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
*
* @class
* @private
*/
// TODO: take limits params instead of size
function RTITextureSettings(resolution, contentSize, hasMask, filterSettings) {
  this.resolution = resolution;
  this.contentSize = contentSize;

  this.initFilters(filterSettings);

  // TODO: refactor to uvmin, uvmax
  this.uContentLimits = new THREE.Vector2(0,1);
  this.vContentLimits = new THREE.Vector2(0,1);
  this.setContentLimitsFromSize(contentSize);

  this.uDynamicLimits = new THREE.Vector2(0,1);
  this.vDynamicLimits = new THREE.Vector2(0,1);

  this.combinedUContentLimits = new THREE.Vector2();
  this.combinedVContentLimits = new THREE.Vector2();
  this.updateCombinedContentLimits();

  this.uvScale = new THREE.Vector2(1,1);
  this.uvBias = new THREE.Vector2(0,0);

  this.hasMask = hasMask || false;
}

RTITextureSettings.prototype.attachUniforms = function(material) {
  var uniforms = material.uniforms;
  if (material.defines.CONTENT_LIMITS) {
    uniforms.contentLimitsU = {type: 'v2', value: this.combinedUContentLimits};
    uniforms.contentLimitsV = {type: 'v2', value: this.combinedVContentLimits};
  }
  if (material.defines.SCALED_CONTENT) {
    uniforms.uvScale = {type: 'v2', value: this.uvScale};
    uniforms.uvBias = {type: 'v2', value: this.uvBias};
  }
}

RTITextureSettings.prototype.setContentLimitsFromSize = function(contentSize) {
  var lowerLimits = this.resolution.clone().sub(contentSize).divideScalar(2);
  var upperLimits = this.resolution.clone().add(contentSize).divideScalar(2);
  lowerLimits.divide(this.resolution);
  upperLimits.divide(this.resolution);
  this.uContentLimits.set(lowerLimits.x, upperLimits.x)
  this.vContentLimits.set(lowerLimits.y, upperLimits.y)
}

RTITextureSettings.prototype.scaleToContent = function() {
  this.uvScale.setX(this.uContentLimits.y-this.uContentLimits.x);
  this.uvScale.setY(this.vContentLimits.y-this.vContentLimits.x);
  this.uvBias.set(this.uContentLimits.x, this.vContentLimits.x);
}

RTITextureSettings.prototype.setPartialRenderingLimits = function(uLimitsGeom, vLimitsGeom) {
  this.uDynamicLimits.set(uLimitsGeom.x*this.uvScale.x+this.uvBias.x, uLimitsGeom.y*this.uvScale.x+this.uvBias.x);
  this.vDynamicLimits.set(vLimitsGeom.x*this.uvScale.y+this.uvBias.y, vLimitsGeom.y*this.uvScale.y+this.uvBias.y);
  this.updateCombinedContentLimits();
}

RTITextureSettings.prototype.updateCombinedContentLimits = function() {
  this.combinedUContentLimits.setX(Math.max(this.uDynamicLimits.x,this.uContentLimits.x));
  this.combinedUContentLimits.setY(Math.min(this.uDynamicLimits.y,this.uContentLimits.y));

  this.combinedVContentLimits.setX(Math.max(this.vDynamicLimits.x,this.vContentLimits.x));
  this.combinedVContentLimits.setY(Math.min(this.vDynamicLimits.y,this.vContentLimits.y));
}

RTITextureSettings.prototype.isInsideContentLimits = function(uv) {
  if (uv.x < this.uContentLimits.x || uv.x > this.uContentLimits.y || uv.y < this.vContentLimits.x || uv.y > this.vContentLimits.y ){
    return false;
  }
  return true;
}

