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

import { Log } from './Log.js';

/**
*
* @class
* @private
*/
function TextureStackRequest(urls, callBack, loader) {
  this.textures = [];
  this.urls = urls;
  this.callBack = callBack;
  this.settledLayersCount = 0;
  this.loadError = false;
  this.loader = loader;

  this.retries = [];
  this.maxRetries = 4;
}

TextureStackRequest.prototype = {
  load: function() {
    for (var layer = 0; layer < this.urls.length; layer++) {
      this.retries[layer] = 1;

      this.loader.load(
        this.urls[layer],
        this.onLoadSuccess(layer),
        this.onLoadProgress(layer),
        this.onLoadError(layer)
      );
    }
  },

  onLoadSuccess: function(layer) {
    var self = this;
    return function ( texture ) {
      self.textures[layer] = texture;
      self.settledLayersCount++;
      Log.info("TextureStackRequest.onLoadSuccess: Loaded texture from: " + self.urls[layer] );
      self.checkComplete();
    }
  },

  onLoadProgress: function(layer) {
    // var self = this;
    return function ( xhr ) {
      // Log.trace("TextureStackRequest.onLoadProgress: Loading texture of from: " + self.urls[layer] + ". " + (xhr.loaded / xhr.total * 100) + '% loaded');
    }
  },

  onLoadError: function(layer){
    var self = this;
    return function ( xhr ) {
      if (self.retries[layer] <= self.maxRetries) {
        Log.error("TextureStackRequest.onLoadError: Unable to load texture from: " + self.urls[layer] + ". Trying again..." );

        self.retries[layer] = self.retries[layer] + 1;

        setTimeout(function () {
          self.loader.load(
            self.urls[layer],
            self.onLoadSuccess(layer),
            self.onLoadProgress(layer),
            self.onLoadError(layer)
          );
        },
        250);
      } else {
        Log.error("TextureStackRequest.onLoadError: Unable to load texture from: " + self.urls[layer] );

        self.loadError = true;
        self.settledLayersCount++;
        self.checkComplete();
      }
    }
  },

  checkComplete: function() {
    if (this.settledLayersCount == this.urls.length) {
      this.callBack(this.textures, this.loadError);
    }
  }
}

export { TextureStackRequest }
