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

import { ModularRTIObject } from '../core/ModularRTIObject.js';
import { RTIMaterial } from '../core/RTIMaterial.js';
import { TextureManager } from '../utils/TextureManager.js';


/**
*
* @class
* @private
*/
function SingleresRTIObject(rtiModel, shader, textureSettings, textureAccessParams, geometry) {
  ModularRTIObject.call(this, rtiModel, shader, textureSettings, geometry);

  this.type = "SingleresRTIObject";

  this.defines.SCALED_CONTENT = true;
  this.textureSettings.scaleToContent();

  this.material = new RTIMaterial(this.rtiModel, this.shader, this.textureSettings, this.defines);

  this.textureMngr = new TextureManager(textureAccessParams.urls, textureAccessParams.prefix, this.setTextures.bind(this));

  this.renderMesh = new THREE.Mesh(this.geometry, this.material);
  this.renderObject.add(this.renderMesh);

  return true;
}
SingleresRTIObject.prototype = Object.create(ModularRTIObject.prototype);
SingleresRTIObject.prototype.constructor = SingleresRTIObject;

SingleresRTIObject.prototype.setTextures = function(textures) {
  this.material.attachTextures(textures);
}

SingleresRTIObject.prototype.setShaderFlag = function(flag, value) {
  if (this.defines[flag] != value) {
    this.defines[flag] = value;
    this.material.setupShaderMaterial();
    this.material.needsUpdate = true;
  }
}

SingleresRTIObject.prototype.setDepthWrite = function(write) {
  this.material.depthWrite = write;
}

SingleresRTIObject.prototype.setDeformable = function(deformable) {
  if (deformable) {
    if (!this.geometry.hasTangentAttributes) {
      this.geometry.createTangentAttributes();
    }
  }
  this.setShaderFlag('TRNSFRM_TANGENT', deformable);
}

SingleresRTIObject.prototype.setURLPrefix = function(prefix) {
  this.textureMngr.prefix = prefix;
}

SingleresRTIObject.prototype.dispose = function() {
  this.geometry.dispose();
  this.material.disposeTextures();
  this.material.dispose();
}

export { SingleresRTIObject }
