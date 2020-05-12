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
* Abstract base class for all RTIModels.
* RTIModel subclasses provide all uniforms related to a particular RTI
* algorithm like e.g. PTM, or HSH.
* @abstract
* @class
* @private
*/
function RTIModel() {
  this.type = "RTIModel";
  this.numTexLayers = 0;
}

/**
 * Attaches all uniforms to the provided material.
 *
 * @abstract
 * @param {RTIMaterial} material - the target material.
 */
RTIModel.prototype.attachUniforms = function(material) {
  throw new Error("ERROR: abstract function RTIModel.attachUniforms must be implemented by subclass");
}

/**
 * Attaches all texture uniforms to the provided material, using the provided textures as values.
 *
 * @abstract
 * @param {RTIMaterial} material - the target material.
 */
RTIModel.prototype.attachTextures = function(material, textures) {
  throw new Error("ERROR: abstract function RTIModel.attachTextures must be implemented by subclass");
}

/**
 * Dispose all textures attachede by this RTIModel from the provided material.
 *
 * @abstract
 * @param {RTIMaterial} material - the target material.
 */
RTIModel.prototype.disposeTextures = function(material) {
  throw new Error("ERROR: abstract function RTIModel.disposeTextures must be implemented by subclass");
}

RTIModel.prototype.getSettings = function() {
  var settings = {
    type: this.type
  };
  if (this.mapsContent) {
    settings.mapsContent = this.mapsContent
  }
  return settings;
}


/**
* LRGB_PTM_Model holds the uniforms and rendering paramters necessary for
* rendering a PTM with luminance and RGB components.
* @extends RTIModel
* @class
* @private
*/
function LRGB_PTM_Model(bias, scale, orientation, bias16,
  useEaseOutLum, renderFuncIndex, useFlatNormalSpecular, useFlatNormalEaseOut) {
  RTIModel.call(this);

  this.numTexLayers = 3;

  this.k = {type: 'f', value: 1 };
  this.kRGB = {type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) };
  this.kRGBs = {type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) };
  this.kd = {type: 'f', value: 0.4 };
  this.ks_flat = {type: 'f', value: 0 };
  this.alpha = {type: 'f', value: 75 };
  this.useDiffuseColor = {type: 'i', value: true };

  this.scale = {type: 'fv1', value:  scale.slice(0, 6) };
  this.bias = {type: 'fv1', value: bias.slice(0, 6)};
  if (bias16) {
    for (var b = 0; b < this.bias.value.length; b++) {
      this.bias.value[b] = this.bias.value[b]/256;
    }
  }
  this.bias16 = bias16;

  this.orientation = {type: 'i', value: orientation };
  this.mirror = {type: 'v2', value: new THREE.Vector2(0, 0) };

  this.useEaseOutLum = {type: 'i', value: 1};
  if (typeof useEaseOutLum != 'undefined') {
    this.useEaseOutLum = {type: 'i', value: useEaseOutLum};
  }

  this.renderFuncIndex = {type: 'i', value: 0};
  if (typeof renderFuncIndex != 'undefined') {
    this.renderFuncIndex = {type: 'i', value: renderFuncIndex};
  }

  this.useFlatNormalSpecular = {type: 'i', value: 0};
  if (typeof useFlatNormalSpecular != 'undefined') {
    this.useFlatNormalSpecular = {type: 'i', value: useFlatNormalSpecular};
  }

  this.useFlatNormalEaseOut = {type: 'i', value: 1};
  if (typeof useFlatNormalEaseOut != 'undefined') {
    this.useFlatNormalEaseOut = {type: 'i', value: useFlatNormalEaseOut};
  }

  this.type = "LRGB_PTM";
}
LRGB_PTM_Model.prototype = Object.create(RTIModel.prototype);
LRGB_PTM_Model.prototype.constructor = LRGB_PTM_Model;

/**
* @inheritdoc
*/
LRGB_PTM_Model.prototype.attachUniforms = function(material) {
  var uniforms = material.uniforms;

  uniforms.kRGB = this.kRGB;
  uniforms.kRGBs = this.kRGBs;
  uniforms.k = this.k;
  uniforms.kd = this.kd;
  uniforms.ks_flat = this.ks_flat;
  uniforms.alpha = this.alpha;

  uniforms.useDiffuseColor = this.useDiffuseColor;

  uniforms.scale = this.scale;
  uniforms.bias = this.bias;

  // move to texture
  uniforms.orientation = this.orientation;
  uniforms.mirror = this.mirror;

  if (typeof this.useEaseOutLum != 'undefined') {
    uniforms.useEaseOutLum = this.useEaseOutLum;
  }
  if (typeof this.renderFuncIndex != 'undefined') {
    uniforms.renderFuncIndex = this.renderFuncIndex;
  }
  if (typeof this.useFlatNormalSpecular != 'undefined') {
    uniforms.useFlatNormalSpecular = this.useFlatNormalSpecular;
  }
  if (typeof this.useFlatNormalEaseOut != 'undefined') {
    uniforms.useFlatNormalEaseOut = this.useFlatNormalEaseOut;
  }
}

/**
* @inheritdoc
*/
LRGB_PTM_Model.prototype.attachTextures = function(material, textures) {
  var uniforms = material.uniforms;
  uniforms.texture012 = {type: 't', value: textures[0]};
  uniforms.texture345 = {type: 't', value: textures[1]};
  uniforms.textureRGB = {type: 't', value: textures[2]};
}

