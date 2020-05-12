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

import { PhysicsWorld } from './PhysicsWorld.js';
import { PhysicsParticle } from './PhysicsParticle.js';
import { _Math } from '../math/Math.js';

/**
*
* @class
* @private
*/
function GridPhysics(geometry, physics, mass, damping, attach, precalc) {
  this.physics = physics || new PhysicsWorld();
  this.particles = [];
  this.constraints = [];
  this.widthSegments = 0;
  this.heightSegments = 0;

  this.f_gravity = 0;

  this.mass = (typeof mass != 'undefined')?  mass : 1;
  this.massAdjustment = 335; // MAGIC_VALUE
  this.adjustedMass = 0;

  this._damping = (typeof damping != 'undefined')? damping : 1;
  this._dampingAdjustment = 0.04; // MAGIC_VALUE
  // this._dampingAdjustment = 1; // MAGIC_VALUE
  this.drag = 0;

  this.pinsEnabled = false;

  this.attach = [ "TOP" ];
  if (Array.isArray(attach)) {
    this.attach = attach;
  }

  this.__diff = new THREE.Vector3();
  this.__tmpForce = new THREE.Vector3();
  this.__d1 = new THREE.Vector3();
  this.__d2  = new THREE.Vector3();

  // this.initFromUVFunc(widthSegments, heightSegments, initFunc);
  this.initFromGridGeometry(geometry);
  this.createPositionArray();

  this.precalc = (typeof precalc != 'undefined')? precalc : 0;
  this.update(this.precalc);
  return this;
} // MultiresTree

