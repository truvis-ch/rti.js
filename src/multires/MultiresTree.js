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

import { MultiresLevel } from './MultiresLevel.js';

/**
*
* @class
* @private
*/
function MultiresTree(textureSettings, numLevels) {
  this.resolution = textureSettings.resolution.clone();
  this.numLevels = numLevels;
  this.tileSize = textureSettings.resolution.clone().divideScalar(Math.pow(2, numLevels-1));

  this.levels = [];
  var uContentLimits = textureSettings.uContentLimits;
  var vContentLimits = textureSettings.vContentLimits;
  var currentSize = this.tileSize.clone();
  var currentNumTiles = new THREE.Vector2(1, 1);
  for (var level = 0; level < this.numLevels; level++) {
    this.levels[level] = new MultiresLevel(currentSize, uContentLimits, vContentLimits, currentNumTiles, level, this.levels[level-1]);
    currentSize.multiplyScalar(2);
    currentNumTiles.multiplyScalar(2);
  }

  // TODO: set hascontentent from here? from geomhelper?
}

export { MultiresTree }
