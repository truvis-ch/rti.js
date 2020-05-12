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

import { Utils } from '../utils/Utils.js';
import { _Math } from '../math/Math.js';
import { Log } from '../utils/Log.js';
import { RTIModel } from '../core/RTIModel.js';
import { RTIScene } from '../core/RTIScene.js';
import { LRGB_PTM_Model } from '../core/RTIModel.js';
import { LRGBG_PTM_Model } from '../core/RTIModel.js';
import { RTITextureSettings } from '../core/RTITextureSettings.js';
import { GridGeometry } from '../geometries/GridGeometry.js';
import { PlaneGeometry } from '../geometries/PlaneGeometry.js';
import { MultiresTiledMaterialRTIObject } from '../rtiObjects/MultiresTiledMaterialRTIObject.js';
import { SingleresRTIObject } from '../rtiObjects/SingleresRTIObject.js';
import { ShaderLoader } from './ShaderLoader.js'
import { GridPhysics } from '../physics/GridPhysics.js'

/**
*
* @class
* @private
*/
function ObjectLoader() {
}

ObjectLoader.prototype.loadRTIViewerConfig = function(url, onSucces, onError, beforeCreate) {
  var req = new XMLHttpRequest();
  function handleResponse() {
    if (req.readyState == 4 && req.status == 200) {
      var viewerConfigJSON;
      try {
        viewerConfigJSON = JSON.parse(req.responseText);
      } catch (err) {
        onError(err.message);
      }
      if (typeof beforeCreate != 'undefined') {
        beforeCreate(viewerConfigJSON);
      }
      var viewerConfig = {};
      viewerConfig.viewerSettings = viewerConfigJSON.viewerSettings;
      if (viewerConfigJSON.scene) {
        viewerConfig.scene = this.createRTIScene(viewerConfigJSON.scene);
      }
      onSucces(viewerConfig);
    } else {
      onError(req.statusText);
    }
  }
  function handleError() {
    onError(req.statusText);
  }
  req.onload = handleResponse.bind(this);
  req.onerror = handleError.bind(this);
  req.open("GET", url);
  req.send();
}

ObjectLoader.prototype.loadRTIScene = function(url, onSucces, onError, beforeCreate) {
  var req = new XMLHttpRequest();
  function handleResponse() {
    if (req.readyState == 4 && req.status == 200) {
      var sceneConfig;
      try {
        sceneConfig = JSON.parse(req.responseText);
      } catch (err) {
        onError(err.message);
      }
      if (typeof beforeCreate != 'undefined') {
        beforeCreate(viewerConfigJSON);
      }
      var scene = this.createRTIScene(sceneConfig);
      onSucces(scene);
    } else {
      onError(req.statusText);
    }
  }
  function handleError() {
    onError(req.statusText);
  }
  req.onload = handleResponse.bind(this);
  req.onerror = handleError.bind(this);
  req.open("GET", url);
  req.send();
}

ObjectLoader.prototype.loadRTIObject = function(url, onSucces, onError, beforeCreate) {
  var req = new XMLHttpRequest();
  function handleResponse() {
    if (req.readyState == 4 && req.status == 200) {
      var objectConfig;
      try {
        objectConfig = JSON.parse(req.responseText);
      } catch (err) {
        onError(err.message);
      }
      if (typeof beforeCreate != 'undefined') {
        beforeCreate(viewerConfigJSON);
      }
      var object = this.createRTIObject(objectConfig);
      onSucces(object);
    } else {
      onError(req.statusText);
    }
  }
  function handleError() {
    onError(req.statusText);
  }
  req.onload = handleResponse.bind(this);
  req.onerror = handleError.bind(this);
  req.open("GET", url);
  req.send();
}

