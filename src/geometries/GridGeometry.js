/*
* Copyright 2020 Truvis AG
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*		http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import * as THREE from 'three';

/**
*
* @class
* @private
*/
function GridGeometry(uvFunc, numSegments, createTangentAttributes, position, rotation) {
  THREE.ParametricBufferGeometry.call(this, uvFunc.uvFunc, numSegments.x, numSegments.y);

  this.numSegments = numSegments;
  this.uvFunc = uvFunc;

  this.numVertices = (this.numSegments.x+1)*(this.numSegments.y+1);

  if (createTangentAttributes) {
    this.createTangentAttributes();
  }

  this.bakedPosition = new THREE.Vector3(0,0,0);
  if (position) {
    this.setBakedPosition(position);
  }

  this.bakedRotation = {type: 'v3', value: new THREE.Vector3(0,0,0) };
  if (rotation) {
    this.setBakedRotation(rotation);
  }
}
GridGeometry.prototype = Object.create(THREE.ParametricBufferGeometry.prototype);
GridGeometry.prototype.constructor = GridGeometry;

GridGeometry.prototype.setBakedPosition = function(position) {
  var translation = new THREE.Vector3(position.x, position.y, position.z);
  translation.sub(this.bakedPosition);
  this.translate(translation.x,translation.y,translation.z);
  this.bakedPosition.set(position.x, position.y, position.z);

  this.verticesNeedUpdate = true;
  this.attributes.position.needsUpdate = true;
}

GridGeometry.prototype.setBakedRotation = function(rotation) {
  var bakedRotation = new THREE.Vector3(rotation.x, rotation.y, rotation.z);
  bakedRotation.sub(this.bakedRotation.value);

  // TODO: x,y. needs to be implemented here and in shader
  // this.rotateX(bakedRotation.x);
  // this.rotateY(bakedRotation.y);
  var translation = this.bakedPosition;
  this.translate(-translation.x,-translation.y,-translation.z);
  this.rotateZ(bakedRotation.z);
  this.translate(translation.x,translation.y,translation.z);

  this.bakedRotation.value.set(rotation.x, rotation.y, rotation.z);

  if (this.hasTangentAttributes) {
    this.updateTangents();
  }
  this.computeVertexNormals();
  this.normalsNeedUpdate = true;
  this.verticesNeedUpdate = true;
  this.attributes.position.needsUpdate = true;
}

GridGeometry.prototype.createTangentAttributes = function() {
  var lVertexBuffer = this.numVertices * 3;
  var tangents = new Float32Array( lVertexBuffer);
  this.setAttribute("tangentU", new THREE.BufferAttribute( tangents, 3 ) );
  this.hasTangentAttributes = true;
  this.updateTangents();
}

GridGeometry.prototype.resetFromUVFunc = function() {
  var slices = this.numSegments.x;
  var stacks = this.numSegments.y;

  // TOUPDATE: r82 specfic code from: https://github.com/mrdoob/three.js/blob/r82/src/geometries/ParametricBufferGeometry.js
	var vertices = [];

	var i, j;
	var u, v;

	var sliceCount = slices + 1;

	for ( i = 0; i <= stacks; i ++ ) {

		v = i / stacks;

		for ( j = 0; j <= slices; j ++ ) {

			u = j / slices;

      // TODO: reuse p? => update attribute from here
      var p = new THREE.Vector3();
      this.uvFunc.uvFunc( u, v, p );
      vertices.push(p);
		}

	}

  this.updateFromVectors(vertices);

  var tmpBakedPosition = this.bakedPosition.clone();
  var tmpBakedRotation = this.bakedRotation.value.clone();
  this.bakedPosition.set(0,0,0);
  this.bakedRotation.value.set(0,0,0);
  this.setBakedPosition(tmpBakedPosition);
  this.setBakedRotation(tmpBakedRotation);
}

GridGeometry.prototype.updateFromVectors = function(vectors) {
  var posAttribute = this.getAttribute("position");
  for ( var i = 0; i < vectors.length; i ++ ) {
    var pos = vectors[i];
    posAttribute.setXYZ(i, pos.x, pos.y, pos.z);
  }
  if (this.hasTangentAttributes)
  this.updateTangents();
  this.computeVertexNormals();
  this.normalsNeedUpdate = true;
  this.verticesNeedUpdate = true;
  this.attributes.position.needsUpdate = true;
}

GridGeometry.prototype.updateTangents = function() {
  var posAttribute = this.getAttribute("position");
  var tangAttribute = this.getAttribute("tangentU");

  var pos = new THREE.Vector3();
  var nbrX = new THREE.Vector3();
  var tangent = new THREE.Vector3();

  var wParticles = this.numSegments.x+1;
  for ( var i = 0; i < this.numVertices; i ++ ) {
    pos.fromBufferAttribute(posAttribute, i);
    if (i%wParticles < wParticles-1) {
      nbrX.fromBufferAttribute(posAttribute, i+1);
      tangent.subVectors(nbrX, pos);
    } else {
      nbrX.fromBufferAttribute(posAttribute, i-1);
      tangent.subVectors(pos, nbrX);
    }
    tangAttribute.setXYZ(i, tangent.x, tangent.y, tangent.z);
  }
  this.attributes.tangentU.needsUpdate = true;
}

GridGeometry.prototype.getSettings = function() {
  var settings = {
    type: "GridGeometry",
    uvFunc: this.uvFunc.getSettings(),
    position: { x: this.bakedPosition.x, y: this.bakedPosition.y, z: this.bakedPosition.z },
    rotation: { x: this.bakedRotation.value.x, y: this.bakedRotation.value.y, z: this.bakedRotation.value.z }
  };
  return settings;
}

export { GridGeometry }
