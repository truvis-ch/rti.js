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

import { Utils } from '../utils/Utils.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';

function RTIScene() {
  this.rtiObjects = [];
  this.commonObjects = [];
  this.ambientLights = [];
  this.directionalLights = [];
  this.pointLights = [];
  this.spotLights = [];
  this.camera = null;

  this.physics = null;
  this.physicsEnabled = false;

  this.lightAnimation = false;

  this.threeScene = null;

  this.initialCameraPosition = null;
  this.initialCameraFOV = 0;
  this.initialCameraZoom = 0;

  this.extensions = [];
  this.ambientLightsExtensions = [];
  this.directionalLightsExtensions = [];
  this.pointLightsExtensions = [];
  this.spotLightsExtensions = [];

  this.maxZoomDist = 0;
  this.minZoomDist = 0;

  this.clearColor = null;

  this.init();
}

RTIScene.prototype.init = function () {
  this.rtiObjects = [];
  this.commonObjects = [];

  this.directionalLights = [];
  this.ambientLights = [];

  this.physics = new PhysicsWorld();
  this.physicsEnabled = false;

  this.lightAnimation = false;

  this.threeScene = new THREE.Scene();

  // TODO: initialise as empty scene, handle default population in viewer/controller
  var fov = 45;
  var aspect = 1;
  var near = 0.1;
  var far = 1000;
  this.camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  this.threeScene.add(this.camera);
  this.camera.lookAt(this.threeScene.position);

  this.maxZoomDist = 100; // MAGIC_VALUE
  this.minZoomDist = 3*this.camera.near; // MAGIC_VALUE

  this.initialCameraPosition = new THREE.Vector3(0,0,5);
  this.initialCameraFOV = 45;
  this.initialCameraZoom = 1;
  this.resetCamera();

  this.clearColor = new THREE.Color(0,0,0);
}

/**
* Add a RTIObject (and optional GridPhysics) to the scene.
*
* @param {RTIObject} rtiObject - a RTIObject
* @returns {bool} success
*/
RTIScene.prototype.addRTIObject = function(rtiObject, insertIndex) {
  if (typeof insertIndex == 'undefined') {
    this.rtiObjects.push(rtiObject);
  } else {
    this.rtiObjects.splice(insertIndex, 0, rtiObject);
  }

  this.threeScene.add(rtiObject.renderObject);

  if (rtiObject.physics) {
    this.physicsEnabled = true;
    rtiObject.physics.setPhysicsWorld(this.physics);
  }

  return true;
}

RTIScene.prototype.removeRTIObject = function(objectIndex) {
  this.threeScene.remove(this.rtiObjects[objectIndex].renderObject);
  this.rtiObjects[objectIndex].dispose();

  this.rtiObjects.splice(objectIndex,1);
  return true;
}

RTIScene.prototype.addDirectionalLight = function() {
  // TODO: pass color, dir as optional args
  var insertIndex = this.directionalLights.length;
  this.directionalLights.push(new THREE.DirectionalLight());
  this.directionalLights[insertIndex].position.set(0.0, 0.0, 1.0);
  this.threeScene.add( this.directionalLights[insertIndex] );
  this.directionalLightsExtensions.push([]);
  return insertIndex;
}

RTIScene.prototype.addPointLight = function() {
  // TODO: pass color, pos as optional args
  var insertIndex = this.pointLights.length;
  this.pointLights.push(new THREE.PointLight());
  this.pointLights[insertIndex].position.set(0.0, 0.0, 1.0);
  this.threeScene.add( this.pointLights[insertIndex] );
  this.pointLightsExtensions.push([]);
  return insertIndex;
}

RTIScene.prototype.addSpotLight = function() {
  // TODO: pass color, pos as optional args
  var insertIndex = this.spotLights.length;
  this.spotLights.push(new THREE.SpotLight());
  this.spotLights[insertIndex].position.set(0.0, 0.0, 1.0);
  this.threeScene.add( this.spotLights[insertIndex] );
  this.threeScene.add( this.spotLights[insertIndex].target );
  this.spotLightsExtensions.push([]);
  return insertIndex;
}

