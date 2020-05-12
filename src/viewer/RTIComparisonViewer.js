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

import { Poly } from '../utils/Polyfills.js';
import { ObjectLoader } from '../loaders/ObjectLoader.js';
import { RTIViewer } from './RTIViewer.js';

function RTIComparisonViewer(container) {
  this.userContainer = container;

  this.masterContainer = document.createElement("div");
  this.masterContainer.style.position = "relative";
  this.masterContainer.style.width = "100%";
  this.masterContainer.style.height = "100%";
  this.masterContainer.style.top = "0px";
  this.masterContainer.style.left = "0px";
  this.masterContainer.style.margin = "0";
  this.masterContainer.style.padding = "0";
  this.masterContainer.style.border = "0";
  this.userContainer.appendChild(this.masterContainer);

  this.leftContainer = document.createElement("div");
  this.leftContainer.style.position = "relative";
  this.leftContainer.style.display = "inline-block";
  this.leftContainer.style.width = "50%";
  this.leftContainer.style.height = "100%";
  this.leftContainer.style.top = "0px";
  this.leftContainer.style.left = "0px";
  this.leftContainer.style.margin = "0";
  this.leftContainer.style.padding = "0";
  this.leftContainer.style.border = "0";
  this.masterContainer.appendChild(this.leftContainer);

  this.rightContainer = document.createElement("div");
  this.rightContainer.style.position = "relative";
  this.rightContainer.style.display = "inline-block";
  this.rightContainer.style.width = "50%";
  this.rightContainer.style.height = "100%";
  this.rightContainer.style.top = "0px";
  this.rightContainer.style.left = "0px";
  this.rightContainer.style.margin = "0";
  this.rightContainer.style.padding = "0";
  this.rightContainer.style.border = "0";
  this.masterContainer.appendChild(this.rightContainer);

  this.viewers = [];
  this.masterController = new MasterController(this.viewers, this.masterContainer);

  var rightSettings = { showOverlayGUI: false };
  this.viewers[0] = new RTIViewer(this.leftContainer, null, this.masterController, this.masterContainer);
  this.viewers[1] = new RTIViewer(this.rightContainer, rightSettings, this.masterController, this.masterContainer);

  this.viewers[0].initDefaultScene();
  this.viewers[1].initDefaultScene();
}

RTIComparisonViewer.prototype = {
  setSettings: function(settings) {
    this.viewers[0].controller.setSettings(settings);
    this.viewers[1].controller.setSettings(settings);
  },

  setMasterScene: function(scene) {
    var sceneConfig = scene.getSettings();
    sceneConfig.rtiObjects = [];
    var loader = new ObjectLoader();
    // this.masterScene = loader.createRTIScene(sceneConfig);
    var masterScene = loader.createRTIScene(sceneConfig);

    var scene0 = loader.createRTIScene(masterScene.getSettings());
    this.viewers[0].setRTIScene(scene0);

    var scene1 = loader.createRTIScene(masterScene.getSettings());
    this.viewers[1].setRTIScene(scene1);
  },

  setRTIObject: function(viewIndex, object) {
    if (this.viewers[viewIndex].scene.rtiObjects.length > 0) {
      this.viewers[viewIndex].scene.threeScene.remove(this.viewers[viewIndex].scene.rtiObjects[0].renderObject);
      this.viewers[viewIndex].scene.rtiObjects[0].dispose();
      this.viewers[viewIndex].scene.rtiObjects = [];
    }
    this.viewers[viewIndex].addRTIObject(object);
  },

  startRendering: function() {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].startRendering();
    }
  },

  getSettings: function(index) {
    return this.viewers[index].getSettings();
  },

  setDragMode: function() {
    this.masterController._onPanClick();
  },

  addDirectionalLight: function() {
    var insertIndex = -1;
    for (var i = 0; i < this.viewers.length; i++) {
      insertIndex =this.viewers[i].scene.addDirectionalLight();
    }
    return insertIndex;
  },

  addAmbientLight: function() {
    var insertIndex = -1;
    for (var i = 0; i < this.viewers.length; i++) {
      insertIndex =this.viewers[i].scene.addAmbientLight();
    }
    return insertIndex;
  },

  addPointLight: function() {
    var insertIndex = -1;
    for (var i = 0; i < this.viewers.length; i++) {
      insertIndex =this.viewers[i].scene.addPointLight();
    }
    return insertIndex;
  },

  addSpotLight: function() {
    var insertIndex = -1;
    for (var i = 0; i < this.viewers.length; i++) {
      insertIndex =this.viewers[i].scene.addSpotLight();
    }
    return insertIndex;
  },

  setDirectionalLightsExtensions: function(lightIndex, extensions) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.directionalLights[lightIndex].extensions = extensions;
    }
  },

  setAmbientLightsExtensions: function(lightIndex, extensions) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.ambientLights[lightIndex].extensions = extensions;
    }
  },

  setPointLightsExtensions: function(lightIndex, extensions) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.pointLights[lightIndex].extensions = extensions;
    }
  },

  setSpotLightsExtensions: function(lightIndex, extensions) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.spotLights[lightIndex].extensions = extensions;
    }
  },

  removeDirectionalLight: function(lightIndex) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.removeDirectionalLight(lightIndex);
    }
  },

  removeAmbientLight: function(lightIndex) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.removeAmbientLight(lightIndex);
    }
  },

  removePointLight: function(lightIndex) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.removePointLight(lightIndex);
    }
  },

  removeSpotLight: function(lightIndex) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.removeSpotLight(lightIndex);
    }
  },

  setDirectionalLightColor: function(lightIndex, color, intensity) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.directionalLights[lightIndex].color = color;
      this.viewers[i].scene.directionalLights[lightIndex].intensity = intensity;
    }
  },

  setAmbientLightColor: function(lightIndex, color, intensity) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.ambientLights[lightIndex].color = color;
      this.viewers[i].scene.ambientLights[lightIndex].intensity = intensity;
    }
  },

  setPointLightColor: function(lightIndex, color, intensity) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.pointLights[lightIndex].color = color;
      this.viewers[i].scene.pointLights[lightIndex].intensity = intensity;
    }
  },

  setSpotLightColor: function(lightIndex, color, intensity) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.spotLights[lightIndex].color = color;
      this.viewers[i].scene.spotLights[lightIndex].intensity = intensity;
    }
  },

  setDirectionalLightDirection: function(lightIndex, direction) {
    if (this.viewers[0].scene.directionalLights.length < 1)
    return;
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.directionalLights[lightIndex].position.set(-direction.x, -direction.y, -direction.z);
    }
  },

  setSpotLightDirection: function(lightIndex, direction) {
    if (this.viewers[0].scene.spotLights.length < 1)
    return;
    for (var i = 0; i < this.viewers.length; i++) {
      var target = this.viewers[i].scene.spotLights[lightIndex].position.clone().add(direction);
      this.viewers[i].scene.spotLights[lightIndex].target.position.copy(target);
    }
  },

  setPointLightPosition: function(lightIndex, position) {
    if (this.viewers[0].scene.pointLights.length < 1)
    return;
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.pointLights[lightIndex].position.copy(position);
    }
  },

  setSpotLightPosition: function(lightIndex, position) {
    if (this.viewers[0].scene.spotLights.length < 1)
    return;
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.spotLights[lightIndex].position.copy(position);
    }
  },

  setWindEnabled: function(value) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.physics.windEnabled = value;
    }
  },

  setWindStrength: function(value) {
    for (var i = 0; i < this.viewers.length; i++) {
      this.viewers[i].scene.physics.windStrength = value;
    }
  }

}

