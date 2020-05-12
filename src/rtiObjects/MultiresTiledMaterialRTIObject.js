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
import { ModularRTIObject } from '../core/ModularRTIObject.js';
import { MultiresTree } from '../multires/MultiresTree.js';
import { MultiresTileAlignedGridGeometryHelper } from '../multires/MultiresTileAlignedGridGeometryHelper.js';
import { MultiresTextureLoader } from '../multires/MultiresTextureLoader.js';
import { MultiresTextureManager } from '../multires/MultiresTextureManager.js';
import { TiledMultiMaterialGeometry } from '../geometries/TiledMultiMaterialGeometry.js';
import { UniformContributor } from '../utils/UniformContributor.js';
import { RTIMaterial } from '../core/RTIMaterial.js';
import { Utils } from '../utils/Utils.js';

/**
*
* @class
* @private
*/
function MultiresTiledMaterialRTIObject(rtiModel, shader, textureSettings, textureAccessParams, multiresConfig, geometry) {
  ModularRTIObject.call(this, rtiModel, shader, textureSettings, geometry);

  this.type = "MultiresTiledMaterialRTIObject";

  this.defines.CONTENT_LIMITS = true;
  this.defines.TILED_UV = true;

  this.multires = new MultiresTree(this.textureSettings, multiresConfig.nLevels);

  this.geomHelper = new MultiresTileAlignedGridGeometryHelper(this.geometry, this.textureSettings, this.multires, this.defines);
  var texLoader = new MultiresTextureLoader(textureAccessParams, this.multires, false);
  this.textureMngr = new MultiresTextureManager(texLoader, this.geomHelper, this.multires, this.setTextures.bind(this));

  this.initGeometries();
  this.initMaterials();
  this.initRenderMeshes();

  this.activeLevel = 0;
  this.renderObject.add(this.renderMeshes[0]);

  return true;
}
MultiresTiledMaterialRTIObject.prototype = Object.create(ModularRTIObject.prototype);
MultiresTiledMaterialRTIObject.prototype.constructor = MultiresTiledMaterialRTIObject;


MultiresTiledMaterialRTIObject.prototype.requestMultiresTextureData = function(camera, screenRes) {
  this.textureMngr.requestMultiresTextureData(camera, screenRes);
}

MultiresTiledMaterialRTIObject.prototype.requestTextureLevel = function(level) {
  this.textureMngr.requestTextureLevel(level);
}

MultiresTiledMaterialRTIObject.prototype.updateTextureData = function(camera, screenRes) {
  var availableTiles = this.textureMngr.getAvailableTiles(camera, screenRes);
  if (availableTiles.length > 0) {
    var level = availableTiles[0].levelIndex;
    this.geometries[level].setTiles(availableTiles);
    this.setLevel(level);
  } else {
    this.setLevel(0);
  }
}

MultiresTiledMaterialRTIObject.prototype.setTextures = function(textures, tileX, tileY, level) {
  this.materials[level][tileX][tileY].attachTextures(textures);
}

MultiresTiledMaterialRTIObject.prototype.setLevel = function(level) {
  if (level != this.activeLevel) {
    Log.info("change level to: " + level);
    this.renderObject.remove(this.renderMeshes[this.activeLevel]);
    this.activeLevel = level;
    this.renderObject.add(this.renderMeshes[level]);
  }
}

MultiresTiledMaterialRTIObject.prototype.setShaderFlag = function(flag, value) {
  if (this.defines[flag] != value) {
    this.defines[flag] = value;
    for (var level = 0; level < this.multires.numLevels; level++) {
      var materials = this.materials[level];
      for (var tx=0; tx<materials.length; tx++) {
        for (var ty=0; ty<materials[tx].length; ty++) {
          materials[tx][ty].setupShaderMaterial();
          materials[tx][ty].needsUpdate = true;
        }
      }
    }
  }
}

MultiresTiledMaterialRTIObject.prototype.setDepthWrite = function(write) {
  for (var level = 0; level < this.multires.numLevels; level++) {
    var materials = this.materials[level];
    for (var tx=0; tx<materials.length; tx++) {
      for (var ty=0; ty<materials[tx].length; ty++) {
        materials[tx][ty].depthWrite = write;
      }
    }
  }
}

