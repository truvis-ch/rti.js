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

import { Log } from '../utils/Log.js';
import { RTIViewerOverlayButton } from './RTIViewerOverlayButton.js';
import { Poly } from '../utils/Polyfills.js';

import homeIconBase64 from '../../resources/icons/ic_home_white_24dp_2x.png';
import zoomInIconBase64 from '../../resources/icons/ic_zoom_in_white_24dp_2x.png';
import zoomOutIconBase64 from '../../resources/icons/ic_zoom_out_white_24dp_2x.png';
import lightDirIconBase64 from '../../resources/icons/ic_lightbulb_outline_white_24dp_2x.png';
import panIconBase64 from '../../resources/icons/ic_pan_tool_white_24dp_2x.png';
import playIconBase64 from '../../resources/icons/ic_play_arrow_white_24dp_2x.png';
import pauseIconBase64 from '../../resources/icons/ic_pause_white_24dp_2x.png';
import fullScreenIconBase64 from '../../resources/icons/ic_fullscreen_white_24dp_2x.png';

// TODO: use const when uglifyjs has been updated/changed to es6 supporting for
var DragMode = {
  PAN: "PAN",
  LIGHTDIR: "LIGHTDIR",
  NONE: "NONE"
};

function RTIViewerOverlayGUI(viewer, controller, masterController, settings, imagePrefix) {
  var externalControl = typeof masterController != 'undefined';

  this.viewer = viewer;
  this.controller = controller;
  this.buttons = [];

  this.controlContainer = document.createElement("div");
  this.controlContainer.style.position = "absolute";
  // this.controlContainer.style.width = "100%";
  // this.controlContainer.style.height = "100%";
  this.controlContainer.style.margin = "0";
  this.controlContainer.style.padding = "0";
  this.controlContainer.style.border = "0";
  this.controlContainer.style.background = "none transparent";
  this.controlContainer.style.whiteSpace = "nowrap";

  this.animationButtonTargets = {
    physics: true,
    light: false
  };

  this.stopZoomTimer = null;

  var homeButtonImgSrc = imagePrefix ? imagePrefix+"ic_home_white_24dp_2x.png" : homeIconBase64;
  this.returnHomeEventListener = externalControl? masterController._onReturnHomeClick.bind(masterController) : this._onReturnHomeClick.bind(this);
  var homeButton = new RTIViewerOverlayButton(homeButtonImgSrc, this.returnHomeEventListener);
  this.controlContainer.appendChild(homeButton.element);
  this.buttons.push(homeButton);
  this.homeButton = homeButton;

  var zoomInButtonImgSrc = imagePrefix ? imagePrefix+"ic_zoom_in_white_24dp_2x.png" : zoomInIconBase64;
  this.zoomInEventListener = externalControl? masterController._onZoomInClick.bind(masterController) : this._onZoomInClick.bind(this);
  var zoomInButton = new RTIViewerOverlayButton(zoomInButtonImgSrc, this.zoomInEventListener);
  this.controlContainer.appendChild(zoomInButton.element);
  this.buttons.push(zoomInButton);
  this.zoomInButton = zoomInButton;

  var zoomOutButtonImgSrc = imagePrefix ? imagePrefix+"ic_zoom_out_white_24dp_2x.png" : zoomOutIconBase64;
  this.zoomOutEventListener = externalControl? masterController._onZoomOutClick.bind(masterController) : this._onZoomOutClick.bind(this);
  var zoomOutButton = new RTIViewerOverlayButton(zoomOutButtonImgSrc, this.zoomOutEventListener);
  this.controlContainer.appendChild(zoomOutButton.element);
  this.buttons.push(zoomOutButton);
  this.zoomOutButton = zoomOutButton;

  var lightDirButtonImgSrc = imagePrefix ? imagePrefix+"ic_lightbulb_outline_white_24dp_2x.png" : lightDirIconBase64;
  this.lightDirEventListener = externalControl? masterController._onLightDirClick.bind(masterController) : this._onLightDirClick.bind(this);
  var lightDirButton = new RTIViewerOverlayButton(lightDirButtonImgSrc, this.lightDirEventListener);
  this.controlContainer.appendChild(lightDirButton.element);
  this.buttons.push(lightDirButton);
  this.lightDirButton = lightDirButton;

  var panButtonImgSrc = imagePrefix ? imagePrefix+"ic_pan_tool_white_24dp_2x.png" : panIconBase64;
  this.panEventListener = externalControl? masterController._onPanClick.bind(masterController) : this._onPanClick.bind(this);
  var panButton = new RTIViewerOverlayButton(panButtonImgSrc, this.panEventListener);
  this.controlContainer.appendChild(panButton.element);
  this.buttons.push(panButton);
  this.panButton = panButton;

  var animationButtonImgSrc = imagePrefix ? imagePrefix+"ic_play_arrow_white_24dp_2x.png" : playIconBase64;
  this.animationEventListener = externalControl? masterController._onAnimationClick.bind(masterController) : this._onAnimationClick.bind(this);
  var animationButton = new RTIViewerOverlayButton(animationButtonImgSrc, this.animationEventListener);
  this.controlContainer.appendChild(animationButton.element);
  this.buttons.push(animationButton);
  this.animationButton = animationButton;
  this.playButtonPath = imagePrefix ? imagePrefix+"ic_play_arrow_white_24dp_2x.png" : playIconBase64;
  this.pauseButtonPath = imagePrefix ? imagePrefix+"ic_pause_white_24dp_2x.png" : pauseIconBase64;
  this.animationButton.setVisibility(false);

  var fullScreenButtonImgSrc = imagePrefix ? imagePrefix+"ic_home_white_24dp_2x.png" : fullScreenIconBase64;
  this.fullScreenEventListener = externalControl? masterController._onFullSreenClick.bind(masterController) : this._onFullSreenClick.bind(this);
  var fullScreenButton = new RTIViewerOverlayButton(fullScreenButtonImgSrc, this.fullScreenEventListener, true);
  this.controlContainer.appendChild(fullScreenButton.element);
  this.buttons.push(fullScreenButton);
  this.fullScreenButton = fullScreenButton;


  this.messageContainer = document.createElement("div");
  this.messageContainer.style.position = "absolute";
  this.messageContainer.style.width = "80%";
  this.messageContainer.style.margin = "0";
  this.messageContainer.style.padding = "10px";

  this.messageContainer.style.border = "0";
  this.messageContainer.style.background = "none transparent";
  this.messageContainer.style.left = "50%";
  this.messageContainer.style.top = "50%";
  this.messageContainer.style.transform = "translate(-50%, -50%)";
  this.messageContainer.style.background = "rgba(170,170,170,0.4)";
  this.messageContainer.style.pointerEvents = "none";

  this.messageCloseButton = document.createElement("button");
  this.messageCloseButton.style.float = "right";
  this.messageCloseButton.style.background = "rgba(170,170,170,0.4)";
  this.messageCloseButton.style.border = "none";
  this.messageCloseButton.style.color = "rgba(25,25,25,0.8)";
  this.messageCloseButton.style.font = "bold 0.8em arial, sans-serif";
  this.messageCloseButton.innerText = "X";
  this.messageCloseButton.style.pointerEvents = "auto";

  this._closeMessageCallbacks = [];
  var that = this;
  var messageCloseButton = this.messageCloseButton;
  this.messageCloseButton.onmouseover = function() { messageCloseButton.style.background = "rgba(50,50,50,0.4)"; }
  this.messageCloseButton.onmouseleave = function() { messageCloseButton.style.background = "rgba(170,170,170,0.4)"; }
  this.messageCloseButton.onclick = function() {
    for (var i = 0; i < that._closeMessageCallbacks.length; i++) {
      that._closeMessageCallbacks[i]();
    }
    that.showMessage(false);
  }
  this.messageContainer.appendChild(this.messageCloseButton);

  this.messageDiv = document.createElement("div");
  // this.messageDiv.style.color = "rgba(255,255,255,0.8)";
  // this.messageDiv.style.color = "rgba(10,10,10,0.8)";
  this.messageDiv.style.color = "rgba(25,25,25,0.8)";
  this.messageDiv.style.font = "bold 1.25em arial, sans-serif";
  this.messageDiv.style.textAlign = "center";

  this.messageP = document.createElement("p");
  this.messageP.innerText = "";
  this.messageP.style.color = "rgba(25,25,25,0.8)";
  this.messageP.style.font = "bold 1.25em arial, sans-serif";
  this.messageP.style.margin = "20px 0px";
  this.messageP.style.padding = "0px";
  this.messageP.style.border = "none";
  this.messageP.style.lineHeight = "normal";
  this.messageDiv.appendChild(this.messageP);

  this.messageContainer.appendChild(this.messageDiv);

  this.setMessage("");
  this.showMessage(false);


  if (!externalControl) {
    Poly.addFullscreenChangeEventListener(this.fullScreenChangeEventListener);
    Poly.addFullscreenErrorEventListener(this.fullScreenErrorEventListener);
  }

  this.setActiveMode(this.controller._dragMode);

  this.align(2); // default align ui at bottom of viewer

  window.addEventListener("resize", this.resize.bind(this));

  // TODO: synchronize remove redundancy with cntroller.setsetttings
  // this.setSettings(settings);

  this.update();
  this.resize();
}

