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

function RTIViewerOverlayButton(imgPath, handler, switchState) {
  this.bgInactive = "none transparent";
  this.bgPressed = "rgba(170,170,170,0.9)";
  this.bgHover = "rgba(170,170,170,0.4)";
  this.bgActive = "rgba(255,170,0,0.5)";

  this.visible = true;
  this.visibleDisplayStyle = "inline-block";
  this.enabled = true;
  this.active = false;
  this.switchState = switchState;

  this.handler = handler;

  this.element = document.createElement("div");
  this.element.style.background = this.bgInactive;

  this.element.addEventListener("click", this.onClick.bind(this));
  this.element.addEventListener("mousedown", this.onMouseDown.bind(this));
  this.element.addEventListener("mouseup", this.onMouseUp.bind(this));
  this.element.addEventListener("mouseover", this.onMouseOver.bind(this));
  this.element.addEventListener("mouseout", this.onMouseOut.bind(this));

  this.img = document.createElement("img");
  this.img.src = imgPath;
  this.img.style.maxWidth = "100%";
  this.img.style.maxHeight = "100%";
  this.element.appendChild(this.img);
}

RTIViewerOverlayButton.prototype.setVisibility = function(visible) {
  this.visible = visible;
  this.updateDisplayStyle();
}

RTIViewerOverlayButton.prototype.updateDisplayStyle = function() {
  if (this.visible) {
    this.element.style.display = this.visibleDisplayStyle;
  } else {
    this.element.style.display = "none";
  }
}

// affects only visual appearance of button. See this.enable() for functional effects
RTIViewerOverlayButton.prototype.setActive = function(active) {
  this.active = active;
  this.setBackground();
}

// affects if clicks are handled in any way. See this.setActive() for visual appearance
RTIViewerOverlayButton.prototype.enable = function(enabled) {
  this.enabled = enabled;
}

RTIViewerOverlayButton.prototype.onClick = function() {
  if (this.enabled) {
    if (this.switchState) {
      this.setActive(!this.active);
      this.setBackground();
    }
    this.handler();
  }
}

RTIViewerOverlayButton.prototype.onMouseDown = function() {
  this.element.style.background = this.bgPressed;
}

RTIViewerOverlayButton.prototype.onMouseUp = function() {
  this.element.style.background = this.bgHover;
}

RTIViewerOverlayButton.prototype.onMouseOver = function() {
  this.element.style.background = this.bgHover;
}

RTIViewerOverlayButton.prototype.onMouseOut = function() {
  this.setBackground();
}

RTIViewerOverlayButton.prototype.setBackground = function() {
  if (this.active)
    this.element.style.background = this.bgActive;
  else
    this.element.style.background = this.bgInactive;
}



export { RTIViewerOverlayButton }