/**
* @inheritdoc
*/
LRGB_PTM_Model.prototype.disposeTextures = function(material) {
  var uniforms = material.uniforms;
  if (uniforms.texture012.value)
  uniforms.texture012.value.dispose();
  if (uniforms.texture345.value)
  uniforms.texture345.value.dispose();
  if (uniforms.textureRGB.value)
  uniforms.textureRGB.value.dispose();
}

LRGB_PTM_Model.prototype.getSettings = function() {
  var settings = RTIModel.prototype.getSettings.call(this);
  settings.bias16 = this.bias16;
  settings.scale = [];
  settings.bias = [];
  for (var i = 0; i<this.scale.value.length; i++) {
    settings.scale.push(this.scale.value[i]);
  }
  for (var i = 0; i<this.bias.value.length; i++) {
    settings.bias.push(this.bias.value[i]);
    if (this.bias16)
      settings.bias[i] = settings.bias[i]*256;
  }
  settings.kRGB = { x: this.kRGB.value.x, y: this.kRGB.value.y, z: this.kRGB.value.z };
  settings.kRGBs = { x: this.kRGBs.value.x, y: this.kRGBs.value.y, z: this.kRGBs.value.z };
  settings.k = this.k.value;
  settings.kd = this.kd.value;
  settings.ks_flat = this.ks_flat.value;
  settings.alpha = this.alpha.value;
  settings.useDiffuseColor = this.useDiffuseColor.value;
  settings.orientation = this.orientation.value;
  settings.useEaseOutLum = this.useEaseOutLum.value;
  settings.renderFuncIndex = this.renderFuncIndex.value;
  settings.useFlatNormalSpecular = this.useFlatNormalSpecular.value;
  settings.useFlatNormalEaseOut = this.useFlatNormalEaseOut.value;
  return settings;
}

/**
* LRGBG_PTM_Model holds the uniforms and rendering paramters necessary for
* rendering a PTM with luminance, RGB and gloss components.
* @extends LRGB_PTM_Model
* @class
* @private
*/
function LRGBG_PTM_Model(bias, scale, orientation, bias16,
   useEaseOutLum, renderFuncIndex, useFlatNormalSpecular, useFlatNormalEaseOut) {
  LRGB_PTM_Model.call(this, bias, scale, orientation, bias16,
     useEaseOutLum, renderFuncIndex, useFlatNormalSpecular, useFlatNormalEaseOut);

  this.numTexLayers = 4;

  this.ks = {type: 'f', value: 0.7};
  this.gChannel = {type: 'i', value: 0};
  this.minMean_s = {type: 'f', value: 0 };
  this.maxMean_s = {type: 'f', value: 1 };

  this.scaleSpecular = {type: 'fv1', value: scale.slice(6,9) };
  this.biasSpecular = {type: 'fv1', value: bias.slice(6,9) };
  if (bias16) {
    for (var b = 0; b < this.biasSpecular.value.length; b++) {
      this.biasSpecular.value[b] = this.biasSpecular.value[b]/256;
    }
  }

  this.type = "LRGBG_PTM";
}
LRGBG_PTM_Model.prototype = Object.create(LRGB_PTM_Model.prototype);
LRGBG_PTM_Model.prototype.constructor = LRGBG_PTM_Model;

/**
* @inheritdoc
*/
LRGBG_PTM_Model.prototype.attachUniforms = function(material) {
  LRGB_PTM_Model.prototype.attachUniforms.call(this, material);
  var uniforms = material.uniforms;
  uniforms.ks = this.ks;
  uniforms.gChannel = this.gChannel;
  uniforms.scaleSpecular = this.scaleSpecular;
  uniforms.biasSpecular = this.biasSpecular;
  uniforms.minMean_s = this.minMean_s;
  uniforms.maxMean_s = this.maxMean_s;
}

/**
* @inheritdoc
*/
LRGBG_PTM_Model.prototype.attachTextures = function(material, textures) {
  LRGB_PTM_Model.prototype.attachTextures.call(this, material, textures);
  var uniforms = material.uniforms;
  uniforms.textureGSpecular =  {type: 't', value: textures[3]};
}

/**
* @inheritdoc
*/
LRGBG_PTM_Model.prototype.disposeTextures = function(material) {
  LRGB_PTM_Model.prototype.disposeTextures.call(this, material);
  var uniforms = material.uniforms;
  if (uniforms.textureGSpecular.value)
  uniforms.textureGSpecular.value.dispose();
}

LRGBG_PTM_Model.prototype.getSettings = function() {
  var settings = LRGB_PTM_Model.prototype.getSettings.call(this);
  settings.ks = this.ks.value;
  settings.gChannel = this.gChannel.value;
  for (var i = 0; i<this.scaleSpecular.value.length; i++) {
    settings.scale.push(this.scaleSpecular.value[i]);
  }
  for (var i = 0; i<this.biasSpecular.value.length; i++) {
    settings.bias.push(this.biasSpecular.value[i]);
    if (this.bias16)
      settings.bias[i+6] = settings.bias[i+6]*256;
  }
  settings.maxMean_s = this.maxMean_s.value;
  settings.minMean_s = this.minMean_s.value;
  return settings;
}


export { RTIModel }
export { LRGB_PTM_Model }
export { LRGBG_PTM_Model }