RTIViewerOverlayGUI.prototype.setSettings = function(settings) {
  if (typeof settings == 'undefined')
  return;

  this.homeButton.setVisibility(settings.homeButton);
  this.zoomInButton.setVisibility(settings.zoomButtons);
  this.zoomOutButton.setVisibility(settings.zoomButtons);
  this.panButton.setVisibility(settings.panButton);
  this.lightDirButton.setVisibility(settings.lightDirButton);
  this.fullScreenButton.setVisibility(settings.fullScreenButton);
  this.animationButton.setVisibility(settings.animationButton);

  var message = "";
  if (typeof settings.message != 'undefined') {
    message = settings.message;
  }
  this.setMessage(message);
  this.showMessage(settings.showMessage);

  if (typeof settings.animationButtonTargets != 'undefined') {
    this.animationButtonTargets = settings.animationButtonTargets;
  }

  this.update();

  this.resize();
}

RTIViewerOverlayGUI.prototype.addCloseMessageCallback = function(callback){
  this._closeMessageCallbacks.push(callback);
}

RTIViewerOverlayGUI.prototype.showMessage = function(show) {
  this.messageEnabled = show;
  if (show) {
    this.messageContainer.style.display = "";
  } else {
    this.messageContainer.style.display = "none";
  }
}