ObjectLoader.prototype.createRTIScene = function(sceneConfig) {
  if (!sceneConfig.configVersion || sceneConfig.configVersion < 3) {
    sceneConfig = Utils.jsonCopy(sceneConfig);
    if (sceneConfig.lights && sceneConfig.lights.directionalLights) {
      var dirLights = sceneConfig.lights.directionalLights;
      for (var i = 0; i < dirLights.length; i++) {
        if (dirLights[i].direction.z > 0) {
          dirLights[i].direction.x = -dirLights[i].direction.x;
          dirLights[i].direction.y = -dirLights[i].direction.y;
          dirLights[i].direction.z = -dirLights[i].direction.z;
        }
      }
    }
  }
  var scene = new RTIScene();
  var rtiObjects = sceneConfig.rtiObjects;
  for (var i = 0; i<rtiObjects.length; i++) {
    var rtiObject = this.createRTIObject(rtiObjects[i]);
    scene.addRTIObject(rtiObject);
  }

  var lightSettings = sceneConfig.lights;
  if (lightSettings) {
    var directionalLights = lightSettings.directionalLights;
    if (directionalLights) {
      for (var i = 0; i<directionalLights.length; i++) {
        scene.addDirectionalLight();
        // TODO: pass as args to func above after refactoring of above func
        var jsonColor = directionalLights[i].color;
        var intensity = directionalLights[i].intensity;
        var color = new THREE.Color(jsonColor.r, jsonColor.g, jsonColor.b);
        scene.directionalLights[i].color = color;
        scene.directionalLights[i].intensity = intensity;
        var jsonDir = directionalLights[i].direction;
        var dir = new THREE.Vector3(jsonDir.x, jsonDir.y, jsonDir.z);
        scene.directionalLights[i].position.copy(dir.negate());
        if (directionalLights[i].extensions) {
          scene.directionalLights[i].extensions = directionalLights[i].extensions;
        }
      }
    }

    var pointLights = lightSettings.pointLights;
    if (pointLights) {
      for (var i = 0; i<pointLights.length; i++) {
        scene.addPointLight();
        // TODO: pass as args to func above after refactoring of above func
        var jsonColor = pointLights[i].color;
        var intensity = pointLights[i].intensity;
        var color = new THREE.Color(jsonColor.r, jsonColor.g, jsonColor.b);
        scene.pointLights[i].color = color;
        scene.pointLights[i].intensity = intensity;
        var jsonPos = pointLights[i].position;
        var pos = new THREE.Vector3(jsonPos.x, jsonPos.y, jsonPos.z);
        scene.pointLights[i].position.copy(pos);
        if (pointLights[i].extensions) {
          scene.pointLights[i].extensions = pointLights[i].extensions;
        }
      }
    }

    var spotLights = lightSettings.spotLights;
    if (spotLights) {
      for (var i = 0; i<spotLights.length; i++) {
        scene.addSpotLight();
        // TODO: pass as args to func above after refactoring of above func
        var jsonColor = spotLights[i].color;
        var intensity = spotLights[i].intensity;
        var color = new THREE.Color(jsonColor.r, jsonColor.g, jsonColor.b);
        scene.spotLights[i].color = color;
        scene.spotLights[i].intensity = intensity;
        var jsonPos = spotLights[i].position;
        var pos = new THREE.Vector3(jsonPos.x, jsonPos.y, jsonPos.z);
        scene.spotLights[i].position.copy(pos);
        var jsonDir = spotLights[i].direction;
        var direction = new THREE.Vector3(jsonDir.x, jsonDir.y, jsonDir.z);
        direction.normalize();
        var target = pos.clone().add(direction);
        scene.spotLights[i].target.position.copy(target);
        var angle = spotLights[i].angle;
        scene.spotLights[i].angle = angle;
        var penumbra = spotLights[i].penumbra;
        scene.spotLights[i].penumbra = penumbra;
        if (spotLights[i].extensions) {
          scene.spotLights[i].extensions = spotLights[i].extensions;
        }
      }
    }

    var ambientLights = lightSettings.ambientLights;
    if (ambientLights) {
      for (var i = 0; i<ambientLights.length; i++) {
        scene.addAmbientLight();
        // TODO: pass as args to func above after refactoring of above func
        var jsonColor = ambientLights[i].color;
        var intensity = ambientLights[i].intensity;
        var color = new THREE.Color(jsonColor.r, jsonColor.g, jsonColor.b);
        scene.ambientLights[i].color = color;
        scene.ambientLights[i].intensity = intensity;
        if (ambientLights[i].extensions) {
          scene.ambientLights[i].extensions = ambientLights[i].extensions;
        }
      }
    }

  }

  if (sceneConfig.camera && sceneConfig.camera.initial) {
      var position = sceneConfig.camera.initial.position;
      scene.initialCameraPosition.set(position.x, position.y, position.z);
      scene.initialCameraZoom = sceneConfig.camera.initial.zoom;
      scene.resetCamera();
  }


  if (sceneConfig.camera && sceneConfig.camera.maxZoomDist) {
    scene.maxZoomDist = sceneConfig.camera.maxZoomDist;
  }

  if (sceneConfig.camera && sceneConfig.camera.minZoomDist) {
    scene.minZoomDist = sceneConfig.camera.minZoomDist;
  }

  if (sceneConfig.extensions) {
    scene.extensions = sceneConfig.extensions;
  }

  if (sceneConfig.physics) {
    scene.physics.windEnabled = sceneConfig.physics.windEnabled;
    scene.physics.windStrength = sceneConfig.physics.windStrength;

    if (sceneConfig.physics.precalc) {
      scene.physics.precalc = sceneConfig.physics.precalc;

      for (var iterIndex = 0; iterIndex < sceneConfig.physics.precalc; iterIndex++) {
        scene.physics.update();
        for (var i = 0; i < scene.rtiObjects.length; i++) {
          if (scene.rtiObjects[i].physics) {
            scene.rtiObjects[i].physics.update();
          }
        }
      }
      for (var i = 0; i < scene.rtiObjects.length; i++) {
        if (scene.rtiObjects[i].physics) {
          scene.rtiObjects[i].geometry.updateFromVectors(scene.rtiObjects[i].physics.positions);
        }
      }
    }
  }

  if (sceneConfig.clearColor) {
    var clearColor = sceneConfig.clearColor;
    scene.clearColor = new THREE.Color(clearColor.r, clearColor.g, clearColor.b);
  }


  return scene;
}

