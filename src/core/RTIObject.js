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
* Abstract base class for RTIObjects.
* <br>Defines abstract functions {@link RTIObject#dispose}
* which need to be implemented by subclasses.
*
* @abstract
* @class
*
* @property {THREE.Object3D} renderObject - Subclasses need to attach their THREE.Object3Ds to renderObject for rendering.
* <br>If you are building a custom RTI object viewer: Add this to a THREE.Scene for rendering the RTIObject with a THREE.WebGLRenderer.
*
* @private
*/
function RTIObject() {
  this.renderObject = new THREE.Object3D();
}

/**
* Disposes all resources attached to this RTIViewer.
* <br>Subclasses need to implement this abstract method and dispose of all resources (e.g. textures, materials, geometries).
* <br>Certain three.js objects (as of r84: textures, materials, geometries) need a call to dispose() in order to be
* garbage collected. Simply removing from scene and deleting references in client code is not sufficient.
* <br>If you are building a custom RTI object viewer: This should be called when the RTIObject is no longer needed, to prevent memory bloat/leaks.
* @abstract
*/
RTIObject.prototype.dispose = function() {
  throw new Error("ERROR: abstract function RTIObject.dispose must be implemented by subclass");
}

export { RTIObject }
