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

precision highp float;

#ifdef SCALED_CONTENT
  uniform vec2 uvScale;
  uniform vec2 uvBias;
#endif

#ifdef TRNSFRM_TANGENT
  attribute vec3 tangentU;
  varying vec3 vNormalModel;
  varying vec3 vTangentModel;
#endif

varying vec2 vUV;

#if NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0
  varying vec3 position_world;
#endif

varying vec4 position_view;


void main() {

#if NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0
  position_world = position;
#endif

#ifdef SCALED_CONTENT
  vUV = vec2(uv.x*uvScale.x+uvBias.x, uv.y*uvScale.y+uvBias.y);
#else
  vUV = uv;
#endif

#ifdef TRNSFRM_TANGENT
  vNormalModel = normal;
  vTangentModel = tangentU;
#endif

#ifdef TRNSFRM_MODEL
  position_view = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
#else
  position_view = projectionMatrix * viewMatrix * vec4(position, 1.0 );
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0 );
#endif

}