GridPhysics.prototype = {
  setMass: function(mass) {
    this.mass = mass;
    this.adjustedMass = this.mass*this.massAdjustment/(this.widthParticles*this.heightParticles); // MAGIC_VALUE
    this.f_gravity = this.physics.a_gravity.clone().multiplyScalar(this.adjustedMass);
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].setMass(this.adjustedMass);
    }
  },
  setDamping: function(damping) {
    this._damping = damping;
    this.drag = 1 - this._damping*this._dampingAdjustment;
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].setDrag(this.drag);
    }
  },
  setPhysicsWorld: function(physics) {
    this.physics = physics;
    this.f_gravity = this.physics.a_gravity.clone().multiplyScalar(this.adjustedMass);
  },
  initFromUVFunc: function(widthSegments, heightSegments, initFunc) {
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;
    initFunc = initFunc || new _Math.UVRectangle(1, 1);

    this.widthParticles = widthSegments + 1;
    this.heightParticles = heightSegments + 1;

    this.adjustedMass = this.mass*this.massAdjustment/(this.widthParticles*this.heightParticles); // MAGIC_VALUE
    this.f_gravity = this.physics.a_gravity.clone().multiplyScalar(this.adjustedMass);

    this.drag = 1 - this._damping*this._dampingAdjustment;

    this.pinsEnabled = true;


    var particles = [];
    for ( var y = 0; y < this.heightParticles; y++ ) {
      for ( var x = 0; x < this.widthParticles; x++ ) {
        // TODO: reuse p? => update existing particles from here?
        var pos = new THREE.Vector3();
        initFunc.uvFunc( x / this.widthSegments, y / this.heightSegments, pos);
        particles.push(new PhysicsParticle( pos, this.adjustedMass, this.drag ));
      }
    }
    this.particles = particles;

    this.initFaces();
    this.initNormals();
    this.initConstraints();
    this.initPins();
  },

  initFromGridGeometry: function(geometry) {
    this.widthSegments = geometry.numSegments.x;
    this.heightSegments = geometry.numSegments.y;

    this.widthParticles = this.widthSegments + 1;
    this.heightParticles = this.heightSegments + 1;

    this.adjustedMass = this.mass*this.massAdjustment/(this.widthParticles*this.heightParticles); // MAGIC_VALUE
    this.f_gravity = this.physics.a_gravity.clone().multiplyScalar(this.adjustedMass);

    this.drag = 1 - this._damping*this._dampingAdjustment;

    this.pinsEnabled = true;

    var posAttribute = geometry.getAttribute("position");

    var particles = [];
    var nVertices = this.widthParticles*this.heightParticles;
    for (var i = 0; i < nVertices; i++) {
      var pos = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
      particles.push(new PhysicsParticle( pos, this.adjustedMass, this.drag ));
    }
    this.particles = particles;

    this.initFaces();
    this.initNormals();
    this.initConstraints();
    this.initPins();
  },

  // updatePosFromGeometry: function(geometry) {
  //   var posAttribute = geometry.getAttribute("position");
  //   var nVertices = this.widthParticles*this.heightParticles;
  //   for (var i = 0; i < nVertices; i++) {
  //     var dPos = this.particles[i].position.clone().sub(this.particles[i].previous);
  //     var newPos = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
  //     this.particles[i].position.copy(newPos);
  //     this.particles[i].previous.copy(newPos.sub(dPos));
  //   }
  //   // TODO: pins, originalpos?, normals, constrints,
  // },

  initNormals: function() {
    var normals = [];
    for ( var y = 0; y < this.heightSegments; y++ ) {
      for ( var x = 0; x < this.widthSegments; x++ ) {
        normals.push(new THREE.Vector3());
        normals.push(new THREE.Vector3());
      }
    }
    this.normals = normals;
    this.updateNormals();
  },

  initFaces: function() {
    var faces = [];
    var a, b, c, d;
    for ( var y = 0; y < this.heightSegments; y++ ) {
      for ( var x = 0; x < this.widthSegments; x++ ) {
        a = y * this.widthParticles + x;
        b = y * this.widthParticles + x + 1;
        c = ( y + 1 ) * this.widthParticles + x + 1;
        d = ( y + 1 ) * this.widthParticles + x;
        faces.push( { a: a, b: b, c: d } );
        faces.push( { a: b, b: c, c: d } );
      }
    }
    this.faces = faces;
  },

  initConstraints: function() {
    var constraints = [];
    // structural constraints
    for ( var y = 0; y < this.heightSegments; y++ ) {
      for ( var x = 0; x <= this.widthSegments; x++ ) {
        constraints.push(this.createConstraint(x,y, x,y+1));
      }
    }
    for ( var y = 0; y <= this.heightSegments; y++ ) {
      for ( var x = 0; x < this.widthSegments; x++ ) {
        constraints.push(this.createConstraint(x,y, x+1,y));
      }
    }
    // TODO: add shear springs constraints?
    this.constraints = constraints;
  },

  createConstraint: function(x1, y1, x2, y2) {
    return [
      this.particles[ this.index( x1, y1 ) ],
      this.particles[ this.index( x2, y2 ) ],
      this.particles[ this.index( x1, y1 ) ].original.distanceTo(this.particles[ this.index( x2, y2 ) ].original)
    ];
  },

  initPins: function() {
    // TODO: set common pins configs via json
    var pins = [];
    // 2 pins lower border
    // var pins = [ 0,  this.widthParticles - 1];

    // 2 pins upper border
    // var pins = [ this.index(0, this.heightParticles - 1),  this.index(this.widthParticles-1, this.heightParticles - 1)];

    // upper border pins
    if (this.attach.includes("TOP")) {
      for (var x = 0; x < this.widthParticles; x++) {
        pins.push(this.index(x, this.heightParticles - 1));
      }
    }

    // lower border pins
    if (this.attach.includes("BOTTOM")) {
      for (var x = 0; x < this.widthParticles; x++) {
        pins.push(this.index(x, 0));
      }
    }

    // left border pins
    if (this.attach.includes("LEFT")) {
      for (var y = 0; y < this.heightParticles; y++) {
        pins.push(this.index(0, y));
      }
    }

    // right border pins
    if (this.attach.includes("RIGHT")) {
      for (var y = 0; y < this.heightParticles; y++) {
        pins.push(this.index(this.widthParticles-1, y));
      }
    }

    // area pins
    // for ( var y = 0; y < 25; y++ ) {
    //   for ( var x = 0; x < this.widthParticles; x++ ) {
    //     pins.push(this.index(x,y));
    //   }
    // }

    this.pins = pins;
  },

  createPositionArray: function() {
    this.positions = [];
    for ( var i = 0; i < this.particles.length; i ++ ) {
      this.positions[i] = this.particles[i].position;
    }
  },

  enablePins: function(enable) {
    this.pinsEnabled = enable;
  },

  update: function(n) {
    n = typeof n != 'undefined' ? n : 1;
    for (var iterIndex = 0; iterIndex < n; iterIndex++) {
      // Gravity force
      for (var i = 0; i < this.particles.length; i++) {
        var particle = this.particles[i];
        particle.addForce(this.f_gravity);
      }

      // wind forces
      if ( this.physics.windEnabled ) {
        var face, normal;

        for ( var i = 0; i < this.faces.length; i++ ) {
          face = this.faces[i];
          normal = this.normals[i];

          this.__tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( this.physics.windForce ) );
          this.particles[ face.a ].addForce( this.__tmpForce );
          this.particles[ face.b ].addForce( this.__tmpForce );
          this.particles[ face.c ].addForce( this.__tmpForce );
        }
      }


      // integrate forces
      for (var i = 0; i < this.particles.length; i++) {
        var particle = this.particles[i];
        particle.integrate(this.physics.TIMESTEP_SQ);
      }


      // structural constraints
      for (var i = 0; i < this.constraints.length; i++) {
        var constraint = this.constraints[ i ];
        this.satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );
      }

      // Floor Constraints TODO: move to physics?
      // for (var i = 0; i < this.particles.length; i++ ) {
      //   var pos = this.particles[i].position;
      //   if ( pos.y < this.physics.floor ) {
      //     pos.y = this.physics.floor;
      //   }
      // }

      // Pin Constraints
      if (this.pinsEnabled) {
        for (var i = 0; i < this.pins.length; i++ ) {
          var index = this.pins[i];
          var p = this.particles[index];
          p.position.copy( p.original );
          p.previous.copy( p.original );
          // if (i == 0) {
          //   console.log(p.position);
          //   console.log(this.particles[index].position);
          // }
        }
      }

      // TOCHECK: adapt particle.previous after constraints
      // console.log("----------");

      this.updateNormals();
    }
  },

  updateNormals: function() {
    var particles = this.particles;
    var a, b, c, d;
    var normalIndex = 0;
    for ( var y = 0; y < this.heightSegments; y++ ) {
      for ( var x = 0; x < this.widthSegments; x++ ) {
        a = y * this.widthParticles + x;
        b = y * this.widthParticles + x + 1;
        c = ( y + 1 ) * this.widthParticles + x + 1;
        d = ( y + 1 ) * this.widthParticles + x;

        this.__d1.copy(particles[b].position).sub(particles[a].position);
        this.__d2.copy(particles[d].position).sub(particles[a].position);
        // this.normals[normalIndex].copy(this.__d1.cross(this.__d2)).normalize();
        this.normals[normalIndex].copy(this.__d1.cross(this.__d2)); // do not normalize, we use the size of the normal for scaling wind forces to face size
        normalIndex++;

        this.__d1.copy(particles[c].position).sub(particles[b].position);
        this.__d2.copy(particles[d].position).sub(particles[b].position);
        // this.normals[normalIndex].copy(this.__d1.cross(this.__d2)).normalize();
        this.normals[normalIndex].copy(this.__d1.cross(this.__d2)); // do not normalize, we use the size of the normal for scaling wind forces to face size
        normalIndex++;
      }
    }
  },

  index: function( x, y ) {
    return x + y * ( this.widthParticles );
  },

  satisfyConstraints: function( p1, p2, distance ) {
    this.__diff.subVectors( p2.position, p1.position );
    var currentDist = this.__diff.length();
    if ( currentDist === 0 ) return; // prevents division by 0
    var correction = this.__diff.multiplyScalar( 1 - distance / currentDist );
    var correctionHalf = correction.multiplyScalar( 0.5 );
    p1.position.add( correctionHalf );
    p2.position.sub( correctionHalf );
  },

  getSettings: function() {
    return {
      type: "CLOTH",
      mass: this.mass,
      damping: this._damping,
      precalc: this.precalc,
      attach: this.attach
    };
  }
}

export { GridPhysics }
