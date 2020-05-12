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
function PhysicsWorld() {
  this.TIMESTEP = 18 / 1000;
  this.TIMESTEP_SQ = this.TIMESTEP * this.TIMESTEP;

  this.time = 0;

  // this.GRAVITY = 981 * 1.4; // TODO: correct scaling m/s^2 // MAGIC_VALUE
  this.GRAVITY = 981 * 0.003; // TODO: correct scaling m/s^2 // MAGIC_VALUE // TOCHECKD
  this.a_gravity = new THREE.Vector3(0, -this.GRAVITY, 0);

  this.windEnabled = true;
  this.windStrength = 10;
  this.windForce = new THREE.Vector3( 0, 0, 0 );

  this.floor = -5;
  this.precalc = 0;
  return this;
}

PhysicsWorld.prototype = {
  update: function() {
    if (this.windEnabled) {
      this.windForce.set( Math.sin( this.time / 2 ), Math.cos( this.time / 3 ), Math.sin( this.time / 1 ) ).normalize().multiplyScalar( this.windStrength );
    } else {
      this.windForce.set(0,0,0);
    }
    this.time += this.TIMESTEP;
  },
  // integrate
  // sat constraints
  // upadtephysics
  getSettings: function() {
    var settings = {
      windEnabled: this.windEnabled,
      windStrength: this.windStrength,
      precalc: this.precalc
    };
    return settings;
  }
};

export { PhysicsWorld }
