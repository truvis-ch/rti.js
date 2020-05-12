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

/**
* Allows the rendering of RTIObjects (and common THREE.Object3D objects) in a web browser.
*
* @class
* @param {div} canvasContainer - The div element where the viewer's WebGL canvas
*  should be placed.
* @private
*/
function RTIRenderer(canvasContainer) {
  this.threeRenderer =  new THREE.WebGLRenderer();
  if (!Utils.infoRenderer) {
    Utils.infoRenderer = this.threeRenderer;
  }
  var width = canvasContainer.clientWidth;
  var height = canvasContainer.clientHeight;
  this.threeRenderer.setSize( width, height );
  canvasContainer.appendChild( this.threeRenderer.domElement );
  return this;
}

RTIRenderer.prototype = {

  /**
  * Render the current frame.
  * @param {RTIScene} scene - scene to render
  */
  render: function(scene)
  {
    // TODO: get rid, fix in dispose of scene?
    if (!scene.threeScene)
      return;

    var camera = scene.camera;
    var rtiObjects = scene.rtiObjects;
    for (var i = 0; i<rtiObjects.length; i++) {
      var rtiObject = rtiObjects[i];
      if (rtiObject.type == "MultiresTiledMaterialRTIObject") {
        var screenRes = new THREE.Vector2(this.threeRenderer.domElement.clientWidth, this.threeRenderer.domElement.clientHeight);
        rtiObject.updateTextureData(camera, screenRes);
      }
    }

    this.threeRenderer.render( scene.threeScene, camera );
  },

  setSize: function(width, height) {
    this.threeRenderer.setSize(width, height);
  },

  setClearColor: function(color) {
    this.threeRenderer.setClearColor(color);
  },

  getDomElement: function() {
    return this.threeRenderer.domElement;
  },
};

export { RTIRenderer }