ObjectLoader.prototype.createPhysics = function(config, geometry) {
  var newPhysics  = new GridPhysics(geometry, null, config.mass, config.damping, config.attach, config.precalc);
  return newPhysics;
}

ObjectLoader.prototype.addPhysics = function(object, config) {
  if (config && config.type != "SOLID") {
    var newPhysics = this.createPhysics(config, object.geometry);
    // TODO: move to animationHandler
    object.setDeformable(true);
    object.physics = newPhysics;
  }
}

ObjectLoader.prototype.createRTIObject = function(config) {
  var shaderLoader = new ShaderLoader();
  if (!config.configVersion || config.configVersion < 1) {
    if (config.PTM) {
      config = this.convertLegacyConfig(config);
      Log.info("Converting v0 config.json to new format");
      if (!config)
        return undefined;
    } else {
      Log.error("ObjectLoader.createRTIObject: Unknown config.json format.");
      return undefined;
    }
  }
  if (config.configVersion < 2) {
    Log.info("Converting v1 config.json to new format");
    if (config.rtiModel.flatGSpecular)
    config.rtiModel.ks_flat = config.rtiModel.flatGSpecular;
  }
  if (config.configVersion < 3) {
    // ok
  }
  try {
  var rtiModel = this.createRTIModel(config.rtiModel);
  var shaders = shaderLoader.loadShaderModel(config.rtiModel);
  var textureSettings = this.createRTITextureSettings(config.textureSettings);
  var textureAccessParams = this.createRTITextureAccessParams(config.textureAccess);
  var geometryModel = this.createRTIGeometry(config.geometry);
  var obj = undefined;
  switch (config.type) {
    case "SingleresRTIObject":
      obj = new SingleresRTIObject(rtiModel, shaders, textureSettings, textureAccessParams, geometryModel);
      break;
    case "MultiresTiledMaterialRTIObject":
      obj = new MultiresTiledMaterialRTIObject(rtiModel, shaders, textureSettings, textureAccessParams, config.multires, geometryModel);
      break;
    default:
      Log.error("Unknown RTIObject type: " + config.type);
      return undefined;
  }
  this.addPhysics(obj, config.physics);
  if (geometryModel.hasTangentAttributes) {
    obj.setDeformable(true);
  }
  if (config.settings) {
    console.log("WARNING: material settings as rtiObject.settings will be deprecated. Settings should be put directly in rtiObject.rtiModel.");
    Utils.setObjectSettings(obj, config.settings);
  }
  if (config.extensions) {
    obj.extensions = config.extensions;
  }
  return obj;
} catch (err) {
    if (err.stack)
      Log.error(err.stack);
    Log.error("ObjectLoader.createRTIObject: " + err.message);
    return undefined;
  }
}