RTIViewerOverlayGUI.prototype.setMessage = function(message) {
  this.message = message;
  this.messageP.innerText = this.message;
}

RTIViewerOverlayGUI.prototype.update = function() {
  var enabled = false;
  if (this.animationButtonTargets.physics) {
    enabled = enabled || this.controller.isPhysicsAnimationEnabled();
  }
  if (this.animationButtonTargets.light) {
    enabled = enabled || this.controller.isLightAnimationEnabled();
  }
  if (enabled) {
    this.animationButton.img.src = this.pauseButtonPath;
  } else {
    this.animationButton.img.src = this.playButtonPath;
  }
}

RTIViewerOverlayGUI.prototype.resize = function() {
  var buttonCount = 0;
  for (var i = 0; i < this.buttons.length; i++) {
    if (this.buttons[i].visible) {
      buttonCount++;
    }
  }

  var size = 48;
    switch (this.alignmentId) {
      case 0:
        size = Math.min(this.viewer.viewerContainer.clientWidth/buttonCount, 48);
        break;
      case 1:
        size = Math.min(this.viewer.viewerContainer.clientHeight/buttonCount, 48);
        break;
      case 2:
        size = Math.min(this.viewer.viewerContainer.clientWidth/buttonCount, 48);
        break;
      case 3:
        size = Math.min(this.viewer.viewerContainer.clientHeight/buttonCount, 48);
        break;
      default:
        Log.warn("Invalid alignmentId " + this.alignmentId + " in RTIViewerOverlayGUI.resize()");
    }
    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].element.style.width = size+"px"; this.buttons[i].element.style.height = size+"px";
    }
}

// alignmentId 0:top, 1:right, 2:bottom, 3:left
RTIViewerOverlayGUI.prototype.align = function(alignmentId) {
  switch (alignmentId) {
    case 0:
      for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].visibleDisplayStyle = "inline-block";
        this.buttons[i].updateDisplayStyle();
       }
      this.controlContainer.style.left = "50%";
      this.controlContainer.style.top = "0%";
      this.controlContainer.style.transform = "translate(-50%, 0%)";
      break;
    case 1:
      for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].visibleDisplayStyle = "block";
        this.buttons[i].updateDisplayStyle();
      }
      this.controlContainer.style.left = "100%";
      this.controlContainer.style.top = "50%";
      this.controlContainer.style.transform = "translate(-100%, -50%)";
      break;
    case 2:
      for (var i = 0; i < this.buttons.length; i++) {
       this.buttons[i].visibleDisplayStyle = "inline-block";
       this.buttons[i].updateDisplayStyle();
      }
      this.controlContainer.style.left = "50%";
      this.controlContainer.style.top = "100%";
      this.controlContainer.style.transform = "translate(-50%, -100%)";
      break;
    case 3:
      for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].visibleDisplayStyle = "block";
        this.buttons[i].updateDisplayStyle();
      }
      this.controlContainer.style.left = "0%";
      this.controlContainer.style.top = "50%";
      this.controlContainer.style.transform = "translate(0%, -50%)";
      break;
    default:
      Log.error("Invalid alignmentId " + alignmentId + " in RTIViewerOverlayGUI.align()");
      return;
  }
  this.alignmentId = alignmentId;
  this.resize();
}

