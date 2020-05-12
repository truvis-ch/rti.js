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
* _Math provides a set of math related utility functions.
* <br>All functions are static functions, no new instance of _Math needs to be created for calling the functions.
* @namespace
* @private
*/
var _Math = {};

/**
* Caluculates the intersection point between a line and plane in 3D.
* Returns undefined if no solutions exist, or if infinitely many solutions exist.
*
* @param {THREE.Vector3} lPoint - a point on the line
* @param {THREE.Vector3} lDir - the normalized direction of the line
* @param {THREE.Vector3} pPoint - a point on the plane
* @param {THREE.Vector3} pNormal - the normalized normal vector of the plane
* @returns {THREE.Vector3 | undefined } The intersection point or undefined if no/infinitely many solutions exist
*
*/
_Math.intersect = function(lPoint, lDir, pPoint, pNormal) {
  var numerator = pPoint.clone().sub(lPoint).dot(pNormal);
  var denominator = lDir.clone().dot(pNormal);
  var zerotol = 0.0000000001; // MAGIC_VALUE
  if (Math.abs(denominator) < zerotol ) {
    return undefined;
  } else {
    var d = numerator/denominator;
    return lDir.clone().multiplyScalar(d).add(lPoint);
  }
}

/**
* Returns a function with parameters u and v, which returns points (THREE.Vector3) on a rectangle
* if evaluated with values between 0 and 1 for u and v.
* <br>The rectangle has its center at (0,0,0).
* <br>The rectangle is aligned with the plane z == 0.
* <br>The direction of increasing u and v values on the rectangle is aligned with increasing x and y directions.
*
* @param {int} width - the width of the rectangle in u direction
* @param {int} height - the height of the rectangle in v direction
* @returns {function } The rectangle generating function in u and v
*/
_Math.UVRectangle = function ( width, height) {

  this.uvFunc = function( u, v, target ) {
    var x = ( u - 0.5 ) * width;
    var y = ( v - 0.5 ) * height;
    var z = 0;
    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "RECTANGLE",
      size: {
        w: width,
        h: height
      }
    }
    return settings;
  };
}

/**
* Returns a function with parameters u and v, which returns points (THREE.Vector3)
* on a surface defined by two sine functions in u and v direction.
* <br>If evaluated with values between 0 and 1 for u and v,
* the surface will have a rectangular shape in x and y direction, and z values corresponding to the sum of the sine functions.
* <br>The mapped rectangle has its center at (0,0,0).
* <br>The mapped rectangle is aligned with the plane z == 0.
* <br>The direction of increasing u and v values on the mapped rectangle is aligned with increasing x and y directions.
*
* @param {int} width - the width of the rectangle in u direction
* @param {int} height - the height of the rectangle in v direction
* @param {int} [uAmplitude=1] - the amplitude of the sine function in u direction
* @param {int} [vAmplitude=0] - the amplitude of the sine function in v direction
* @param {int} [uCycles=1] - the number of cycles of the sine function in u direction
* @param {int} [vCycles=1] - the number of cycles of the sine function in v direction @default 0
* @returns {function } The surface generating function in u and v
*/
_Math.UVSineRectangle = function ( width, height, uAmplitude, vAmplitude, uCycles, vCycles ) {
  uAmplitude = uAmplitude || 1;
  vAmplitude = vAmplitude || 0;
  uCycles = uCycles || 1;
  vCycles = vCycles || 1;

  this.uvFunc = function( u, v, target ) {
    var x = ( u - 0.5 ) * width;
    var y = ( v - 0.5 ) * height;
    var z = uAmplitude*Math.sin(u*uCycles*2*Math.PI)
          + vAmplitude*Math.sin(v*vCycles*2*Math.PI);
    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "SINERECTANGLE",
      size: {
        w: width,
        h: height
      },
      uAmplitude: uAmplitude,
      vAmplitude: vAmplitude,
      uCycles: uCycles,
      vCycles: vCycles
    }
    return settings;
  };
}

