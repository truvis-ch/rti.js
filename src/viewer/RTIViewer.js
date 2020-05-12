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
import { RTIViewerController } from './RTIViewerController.js';
import { _Math } from '../math/Math.js';
import { RTIScene } from '../core/RTIScene.js';
import { RTIRenderer } from './RTIRenderer.js';
import { ObjectLoader } from '../loaders/ObjectLoader.js';

/**
* Allows the rendering of RTIObjects (and common THREE.Object3D objects) in a web browser.
*
* @class
* @param {div} container - The div element where the viewer's WebGL canvas
*  should be placed.
* @private
*/
function RTIViewer(container, controllerSettings, masterController, masterContainer) {
  this.userContainer = null;
  this.viewerContainer = null;
  this.canvasContainer = null;
  this.scene = null;
  this.renderer = null;
  this.raycaster = null;
  this.controller = null;

  this._zoomAnimation = false;
  this.zoomAnimationMagnitude = 0.0;

  this.rendering = false;
  this._visible = false;

  this.autoRequest = false;

  this.updateCB = function() {};

  this.init(container, controllerSettings, masterController, masterContainer);
  return this;
}

RTIViewer.prototype = {
  init: function(container, controllerSettings, masterController, masterContainer) {
    this.userContainer = container;

    this.viewerContainer = document.createElement("div");
    this.viewerContainer.style.position = "relative";
    this.viewerContainer.style.width = "100%";
    this.viewerContainer.style.height = "100%";
    this.viewerContainer.style.top = "0px";
    this.viewerContainer.style.left = "0px";
    this.viewerContainer.style.margin = "0";
    this.viewerContainer.style.padding = "0";
    this.viewerContainer.style.border = "0";
    this.userContainer.appendChild(this.viewerContainer);

    this.canvasContainer = document.createElement("div");
    this.canvasContainer.style.position = "absolute";
    this.canvasContainer.style.width = "100%";
    this.canvasContainer.style.height = "100%";
    this.canvasContainer.style.top = "0px";
    this.canvasContainer.style.left = "0px";
    this.canvasContainer.style.margin = "0";
    this.canvasContainer.style.padding = "0";
    this.canvasContainer.style.border = "0";
    this.viewerContainer.appendChild(this.canvasContainer);

    if (!Utils.detectWebGL()) {
      console.log("no webGL");
      var warning = Utils.createWebGLSUpportWarning();
      warning.style.position = "relative";
      warning.style.width = "100%";
      warning.style.height = "100%";
      warning.style.overflow = "hidden";
      warning.style.color = "white";
      this.viewerContainer.appendChild(warning);
      return;
    }

    this.renderer =  new RTIRenderer(this.canvasContainer);

    this.scene = new RTIScene();

    this.raycaster = new THREE.Raycaster();

    this._zoomAnimation = false;
    this.zoomAnimationMagnitude = 0.02; // MAGIC_VALUE

    this.rendering = false;
    this._visible = false;
    this.updateViewerVisibility();

    // TODO: add to options, move to controller?
    this.autoRequest = true;

    this.initDefaultScene();
    this.resize();

    this.controller = new RTIViewerController(this, controllerSettings, masterController, masterContainer);

    // TODO: move to controller?
    window.addEventListener('scroll', this.updateViewerVisibility.bind(this));
  },

  updateViewerVisibility: function() {
      if (Utils.isInViewport(this.viewerContainer)) {
        this._visible = true;
      } else {
        this._visible = false;
      }
  },

  /**
  * Add a RTIObject to the scene.
  *
  * @param {RTIObject} rtiObject - a RTIObject
  * @returns {bool} success
  */
  addRTIObject: function(rtiObject) {
    // TODO: API: use directly from scene
   this.scene.addRTIObject(rtiObject);

    // TODO: do not request if !autoRequest, postpone request?
    rtiObject.requestTextureData();

    this.requestMultiresTextures();

    // tmp hack
    this.controller.update();
    return true;
  },

  /**
  * Set the RTIScene used for rendering
  *
  * @param {RTIScene} rtiScene - a RTIScene
  * @returns {bool} success
  */
  setRTIScene: function(rtiScene) {
    this.scene.dispose();

    if (rtiScene.clearColor) {
      this.renderer.setClearColor(rtiScene.clearColor);
    }

    this.scene = rtiScene;
    this.resize();

    for (var o=0; o<rtiScene.rtiObjects.length; o++) {
      var rtiObject = rtiScene.rtiObjects[o];
      // TODO: do not request if !autoRequest, postpone request?
      rtiObject.requestTextureData();
    }

    this.requestMultiresTextures();

    // tmp hack
    this.controller.update();

    return true;
  },

  /**
  * Removes all objects from the scene, and resets lights and camera to their initial states .
  */
  initDefaultScene: function() {
    if (this.scene) {
      this.scene.dispose();
    }

    this.scene = new RTIScene();
    this.resize();

    this.scene.addDirectionalLight();
    this.scene.addAmbientLight();

    this.resetCamera();
  },

  /**
  * Start the animation loop.
  */
  startRendering: function() {
    if (!this.rendering){
      this.rendering = true;
      this.animate();
    }
  },

  /**
  * Stop the animation loop.
  */
  stopRendering: function() {
    this.rendering = false;
  },

  setClearColor: function(color) {
    this.scene.clearColor = color;
    this.renderer.setClearColor(color);
  },

  /**
  * Perform all necessary updates, request the next animation frame and render the current frame.
  * @private
  */
  animate: function()
  {
    if (!this.rendering)
    return;

    requestAnimationFrame( this.animate.bind(this) );

    if (!this._visible)
    return;

    var camera = this.scene.camera;
    var rtiObjects = this.scene.rtiObjects;

    // TODO: use event from controller, registered to animate()
    if (this._zoomAnimation) {
      if (rtiObjects.length > 0) {
        var viewDist = camera.position.z - rtiObjects[0].renderObject.position.z;
        var dDist = viewDist * this._zoomAnimationDelta;
        var newDist = (1.0 - this._zoomAnimationDelta) * viewDist;
        var activeMinZoom = Math.max(3*camera.near, this.scene.minZoomDist); // MAGIC_VALUE
        var activeMaxZoom = Math.min(100, this.scene.maxZoomDist); // MAGIC_VALUE
        if ((dDist < 0 || newDist > activeMinZoom) &&
            (dDist > 0 || newDist < activeMaxZoom)) { // MAGIC_VALUE
          camera.position.addScaledVector(new THREE.Vector3(0,0, -1.0), dDist);
        }
      }
    }

    // TODO: use event from controller, registered to animate()
    if (this._panAnimation) {

      var camPos = camera.position;
      var step = this._panAnimationStart.clone().addScaledVector(this._panAnimationDeltaPos, this._panAnimationDelta * this._panAnimationIndex);

      camera.position.set(step.x, step.y, camPos.z);

      if (this._panAnimationDelta * this._panAnimationIndex >= 1) {
        this._panAnimation = false;
        this._panAnimationIndex = 0;
      } else {
        this._panAnimationIndex++;
      }

    }

    // TODO: use event from controller, registered to animate()
    if (this._zoomToAnimation) {

      var camPos = camera.position;
      var step = this._zoomToAnimationStart.clone().addScaledVector(this._zoomToAnimationDeltaPos, this._zoomToAnimationDelta * this._zoomToAnimationIndex);

      camera.position.set(camPos.x, camPos.y, step.z);

      if (this._zoomToAnimationDelta * this._zoomToAnimationIndex >= 1) {
        this._zoomToAnimation = false;
        this._zoomToAnimationIndex = 0;
      } else {
        this._zoomToAnimationIndex++;
      }

    }

    this.scene.update();

    this.requestMultiresTextures();

    this.updateCB();

    this.renderer.render(this.scene);
  },

  /**
  * Will be called by RTIViewerController on window resize events.
  * @private
  */
  resize: function() {
    // TODO: check if clientwidth is appropriate for al user cases
    var viewerWidth = this.viewerContainer.clientWidth;
    var viewerHeight = this.viewerContainer.clientHeight;
    this.renderer.setSize(viewerWidth, viewerHeight);
    this.scene.camera.aspect = viewerWidth / viewerHeight;
    this.scene.camera.updateProjectionMatrix();
    this.requestMultiresTextures();
  },

  /**
  * Drag the viewport.
  *
  * @param {THREE.Vector2} lastPos2d - Normalized mouse position on screen on
  *  start of dragging operation.
  * @param {THREE.Vector2} currentPos2 - Normalized mouse position on screen
  *  after dragging operation.
  */
  dragView: function(lastPos2d, currentPos2) {
    var camera = this.scene.camera;

    this.raycaster.setFromCamera( lastPos2d, camera );
    var intersectLast = this.raycaster.intersectObjects([this.scene.rtiObjects[0].renderObject], true);

    if (intersectLast[0]) {
      // this.raycaster.setFromCamera( currentPos2, camera );
      var camPos = camera.position;
      var lDir = new THREE.Vector3(currentPos2.x, currentPos2.y, 0.5).unproject(camera).sub(camPos).normalize();
      var intersectCurrent = _Math.intersect(camPos, lDir, intersectLast[0].point, new THREE.Vector3(0,0,-1));

      if (intersectCurrent && intersectLast[0]) {
        var dist = intersectCurrent.clone().sub(intersectLast[0].point);
        camera.position.set(camPos.x - dist.x, camPos.y -  dist.y, camPos.z);
        this.requestMultiresTextures();
      }
    }
  },

  // TODO: unify with dragview
  panTo: function(targetPos2d) {
    var camPos = this.scene.camera.position;

    this._panAnimationDelta = 0.01;

    this._panAnimation = true;
    this._panAnimationIndex = 0;
    this._panAnimationStart = camPos.clone();
    this._panAnimationTarget = new THREE.Vector3(targetPos2d.x, targetPos2d.y, camPos.z);
    this._panAnimationDeltaPos = this._panAnimationTarget.clone().sub(this._panAnimationStart);

  },

  // TODO: unify with zoomView, zoomanimation
  zoomTo: function(targetZ) {
    var camPos = this.scene.camera.position;

    this._zoomToAnimationDelta = 0.01;

    this._zoomToAnimation = true;
    this._zoomToAnimationIndex = 0;
    this._zoomToAnimationStart = camPos.clone();
    this._zoomToAnimationTarget = new THREE.Vector3(camPos.x, camPos.y, targetZ);
    this._zoomToAnimationDeltaPos = this._zoomToAnimationTarget.clone().sub(this._zoomToAnimationStart);

  },

  /**
  * Zooms the viewport centered around a mouse position.
  *
  * @param {float} deltaZoom - Amount to zoom relative to current zoom. Ue deltaZoom > 0 for zooming in, deltaZoom < 0 for zooming out.
  *  (Usually the magnitude of a mouse wheel event)
  * @param {THREE.Vector2} mousePos2d - Normalized mouse position on screen.
  *  Center of zooming operation.
  */
  zoomView: function(deltaZoom, mousePos2d) {
    if (this.scene.rtiObjects.length < 1)
      return;

    var camera = this.scene.camera;
    if (Math.abs(deltaZoom) >= 1) {
      deltaZoom = Math.sign(deltaZoom)*0.1;
    }
    this.raycaster.setFromCamera( mousePos2d, camera );
    var intersect = this.raycaster.intersectObjects([this.scene.rtiObjects[0].renderObject], true);
    if (intersect[0]) {
      var viewLine = intersect[0].point.clone().sub(camera.position);
      var newDist = (1-deltaZoom)*viewLine.length();
      var activeMinZoom = Math.max(3*camera.near, this.scene.minZoomDist); // MAGIC_VALUE
      var activeMaxZoom = Math.min(100, this.scene.maxZoomDist); // MAGIC_VALUE
      if ((deltaZoom < 0 || newDist > activeMinZoom) &&
          (deltaZoom > 0 || newDist < activeMaxZoom)) {
        camera.position.addScaledVector(viewLine, deltaZoom);
        this.requestMultiresTextures();
      }
    }
  },

  startZoomingIn: function() {
    this._zoomAnimation = true;
    this._zoomAnimationDelta = this.zoomAnimationMagnitude;
  },

  startZoomingOut: function() {
    this._zoomAnimation = true;
    this._zoomAnimationDelta = - this.zoomAnimationMagnitude;
  },

  stopZooming: function() {
    this._zoomAnimation = false;
  },

  /**
  * Reset the camera to it's initial position and orientation.
  */
  resetCamera: function() {
    // TODO: API: use directly from scene
    this.scene.resetCamera();

    this.requestMultiresTextures();
  },

  /**
  * Returns the current settings of the viewer as a JSON object.
  * @returns {ViewerSettings} the current settings.
  */
  getSettings: function() {
    var settings = {};
    settings.viewerSettings = this.controller.getSettings();
    settings.scene = this.scene.getSettings();
    return settings;
  },

  loadConfig: function(configURL, successCB, errorCB) {
    var objectLoader = new ObjectLoader();

    var lastSeparatorIndex = configURL.lastIndexOf("/");
    var dataPrefix = configURL.substr(0,lastSeparatorIndex);

    var that = this;
    objectLoader.loadRTIViewerConfig(
      configURL,
      function(viewerConfig) {
        that.controller.setSettings(viewerConfig.viewerSettings);
        that.setRTIScene(viewerConfig.scene);
        successCB();
      },
      function(message) {
        errorCB(message);
      },
      function(config) {
        for (var i = 0; i < config.scene.rtiObjects.length; i++) {
          var obj = config.scene.rtiObjects[i];
          obj.textureAccess.prefix = dataPrefix + "/" + obj.textureAccess.prefix;
        }
      }
  );

  },

  /** @private */
  getDomElement: function() {
    return this.renderer.getDomElement();
  },

  /**
  * Intersect a RTIObject with the ray defined by a mouse position
  * @param {THREE.Vector2} mousePos - normalized mouse position.
  * @param {int} objIndex - index int the rtiObjects array of the object to intersect
  * @returns {Object[]} an array of intersections (see '.intersectObject()' in {@link https://threejs.org/docs/index.html#Reference/Core/Raycaster })
  */
  intersectObject: function(mousePos, objIndex) {
    this.raycaster.setFromCamera( mousePos, this.scene.camera );
    // TODO: move to obj, intersect with geometry, not renderobj.
    return this.raycaster.intersectObjects([this.scene.rtiObjects[objIndex].renderObject], true);
  },

  /** @private */
  requestMultiresTextures: function() {
    // TODO: move check outside of this func
    if (this.autoRequest && this.scene.threeScene) { // checking for threeScene: quick fix, TODO: get rid, fix in dispose of scene?
      var camera = this.scene.camera;
      this.scene.threeScene.updateMatrixWorld();
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.getInverse( camera.matrixWorld );

      var screenRes = new THREE.Vector2(this.renderer.getDomElement().clientWidth, this.renderer.getDomElement().clientHeight);
      for (var i = 0; i< this.scene.rtiObjects.length; i++) {
        var rtiObject = this.scene.rtiObjects[i];
        if (rtiObject.type == "MultiresTiledMaterialRTIObject") {
          rtiObject.requestMultiresTextureData(camera, screenRes);
        }
      }
    }
  },

  setAutoRequest: function(autoRequest) {
    if (autoRequest && !this.autoRequest) {
        this.requestMultiresTextures();
    }
    this.autoRequest = autoRequest;
  }
};

export { RTIViewer }
