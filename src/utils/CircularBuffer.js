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


/**
*
* @class
* @private
*/
function CircularBuffer(size) {
  this.maxSize = 0;
  this.currentSize = 0;
  this.currentIndex = 0;
  this.values = [];
  this.init(size);
  return this;
}

CircularBuffer.prototype = {
  init: function(size) {
    this.maxSize = size;
    this.currentSize = 0;
    this.currentIndex = 0;
    this.values = new Array(size);
  },

  push: function(value) {
    if (this.currentSize < this.maxSize) {
      this.currentSize++;
    }
    this.values[this.currentIndex] = value;
    this.currentIndex++;
    this.currentIndex = this.currentIndex%this.maxSize;
  },

  flush: function() {
    this.init(this.maxSize);
  },

  getAvg: function() {
    if (this.currentSize < 1)
    return undefined;

    var avg = 0;
    for (var i = 0; i < this.currentSize; i++) {
      avg = avg + this.values[i];
    }
    avg = avg/this.currentSize;
    return avg;
  },

  getVar: function() {
    if (this.currentSize < 1)
    return undefined;

    var avg = this.getAvg();
    var variance = 0;
    for (var i = 0; i < this.currentSize; i++) {
      var d = (this.values[i] - avg);
      variance = variance + d*d;
    }
    variance = variance/this.currentSize;
    return variance;
  }
}

export { CircularBuffer }
