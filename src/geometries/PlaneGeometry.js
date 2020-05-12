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

import { GridGeometry } from './GridGeometry.js';
import { _Math } from '../math/Math.js';

/**
*
* @class
* @private
*/
function PlaneGeometry(size, numSegments, createTangentAttributes, position, rotation) {
  GridGeometry.call(this, new _Math.UVRectangle(size.x, size.y), numSegments, createTangentAttributes, position, rotation);
  this.size = size;
}
PlaneGeometry.prototype = Object.create(GridGeometry.prototype);
PlaneGeometry.prototype.constructor = PlaneGeometry;

PlaneGeometry.prototype.getSettings = function() {
  var settings = {
    type: "RECTANGLE",
    size: {
      w: this.size.x,
      h: this.size.y
    },
    scale: 1,
    position: { x: this.bakedPosition.x, y: this.bakedPosition.y, z: this.bakedPosition.z },
    rotation: { x: this.bakedRotation.value.x, y: this.bakedRotation.value.y, z: this.bakedRotation.value.z }
  };
  return settings;
}

export { PlaneGeometry }
