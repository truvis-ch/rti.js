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
* RTIMaterial extends THREE.ShaderMaterial and is used for rendering ModularRTIObjects.
* RTIMaterial does not directly manage any textures or uniforms on its own, but delegates this
* task to its different 'uniform contributors' - a RTIModel, RTIShader and RTITextureSettings
*  - which each attach the needed uniforms - depending on the contributors
* settings - to the RTIMaterial.
*
* @extends THREE.ShaderMaterial
* @class
*
* @property {RTIModel} rtiModel - the RTIModel used for rendering
* @property {RTIShader} shader - the RTIShader used for rendering
* @property {RTITextureSettings} textureSettings - the RTITextureSettings used for rendering
* @property {Object} defines - the shader flags used for rendering. See Properties defines under {@link https://threejs.org/docs/#Reference/Materials/ShaderMaterial}
* @property {UniformContributor[]} [optionalContributors] - an array of UniformContributors which will be used for rendering
* @private
*/
function RTIMaterial(rtiModel, shader, textureSettings, defines, optionalContributors) {
  THREE.ShaderMaterial.call(this);

  this.lights = true;
  this.extensions.derivatives = true;

  this.rtiModel = rtiModel;
  this.shader = shader;
  this.textureSettings = textureSettings;

  if (optionalContributors) {
    this.optionalContributors = optionalContributors
  } else {
    this.optionalContributors = [];
  }

  this.defines = defines;

  this.setupShaderMaterial([]);
}
RTIMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
RTIMaterial.prototype.constructor = RTIMaterial;

RTIMaterial.prototype.setupShaderMaterial = function(textures) {
  this.transparent = true;
  // this.wireframe = true;
  this.side = THREE.DoubleSide;

  this.uniforms = THREE.UniformsUtils.merge( [
    THREE.UniformsLib[ "lights" ]
  ] );

  this.rtiModel.attachUniforms(this);
  if (textures)
    this.attachTextures(textures);

  this.shader.attachUniforms(this);
  this.shader.attachShaders(this);

  this.textureSettings.attachUniforms(this);

  for (var i = 0; i < this.optionalContributors.length; i++) {
    this.optionalContributors[i].attachUniforms(this);
  }
}

RTIMaterial.prototype.attachTextures = function(textures) {
  this.rtiModel.attachTextures(this, textures);
  if (this.textureSettings.hasMask) {
    // TODO: make textures an associative array, use: textures['mask']
    this.uniforms.textureOpacity = {type: 't', value: textures[textures.length-1]};
  }
  this.textureSettings.setFilters(textures);
}

RTIMaterial.prototype.disposeTextures = function() {
  this.rtiModel.disposeTextures(this);
  if (this.textureSettings.hasMask) {
    if (this.uniforms.textureOpacity && this.uniforms.textureOpacity.value) {
      this.uniforms.textureOpacity.value.dispose();
    }
  }
}

export { RTIMaterial }