RTIViewerOverlayGUI.prototype.setActiveMode = function(modeString) {
  switch (modeString) {
    case DragMode.PAN:
      this.panButton.setActive(true);
      this.lightDirButton.setActive(false);
      this.panButton.enable(true);
      this.lightDirButton.enable(true);
      break;
    case DragMode.LIGHTDIR:
      this.panButton.setActive(false);
      this.lightDirButton.setActive(true);
      this.panButton.enable(true);
      this.lightDirButton.enable(true);
      break;
    case DragMode.NONE:
      this.panButton.setActive(false);
      this.lightDirButton.setActive(false);
      this.panButton.enable(false);
      this.lightDirButton.enable(false);
      break;
    default:
      console.log("ERROR: unknown DragMode: "+modeString);
      return;
  }
}

RTIViewerOverlayGUI.prototype._onReturnHomeClick = function() {
  this.viewer.resetCamera();
}

RTIViewerOverlayGUI.prototype._onZoomInClick = function() {
  if (this.viewer._zoomAnimation)
    clearTimeout(this.stopZoomTimer);
  this.viewer.startZoomingIn();
  this.stopZoomTimer = setTimeout(this.viewer.stopZooming.bind(this.viewer), 500);
}

RTIViewerOverlayGUI.prototype._onZoomOutClick = function() {
  if (this.viewer._zoomAnimation)
    clearTimeout(this.stopZoomTimer);
  this.viewer.startZoomingOut();
  this.stopZoomTimer = setTimeout(this.viewer.stopZooming.bind(this.viewer), 500);
}

RTIViewerOverlayGUI.prototype._onPanClick = function() {
  this.controller.setPointerDragMode(DragMode.PAN);
  this.lightDirButton.setActive(false);
  this.panButton.setActive(true);
}

RTIViewerOverlayGUI.prototype._onLightDirClick = function() {
  this.controller.setPointerDragMode(DragMode.LIGHTDIR);
  this.panButton.setActive(false);
  this.lightDirButton.setActive(true);
}

RTIViewerOverlayGUI.prototype._onAnimationClick = function() {
  var enabled = false;
  if (this.animationButtonTargets.physics) {
    enabled = enabled || this.controller.isPhysicsAnimationEnabled();
  }
  if (this.animationButtonTargets.light) {
    enabled = enabled || this.controller.isLightAnimationEnabled();
  }

  if (this.animationButtonTargets.physics) {
    this.controller.enablePhysicsAnimation(!enabled);
  }
  if (this.animationButtonTargets.light) {
    this.controller.enableLightAnimation(!enabled);
  }

  this.update();

}

RTIViewerOverlayGUI.prototype._onFullSreenClick = function() {
  this.controller.setFullScreen(!this.controller.isFullScreen());
}

RTIViewerOverlayGUI.prototype._fullScreenErrorHandler = function() {
  this.fullScreenButton.setActive(this.controller.isFullScreen());
}

RTIViewerOverlayGUI.prototype._fullScreenChangeHandler = function() {
  this.fullScreenButton.setActive(this.controller.isFullScreen());
}

RTIViewerOverlayGUI.prototype.getSettings = function() {
  var settings = {};
  settings.homeButton = this.homeButton.visible;
  settings.zoomButtons = this.zoomInButton.visible || this.zoomOutButton.visible ;
  settings.panButton = this.panButton.visible;
  settings.lightDirButton = this.lightDirButton.visible;
  settings.fullScreenButton = this.fullScreenButton.visible;
  settings.animationButton = this.animationButton.visible;
  settings.message = this.message;
  settings.showMessage = this.messageEnabled;
  return settings;
}

export { RTIViewerOverlayGUI, DragMode }
