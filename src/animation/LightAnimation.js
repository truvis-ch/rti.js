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

function LightAnimation(scene, animationID) {
  if (scene && scene.directionalLights.length > 0) {
    var animatedLight = scene.directionalLights[0];
    this.directionalLightDirection = new THREE.Vector3().copy(animatedLight.position);
    this.directionalLightColor = new THREE.Color().copy(animatedLight.color);
    this.directionalLightIntensity = animatedLight.intensity;
  } else {
    this.directionalLightDirection = new THREE.Vector3(0.0, 0.0, 1.0);
    this.directionalLightColor = new THREE.Color(1, 1, 1);
    this.directionalLightIntensity = 2.5980762114;
  }

  if (scene && scene.ambientLights.length > 0) {
    var animatedLight = scene.ambientLights[0];
    this.ambientLightColor = new THREE.Color().copy(animatedLight.color);
    this.ambientLightIntensity = animatedLight.intensity;
  } else {
    this.ambientLightColor = new THREE.Color(1, 1, 1);
    this.ambientLightIntensity = 1;
  }

  if (animationID) {
    this.animationID = animationID;
  } else {
    this.animationID = "C";
  }

  this.TIMESTEP = 19 / 1000;
  this.time = 0;

  // // circular orbit in xy plane. starting 1,0
  // this.directionalLightDirection.set(1,0,0);
  // this.ambientLightColor.set(0.8, 0.8, 0.8);

  // circular orbit in xz plane. starting 1,0,0
  // this.directionalLightDirection.set(1,0,0);
  // this.ambientLightColor.set(0.8, 0.8, 0.8);

  // // half-circular orbit in xz plane. starting 1,0,0
  // this.directionalLightDirection.set(1,0,0);

  // spiral orbit on z+ halfdome. starting 1,0,0
  // this.directionalLightDirection.set(1,0,0);
  // this.ambientLightColor.set(0.8, 0.8, 0.8);

  // almost half-circular orbit in xz plane. starting 1,0,0
  // rotating around z
  // this.directionalLightDirection.set(1,0,0);
}


LightAnimation.prototype = {
  update: function() {
    this.time += this.TIMESTEP;

    var angle = this.time/2.5;

    switch (this.animationID) {

      case "A":
        // // circular orbit in xy plane. starting 1,0
        var x = Math.cos(angle);
        var y = Math.sin(angle);
        var z = 0;
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();
        break;

      case "B":
        // circular orbit in xz plane. starting 1,0,0
        var x = Math.cos(angle);
        var y = 0;
        var z = Math.sin(angle);
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();
        break;

      case "C":
        // half-circular orbit in xz plane. starting 1,0,0
        var x = Math.cos(angle);
        var y = 0;
        var z = Math.abs(Math.sin(angle));
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();
        break;

      case "D":
        // spiral orbit on z+ halfdome. starting 1,0,0
        var h = -Math.cos(angle/4)*0.5 + 0.5;
        var x = Math.cos(angle)*(1-h);
        var y = Math.sin(angle)*(1-h);
        var z = h;
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();
        break;

      case "E":
        // almost half-circular orbit in xz plane. starting 1,0,0
        // rotating around z
        var x = Math.cos(angle);
        var y = 0;
        var z = 0.3 + Math.abs(Math.sin(angle));

        var rotAngle = angle/4;
        var cosRotAngle = Math.cos(rotAngle);
        var sinRotAngle = Math.sin(rotAngle);

        var rotx = x*cosRotAngle - y*sinRotAngle;
        var roty = x*sinRotAngle + y*cosRotAngle;
        this.directionalLightDirection.set(rotx,roty,z);
        this.directionalLightDirection.normalize();
        break;

      case "F":

      if (angle < 2*Math.PI) {

        // half-circular orbit in xz plane. starting 1,0,0
        var x = Math.cos(angle);
        var y = 0;
        var z = Math.abs(Math.sin(angle));
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();

      } else if (angle < 4*Math.PI) {
        // half-circular orbit in yz plane. starting 0,-1,0
        var x = 0;
        var y = -Math.cos(angle);
        var z = Math.abs(Math.sin(angle));
        this.directionalLightDirection.set(x,y,z);
        this.directionalLightDirection.normalize();

      } else {
        this.time = 0;
      }

        break;

      default:
      console.log("ERROR: unknown animationID " + this.animationID);
    }

  }
}



export { LightAnimation }
