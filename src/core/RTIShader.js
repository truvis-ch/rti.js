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
*
* @class
* @private
*/
function RTIShader(vShader, fShader) {
  this.viewMatrixInverse = { type: 'mat4', value: new THREE.Matrix4() };
  this.viewMatrixTranspose = { type: 'mat3', value: new THREE.Matrix3() };

  this.visualDebugging = { type: 'i', value: false };
  this.visualDebuggingIndex = {type: 'i', value: 0 };

  this.vShader = vShader;
  this.fShader = fShader;
}

RTIShader.prototype = {
  attachShaders: function(material) {
    material.vertexShader = this.vShader;
    material.fragmentShader = this.fShader;
  },

  attachUniforms: function(material) {
    var uniforms = material.uniforms;
    uniforms.visualizeErrors = this.visualDebugging;
    uniforms.visualizeErrorsIndex = this.visualDebuggingIndex;
    uniforms.viewMatrixInverse = this.viewMatrixInverse;
    uniforms.viewMatrixTranspose = this.viewMatrixTranspose;
  },

  onBeforeRender: function(viewMatrixInverse, viewMatrixTranspose) {
    // console.log("hallo RTIShader.prototype.onBeforeRender");
    this.viewMatrixInverse.value.copy(viewMatrixInverse);
    this.viewMatrixTranspose.value.copy(viewMatrixTranspose);
  }
}

export { RTIShader }