ObjectLoader.prototype.createRTIGeometry = function(config) {
  var geomType = config.type;
  if (geomType == "GridGeometry") {
    var nSegs = 64; // must be POT for multimat
    var numSegments = new THREE.Vector2(nSegs, nSegs);
    var funcConfig = config.uvFunc;
    var uvFuncType = funcConfig.type;
    var uvFunc;
    var createTangentAttributes;
    if (uvFuncType == "SINERECTANGLE") {
      var size = new THREE.Vector3(funcConfig.size.w, funcConfig.size.h);
      uvFunc = new _Math.UVSineRectangle(size.x, size.y, funcConfig.uAmplitude, funcConfig.vAmplitude, funcConfig.uCycles, funcConfig.vCycles);
      createTangentAttributes = true;
    } else if (uvFuncType == "HALFCYLINDER") {
      var radius = funcConfig.radius;
      var height = funcConfig.height;
      if (funcConfig.scale) {
        console.log("WARNING: scale parameter in GridGeometry.HALFCYLINDER has been deprecated. Support will be dropped in future versions.");
        radius = radius*funcConfig.scale;
        height = height*funcConfig.scale;
      }
      uvFunc = new _Math.UVHalfCylinder(radius, height);
      createTangentAttributes = true;
    } else if (uvFuncType == "SPHERE") {
      var radius = funcConfig.radius;
      uvFunc = new _Math.UVSphere(radius);
      createTangentAttributes = true;
    } else if (uvFuncType == "TORUS") {
      var radius1 = funcConfig.radius1;
      var radius2 = funcConfig.radius2;
      uvFunc = new _Math.UVTorus(radius1, radius2);
      createTangentAttributes = true;
    } else if (uvFuncType == "MOBIUS") {
      var radius = funcConfig.radius;
      uvFunc = new _Math.UVMobius(radius);
      createTangentAttributes = true;
    }
    else if (uvFuncType == "BENT_TEST") {
      var y0 = funcConfig.y0;
      var y1 = funcConfig.y1;
      var dz = funcConfig.dz;
      createTangentAttributes = false;
      uvFunc = new _Math.UVBentTest(y0, y1, dz);
      createTangentAttributes = true;
    }  else {
      uvFuncType = "RECTANGLE";
      var size = new THREE.Vector3(funcConfig.size.w, funcConfig.size.h);
      if (funcConfig.scale) {
        console.log("WARNING: scale parameter in GridGeometry.RECTANGLE has been deprecated. Support will be dropped in future versions.");
        size.multiplyScalar(funcConfig.scale);
      }
      createTangentAttributes = false;
      uvFunc = new _Math.UVRectangle(size.x, size.y);
    }
    var position = new THREE.Vector3(0,0,0);
    if (config.position) {
      position.set(config.position.x, config.position.y, config.position.z);
    }
    var rotation = new THREE.Vector3(0,0,0);
    if (config.rotation && (config.rotation.x != 0 || config.rotation.y != 0 || config.rotation.z != 0)) {
      createTangentAttributes = true;
      rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
    }
    var geometry = new GridGeometry(uvFunc, numSegments, createTangentAttributes, position, rotation);
    return geometry;
  } else {
    var nSegs = 64; // must be POT for multimat
    var numSegments = new THREE.Vector2(nSegs, nSegs);
    var size = new THREE.Vector3(config.size.w, config.size.h);
    if (config.scale)
      size.multiplyScalar(config.scale);
    var position = new THREE.Vector3(0,0,0);
    if (config.position) {
      position.set(config.position.x, config.position.y, config.position.z);
    }
    var createTangentAttributes = false;
    var rotation = new THREE.Vector3(0,0,0);
    if (config.rotation && (config.rotation.x != 0 || config.rotation.y != 0 || config.rotation.z != 0)) {
      createTangentAttributes = true;
      rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
    }
    var geometry = new PlaneGeometry(size, numSegments, createTangentAttributes, position, rotation);
    return geometry;
  }
}

ObjectLoader.prototype.createRTITextureSettings = function(config) {
  var resolution = new THREE.Vector2(config.resolution.w, config.resolution.h);
  var contentSize = new THREE.Vector2(config.contentSize.w, config.contentSize.h);
  var model = new RTITextureSettings(resolution, contentSize, config.hasMask, config.filterSettings);
  return model;
}

ObjectLoader.prototype.createRTITextureAccessParams = function(config) {
  var accessParams = config;
  return accessParams;
}