RTITextureSettings.prototype.initFilters = function(filterSettings) {
    var infoRenderer;
    if (Utils.infoRenderer) {
      infoRenderer = Utils.infoRenderer;
    } else {
      infoRenderer = new THREE.WebGLRenderer();
      Utils.infoRenderer = infoRenderer;
    }

    this.maxAnisotropy = infoRenderer.capabilities.getMaxAnisotropy();
    this.targetAnisotropy = 8; // MAGIC_VALUE
    this.anisotropy = Math.min(this.targetAnisotropy, this.maxAnisotropy);

    this.coeffFilterMag = THREE.LinearFilter;
    this.coeffFilterMin = THREE.LinearMipmapLinearFilter;
    this.rgbFilterMag = THREE.LinearFilter;
    this.rgbFilterMin = THREE.LinearMipmapLinearFilter;
    this.specFilterMag = THREE.LinearFilter;
    this.specFilterMin = THREE.LinearMipmapLinearFilter;
    this.maskFilterMag = THREE.LinearFilter;
    this.maskFilterMin = THREE.LinearMipmapLinearFilter;

    if (filterSettings != undefined) {
      if (filterSettings.coeffFilterMag != undefined)
      this.coeffFilterMag = Utils.getTexFilterConstant(filterSettings.coeffFilterMag);

      if (filterSettings.coeffFilterMin != undefined)
      this.coeffFilterMin = Utils.getTexFilterConstant(filterSettings.coeffFilterMin);

      if (filterSettings.rgbFilterMag != undefined)
      this.rgbFilterMag = Utils.getTexFilterConstant(filterSettings.rgbFilterMag);

      if (filterSettings.rgbFilterMin != undefined)
      this.rgbFilterMin = Utils.getTexFilterConstant(filterSettings.rgbFilterMin);

      if (filterSettings.specFilterMag != undefined)
      this.specFilterMag = Utils.getTexFilterConstant(filterSettings.specFilterMag);

      if (filterSettings.specFilterMin != undefined)
      this.specFilterMin = Utils.getTexFilterConstant(filterSettings.specFilterMin);

      if (filterSettings.maskFilterMag != undefined)
      this.maskFilterMag = Utils.getTexFilterConstant(filterSettings.maskFilterMag);

      if (filterSettings.maskFilterMin != undefined)
      this.maskFilterMin = Utils.getTexFilterConstant(filterSettings.maskFilterMin);

      if (filterSettings.anisotropy != undefined) {
        this.targetAnisotropy = filterSettings.anisotropy;
        this.anisotropy = Math.min(this.targetAnisotropy, this.maxAnisotropy);
      }
    }
}

RTITextureSettings.prototype.setFilters = function(textures) {
  for (var i = 0; i< textures.length; i++) {
    switch (i) {
      case 0:
        textures[i].magFilter = this.coeffFilterMag;
        textures[i].minFilter = this.coeffFilterMin;
        break;
      case 1:
        textures[i].magFilter = this.coeffFilterMag;
        textures[i].minFilter = this.coeffFilterMin;
        break;
      case 2:
        textures[i].magFilter = this.rgbFilterMag;
        textures[i].minFilter = this.rgbFilterMin;
        break;
      case 3:
        textures[i].magFilter = this.specFilterMag;
        textures[i].minFilter = this.specFilterMin;
        break;
      case 4:
        textures[i].magFilter = this.maskFilterMag;
        textures[i].minFilter = this.maskFilterMin;
        break;
      default:
        console.log("unexpected number of textures in attachTextures");
    }

    textures[i].anisotropy = this.anisotropy;
  }
}

RTITextureSettings.prototype.getSettings = function() {
  var settings = {
    resolution: {
      w: this.resolution.x,
      h: this.resolution.y
    },
    contentSize: {
      w: this.contentSize.x,
      h: this.contentSize.y
    },
    filterSettings: {
      coeffFilterMag: Utils.getTexFilterName(this.coeffFilterMag),
      coeffFilterMin: Utils.getTexFilterName(this.coeffFilterMin),
      rgbFilterMag: Utils.getTexFilterName(this.rgbFilterMag),
      rgbFilterMin: Utils.getTexFilterName(this.rgbFilterMin),
      specFilterMag: Utils.getTexFilterName(this.specFilterMag),
      specFilterMin: Utils.getTexFilterName(this.specFilterMin),
      maskFilterMag: Utils.getTexFilterName(this.maskFilterMag),
      maskFilterMin: Utils.getTexFilterName(this.maskFilterMin),

      anisotropy: this.targetAnisotropy,
    },
    hasMask: this.hasMask
  };
  return settings;
}

export { RTITextureSettings }
