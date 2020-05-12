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

import { MultiresGridGeometryHelper } from './MultiresGridGeometryHelper.js'

/**
*
* @class
* @private
*/
function MultiresTileAlignedGridGeometryHelper(geometry, textureModel, multiresTree, defines) {
  MultiresGridGeometryHelper.call(this, geometry, textureModel, multiresTree, defines);

  this.frustum = new THREE.Frustum();
  this.createBoundingBoxes();
}
MultiresTileAlignedGridGeometryHelper.prototype = Object.create(MultiresGridGeometryHelper.prototype);
MultiresTileAlignedGridGeometryHelper.prototype.constructor = MultiresTileAlignedGridGeometryHelper;

MultiresTileAlignedGridGeometryHelper.prototype.createBoundingBoxes = function() {
  for (var level = 0; level < this.multires.numLevels; level++) {
    var numTiles = this.multires.levels[level].numTiles;
    var tiles = this.multires.levels[level].tiles;
    for (var x = 0; x < numTiles.x; x++) {
      for (var y = 0; y < numTiles.y; y++) {
        var currTile = tiles[x][y];
        var box = new THREE.Box3();
        currTile.boundingBox = box;
      }
    }
  }
  this.createTileIndices();
  this.updateBoundingBoxes();
}

MultiresTileAlignedGridGeometryHelper.prototype.createTileIndices = function() {
  var numSegments = this.geometry.numSegments;
  var numVertices = new THREE.Vector2(numSegments.x+1, numSegments.y+1);

  for (var level = 0; level < this.multires.numLevels; level++) {
    var numTiles = this.multires.levels[level].numTiles;
    var tiles = this.multires.levels[level].tiles;
    var nSlicePerTile = numSegments.x/numTiles.x;
    var nStackPerTile = numSegments.y/numTiles.y;
    for (var tileY = 0; tileY < numTiles.y; tileY++) {
      for (var tileX = 0; tileX < numTiles.x; tileX++) {
        var currTile = tiles[tileX][tileY];
        var vertexIndices = [];
        var tileOffset = tileY*nStackPerTile*numVertices.x + tileX*nSlicePerTile;
        for (var stack = 0; stack < nStackPerTile; stack++) {
          for (var slice = 0; slice < nSlicePerTile; slice++) {
            var quadOffset = tileOffset + stack*numVertices.x;
            var a = quadOffset + slice;
            var b = quadOffset + slice+1;
            var c = quadOffset + slice+numVertices.x+1;
            var d = quadOffset + slice+numVertices.x;
            vertexIndices.push(a,b,d);
            vertexIndices.push(b,c,d);
          }
        }
        currTile.vertexIndices = vertexIndices;
      }
    }
  }
}

MultiresTileAlignedGridGeometryHelper.prototype.updateBoundingBoxes = function() {
  // TODO: movement
  var posAttribute = this.geometry.getAttribute("position");

  var level = this.multires.numLevels-1;
  var numTiles = this.multires.levels[level].numTiles;
  var tiles = this.multires.levels[level].tiles;

  var pos = new THREE.Vector3();

  for (var x = 0; x < numTiles.x; x++) {
    for (var y = 0; y < numTiles.y; y++) {
      var currTile = tiles[x][y];
      if (currTile.hasContent ) {

        currTile.boundingBox.min.set( + Infinity, + Infinity, + Infinity );
        currTile.boundingBox.max.set( - Infinity, - Infinity, - Infinity );
        var vertexIndices = currTile.vertexIndices;

        for (var i = 0; i < vertexIndices.length; i+=6) {
          pos.fromBufferAttribute(posAttribute, vertexIndices[i+0]);
          currTile.boundingBox.expandByPoint(pos);
          pos.fromBufferAttribute(posAttribute, vertexIndices[i+1]);
          currTile.boundingBox.expandByPoint(pos);
          pos.fromBufferAttribute(posAttribute, vertexIndices[i+2]);
          currTile.boundingBox.expandByPoint(pos);
          pos.fromBufferAttribute(posAttribute, vertexIndices[i+4]);
          currTile.boundingBox.expandByPoint(pos);
        }

        if (!currTile.boundingBox.isEmpty()) {
          var parent = currTile.parent;
          while (parent) {
            parent.boundingBox.expandByPoint(currTile.boundingBox.min);
            parent.boundingBox.expandByPoint(currTile.boundingBox.max);
            parent = parent.parent;
          }
        }
      }
    }
  }

}

MultiresTileAlignedGridGeometryHelper.prototype.getVisibleTiles = function(camera, requiredLevel) {
  var visibleTiles = [];

  if (this.deformable) { // obj.deformable / deformed
    // TODO: only on updateneeded
   this.updateBoundingBoxes();
  }

  this.frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
  var numTiles = this.multires.levels[requiredLevel].numTiles;
  var tiles = this.multires.levels[requiredLevel].tiles;

  for (var x = 0; x < numTiles.x; x++) {
    for (var y = 0; y < numTiles.y; y++) {
      var currTile = tiles[x][y];
      if (currTile.hasContent ) {
        if ( this.frustum.intersectsBox( currTile.boundingBox )) {
          visibleTiles.push(currTile);
        }
      }
    }
  }

  return visibleTiles;
}


export { MultiresTileAlignedGridGeometryHelper }
