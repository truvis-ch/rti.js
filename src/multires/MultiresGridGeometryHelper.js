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

import { Log } from '../utils/Log.js';

/**
*
* @class
* @private
*/
function MultiresGridGeometryHelper(geometry, textureSettings, multiresTree, defines) {
  this.geometry = geometry;
  this.textureSettings = textureSettings;
  this.multires = multiresTree;
  this.defines = defines;

  this.createResolutionSampleIndices();
}

MultiresGridGeometryHelper.prototype = {
  createResolutionSampleIndices: function(camera, screenRes) {
    var indexAttribute = this.geometry.index;

    var sampleIndices = [];
    // assumes uv aligned triangles, indexed like paramgeom
    var testIndex = Math.floor(indexAttribute.array.length/2);
    var maxTested = testIndex;
    while (testIndex >= 0 && !this.isTriangleInsideContentLimits(testIndex)) {
        testIndex = testIndex-6;
    }
    if (testIndex > 0) {
      sampleIndices.push(testIndex);
    }

    var minTested = testIndex;
    testIndex = 0;
    while (testIndex < minTested && !this.isTriangleInsideContentLimits(testIndex)) {
        testIndex = testIndex+6;
    }
    if (testIndex < minTested) {
      sampleIndices.push(testIndex);
    }

    testIndex = indexAttribute.array.length-6;
    while (testIndex > maxTested && !this.isTriangleInsideContentLimits(testIndex)) {
        testIndex = testIndex-6;
    }
    if (testIndex > maxTested) {
      sampleIndices.push(testIndex);
    }

    if (sampleIndices.length < 1) {
      Log.error("MultiresGridGeometryHelper: could not find a visible triangle for resolution sampling.");
    }
    this.sampleIndices = sampleIndices;
  },

  isUVInsideContentLimits: function(uv) {
    return this.textureSettings.isInsideContentLimits(uv);
  },

  isTriangleInsideContentLimits: function(triangleIndexOffset) {
    var indexAttribute = this.geometry.index;
    var uvAttribute = this.geometry.getAttribute("uv");

    var aIndex = indexAttribute.array[triangleIndexOffset+0];
    var bIndex = indexAttribute.array[triangleIndexOffset+1];
    var cIndex = indexAttribute.array[triangleIndexOffset+2];

    var aUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, aIndex);
    var bUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, bIndex);
    var cUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, cIndex);

    if (this.defines.SCALED_CONTENT) {
      var uvScale = this.textureSettings.uvScale;
      var uvBias = this.textureSettings.uvBias;
      aUV.set(aUV.x*uvScale.x+uvBias.x, aUV.y*uvScale.y+uvBias.y);
      bUV.set(bUV.x*uvScale.x+uvBias.x, bUV.y*uvScale.y+uvBias.y);
      cUV.set(cUV.x*uvScale.x+uvBias.x, cUV.y*uvScale.y+uvBias.y);
    }

    var isInside = ( this.isUVInsideContentLimits(aUV)
                  && this.isUVInsideContentLimits(bUV)
                  && this.isUVInsideContentLimits(cUV) );
    return isInside;
  },

    getRequiredResolution: function(camera, screenRes) {
    // TODO: movement
    // TODO: use scaling / uv, transfrm
    var posAttribute = this.geometry.getAttribute("position");
    var indexAttribute = this.geometry.index;
    var uvAttribute = this.geometry.getAttribute("uv");

    // assumes uv aligned triangles, indexed like paramgeom
    var maxRequiredResolution = new THREE.Vector2(0,0);
    for (var i = 0; i < this.sampleIndices.length; i++) {
      var sampleIndex = this.sampleIndices[i];
      var aIndex = indexAttribute.array[sampleIndex+0];
      var bIndex = indexAttribute.array[sampleIndex+1];
      var cIndex = indexAttribute.array[sampleIndex+2];

      var aOnScreen = new THREE.Vector3().fromBufferAttribute(posAttribute, aIndex);
      aOnScreen.project(camera);
      var bOnScreen = new THREE.Vector3().fromBufferAttribute(posAttribute, bIndex);
      bOnScreen.project(camera);
      var cOnScreen = new THREE.Vector3().fromBufferAttribute(posAttribute, cIndex);
      cOnScreen.project(camera);

      var aUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, aIndex);
      var bUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, bIndex);
      var cUV =  new THREE.Vector2().fromBufferAttribute(uvAttribute, cIndex);

      if (this.defines.SCALED_CONTENT) {
        var uvScale = this.textureSettings.uvScale;
        var uvBias = this.textureSettings.uvBias;
        aUV.set(aUV.x*uvScale.x+uvBias.x, aUV.y*uvScale.y+uvBias.y);
        bUV.set(bUV.x*uvScale.x+uvBias.x, bUV.y*uvScale.y+uvBias.y);
        cUV.set(cUV.x*uvScale.x+uvBias.x, cUV.y*uvScale.y+uvBias.y);
      }

      var distU = Math.abs(bUV.x - aUV.x);
      var distV = Math.abs(cUV.y - aUV.y);

      var distAB_Pix = this.getPixelDistance(aOnScreen, bOnScreen, screenRes);
      var distAC_Pix = this.getPixelDistance(aOnScreen, cOnScreen, screenRes);

      var requiredResolution = new THREE.Vector2(distAB_Pix/distU, distAC_Pix/distV);
      maxRequiredResolution.max(requiredResolution);
    }

    return maxRequiredResolution;
  },

  getPixelDistance: function(aOnScreen, bOnScreen, screenRes) {
    var diffAB_Screen = new THREE.Vector2().subVectors(bOnScreen, aOnScreen);
    diffAB_Screen = diffAB_Screen.divideScalar(2);
    var diffAB_Pix = new THREE.Vector2().copy(diffAB_Screen).multiply(screenRes);
    return diffAB_Pix.length();
  },

  getVisibleTiles: function(camera, requiredLevel) {
    // naive strategy: return all tiles on level.
    var visibleTiles = [];
    var level = this.multires.levels[requiredLevel];
    var numTiles = level.numTiles;
    var tiles = level.tiles;
    for (var x = 0; x < numTiles.x; x++) {
      for (var y = 0; y < numTiles.y; y++) {
        var currTile = tiles[x][y];
        if (currTile.hasContent ) {
          visibleTiles.push(currTile);
        }
      }
    }
    return visibleTiles;
  }
}

export { MultiresGridGeometryHelper }
