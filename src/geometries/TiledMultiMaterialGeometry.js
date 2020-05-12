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

import { GridGeometry } from './GridGeometry.js';

/**
*
* @class
* @private
*/
function TiledMultiMaterialGeometry(uvFunc, numSegments, createTangentAttributes, numTiles, position, rotation) {
  GridGeometry.call(this, uvFunc, numSegments, createTangentAttributes, position, rotation);

  this.numTiles = numTiles.clone();

  if (numTiles.x > 1 || numTiles.y > 1) {

    this.clearGroups();
    var nVerticesPerQuad = 3*2;
    var nSlicePerTile = numSegments.x/numTiles.x;
    var nStackPerTile = numSegments.y/numTiles.y;
    var nQuadsPerTile = nSlicePerTile*nStackPerTile;
    var nVerticesPerTile = nQuadsPerTile*nVerticesPerQuad;
    for (var tileY = 0; tileY < numTiles.y; tileY++) {
      for (var tileX = 0; tileX < numTiles.x; tileX++) {
        var start = tileY*numTiles.x*nVerticesPerTile +tileX*nVerticesPerTile;
        var count = nVerticesPerTile;
        var materialIndex = tileY*numTiles.x + tileX;
        this.addGroup(start, count, materialIndex);
      }
    }

    var numVertices = new THREE.Vector2(numSegments.x+1, numSegments.y+1);
    var tiledIndex = [];
    for (var tileY = 0; tileY < numTiles.y; tileY++) {
      for (var tileX = 0; tileX < numTiles.x; tileX++) {
        var tileOffset = tileY*nStackPerTile*numVertices.x + tileX*nSlicePerTile;
        for (var stack = 0; stack < nStackPerTile; stack++) {
          for (var slice = 0; slice < nSlicePerTile; slice++) {
            var quadOffset = tileOffset + stack*numVertices.x;
            var a = quadOffset + slice;
            var b = quadOffset + slice+1;
            var c = quadOffset + slice+numVertices.x+1;
            var d = quadOffset + slice+numVertices.x;
            tiledIndex.push(a,b,d);
            tiledIndex.push(b,c,d);
          }
        }
      }
    }
    // this.setIndex(tiledIndex); // migration to threejs r84: use setIndex(tiledIndex) instead of the following lines
    // this.setIndex( new ( Math.max.apply( Math, tiledIndex ) > 65535 ? THREE.Uint32BufferAttribute : THREE.Uint16BufferAttribute )( tiledIndex, 1 ) ); // r83
    var indexBuffer;
    if (Math.max.apply( Math, tiledIndex ) > 65535) {
      // indexBuffer = new THREE.Uint32BufferAttribute(tiledIndex, 1); // r83
      indexBuffer = new THREE.BufferAttribute( new Uint16Array( tiledIndex ), 1 );
    } else {
      // indexBuffer = new THREE.Uint16BufferAttribute(tiledIndex, 1); // r83
      indexBuffer = new THREE.BufferAttribute( new Uint32Array( tiledIndex ), 1 );
    }
    this.setIndex(indexBuffer);

    // uv scaling for tiled texture access. currently done in shader
    // var uvs = this.getAttribute("uv").array;
    // for (var uvBuffIndex = 0; uvBuffIndex < uvs.length; uvBuffIndex++) {
    //   uvs[uvBuffIndex] = uvs[uvBuffIndex]*numTiles.x;
    //   uvBuffIndex++;
    //   uvs[uvBuffIndex] = uvs[uvBuffIndex]*numTiles.y;
    // }

  }
}
TiledMultiMaterialGeometry.prototype = Object.create(GridGeometry.prototype);
TiledMultiMaterialGeometry.prototype.constructor = TiledMultiMaterialGeometry;

TiledMultiMaterialGeometry.prototype.setTiles = function(tiles) {
  this.clearGroups();
  var nVerticesPerQuad = 3*2;
  var nSlicePerTile = this.numSegments.x/this.numTiles.x;
  var nStackPerTile = this.numSegments.y/this.numTiles.y;
  var nQuadsPerTile = nSlicePerTile*nStackPerTile;
  var nVerticesPerTile = nQuadsPerTile*nVerticesPerQuad;
  for (var i = 0; i < tiles.length; i++) {
    var tileX = tiles[i].tileIndex.x;
    var tileY = tiles[i].tileIndex.y;

    var start = tileY*this.numTiles.x*nVerticesPerTile +tileX*nVerticesPerTile;
    var count = nVerticesPerTile;
    var materialIndex = tileY*this.numTiles.x + tileX;
    this.addGroup(start, count, materialIndex);
  }
}

export { TiledMultiMaterialGeometry }