// TODO: API: get color as params
RTIScene.prototype.addAmbientLight = function() {
  // TODO: pass color as optional arg
  var insertIndex = this.ambientLights.length;
  this.ambientLights.push(new THREE.AmbientLight());
  this.threeScene.add(this.ambientLights[insertIndex]);
  this.ambientLightsExtensions.push([]);
  return insertIndex;
}

RTIScene.prototype.removeDirectionalLight = function(index) {
  if (index >= 0 && index < this.directionalLights.length) {
    this.threeScene.remove(this.directionalLights[index]);
    this.directionalLights.splice(index, 1);
    this.directionalLightsExtensions.splice(index, 1);
  }
}

RTIScene.prototype.removePointLight = function(index) {
  if (index >= 0 && index < this.pointLights.length) {
    this.threeScene.remove(this.pointLights[index]);
    this.pointLights.splice(index, 1);
    this.pointLightsExtensions.splice(index, 1);
  }
}

RTIScene.prototype.removeSpotLight = function(index) {
  if (index >= 0 && index < this.spotLights.length) {
    this.threeScene.remove(this.spotLights[index]);
    this.spotLights.splice(index, 1);
    this.spotLightsExtensions.splice(index, 1);
  }
}

RTIScene.prototype.removeAmbientLight = function(index) {
  if (index >= 0 && index < this.ambientLights.length) {
    this.threeScene.remove(this.ambientLights[index]);
    this.ambientLights.splice(index, 1);
    this.ambientLightsExtensions.splice(index, 1);
  }
}

RTIScene.prototype.setURLPrefix = function(prefix) {
  for (var o=0; o<this.rtiObjects.length; o++) {
    this.rtiObjects[o].setURLPrefix(prefix);
  }
}


RTIScene.prototype.setShaderFlag = function(flag, value) {
  for (var o=0; o<this.rtiObjects.length; o++) {
    this.rtiObjects[o].setShaderFlag(flag, value);
  }
}


/**
* Returns the current settings of the viewer as a JSON object.
* @returns {SceneSettings} the current settings.
*/
RTIScene.prototype.getSettings = function() {
  var settings = {
    "configVersion": 3,
    rtiObjects: [],
    lights: {
      directionalLights : [],
      spotLights : [],
      pointLights : [],
      ambientLights : []
    },
    camera: {
      current: {
        position: {},
        zoom: 1
      },
      initial: {
        position: {},
        zoom: 1
      }
    }
  };
  for (var o=0; o<this.rtiObjects.length; o++) {
    settings.rtiObjects.push(this.rtiObjects[o].getSettings());
  }
  for (var l=0; l<this.directionalLights.length; l++) {
    var color = this.directionalLights[l].color;
    var light = this.directionalLights[l];
    settings.lights.directionalLights.push({
      color : { r: color.r, g: color.g, b: color.b },
      intensity: this.directionalLights[l].intensity,
      // TODO: use helper function
      direction : light.target.position.clone().sub(light.position).normalize(),
      extensions: Utils.jsonCopy(this.directionalLightsExtensions[l])
    })
  }
  for (var l=0; l<this.spotLights.length; l++) {
    var color = this.spotLights[l].color;
    var light = this.spotLights[l];
    settings.lights.spotLights.push({
      color : { r: color.r, g: color.g, b: color.b },
      intensity: this.spotLights[l].intensity,
      angle: this.spotLights[l].angle,
      penumbra: this.spotLights[l].penumbra,
      // TODO: use helper function
      position : Utils.jsonCopy(light.position),
      direction : light.target.position.clone().sub(light.position).normalize(),
      extensions: Utils.jsonCopy(this.spotLightsExtensions[l])
    })
  }
  for (var l=0; l<this.pointLights.length; l++) {
    var color = this.pointLights[l].color;
    var light = this.pointLights[l];
    settings.lights.pointLights.push({
      color : { r: color.r, g: color.g, b: color.b },
      intensity: this.pointLights[l].intensity,
      // TODO: use helper function
      position : Utils.jsonCopy(light.position),
      extensions: Utils.jsonCopy(this.pointLightsExtensions[l])
    })
  }
  for (var l=0; l<this.ambientLights.length; l++) {
    var color =  this.ambientLights[l].color;
    settings.lights.ambientLights.push({
      color : { r: color.r, g: color.g, b: color.b },
      intensity:  this.ambientLights[l].intensity,
      extensions: Utils.jsonCopy(this.ambientLightsExtensions[l])
    })
  }

  settings.camera.current.position.x = this.camera.position.x;
  settings.camera.current.position.y = this.camera.position.y;
  settings.camera.current.position.z = this.camera.position.z;

  settings.camera.current.zoom = this.camera.zoom;

  settings.camera.initial.position.x = this.initialCameraPosition.x;
  settings.camera.initial.position.y = this.initialCameraPosition.y;
  settings.camera.initial.position.z = this.initialCameraPosition.z;

  settings.camera.initial.zoom = this.initialCameraZoom;

  settings.extensions = Utils.jsonCopy(this.extensions);

  settings.physics = this.physics.getSettings();

  var clearColor = this.clearColor;
  settings.clearColor =  { r: clearColor.r, g: clearColor.g, b: clearColor.b };
  return settings;
}

