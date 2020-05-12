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

import { TextureStackRequest } from './TextureStackRequest.js';
import { Log } from './Log.js';

/**
*
* @class
* @private
*/
function TextureManager(urls, prefix, callBackSetTextures) {
  this.urls = urls;
  this.prefix = prefix;
  this.callBackSetTextures = callBackSetTextures;
  this.loadState = 0; // 0: init, 1: requested/waiting, 2: settled w error, 3: success
  this.loader = new THREE.TextureLoader();
  this.loader.setCrossOrigin("");
}

TextureManager.prototype = {
  requestTextureData: function(forceReload) {
    if (forceReload || this.loadState == 0) {
      var urls = [];
      for (var i = 0; i<this.urls.length; i++) {
        urls[i] = this.urls[i];
        if (this.prefix != undefined)
          urls[i] = this.prefix + urls[i];
      }
      var request = new TextureStackRequest(urls, this.handleResponse.bind(this), this.loader);
      request.load();
      this.loadState = 1;
    }
  },

  handleResponse: function(textures, error) {
    if (error) {
      this.loadState = 2;
      Log.error("TextureManager: response error");
    } else {
      this.callBackSetTextures(textures);
      this.loadState = 3;
      Log.info("TextureManager: response success");
    }
  }
}

export { TextureManager }