MultiresTiledMaterialRTIObject.prototype.initGeometries = function() {
  this.geometries = [];
  var currentNumTiles = new THREE.Vector2(1, 1);
  for (var l=0; l<this.multires.numLevels; l++) {
    this.geometries[l] = new TiledMultiMaterialGeometry(this.geometry.uvFunc, this.geometry.numSegments, false, currentNumTiles, this.geometry.bakedPosition, this.geometry.bakedRotation.value);
    this.geometries[l].setAttribute("position", this.geometry.getAttribute("position"));
    this.geometries[l].setAttribute("normal", this.geometry.getAttribute("normal"));
    if (this.geometry.hasTangentAttributes) {
      this.geometries[l].setAttribute("tangentU", this.geometry.getAttribute("tangentU"));
      this.geometries[l].hasTangentAttributes = true;
    }
    currentNumTiles.multiplyScalar(2);
  }
}

MultiresTiledMaterialRTIObject.prototype.initMaterials = function() {
  this.materials = [];
  var currentNumTiles = new THREE.Vector2(1, 1);
  for (var l=0; l<this.multires.numLevels; l++) {
    var numTilesUniformVal = new THREE.Vector2().copy(currentNumTiles);
    this.materials[l] = [];
    for (var tx=0; tx<currentNumTiles.x; tx++) {
      this.materials[l][tx] = [];
      for (var ty=0; ty<currentNumTiles.y; ty++) {
        var tileIndicesUniformVal = new THREE.Vector2(tx, ty);
        var uniformDefinitions = [
          { key: 'tileIndices', uniform: {type: 'v2', value: tileIndicesUniformVal} },
          { key: 'numTiles', uniform: {type: 'v2', value: numTilesUniformVal} }
        ];
        var tiledUVUniforms = new UniformContributor(uniformDefinitions);
        this.materials[l][tx][ty] = new RTIMaterial(this.rtiModel, this.shader, this.textureSettings, this.defines, [tiledUVUniforms]);
      }
    }
    currentNumTiles.multiplyScalar(2);
  }
}

MultiresTiledMaterialRTIObject.prototype.initRenderMeshes = function() {
  this.renderMeshes = [];
  var currentNumTiles = new THREE.Vector2(1, 1);
  for (var l=0; l<this.multires.numLevels; l++) {
    var materialsList = [];
    for (var ty=0; ty<currentNumTiles.y; ty++) {
      for (var tx=0; tx<currentNumTiles.x; tx++) {
        materialsList.push(this.materials[l][tx][ty]);
      }
    }
    this.renderMeshes[l] = new THREE.Mesh(this.geometries[l], materialsList );
    this.renderMeshes[l].onBeforeRender = this.onBeforeRender.bind(this);
    currentNumTiles.multiplyScalar(2);
  }
}

MultiresTiledMaterialRTIObject.prototype.setDeformable = function(deformable) {
  if (deformable) {
    if (!this.geometry.hasTangentAttributes) {
      this.geometry.createTangentAttributes();
      for (var l=0; l<this.multires.numLevels; l++) {
        this.geometries[l].setAttribute("tangentU", this.geometry.getAttribute("tangentU"));
        this.geometries[l].hasTangentAttributes = true;
      }
    }
  }
  this.setShaderFlag('TRNSFRM_TANGENT', deformable);
  this.geomHelper.deformable = true;
}

// TODO: use scale on renderobject when TRNSFRM MODEL is ready
MultiresTiledMaterialRTIObject.prototype.scale = function(x, y) {
  this.setDeformable(true);
  this.geometry.scale(x, y, 1);
  // TODO: what to do when geometry != planegeometry?
  this.geometry.size.set(this.geometry.size.x*x, this.geometry.size.y*y);
}