ObjectLoader.prototype.createRTIModel = function(config) {
  switch (config.type) {
    case "LRGB_PTM":
    var bias = config.bias;
    var scale = config.scale;
    var orientation = config.orientation;
    var bias16 = config.bias16;
    var useEaseOutLum = config.useEaseOutLum;
    var renderFuncIndex = config.renderFuncIndex;
    var useFlatNormalSpecular = config.useFlatNormalSpecular;
    var useFlatNormalEaseOut = config.useFlatNormalEaseOut;
    var model = new LRGB_PTM_Model(bias, scale, orientation, bias16, useEaseOutLum, renderFuncIndex, useFlatNormalSpecular, useFlatNormalEaseOut);
    this.applyOptionalModelSettings(config, model);
    return model;
    case "LRGBG_PTM":
    var bias = config.bias;
    var scale = config.scale;
    var orientation = config.orientation;
    var bias16 = config.bias16;
    var useEaseOutLum = config.useEaseOutLum;
    var renderFuncIndex = config.renderFuncIndex;
    var useFlatNormalSpecular = config.useFlatNormalSpecular;
    var useFlatNormalEaseOut = config.useFlatNormalEaseOut;
    var model = new LRGBG_PTM_Model(bias, scale, orientation, bias16, useEaseOutLum, renderFuncIndex, useFlatNormalSpecular, useFlatNormalEaseOut);
    this.applyOptionalModelSettings(config, model);
    return model;
    default:
    Log.error("Unknown RTIModel type: ", config.type);
    return undefined;
  }
}

ObjectLoader.prototype.applyOptionalModelSettings = function(config, model) {
  if (config.k != undefined)
  model.k.value = config.k;

  if (config.kRGB)
  model.kRGB.value.set(config.kRGB.x, config.kRGB.y, config.kRGB.z);

  if (config.kRGBs)
  model.kRGBs.value.set(config.kRGBs.x, config.kRGBs.y, config.kRGBs.z);

  if (config.orientation != undefined)
  model.orientation.value = config.orientation;

  if (config.kd != undefined)
  model.kd.value = config.kd;

  if (config.ks_flat != undefined)
  model.ks_flat.value = config.ks_flat;

  if (config.alpha != undefined)
  model.alpha.value = config.alpha;

  if (config.minMean_s != undefined)
  model.minMean_s.value = config.minMean_s;

  if (config.maxMean_s != undefined)
  model.maxMean_s.value = config.maxMean_s;

  if (config.useDiffuseColor != undefined)
  model.useDiffuseColor.value = config.useDiffuseColor;

  if (model.type == "LRGBG_PTM") {
    if (config.gChannel != undefined)
    model.gChannel.value = config.gChannel;

    if (config.ks != undefined)
    model.ks.value = config.ks;
  }

  if (config.mapsContent) {
    model.mapsContent = config.mapsContent;
  }
}

ObjectLoader.prototype.convertLegacyConfig = function(oldConfig) {
  console.log("ERROR: loading of legacy config format currently not supported");
  try {
  var newConfig = {};
  newConfig.configVersion = 1;

  newConfig.type = "MultiresTiledMaterialRTIObject";

  newConfig.rtiModel = {};
  var oldModel = oldConfig.PTM;
  newConfig.rtiModel.type = oldModel.type;
  newConfig.rtiModel.scale = oldModel.scale;
  newConfig.rtiModel.bias = oldModel.bias;
  newConfig.rtiModel.bias16 = oldModel.bias16 || 0;
  newConfig.rtiModel.orientation = oldModel.orientation;

  newConfig.textureSettings = {};
  newConfig.textureSettings.resolution = oldModel.maxResolution;
  newConfig.textureSettings.contentSize = oldModel.contentSize;

  newConfig.textureAccess = {};
  newConfig.textureAccess.suffix = oldModel.imageFormat;
  newConfig.textureAccess.indexType = "MORTON_SUM";

  newConfig.geometry = {};
  newConfig.geometry.type = "RECTANGLE";
  var planeSize = new THREE.Vector2(oldModel.maxResolution.w, oldModel.maxResolution.h);
  planeSize.divideScalar(Math.max(oldModel.contentSize.w, oldModel.contentSize.h));
  newConfig.geometry.size = { "w": planeSize.x, "h": planeSize.y };
  newConfig.geometry.scale = 4;

  newConfig.physics = {};
  newConfig.physics.type = "SOLID";

  newConfig.multires = {};

  var temp = oldModel.maxResolution.w;
  var nLevels = 1;
  while (temp > oldConfig.MultiresStrategy.tileSize.w)
  {
    nLevels++;
    temp /= 2;
  }
  newConfig.multires.nLevels = nLevels;

  if (oldConfig.settings)
  newConfig.settings = oldConfig.settings;
  return newConfig;

} catch (err) {
    if (err.stack)
      Log.error(err.stack);
    Log.error("ObjectLoader.convertLegacyConfig: " + err.message);
    return undefined;
}
}


