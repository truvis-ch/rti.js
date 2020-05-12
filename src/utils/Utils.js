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

import { Log } from './Log.js';

/**
* Utils provides a set of utility functions.
* <br>All functions are static functions, no new instance of Utils needs to be created for calling the functions.
* <br>See {@link _Math} for math related utility functions.
* @namespace
* @private
*/
var Utils = {
};

Utils.infoRenderer = undefined;

/**
* Caluculates the normalized device coordinates of a mouse/touch position relative to a DOM element.
*
* @param {MouseEvent|Touch} contactPoint - the MouseEvent, or Touch
* @param {DOMElement} domElement - the DOM element
* @returns {THREE.Vector2} mouse pos in normalized device ccordinates
*
*/
Utils.normalizedMouseCoords = function(contactPoint, domElement) {
  var offset = domElement.getBoundingClientRect();
  var normalizedX = ( (contactPoint.clientX - offset.left ) / domElement.clientWidth ) * 2 - 1;
  var normalizedY = - ( (contactPoint.clientY - offset.top) / domElement.clientHeight ) * 2 + 1;
  return new THREE.Vector2(normalizedX, normalizedY);
}

/**
* Splits a string into an array of lines. All lines are trimmed
* and multiple whitespace characters replaced with a single whitespace.
*
* @param {string} text - a string
* @returns {string[]} array of lines
*
*/
Utils.readLines = function(text){
  var splitted = text.split("\n");
  var lines = [];
  for (var i=0; i<splitted.length; ++i) {
    var line = splitted[i].replace( /\s\s+/g, ' ' );
    line = line.trim();
    if (line.length > 0)
    lines.push(line);
  }
  return lines;
}

/**
* Checks if a string ends with a particular suffix.
* @param {string} str - the string to check.
* @param {string} suffix - the suffix to search for.
* @returns {bool} true if str ends with suffix.
*
*/
Utils.endsWith = function(str, suffix) {
  return (str.indexOf(suffix, str.length - suffix.length) !== -1);
}

/**
* Sets a cookie.
*
* @param {string} cname - the name of the cookie.
* @param {string} cvalue - the value of the cookie.
* @param {Number} exdays - the number of days before the cookie gets deleted.
*
*/
Utils.setCookie = function(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}

/**
* Reads a cookie.
* Returns a empty string if the cookie could not be found.
* @param {string} cname - the name of the cookie.
* @returns {string} the cookie value.
*
*/
Utils.getCookie = function(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
  }
  return "";
}

/**
* Checks if a cookie exists for a particular cookie name.
* @param {string} cname - the name of the cookie.
* @returns {bool} true if cookie exists.
*
*/
Utils.hasCookie = function(cname) {
  var cookie = Utils.getCookie(cname);
  if (cookie.length > 0)
  return true;
  else
  return false;
}

/**
* Sends a synchronous XMLHttpRequest.
* @param {string} url - the request URL.
* @returns {XMLHttpRequest} the request after send() was executed.
*
*/
Utils.sendSyncRequest = function(url) {
  var request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send();
  return request;
}

/**
* Executes a function asynchronously
*
* @param {function} fn - the function to be executed
* @param {function} [callback] - callback to be called after function executed
*
*/
Utils.runAsync = function(fn, callback) {
  setTimeout(function() {
    fn();
    if (callback) {
      callback();
    }
  }, 0);
}