MultiresTiledMaterialRTIObject.prototype.reloadTextures = function() {
  for (var level = 0; level < this.multires.numLevels; level++) {
    var materials = this.materials[level];
    for (var tx=0; tx<materials.length; tx++) {
      for (var ty=0; ty<materials[tx].length; ty++) {
        var textures = [];
        var uniforms = materials[tx][ty].uniforms;
        if (uniforms.texture012 && uniforms.texture012.value) {
          textures.push(uniforms.texture012.value);
        }
        if (uniforms.texture345 && uniforms.texture345.value) {
          textures.push(uniforms.texture345.value);
        }
        if (uniforms.textureRGB && uniforms.textureRGB.value) {
          textures.push(uniforms.textureRGB.value);
        }
        if (uniforms.textureGSpecular && uniforms.textureGSpecular.value) {
          textures.push(uniforms.textureGSpecular.value);
        }
        if (uniforms.textureOpacity && uniforms.textureOpacity.value) {
          textures.push(uniforms.textureOpacity.value);
        }
        materials[tx][ty].setupShaderMaterial(textures);
      }
    }
  }

  var levels = this.textureMngr.multires.levels;
  for (var l = 0; l < levels.length; l++) {
    for (var i = 0; i < levels[l].tiles.length; i++) {
      for (var j = 0; j < levels[l].tiles[i].length; j++) {
        levels[l].tiles[i][j].loadState = 0;
        levels[l].loadedTiles = 0;
      }
    }
  }
  this.textureMngr.fullRequestStarted = false;
  this.textureMngr.fullyLoadedLevels = 0;
}

MultiresTiledMaterialRTIObject.prototype.setURLPrefix = function(prefix) {
  this.textureMngr.loader.prefix = prefix;
}

MultiresTiledMaterialRTIObject.prototype.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
  // console.log("hallo MultiresTiledMaterialRTIObject.prototype.onBeforeRender");

  // TODO; create only once
  // TODO; calc only once per scene?
  // var viewMatrixInverse = new THREE.Matrix4().getInverse(camera.matrixWorldInverse);
  var viewMatrixInverse = new THREE.Matrix4();
  viewMatrixInverse.getInverse(camera.matrixWorldInverse);

  var viewMatrixTranspose4 = new THREE.Matrix4();
  viewMatrixTranspose4.copy(camera.matrixWorld);
  viewMatrixTranspose4.transpose();
  var viewMatrixTranspose3 = new THREE.Matrix3();
  viewMatrixTranspose3.setFromMatrix4(viewMatrixTranspose4);
  // TODO; alt?
  // var viewMatrixTranspose3a = new THREE.Matrix3();
  // viewMatrixTranspose3a.getNormalMatrix(viewMatrixInverse);


  // console.log(viewMatrixTranspose3);
  // console.log(viewMatrixTranspose3a);

  // console.log(camera.matrixWorldInverse);
  // console.log(viewMatrixInverse);
  this.shader.onBeforeRender(viewMatrixInverse, viewMatrixTranspose3);
}

MultiresTiledMaterialRTIObject.prototype.dispose = function() {
  this.geometry.dispose();
  var currentNumTiles = new THREE.Vector2(1, 1);
  for (var l=0; l<this.multires.numLevels; l++) {
    this.geometries[l].dispose();
    for (var tx=0; tx<currentNumTiles.x; tx++) {
      for (var ty=0; ty<currentNumTiles.y; ty++) {
        this.materials[l][tx][ty].disposeTextures();
        this.materials[l][tx][ty].dispose();
      }
    }
    currentNumTiles.multiplyScalar(2);
  }
}

MultiresTiledMaterialRTIObject.prototype.getSettings = function() {
  var settings = ModularRTIObject.prototype.getSettings.call(this);
  settings.type = this.type;
  settings.textureAccess = {
    prefix: this.textureMngr.loader.prefix,
    urls: Utils.jsonCopy(this.textureMngr.loader.urls),
    suffix: this.textureMngr.loader.suffix,
    indexType: this.textureMngr.loader.indexType
  };
  settings.multires = {
    nLevels: this.multires.numLevels
  };
  // TODO:
  // settings.calcParam = this.calcParam.;
  return settings;
}

export { MultiresTiledMaterialRTIObject }