/**
* Add a THREE.Object3D to the scene.
* <br>For RTIObjects {@link RTIScene#addRTIObject} should be used.
* @param {THREE.Object3D} obj - a THREE.Object3D
*/
RTIScene.prototype.addCommonObject = function(obj) {
  var insertIndex = this.commonObjects.length;
  this.commonObjects[insertIndex] = obj;
  this.threeScene.add(obj);
}

RTIScene.prototype.update = function() {
  if (this.lightAnimationEnabled) {
    if (this.lightAnimation) {
    this.lightAnimation.update();
    // TODO: support for animating lights with index > 0
    // TODO: use THREE color, intensity in lightanimation

    // TODO: get rid, fix in dispose of scene?
    if (this.directionalLights[0]) {
      this.directionalLights[0].position.copy(this.lightAnimation.directionalLightDirection);
      this.directionalLights[0].color.copy(this.lightAnimation.directionalLightColor);
      this.directionalLights[0].intensity = this.lightAnimation.directionalLightIntensity;
    }

    // TODO: get rid, fix in dispose of scene?
    if (this.ambientLights[0]) {
      this.ambientLights[0].color.copy(this.lightAnimation.ambientLightColor);
      this.ambientLights[0].intensity = this.lightAnimation.ambientLightIntensity;
    }
    }
  }

  if (this.physicsEnabled) {
    if (this.physics) {
    this.physics.update();
    for (var i = 0; i < this.rtiObjects.length; i++) {
      if (this.rtiObjects[i].physics) {
        this.rtiObjects[i].physics.update();
        this.rtiObjects[i].geometry.updateFromVectors(this.rtiObjects[i].physics.positions);
      }
    }
    }
  }

}

/**
* Reset the camera to its initial position.
*/
RTIScene.prototype.resetCamera = function() {
  this.camera.fov = this.initialCameraFOV;
  this.camera.zoom = this.initialCameraZoom;
  this.camera.position.copy(this.initialCameraPosition);
  this.camera.updateProjectionMatrix();
}

RTIScene.prototype.dispose = function() {
  for (var i = 0; i< this.rtiObjects.length; i++) {
    this.threeScene.remove(this.rtiObjects[i].renderObject);
    this.rtiObjects[i].dispose();
  }
  for (var i = 0; i< this.commonObjects.length; i++) {
    this.threeScene.remove(this.commonObjects[i]);
    this.commonObjects[i].geometry.dispose();
    this.commonObjects[i].material.dispose();
  }
  this.rtiObjects = [];
  this.commonObjects = [];

  this.ambientLights = [];
  this.directionalLights = [];
  this.threeScene = null;
}

export { RTIScene }
