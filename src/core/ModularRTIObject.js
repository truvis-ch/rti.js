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
import { RTIObject } from './RTIObject.js';

/**
* Abstract base class for ModularRTIObjects.
* ModularRTIObject defines a common public API for its child classes.
* <br>ModularRTIObjects have in common that they are composed of different modular subparts, namely:
* a RTIModel, RTIShader, RTITextureSettings and RTIGeometry. These subparts all
* provide WebGL uniforms and attributes which will finally be added to a THREE.ShaderMaterial
* for rendering (this needs to be implemented by the subclass). This allows a multitude of object configurations by composing objects from different subparts.
* <br>On top of the abstract function {@link ModularRTIObject#setShaderFlag}, additional mssing functionality must
* be implemented in child classes. Specifically: implementing subclasses need to provide a TextureManager accessible via this.textureMngr (think: abstract variable),
* and implement the translation from the properties of RTIModel, RTIShader, RTITextureSettings and RTIGeometry to
* a THREE.ShaderMaterial and finally to a renderable THREE.Object3D.
*
* @abstract
* @class
* @extends RTIObject
*
* @param {RTIModel} rtiModel - the RTIModel used for rendering
* @param {RTIShader} shader - the RTIShader used for rendering
* @param {RTITextureSettings} textureSettings - the RTITextureSettings used for rendering
* @param {RTIGeometry} geometry - the RTIGeometry used for rendering
*
* @property {RTIModel} rtiModel - the RTIModel used for rendering
* @property {RTIShader} shader - the RTIShader used for rendering
* @property {RTITextureSettings} textureSettings - the RTITextureSettings used for rendering
* @property {RTIGeometry} geometry - the RTIGeometry used for rendering
* @property {Object} defines - the shader flags used for rendering. See Properties defines under {@link https://threejs.org/docs/#Reference/Materials/ShaderMaterial}
* @abstract
* @property {TextureManager} textureMngr - needs to be created by the implementing subclass.
* @private
*/
function ModularRTIObject(rtiModel, shader, textureSettings, geometry) {
  RTIObject.call(this);

  this.rtiModel = rtiModel;
  this.shader = shader;
  this.textureSettings = textureSettings;
  this.geometry = geometry;

  this.defines = {  SCALED_CONTENT: false,
                    CONTENT_LIMITS: false,
                    TRNSFRM_MODEL: false,
                    TRNSFRM_TANGENT: false,
                    POLAR_NORMAL: false,
                    TILED_UV: false,
                    OPACITY_MASK: false
                  };

  if (this.geometry.hasTangentAttributes) {
    this.defines.TRNSFRM_TANGENT = true;
  }

  if (this.textureSettings.hasMask) {
    this.defines.OPACITY_MASK = true;
  }

  this.extensions = [];
}
ModularRTIObject.prototype = Object.create(RTIObject.prototype);
ModularRTIObject.prototype.constructor = ModularRTIObject;

/**
* Request the texture data for this object (asynchronously).
* <br>Should be called once before the first rendering.
* <br>(For child objects with multiresolution support, this will request the data for the lowest resolution level.)
* <br>More precisely: this.textureMngr.requestTextureData() will be called. Handling of response from textureMngr
* must be implemented in child classes.
*/
ModularRTIObject.prototype.requestTextureData = function() {
  this.textureMngr.requestTextureData();
}

/**
* Enables partial rendering for this object. Partial rendering allows to render only
* a part of the texture on this object. Set the min and max limits of the rendered area with
* {@link ModularRTIObject#setPartialRenderingLimits}
*
* @param {bool} partial - on/off
*/
ModularRTIObject.prototype.enablePartialRendering = function(partial) {
  this.setShaderFlag('CONTENT_LIMITS', partial);
}

/**
* Enables/disables a boolean glsl preprocessor macro.
* This is a somewhat costly operation, as it will ussually require shader recompilation.
*
* @param {string} shaderFlag - name of preprocessor macro
* @param {bool} enable - on/off
*
* @abstract
*/
ModularRTIObject.prototype.setShaderFlag = function(shaderFlag, enable) {
  throw new Error("ERROR: abstract function ModularRTIObject.setShaderFlag must be implemented by subclass");
}

/**
* Enables partial rendering for this object. Partial rendering allows to render only
* a part of the texture on this object. Set the min and max limits of the rendered area with
* {@link ModularRTIObject#setPartialRenderingLimits}
*
* @param {THREE.Vector2} uLimitsGeom - min and max u coorddinate to be rendered
* @param {THREE.Vector2} vLimitsGeom - min and max v coorddinate to be rendered
*/
ModularRTIObject.prototype.setPartialRenderingLimits = function(uLimitsGeom, vLimitsGeom) {
  this.textureSettings.setPartialRenderingLimits(uLimitsGeom, vLimitsGeom);
}

ModularRTIObject.prototype.setExtensions = function(extensions) {
  this.extensions = extensions;
}

ModularRTIObject.prototype.getSettings = function() {
  var settings = {
    configVersion: 3,
    rtiModel: this.rtiModel.getSettings(),
    textureSettings: this.textureSettings.getSettings(),
    geometry: this.geometry.getSettings(),
    extensions: Utils.jsonCopy(this.extensions)
  };
  if (this.physics) {
    settings.physics = this.physics.getSettings()
  } else {
    settings.physics = { type: "SOLID" }
  }
  return settings;
}

export { ModularRTIObject }
