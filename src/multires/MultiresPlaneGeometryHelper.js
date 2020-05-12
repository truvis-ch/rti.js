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

import { MultiresTileAlignedGridGeometryHelper } from './MultiresTileAlignedGridGeometryHelper.js'

/**
*
* @class
* @private
*/
function MultiresPlaneGeometryHelper(geometry, textureSettings, multiresTree, defines) {
  MultiresTileAlignedGridGeometryHelper.call(this, geometry, textureSettings, multiresTree, defines);
}
MultiresPlaneGeometryHelper.prototype = Object.create(MultiresTileAlignedGridGeometryHelper.prototype);
MultiresPlaneGeometryHelper.prototype.constructor = MultiresPlaneGeometryHelper;

MultiresPlaneGeometryHelper.prototype.createBoundingBoxes = function() {
  for (var level = 0; level < this.multires.numLevels; level++) {
    var numTiles = this.multires.levels[level].numTiles;
    var tiles = this.multires.levels[level].tiles;
    for (var x = 0; x < numTiles.x; x++) {
      for (var y = 0; y < numTiles.y; y++) {
        var currTile = tiles[x][y];
        var box = new THREE.Box3();
        currTile.boundingBox = box;
      }
    }
  }
  this.updateBoundingBoxes();
}

MultiresPlaneGeometryHelper.prototype.updateBoundingBoxes = function() {
  // TODO: movement
  var posAttribute = this.geometry.getAttribute("position");

  var llPlane = new THREE.Vector3().fromBufferAttribute(posAttribute, 0);

  var numVertices = this.geometry.numVertices;
  var urPlane = new THREE.Vector3().fromBufferAttribute(posAttribute, numVertices-1);

  var width = urPlane.x - llPlane.x;
  var height = urPlane.y - llPlane.y;
  var halfWidth = width/2;
  var halfHeight = height/2;

  for (var level = 0; level < this.multires.numLevels; level++) {

    var numTiles = this.multires.levels[level].numTiles;
    var tiles = this.multires.levels[level].tiles;

    var sizeFactor = 1/Math.pow(2,level);
    var tileWidth = width*sizeFactor;
    var tileHeight = height*sizeFactor;
    var halfTileWidth = tileWidth/2;
    var halfTileHeight = tileHeight/2;

    var center = new THREE.Vector3();
    var size = new THREE.Vector3();
    for (var x = 0; x < numTiles.x; x++) {
      for (var y = 0; y < numTiles.y; y++) {
        var currTile = tiles[x][y];
        if (currTile.hasContent ) {
          center.set(x*tileWidth + halfTileWidth - halfWidth, y*tileHeight + halfTileHeight - halfHeight, 0);
          size.set(tileWidth,tileHeight,0);
          currTile.boundingBox.setFromCenterAndSize(center, size);
        }
      }
    }
  }
}

export { MultiresPlaneGeometryHelper }
