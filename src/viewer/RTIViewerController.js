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

import { CircularBuffer } from '../utils/CircularBuffer.js';
import { Utils } from '../utils/Utils.js';
import { Log } from '../utils/Log.js';
import { RTIViewerOverlayGUI, DragMode } from './RTIViewerOverlayGUI.js';
import { Poly } from '../utils/Polyfills.js';

/**
* Handles user events for basic interactions like zooming, dragging, or control
* of light direction on the div containing the RTIViewer. Acts on the events by
* interfacing with the API of the RTIViewer.
*
* @class
* @param {RTIViewer} viewer - The viewer to be controlled.
* @private
*/
function RTIViewerController(viewer, settings, masterController, masterContainer) {
  this._viewer = null;
  this._dragMode = DragMode.LIGHTDIR;
  this._isMouseDown = false;
  this._lastMousePos = null;
  this._dPinchLast = 0;

  this._orientationAmplify = false;
  this._orientationAlpha = null;
  this._orientationBeta = null;
  this._orientationGamma = null;
  this._orientationControlSupported = false;
  this.orientationControlEnabled = false;
  this.orientationControlTested = false;
  this.orientationSupportTestOngoing = false;

  this._callbacksStart = [];
  this._callbacksMove = [];

  this._singleContactPointControl = true;

  this._firstContactStarted = false;
  this._firstMoveStarted = false;
  this._firstMoveCallbacks = [];

  this.supportsPassiveListeners = false;

  this._init(viewer, settings, masterController, masterContainer);
  return this;
} // RTIViewerController