/**
* Parses a PTMConfig file in .xml format.
* @param {Document} doc - the .xml document
* @returns {PTMConfig|bool} - the PTMConfig or false if the config file could not be parsed.
*/
ObjectLoader.prototype.parseLegacyXMLConfig = function(doc) {
  var content = doc.getElementsByTagName("Content")[0];
  var ptmType = content.getAttribute("type");

  if (!(ptmType == "LRGBG_PTM" || ptmType == "LRGB_PTM" )) {
    Log.error("ObjectLoader.parseLegacyXMLConfig: unsupported ptm format: " + ptmType);
    return false;
  }

  var geometryType = "PLANE";

  var imageFormat = "jpg";
  var val = parseInt(doc.getElementsByTagName("MultiRes")[0].getAttribute("format"));
  if (!isNaN(val))
  if (val == 1)
  imageFormat = "png";

  var scale = doc.getElementsByTagName("Scale")[0];
  var size = doc.getElementsByTagName("Size")[0];
  var bias = doc.getElementsByTagName("Bias")[0];

  var contentWidth = parseInt(size.getAttribute("width"));
  var contentHeight = parseInt(size.getAttribute("height"));
  var expectedNumberCoeffs = 9; // LRGBG_PTM
  if (ptmType == "LRGB_PTM") {
    expectedNumberCoeffs = 6;
  }
  var numberCoeffs = parseInt(size.getAttribute("coefficients"));
  if (numberCoeffs != expectedNumberCoeffs) {
    Log.error("ObjectLoader.parseLegacyXMLConfig: invalid info.xml: attribute 'coefficients' of tag 'Size' must be "+expectedNumberCoeffs+" for type"+ptmType);
    return false;
  }

  var tokens = scale.childNodes[0].nodeValue.split(" ");
  if (tokens.length < numberCoeffs) {
    Log.error("ObjectLoader.parseLegacyXMLConfig: invalid info.xml: number of scale coefficients must be "+expectedNumberCoeffs+" for type"+ptmType);
    return false;
  }
  var scale = [];
  for (var j = 0; j < numberCoeffs; j++ )
  scale[j] = parseFloat(tokens[j]);

  tokens = bias.childNodes[0].nodeValue.split(" ");
  if (tokens.length < numberCoeffs) {
    Log.error("ObjectLoader.parseLegacyXMLConfig: invalid info.xml: number of bias coefficients must be "+expectedNumberCoeffs+" for type"+ptmType);
    return false;
  }
  var bias = [];
  for (var j = 0; j < numberCoeffs; j++ )
  bias[j] = parseFloat(tokens[j]);

  var orientation = 0;
  var orientationTag = doc.getElementsByTagName("Orientation")[0];
  if (orientationTag) {
    var orientation = parseInt(orientationTag.textContent);
    if (orientation >= 0 && orientation < 4) {
      orientation = orientation;
    }
  }

  var treeTag = doc.getElementsByTagName("Tree")[0];

  var lines = Utils.readLines(treeTag.textContent);
  var n = lines.length;

  var multiresStrategyType = "IMAGE_TREE";

  if (n<3) return false;

  tokens = lines[0].split(" ");
  if (tokens.length < 2) return  false;
  var nodesCount = parseInt(tokens[0]);
  if (nodesCount <= 0) return  false;

  tokens = lines[1].split(" ");
  if (tokens.length < 1) return  false;
  var tileSizeWidth = parseInt(tokens[0]);
  if (tileSizeWidth <= 0) return false;

  var tileSizeHeight = tileSizeWidth;

  tokens = lines[2].split(" ");
  if (tokens.length < 2) return false;
  var maxWidth = parseFloat(tokens[0]);
  var maxHeight = parseFloat(tokens[1]);

  var config = {
    "PTM" : {
      "type" : ptmType,
      "maxResolution" : { "w" : maxWidth, "h" : maxHeight },
      "contentSize" : { "w" : contentWidth, "h" : contentHeight },
      "scale" : scale,
      "bias" : bias,
      "orientation" : orientation,
      "imageFormat" : imageFormat
    },

    "Geometry" : {
      "type" : geometryType
    },

    "MultiresStrategy" : {
      "type" : multiresStrategyType,
      "tileSize" : { "w" : tileSizeWidth, "h" : tileSizeHeight }
    }
  };
  return config;
}

export { ObjectLoader }
