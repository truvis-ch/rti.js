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
function MultiresLevel(resolution, uContentLimits, vContentLimits, numTiles, levelIndex, parentLevel) {
  this.resolution = resolution.clone();
  this.numTiles = numTiles.clone();
  this.levelIndex = levelIndex;
  this.tiles = [];
  this.loadedTiles = 0;

  // TODO: set hascontentent from geomhelper?
  var tileIndex = new THREE.Vector2();
  var hasContent;
  var parent;
  // TODO: split creation and update?
  for (var xT = 0; xT < numTiles.x; xT++) {
    var column = [];
    for (var yT = 0; yT < numTiles.y; yT++) {
      tileIndex.set(xT, yT);

      var left  = xT * 1/numTiles.x;
      var right = xT * 1/numTiles.x + 1/numTiles.x;
      var lower = yT * 1/numTiles.y;
      var upper = yT * 1/numTiles.y + 1/numTiles.y;
      if (
        uContentLimits.x > right
        || uContentLimits.y < left
        || vContentLimits.x > upper
        || vContentLimits.y < lower
      ) {
        hasContent = false;
        this.loadedTiles++;
      } else {
        hasContent = true;
      }

      if (levelIndex == 0) {
        parent = null;
      } else {
        parent = parentLevel.tiles[Math.floor(xT/2)][Math.floor(yT/2)];
      }

      column[yT] = new MultiresTile(tileIndex, levelIndex, parent, hasContent);
    }
    this.tiles[xT] = column;
  }
}

////////////

function MultiresTile(tileIndex, levelIndex, parent, hasContent) {
  this.tileIndex = tileIndex.clone();
  this.levelIndex = levelIndex;
  // this.children = // TODO:
  this.parent = parent;
  this.loadState = 0; // 0: init, 1: requested/waiting, 2: settled w error, 3: success
  this.hasContent = hasContent;
}

export { MultiresLevel }