/**
* Sets JSON settings on an RTIObject
*
* @param {RTIObject} rtiObj - the target RTIObject
* @param {JSON} settings - the RTIObject settings as a JSON object
*/
// TODO tmp hack for ie2017, kept here for compatibility with old configs
Utils.setObjectSettings = function(rtiObj, settings) {
  if (settings.kRGB)
  rtiObj.rtiModel.kRGB.value.set(settings.kRGB.x, settings.kRGB.y, settings.kRGB.z);

  if (settings.orientation != undefined)
  rtiObj.rtiModel.orientation.value = settings.orientation;

  if (settings.kd != undefined)
  rtiObj.rtiModel.kd.value = settings.kd;

  // compatibility with v1 configs
  if (settings.flatGSpecular != undefined)
  rtiObj.rtiModel.ks_flat.value = settings.flatGSpecular;

  if (settings.ks_flat != undefined)
  rtiObj.rtiModel.ks_flat.value = settings.ks_flat;

  if (settings.alpha != undefined)
  rtiObj.rtiModel.alpha.value = settings.alpha;

  if (settings.useDiffuseColor != undefined)
  rtiObj.rtiModel.useDiffuseColor.value = settings.useDiffuseColor;

  if (rtiObj.rtiModel.type == "LRGBG_PTM") {
    if (settings.gChannel != undefined)
    rtiObj.rtiModel.gChannel.value = settings.gChannel;

    if (settings.ks != undefined)
    rtiObj.rtiModel.ks.value = settings.ks;
  }
}

Utils.isInViewport = function(element) {
  var rect = element.getBoundingClientRect();
  var html = document.documentElement;

  return (
    (
      rect.top >= 0 &&
      rect.top <= (window.innerHeight || html.clientHeight)
    ) || (
      rect.bottom <= (window.innerHeight || html.clientHeight) &&
      rect.bottom >= 0
    )
  );
}

Utils.detectWebGL = function() {
  // from three 0.82, https://github.com/mrdoob/three.js/blob/master/examples/js/Detector.js
	try {

		var canvas = document.createElement( 'canvas' );
    return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

	} catch ( e ) {

		return false;

	}
}

Utils.createWebGLSUpportWarning = function() {
  // message construction code from three 0.82, https://github.com/mrdoob/three.js/blob/master/examples/js/Detector.js
  var message = window.WebGLRenderingContext ? [
    'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#aaa">WebGL</a>.<br />',
    'Find out how to get it <a href="http://get.webgl.org/" style="color:#aaa">here</a>.'
  ].join( '\n' ) : [
    'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#aaa">WebGL</a>.<br/>',
    'Find out how to get it <a href="http://get.webgl.org/" style="color:#aaa">here</a>.'
  ].join( '\n' );

  var messageElement = document.createElement("p");
  messageElement.innerHTML = message;
  messageElement.classList.add("textOverlay");
  return messageElement;
}


// code from https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
Utils.detectPassiveListener = function() {
  var supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassive = true;
      }
    });
    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);
  } catch (e) {}
  return supportsPassive;
}

Utils.getTexFilterConstant = function(filterEnum) {
  var filter;
  switch (filterEnum) {
    case "NEAREST":
      filter = THREE.NearestFilter;
      break;
    case "LINEAR":
      filter = THREE.LinearFilter;
      break;
    case "NEAREST_MM_NEAREST":
      filter = THREE.NearestMipmapNearestFilter;
      break;
    case "LINEAR_MM_NEAREST":
      filter = THREE.LinearMipmapNearestFilter;
      break;
    case "NEAREST_MM_LINEAR":
      filter = THREE.NearestMipmapLinearFilter;
      break;
    case "LINEAR_MM_LINEAR":
      filter = THREE.LinearMipmapLinearFilter;
      break;
    default:
    console.log("ERROR: unknown filter filterEnum: "+filterEnum);
  }
  return filter;
};

Utils.getTexFilterName = function(filterConstant) {
  var name;
  switch (filterConstant) {
    case THREE.NearestFilter:
      name = "NEAREST";
      break;
    case THREE.LinearFilter:
      name = "LINEAR";
      break;
    case THREE.NearestMipmapNearestFilter:
      name = "NEAREST_MM_NEAREST";
      break;
    case THREE.LinearMipmapNearestFilter:
      name = "LINEAR_MM_NEAREST";
      break;
    case THREE.NearestMipmapLinearFilter:
      name = "NEAREST_MM_LINEAR";
      break;
    case THREE.LinearMipmapLinearFilter:
      name = "LINEAR_MM_LINEAR";
      break;
    default:
      console.log("ERROR: unknown filterConstant: "+filterConstant);
  }
  return name;
};

Utils.jsonCopy = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

export { Utils }
