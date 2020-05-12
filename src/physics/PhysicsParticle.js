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

// based on https://threejs.org/examples/webgl_animation_cloth.html

/**
*
* @class
* @private
*/
function PhysicsParticle( position, mass, drag ) {
  this.position = position.clone();
  this.previous = position.clone();
  this.original = position.clone();
  this.a = new THREE.Vector3( 0, 0, 0 );

  this.mass = mass;
  this.invMass = 1 / mass;
  this.drag = drag;

  this.__tmp = new THREE.Vector3();
}

PhysicsParticle.prototype = {
  setMass: function(mass) {
    this.mass = mass;
    this.invMass = 1 / mass;
  },
  setDrag: function(drag) {
    this.drag = drag;
  },
  addForce: function(force) {
    this.a.add(
      this.__tmp.copy(force).multiplyScalar(this.invMass)
    );
  },

  integrate: function(timesq) {
    var newPos = this.__tmp.subVectors( this.position, this.previous );
    newPos.multiplyScalar( this.drag ).add( this.position );
    newPos.add( this.a.multiplyScalar( timesq ) );

    this.previous.copy(this.position);
    this.position.copy(newPos);

    this.a.set( 0, 0, 0 );
  }
}; // PhysicsParticle.prototype

export { PhysicsParticle }
