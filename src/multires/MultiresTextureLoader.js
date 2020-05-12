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

import { _Math } from '../math/Math.js';
import { TextureStackRequest } from '../utils/TextureStackRequest.js';

/**
*
* @class
* @private
*/
function MultiresTextureLoader(accessParams, multiresTree, useImageLoader) {
  this.urls = accessParams.urls;
  this.prefix = accessParams.prefix;
  this.multires = multiresTree;
  this.suffix = accessParams.suffix;

  if (accessParams.indexType == "IIIF") {
    this.indexType = "IIIF";
  } else if (accessParams.indexType == "SLIPPY_MAP") {
    this.indexType = "SLIPPY_MAP";
  } else {
    this.indexType = "MORTON_SUM";
  }

  if (useImageLoader)
  this.loader = new THREE.ImageLoader();
  else
  this.loader = new THREE.TextureLoader();
  this.loader.setCrossOrigin("");
}

MultiresTextureLoader.prototype = {
  requestTextures: function(tileX, tileY, level, callback) {
    var urls = this.getFullURLs(tileX, tileY, level);
    var request = new TextureStackRequest(urls, callback, this.loader);
    request.load();
  },

  getFullURLs: function(tileX, tileY, level) {
    var fullURLs = [];

    if (this.indexType == "MORTON_SUM") {
      var levelOffset = 0;
      for (var l = 0; l < level; l++) {
        levelOffset = levelOffset + Math.pow(4, l);
      }
      var numTilesH = this.multires.levels[level].numTiles.y;
      var yTopdown = numTilesH - 1 - tileY;
      var morton = _Math.encodeMorton(tileX,yTopdown);
      var tileOffset = morton+1;
      var imgId = levelOffset+tileOffset;

      // console.log("x "+tileX+" y "+tileY+" level "+level);
      // console.log("ntilesh ", numTilesH);
      // console.log("ytd ", yTopdown);
      // console.log("levelOffset ", levelOffset);
      // console.log("tileOffset ", tileOffset);

      for (var i = 0; i<this.urls.length; i++) {
        var layerId = i+1;
        fullURLs[i] = this.urls[i]+ imgId + "_" + layerId + "." + this.suffix;
        // console.log(fullURLs[i]);
      }
    }  else if (this.indexType == "SLIPPY_MAP") {

      for (var i = 0; i<this.urls.length; i++) {
        var numTilesH = this.multires.levels[level].numTiles.y;
        var tileYTopDown = numTilesH - 1 - tileY;
        fullURLs[i] = this.urls[i] + level + "/" + tileX + "/" + tileYTopDown + "." + this.suffix;
        // console.log(fullURLs[i]);
      }
    }  else {
      var resolution = this.multires.resolution;

      var iiifimageRequestParams = "";
      if (tileX == 0 && tileY == 0)
      iiifimageRequestParams = "/0,0,"+resolution.x+","+resolution.y+"/"+this.multires.tileSize.x+","+this.multires.tileSize.y+"/0/default";
      else {
        var numTiles = this.multires.levels[level].numTiles;

        var regionSize = new THREE.Vector3(resolution.x/numTiles.x, resolution.y/numTiles.y);
        var regionUL = new THREE.Vector2();
        regionUL.x = tileX*regionSize.x;
        regionUL.y = (numTiles.y - 1 - tileY)*regionSize.y;
        iiifimageRequestParams = "/"+regionUL.x+","+regionUL.y+","+regionSize.x+","+regionSize.y+"/"+this.multires.tileSize.x+","+this.multires.tileSize.y+"/0/default";
      }
      for (var i = 0; i<this.urls.length; i++) {
        fullURLs[i] = this.urls[i] + iiifimageRequestParams + "." + this.suffix;
        // console.log(fullURLs[i]);
      }
    }
    if (this.prefix != undefined) {
      for (var i = 0; i<fullURLs.length; i++) {
        fullURLs[i] = this.prefix + fullURLs[i];
      }
    }
    return fullURLs;
  }
}

export { MultiresTextureLoader }