RTIViewerController.prototype = {
  _init: function(viewer, settings, masterController, masterContainer) {
    var externalControl = typeof masterController != 'undefined';
    var externalContainer = typeof masterContainer != 'undefined';

    this.supportsPassiveListeners = Utils.detectPassiveListener();

    this._singleContactPointControl = true;

    this._firstContactStarted = false;
    this._firstMoveStarted = false;
    this._firstMoveCallbacks = [];

    this._viewer = viewer;

    this._dragMode = DragMode.LIGHTDIR;

    this._isMouseDown = false;
    this._lastMousePos = new THREE.Vector2();
    this._dPinchLast = 0;

    window.addEventListener("resize", this.onResize.bind(this) );

    this.mouseDownEventListener = externalControl? masterController.onMouseDown.bind(masterController) : this.onMouseDown.bind(this);
    this._viewer.getDomElement().addEventListener( 'mousedown', this.mouseDownEventListener );

    this.mouseMoveEventListener = externalControl? masterController.onMouseMove.bind(masterController) : this.onMouseMove.bind(this);
    this._viewer.getDomElement().addEventListener( 'mousemove', this.mouseMoveEventListener );

    this.mouseEnterEventListener = externalControl? masterController.onMouseEnter.bind(masterController) : this.onMouseEnter.bind(this);
    this._viewer.getDomElement().addEventListener( 'mouseenter', this.mouseEnterEventListener );

    this.mouseOutEventListener = externalControl? masterController.onMouseOut.bind(masterController) : this.onMouseOut.bind(this);
    this._viewer.getDomElement().addEventListener( 'mouseout', this.mouseOutEventListener );

    this.mouseUpEventListener = externalControl? masterController.onMouseUp.bind(masterController) : this.onMouseUp.bind(this);
    this._viewer.getDomElement().addEventListener( 'mouseup', this.mouseUpEventListener );

    this.mouseWheelEventListener = externalControl? masterController.onWheel.bind(masterController) : this.onWheel.bind(this);
    this.enableMouseWheelZoom(true);

    this.keyEventListener = externalControl? masterController.onKeyUp.bind(masterController) : this.onKeyUp.bind(this);
    this.enableKeyControl(true);

    this.touchStartEventListener = externalControl? masterController.onTouchStart.bind(masterController) : this.onTouchStart.bind(this);
    this._viewer.getDomElement().addEventListener('touchstart', this.touchStartEventListener, this.supportsPassiveListeners ? { passive: false } : false );

    this.touchMoveEventListener = externalControl? masterController.onTouchMove.bind(masterController) : this.onTouchMove.bind(this);
    this._viewer.getDomElement().addEventListener('touchmove', this.touchMoveEventListener, this.supportsPassiveListeners ? { passive: false } : false );

    this.touchEndEventListener = externalControl? masterController.onTouchEnd.bind(masterController) : this.onTouchEnd.bind(this);
    this._viewer.getDomElement().addEventListener('touchend', this.touchEndEventListener );

    this.orientationControlTested = false;
    this._orientationControlSupported = false;
    this.orientationControlEnabled = false;
    this.orientationSupportTestOngoing = false;
    this.orientationEventListener = this.onDeviceOrientation.bind(this);
    this.enableOrientationControl(true);

    this.fullScreenChangeEventListener = externalControl? masterController._fullScreenChangeHandler.bind(masterController) : this._fullScreenChangeHandler.bind(this);
    Poly.addFullscreenChangeEventListener(this.fullScreenChangeEventListener);
    this.fullScreenErrorEventListener = externalControl? masterController._fullScreenErrorHandler.bind(masterController) : this._fullScreenErrorHandler.bind(this);
    Poly.addFullscreenErrorEventListener(this.fullScreenErrorEventListener);

    this.targetContainer = externalContainer ? masterContainer : viewer.viewerContainer;

    this.overlayGUI = new RTIViewerOverlayGUI(viewer, this, masterController, settings);
    this.showOverlayGUI(true);

    this.lightControlEnabled = true;
    this.enableLightControl(true);

    this.setSettings(settings);

    this.update();
  },

  setSettings: function(settings) {
    if (settings == undefined)
    return;

    this.overlayGUI.setSettings(settings.overlayGUI);

    if (typeof settings.showOverlayGUI != 'undefined')
    this.showOverlayGUI(settings.showOverlayGUI);

    if (typeof settings.enableLightControl != 'undefined') {
      this.enableLightControl(settings.enableLightControl);
    }

    var keySettings = settings.keyboard;
    if (keySettings)
    this.enableKeyControl(keySettings.modeSwitch);

    var pointerSettings = settings.pointingDevice;
    if (pointerSettings) {
      this.enableMouseWheelZoom(pointerSettings.scroll);
      this.enablePointerDrag(pointerSettings.drag);
      this.setPointerDragMode(pointerSettings.dragMode);
    }

    var orientationSettings = settings.deviceOrientation;
    if (orientationSettings) {
      this.enableOrientationControl(orientationSettings.enable);
      this.enableOrientationAmplify(orientationSettings.amplify);
    }

    this.overlayGUI.update();
  },

  // tmp hack
  update: function() {
    this.overlayGUI.update();
  },

  showOverlayGUI: function(visible) {
    this.overlayGUIEnabled = visible;
    if (visible) {
      this.targetContainer.appendChild(this.overlayGUI.controlContainer);
      this.targetContainer.appendChild(this.overlayGUI.messageContainer);
    } else {
      this.targetContainer.removeChild(this.overlayGUI.controlContainer);
      this.targetContainer.removeChild(this.overlayGUI.messageContainer);
    }
  },

  enableLightControl: function(enable) {
    this.lightControlEnabled = enable;
    this.overlayGUI.lightDirButton.setVisibility(enable);
  },

  enableInstructions: function(pointerMessage, orientationMessage) {
    if (typeof pointerMessage == 'undefined') {
      pointerMessage = "Click and drag here to change the light direction.";
    }
    if (typeof orientationMessage == 'undefined') {
      orientationMessage = "Hold your device paralell to the ground and slowly rotate it to change the light direction.";
    }

    while (!this.orientationControlTested) {
      setTimeout(this.enableInstructions.bind(this, pointerMessage, orientationMessage), 100);
      return;
    }

    if (this.orientationControlEnabled) {
      this.overlayGUI.setMessage(orientationMessage);
    } else {
      this.overlayGUI.setMessage(pointerMessage);
    }

    var firstMoveCallback = function() {
      this.overlayGUI.showMessage(false);
    }
    this.addFirstMoveCallback(firstMoveCallback.bind(this));

    this.overlayGUI.showMessage(true);
  },

  enableMouseWheelZoom: function(enable) {
    this.mouseWheelZoomEnabled = enable;
    if (enable) {
      this._viewer.getDomElement().addEventListener('wheel', this.mouseWheelEventListener, this.supportsPassiveListeners ? { passive: false } : false);
    } else {
      this._viewer.getDomElement().removeEventListener('wheel', this.mouseWheelEventListener, this.supportsPassiveListeners ? { passive: false } : false);
    }
  },

  enableKeyControl: function(enable) {
    this.keyControlEnabled = enable;
    if (enable) {
      document.removeEventListener('keyup', this.keyEventListener);
      document.addEventListener('keyup', this.keyEventListener);
    } else {
      document.removeEventListener('keyup', this.keyEventListener);
    }
  },

  enablePointerDrag: function(enable) {
    this._singleContactPointControl = enable;
  },

  setPointerDragMode: function(modeString) {
    switch (modeString) {
      case DragMode.PAN:
        this._dragMode = DragMode.PAN;
        break;
      case DragMode.LIGHTDIR:
        this._dragMode = DragMode.LIGHTDIR;
        break;
      case DragMode.NONE:
        this._dragMode = DragMode.NONE;
        break;
      default:
        console.log("ERROR: unknown DragMode: "+modeString);
        return;
    }
    this.overlayGUI.setActiveMode(this._dragMode);
  },

  addDragCallbacks: function(callbackStart, callbackMove) {
    this._callbacksStart.push(callbackStart);
    this._callbacksMove.push(callbackMove);
  },

  removeDragCallbacks: function(callbackStart, callbackMove) {
    var index = this._callbacksStart.indexOf(callbackStart);
    if (index >= 0) {
      this._callbacksStart.splice(index, 1);
    }
    index = this._callbacksMove.indexOf(callbackMove);
    if (index >= 0) {
      this._callbacksMove.splice(index, 1);
    }
  },

  onDeviceOrientation: function(e) {
    if (window.orientation != null) {
      this._orientationAlpha.push(e.alpha*Math.PI/180);
      this._orientationBeta.push(e.beta*Math.PI/180);
      this._orientationGamma.push(e.gamma*Math.PI/180);

      var lightDir = new THREE.Vector3(0.0, 0.0, 1.0);

      var axisBeta = new THREE.Vector3(0.0, 0.0, 0.0);
      var axisGamma = new THREE.Vector3(0.0, 0.0, 0.0);

      var orientation = window.orientation;
      if (orientation == 0.0) {
        axisBeta.setX(1.0);
        axisGamma.setY(1.0);
      } else if (orientation == 90) {
        axisBeta.setY(1.0);
        axisGamma.setX(-1.0);
      } else if (orientation == 180) {
        axisBeta.setX(-1.0);
        axisGamma.setY(-1.0);
      } else if (orientation == -90) {
        axisBeta.setY(-1.0);
        axisGamma.setX(1.0);
      }

      var angleBeta = -this._orientationBeta.getAvg();
      var angleGamma = -this._orientationGamma.getAvg();
      if (this._orientationAmplify) {
        angleGamma = 2*angleGamma;
        angleBeta = 2*angleBeta;
      }

      lightDir.applyAxisAngle(axisBeta, angleBeta);
      lightDir.applyAxisAngle(axisGamma, angleGamma);

      lightDir.normalize();
      if (this.lightControlEnabled) {
        this._viewer.scene.directionalLights[0].position.copy(lightDir);
      }
    }
  },

  onResize: function() {
    this._viewer.resize();
    this.overlayGUI.resize();
  },

  onMouseEnter: function( event_info ) {
    event_info.preventDefault();
    this._isMouseIn = true;
  },

  onMouseOut: function( event_info ) {
    event_info.preventDefault();
    this._isMouseIn = false;
    this._isMouseDown = false;
  },

  onMouseUp: function( event_info ) {
    event_info.preventDefault();
    this._isMouseDown = false;
  },

  onMouseDown: function( event_info ) {
    event_info.preventDefault();
    if (event_info.button == 0) {
      this._contactPointStart(event_info);
    }
  },

  onMouseMove: function( event_info ) {
    event_info.preventDefault();
    this._contactPointMove(event_info);
  },

  onWheel: function(event_info) {
    event_info.preventDefault();
    var mousePos = Utils.normalizedMouseCoords(event_info, this._viewer.getDomElement());
    this._viewer.zoomView(event_info.deltaY/40, mousePos); // MAGIC_VALUE
  },

  onTouchStart: function( event ) {
    if (this._singleContactPointControl && event.targetTouches.length == 1) {
      event.preventDefault();
      var touch = event.changedTouches[0];
      this._contactPointStart(touch);
    }
  },

  onTouchMove: function( event ) {
    if (this._singleContactPointControl && event.targetTouches.length == 1) {
      event.preventDefault();
      var touch = event.changedTouches[0];
      this._isZoomActive = false;
      this._contactPointMove(touch);
    } else if (event.targetTouches.length == 2) {
      event.preventDefault();
      var touch0 = event.changedTouches[0];
      var touch1 = event.changedTouches[1];
      this._isMouseDown = false;
      var newMousePos0 = Utils.normalizedMouseCoords(touch0, this._viewer.getDomElement());
      var newMousePos1 = Utils.normalizedMouseCoords(touch1, this._viewer.getDomElement());
      var dPinchNew = Math.pow(newMousePos1.x - newMousePos0.x, 2) +  Math.pow(newMousePos1.y - newMousePos0.y, 2);
      if (this._isZoomActive) {
        var d = dPinchNew - this._dPinchLast;
        this._viewer.zoomView(d, new THREE.Vector2(0,0));
        this._dPinchLast = dPinchNew;
      } else {
        this._isZoomActive = true;
        this._dPinchLast = dPinchNew;
      }
    }
  },

  onTouchEnd: function( event ) {
    if (this._singleContactPointControl && event.targetTouches.length == 1) {
      event.preventDefault();
      this._isZoomActive = false;
      this._isMouseDown = false;
    }
  },

  onKeyUp: function(event_info, ignoreMouseIn) {
    if (ignoreMouseIn || this._isMouseIn) {
      event_info.preventDefault();
      if (event_info.keyCode == 32) {
        switch (this._dragMode) {
          case DragMode.PAN:
            this._dragMode = DragMode.LIGHTDIR; // switch mode
            break;
          case DragMode.LIGHTDIR:
            this._dragMode = DragMode.PAN; // switch mode
            break;
          case DragMode.NONE:
            this._dragMode = DragMode.NONE; // do nothing
            break;
          default:
            console.log("ERROR: unknown DragMode: "+modeString);
            return;
        }
        this.overlayGUI.setActiveMode(this._dragMode);
      }
    }
  },

  /**
  * Enables/disables control of lights through orientation/acceleration sensors.
  * @param {bool} enable - enable/disable.
  */
  enableOrientationControl: function(enable) {
    this.orientationControlDesired = enable;
    if (enable) {
      if (!this.orientationControlTested) {
        this.testOrientationControlSupport(this._enableOrientationControlResolve.bind(this));
      } else {
        if (this._orientationControlSupported) {
          this._enableOrientationControlResolve(true);
        } else {
          this.orientationControlEnabled = false;
          window.removeEventListener('deviceorientation', this.orientationEventListener);
        }
      }
    } else {
      this.orientationControlEnabled = false;
      window.removeEventListener('deviceorientation', this.orientationEventListener);
    }
  },

  _enableOrientationControlResolve: function(success) {
    this.orientationControlTested = true;
    this._orientationControlSupported = success;
    if (success) {
      Log.info(" has orientation support");

      if (this.orientationControlDesired) {
        this.orientationControlEnabled = true;
        var bufferSize = 3;
        this._orientationAlpha = new CircularBuffer(bufferSize);
        this._orientationBeta = new CircularBuffer(bufferSize);
        this._orientationGamma = new CircularBuffer(bufferSize);
        window.addEventListener('deviceorientation', this.orientationEventListener);
      }
    } else {
      Log.info(" no orientation support");
    }
  },

  /**
  * Enables/disables the amplification of movements detected by orientation/acceleration sensors.
  * <br>Angles detected by the sensors will be multiplied by a factor of 2 for controlling the light direction.
  * <br>This will have no effects if orientation control is off (see {@link RTIViewer#enableOrientationControl}).
  * @param {bool} enable - enable/disable.
  */
  enableOrientationAmplify: function(enable) {
    this._orientationAmplify = enable;
  },

  testOrientationControlSupport: function(callback) {
    while (this.orientationSupportTestOngoing) {
      setTimeout(this.testOrientationControlSupport.bind(this, callback), 100);
      return;
    }

    this.orientationSupportTestOngoing = true;
    var numDeviceOrientationCalls = 0;
    var lastDeviceOrientationCall = Date.now();
    var orientationTestResolved = false;

    var deviceOrientationTestListener = function() {
      var now = Date.now();
      numDeviceOrientationCalls++;
      if (numDeviceOrientationCalls > 1) {
        if (now-lastDeviceOrientationCall < 3000) {
          callback(true);
          this.orientationSupportTestOngoing = false;
        } else {
          callback(false);
          this.orientationSupportTestOngoing = false;
        }
        window.removeEventListener('deviceorientation', deviceOrientationTestListener );
        orientationTestResolved = true;
      }
      lastDeviceOrientationCall = now;
    };

    var abortTest = function() {
      if (!orientationTestResolved) {
        callback(false);
        orientationTestResolved = true;
        this.orientationSupportTestOngoing = false;
      }
    };

    if (window.DeviceOrientationEvent != null && window.orientation != null) {
      window.addEventListener('deviceorientation', deviceOrientationTestListener);
      setTimeout(abortTest, 3000);
    } else {
      callback(false);
      this.orientationSupportTestOngoing = false;
    }
  },

  setLightDir: function(mousePos2d){
    var lightDir = new THREE.Vector3(mousePos2d.x, mousePos2d.y, 0);

    var sumSquares = lightDir.x*lightDir.x + lightDir.y*lightDir.y;
    if (sumSquares < 1) {
      lightDir.setZ(Math.sqrt(1 - sumSquares));
    } else {
      lightDir.setZ(0.0);
      lightDir.normalize();
    }
    if (this.lightControlEnabled && this._viewer.scene.directionalLights.length > 0) {
      this._viewer.scene.directionalLights[0].position.copy(lightDir);
    }
  },

  addFirstMoveCallback: function(callback){
    this._firstMoveCallbacks.push(callback);
  },

  _contactPointStart: function(contactPoint) {
    this._firstContactStarted = true;
    if (this._singleContactPointControl) {
      this._isMouseDown = true;
      var newMousePos = Utils.normalizedMouseCoords(contactPoint, this._viewer.getDomElement());
      switch (this._dragMode) {
        case DragMode.PAN:
          this._lastMousePos = newMousePos;
          break;
        case DragMode.LIGHTDIR:
          this.setLightDir(newMousePos);
          break;
        case DragMode.NONE:
          break;
        default:
          console.log("ERROR: unknown DragMode: "+modeString);
          return;
      }
      for (var i = 0; i < this._callbacksStart.length; i++) {
        this._callbacksStart[i](newMousePos);
      }
    }
  },

  _contactPointMove: function(contactPoint) {
    if (this._firstContactStarted && this._isMouseDown) {
      if (!this._firstMoveStarted) {
        for (var i = 0; i < this._firstMoveCallbacks.length; i++) {
          this._firstMoveCallbacks[i]();
        }
        this._firstMoveStarted = true;
      }
    }
    if (this._singleContactPointControl && this._isMouseDown) {
      var newMousePos = Utils.normalizedMouseCoords(contactPoint, this._viewer.getDomElement());
      switch (this._dragMode) {
        case DragMode.PAN:
          this._viewer.dragView(this._lastMousePos, newMousePos);
          this._lastMousePos = newMousePos;
          break;
        case DragMode.LIGHTDIR:
          this.setLightDir(newMousePos);
          break;
        case DragMode.NONE:
          break;
        default:
          console.log("ERROR: unknown DragMode: "+modeString);
          return;
      }
      for (var i = 0; i < this._callbacksMove.length; i++) {
        this._callbacksMove[i](this._lastMousePos, newMousePos);
      }
    }
  },

  isPhysicsAnimationEnabled: function() {
    return this._viewer.scene.physicsEnabled;
  },

  enablePhysicsAnimation: function(enable) {
    this._viewer.scene.physicsEnabled = enable;
  },


  isLightAnimationEnabled: function() {
    return this._viewer.scene.lightAnimationEnabled;
  },

  enableLightAnimation: function(enable) {
    this._viewer.scene.lightAnimationEnabled = enable;
  },

  isFullScreen: function() {
    var viewerContainer = this._viewer.viewerContainer;
    if (Poly.fullscreenAvailable(viewerContainer)) {
      var fullscreenElement = Poly.fullscreenElement();
      return (fullscreenElement == this._viewer.viewerContainer);
    } else {
      if (viewerContainer.classList.contains("mockFullScreen")) {
        return true;
      } else {
        return false;
      }
    }
  },

  _fullScreenErrorHandler: function() {
    Log.error("could not enable fullscreen");
  },

  _fullScreenChangeHandler: function() {
    var viewerContainer = this._viewer.viewerContainer;
    if (Poly.fullscreenAvailable(viewerContainer)) {
      if (this.isFullScreen()) {
        viewerContainer.style.width = "100vw";
        viewerContainer.style.height = "100vh";
      } else {
        viewerContainer.style.width = "100%";
        viewerContainer.style.height = "100%";
      }
    } else {
      if (this.isFullScreen()) {
        var clientH = document.documentElement.clientHeight;
        viewerContainer.style.width = "100vw";
        viewerContainer.style.height = clientH;
        viewerContainer.style.zIndex = "100";
        viewerContainer.style.position = "fixed";
      } else {
        viewerContainer.style.width = "100%";
        viewerContainer.style.height = "100%";
        viewerContainer.style.zIndex = "";
        viewerContainer.style.position = "relative";
      }
      setTimeout(this._viewer.resize(), 2000);
      setTimeout(this._viewer.resize(), 6000);
    }
    this._viewer.resize();
  },

  setFullScreen: function(fullscreen) {
    var viewerContainer = this._viewer.viewerContainer;
    if (Poly.fullscreenAvailable(viewerContainer)) {
      if (fullscreen) {
        Poly.requestFullscreen(viewerContainer);
      } else {
        Poly.exitFullscreen();
      }
    } else {
      if (fullscreen) {
        viewerContainer.classList.add("mockFullScreen");
      } else {
        viewerContainer.classList.remove("mockFullScreen");
      }
      this._fullScreenChangeHandler();
    }
  },

  getSettings: function() {
    var settings = {};
    settings.overlayGUI = this.overlayGUI.getSettings();
    settings.showOverlayGUI = this.overlayGUIEnabled;
    settings.enableLightControl = this.lightControlEnabled;
    settings.keyboard = {};
    settings.keyboard.modeSwitch = this.keyControlEnabled;
    settings.pointingDevice = {};
    settings.pointingDevice.scroll = this.mouseWheelZoomEnabled;
    settings.pointingDevice.drag = this._singleContactPointControl;
    settings.pointingDevice.dragMode = this._dragMode;
    settings.deviceOrientation = {};
    settings.deviceOrientation.enable = this.orientationControlDesired;
    settings.deviceOrientation.amplify = this._orientationAmplify;
    return settings;
  }
} // RTIViewerController prototype

export { RTIViewerController }
