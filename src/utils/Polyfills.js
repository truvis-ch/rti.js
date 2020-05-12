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

/**
* Polyfill provides a set of polyfill utility functions.
* <br>All functions are static functions, no new instance of Polyfill needs to be created for calling the functions.
* @namespace
* @private
*/
var Poly = {
};

Poly.fullscreenElement = function() {
  return document.fullscreenElement ||
  document.mozFullScreenElement ||
  document.webkitFullscreenElement ||
  document.webkitCurrentFullScreenElement ||
  document.msFullscreenElement;
};

Poly.fullscreenAvailable = function(element) {
  if (element.requestFullscreen ||
      element.mozRequestFullScreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen) {
    return true;
  } else {
    return false;
  }
}

Poly.requestFullscreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    console.log("Unable to request fullscreen on " + element);
  }
};

Poly.exitFullscreen = function() {
  if (document.exitFullscreen) {
      document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
  } else {
    console.log("Unable to exit fullscreen");
  }
};

Poly.addFullscreenChangeEventListener = function(handler) {
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("mozfullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  document.addEventListener("MSFullscreenChange", handler);
};

Poly.addFullscreenErrorEventListener = function(handler) {
  document.addEventListener("fullscreenerror", handler);
  document.addEventListener("mozfullscreenerror", handler);
  document.addEventListener("webkitfullscreenerror", handler);
  document.addEventListener("MSFullscreenError", handler);
};

export { Poly }