/**
* Returns a function with parameters u and v, which returns points (THREE.Vector3) on a
* open half cylinder, if evaluated with values between 0 and 1 for u and v.
* <br>The half cylinder has its center at (0,0,0).
* <br>The flat side of the half cylinder is aligned with the plane z == 0.
* <br>The curved side of the half cylinder is pointing in negative z direction .
*
* @param {int} radius - the radius of the half cylinder
* @param {int} height - the height of the half cylinder
* @returns {function } The cylinder generating function in u and v
*/
_Math.UVHalfCylinder = function ( radius, height ) {

  this.uvFunc = function( u, v, target ) {
    var x = -Math.cos( u * Math.PI) * radius;
    var y = ( v - 0.5 ) * height;
    var z = -Math.sin( u * Math.PI) * radius;
    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "HALFCYLINDER",
      radius: radius,
      height: height
    }
    return settings;
  };
}


_Math.UVBentTest = function ( y0, y1, dz) {
  var width = 1;
  var height =  1;

  this.uvFunc = function( u, v, target ) {

    if ( v < y0 ) {
      var x = ( u - 0.5 ) * width;
      var y = ( v - 0.5 ) * height;
      var z = 0;
      target.set( x, y, z );
    } else if (v <= y1) {
      var x = ( u - 0.5 ) * width;
      var y = ( v - 0.5 ) * height;
      // var z = dz*(v-y0)*(v-y0)/((y1-y0)*(y1-y0));
      var z = dz*(v-y0)*(v-y0)*(v-y0)/((y1-y0)*(y1-y0)*(y1-y0));
      target.set( x, y, z );
    } else {
      var x = ( u - 0.5 ) * width;
      var y = ( v - 0.5 ) * height;
      // var z = 0.8*v - 0.8*y1 + dz;
      // var z = 2*v - 2*y1 + dz;
      var z = 3*v - 3*y1 + dz;
      target.set( x, y, z );
    }

  };

  this.getSettings = function() {
    var settings = {
      type: "BENT_TEST",
      dz: dz,
      y0: y0,
      y1: y1
    }
    return settings;
  };
}

/**
* Returns a function with parameters u and v, which returns points (THREE.Vector3) on a
* sphere, if evaluated with values between 0 and 1 for u and v.
* <br>The sphere has its center at (0,0,0).
*
* @param {int} radius - the radius of the sphere
* @returns {function } The sphere generating function in u and v
*/
_Math.UVSphere = function( radius  ) {

  this.uvFunc =  function( u, v, target ) {
    u *= Math.PI;
    v *= 2 * Math.PI;

    var x = radius * Math.sin( u ) * Math.cos( v );
    var y = radius * Math.sin( u ) * Math.sin( v );
    var z = radius * Math.cos( u );

    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "SPHERE",
      radius: radius
    }
    return settings;
  };

}
/**  */ // experimental...
_Math.UVMobius = function( radius  ) {
  this.uvFunc = function( u, v, target ) {
      u = u - 0.5;
  		v = 2 * Math.PI * v;

  		var x = Math.cos( v ) * ( radius + u * Math.cos( v / 2 ) );
  		var y = Math.sin( v ) * ( radius + u * Math.cos( v / 2 ) );
  		var z = u * Math.sin( v / 2 );

    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "MOBIUS",
      radius: radius
    }
    return settings;
  };
}

/**  */ // experimental...
_Math.UVTorus = function( r1, r2  ) {
  this.uvfunc =  function( u, v, target ) {
      u = 2 * Math.PI * u;
  		v = 2 * Math.PI * v;

  		var x = Math.cos( u ) * ( r1 + r2 * Math.cos( v ) );
  		var y = Math.sin( u ) * ( r1 + r2 * Math.cos( v ) );
  		var z = r2 * Math.sin( v );

    target.set( x, y, z );
  };

  this.getSettings = function() {
    var settings = {
      type: "TORUS",
      radius1: r1,
      radius2: r2
    }
    return settings;
  };
}

/**
* Caluculates the value of the Z-order curve or morton code for integer coordinates x and y.
* <br>See {@link https://en.wikipedia.org/wiki/Z-order_curve}
* <br> Values for x and y need to be between 0 and 2^15 - 1 = 32767
*
* @param {int} x - x coordinate
* @param {int} x - y coordinate
* @returns {int} morton code for integer coordinates x and y
*
*/
_Math.encodeMorton = function(x, y) {
  // signed 32bit int max value: 2^31-1 = 2147483647
  // -> max safe value for x,y: 2^15-1 = 32767
  var z = 0;

  for (var i = 0; i < 15; i++) {
    var x_masked_i = (x & (1 << i));
    var y_masked_i = (y & (1 << i));

    z |= (x_masked_i << i);
    z |= (y_masked_i << (i + 1));
  }
  return z;
}

export { _Math };
