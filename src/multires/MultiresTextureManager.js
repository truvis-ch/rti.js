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

import { Log } from '../utils/Log.js';
import { Utils } from '../utils/Utils.js';

/**
*
* @class
* @private
*/
// TODO: inherit from TextureManager?
function MultiresTextureManager(texLoader, geomHelper, multiresTree, setTexturesCallBack) {
  this.multires = multiresTree;
  this.geomHelper = geomHelper;
  this.loader = texLoader;
  this.setTexturesCallBack = setTexturesCallBack;

  this.fullRequestStarted = false;
  this.fullyLoadedLevels = 0;

  this.requestMode = "INCREMENTAL"; // load levels incrementally until required level reached
  // this.requestMode = "DIRECT"; // load required level immediately
}

MultiresTextureManager.prototype = {
  requestTextureData: function() {
    this.requestTextureLevel(0);
    // this.requestTextureLevel(1);
  },

  requestAllTextureData: function(cbAll) {
    if (this.fullRequestStarted) {
      if (this.fullyLoadedLevels == this.multires.levels.length) {
        cbAll()
      } else {
        console.log("WARNING: multiple concurrent requestAllTextureData calls");
      }
      return;
    }

    this.fullRequestStarted = true;
    var that = this;
    function cb() {
      that.fullyLoadedLevels++;
      if (that.fullyLoadedLevels == that.multires.levels.length) {
        cbAll()
      }
    }
    for (var i = 0; i < this.multires.levels.length; i++) {
      this.requestTextureLevel(i, cb);
    }
  },

  requestTextureLevel: function(level, cb) {
    for (var i = 0; i < this.multires.levels[level].numTiles.x; i++) {
      for (var j = 0; j < this.multires.levels[level].numTiles.y; j++) {
        this.requestTileAsync(this.multires.levels[level].tiles[i][j], cb);
      }
    }
  },

  requestMultiresTextureData: function(camera, screenRes) {
    // TODO: refactor requestMultiresTextureData, getAvailableTiles, getAvailableLevel
    switch (this.requestMode) {
      case "DIRECT":
        var requiredLevel = this.getRequiredLevel(camera, screenRes);
        var visibleTiles = this.getRequiredTiles(camera, requiredLevel);
        for (var n = 0; n < visibleTiles.length; n++) {
          this.requestTileAsync(visibleTiles[n]);
        }
        break;
      case "INCREMENTAL":
        // TODOD: refactor to prevent multiple runs of getrequiredlevel ...
        var requiredLevel = this.getRequiredLevel(camera, screenRes);
        var availableLevel = this.getAvailableLevel(camera, screenRes);
        if (availableLevel < requiredLevel) {
          var nextLevel = availableLevel+1;
          var visibleTiles = this.getRequiredTiles(camera, nextLevel);
          for (var n = 0; n < visibleTiles.length; n++) {
            this.requestTileAsync(visibleTiles[n]);
          }
        }
        break;
      default:
        Log.error("Unknown requestMode: "+this.requestMode);
    }
  },

  requestTile: function(tile, cb) {
    if (tile.loadState == 0) {
      this.loader.requestTextures(tile.tileIndex.x, tile.tileIndex.y, tile.levelIndex, this.getResponseHandler(tile, cb).bind(this));
      tile.loadState = 1;
    }
  },

  requestTileAsync: function(tile, cb) {
    Utils.runAsync(this.requestTile.bind(this, tile, cb));
  },

  getAvailableTiles: function(camera, screenRes) {
    var requiredLevel = this.getRequiredLevel(camera, screenRes);
    var availableTiles = [];
    while (requiredLevel >= 0) {
      var visibleTiles = this.getRequiredTiles(camera, requiredLevel);
      var allNodesLoaded = true;
      for (var n = 0; n< visibleTiles.length; n++) {
        var tile = visibleTiles[n];
        if (tile.loadState < 2) {
          allNodesLoaded = false;
          break;
        }
      }
      if (visibleTiles.length > 0 && allNodesLoaded) {
        availableTiles = visibleTiles;
        break;
      }
      requiredLevel--;
    }
    return availableTiles;
  },

  getAvailableLevel: function(camera, screenRes) {
    var availableTiles = this.getAvailableTiles(camera, screenRes);
    if (availableTiles.length == 0)
    return -1;

    return availableTiles[0].levelIndex;
  },

  getResponseHandler: function(tile, cb) {
    return function(textures, error) {
      if (error) {
        Log.error("response error\n level: " + tile.levelIndex + " x: " + tile.tileIndex.x + " y: " + tile.tileIndex.y );
        tile.loadState = 2;
      } else {
        Log.info("response success\n level: " + tile.levelIndex + " x: " + tile.tileIndex.x + " y: " + tile.tileIndex.y );
        tile.loadState = 3;
        this.setTexturesCallBack(textures, tile.tileIndex.x, tile.tileIndex.y, tile.levelIndex);
      }

      var level = this.multires.levels[tile.levelIndex];
      level.loadedTiles++;
      var nLoaded = level.loadedTiles;
      var nTotal = level.numTiles.x * level.numTiles.y;
      if (nLoaded == nTotal) {
        if (typeof cb != 'undefined') {
          cb(tile.levelIndex);
        }
      }

    }
  },

  getRequiredLevel: function(camera, screenRes) {
    var requiredResolution = this.geomHelper.getRequiredResolution(camera, screenRes);

    var level = 0;
    var currResolution;
    while (level < this.multires.numLevels){
      currResolution = this.multires.levels[level].resolution;
      if (currResolution.x >= requiredResolution.x && currResolution.y >= requiredResolution.y)
      break;
      level++;
    }

    if (level < this.multires.numLevels)
    return level;
    else
    return level - 1;

  },

  getRequiredTiles: function(camera, requiredLevel) {
    var visibleTiles = this.geomHelper.getVisibleTiles(camera, requiredLevel);
    return visibleTiles;
  }
}

export { MultiresTextureManager }