function MasterController(viewers, masterContainer) {
  this.masterContainer = masterContainer;
  this.viewers = viewers;
  this.keyUpCount = 0;
}

MasterController.prototype.dummyFunction = function() {
}

MasterController.prototype.createMockEvent = function(event, viewer) {
  var mockEvent = {
    preventDefault : this.dummyFunction,
    deltaY: event.deltaY,
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
    button: event.button,
    keyCode: event.keyCode,
    targetTouches: event.targetTouches,
    changedTouches: event.changedTouches
  };

  var srcElement = event.target || event.srcElement;
  var offsetSrc = srcElement.getBoundingClientRect();
  var offsetTarget = viewer.getDomElement().getBoundingClientRect();
  mockEvent.clientX = event.clientX - offsetSrc.left + offsetTarget.left;
  mockEvent.clientY = event.clientY - offsetSrc.top + offsetTarget.top;

  return mockEvent;
}

MasterController.prototype.onWheel = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onWheel(mockEvent);
  }
}

MasterController.prototype.onMouseDown = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onMouseDown(mockEvent);
  }
}

MasterController.prototype.onMouseMove = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onMouseMove(mockEvent);
  }
}

MasterController.prototype.onMouseEnter = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onMouseEnter(mockEvent);
  }
}

MasterController.prototype.onMouseOut = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onMouseOut(mockEvent);
  }
}

MasterController.prototype.onMouseUp = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onMouseUp(mockEvent);
  }
}

MasterController.prototype.onTouchStart = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onTouchStart(mockEvent);
  }
}

MasterController.prototype.onTouchMove = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onTouchMove(mockEvent);
  }
}

MasterController.prototype.onTouchEnd = function(event) {
  event.preventDefault();
  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onTouchEnd(mockEvent);
  }
}

// overlayGUI handlers

MasterController.prototype._onReturnHomeClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onReturnHomeClick();
  }
}

MasterController.prototype._onZoomInClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onZoomInClick();
  }
}

MasterController.prototype._onZoomOutClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onZoomOutClick();
  }
}

MasterController.prototype._onLightDirClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onLightDirClick();
  }
}

MasterController.prototype._onPanClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onPanClick();
  }
}

MasterController.prototype._onAnimationClick = function() {
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI._onAnimationClick();
  }
}

MasterController.prototype._onFullSreenClick = function() {
  var element = this.masterContainer;
  if (!this.isFullScreen()) {
    Poly.requestFullscreen(element);
  } else {
    Poly.exitFullscreen();
  }
}

MasterController.prototype._fullScreenErrorHandler = function() {
  // controller handler
  Log.error("could not enable fullscreen");

  // overlayGUI handler
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI.fullScreenButton.setActive(this.isFullScreen());
  }
}

MasterController.prototype._fullScreenChangeHandler = function() {
  // controller handler
  var element = this.masterContainer;
  if (this.isFullScreen()) {
    element.style.width = "100vw";
    element.style.height = "100vh";
  } else {
    element.style.width = "100%";
    element.style.height = "100%";
  }
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].resize();
  }

  // overlayGUI handler
  for (var i = 0; i < this.viewers.length; i++) {
    this.viewers[i].controller.overlayGUI.fullScreenButton.setActive(this.isFullScreen());
  }
}

MasterController.prototype.isFullScreen =  function() {
  var fullscreenElement = Poly.fullscreenElement();
  return (fullscreenElement == this.masterContainer);
}


MasterController.prototype.onKeyUp = function(event) {
  this.keyUpCount++;
  if (this.keyUpCount%2==0)
  return;

  for (var i = 0; i < this.viewers.length; i++) {
    var mockEvent = this.createMockEvent(event, this.viewers[i]);
    this.viewers[i].controller.onKeyUp(mockEvent, true);

    if (this.viewers[i].controller._isMouseIn) {
      event.preventDefault();
    }

  }

}

export { RTIComparisonViewer }
