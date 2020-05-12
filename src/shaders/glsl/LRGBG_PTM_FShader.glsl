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

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

//////////////////////////////////////////////////////////////////////////////////////////
/// common inputs for all PTM types (LRGB, LRGBG) and all geometries (PLANE, HALFDOME) ///
//////////////////////////////////////////////////////////////////////////////////////////

varying vec4 position_view;

varying vec2 vUV;
uniform sampler2D texture012;
uniform sampler2D texture345;
uniform sampler2D textureRGB;


#if NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0
  varying vec3 position_world;
#endif

#ifdef OPACITY_MASK
  uniform sampler2D textureOpacity;
#endif

uniform float scale[6];
uniform float bias[6];


#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

  uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

uniform vec3 ambientLightColor;


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];

#endif



uniform vec3 kRGB;
uniform vec3 kRGBs;
uniform float k;
uniform float kd;
uniform float alpha;
uniform float ks_flat;
uniform int useDiffuseColor;
uniform int useEaseOutLum;
uniform int renderFuncIndex;

uniform int useFlatNormalSpecular;
uniform int useFlatNormalEaseOut;

uniform vec2 mirror;
uniform int orientation;


uniform mat4 viewMatrixInverse;
uniform mat3 viewMatrixTranspose;


uniform int visualizeErrors;
uniform int visualizeErrorsIndex;

#ifdef CONTENT_LIMITS
  uniform vec2 contentLimitsU;
  uniform vec2 contentLimitsV;
#endif

#ifdef TILED_UV
  uniform vec2 tileIndices;
  uniform vec2 numTiles;
#endif

//////////////////////////////////////////////////////////////////////////////////////////
/// additional inputs for PTM type LRGBG ///
//////////////////////////////////////////////////////////////////////////////////////////

uniform sampler2D textureGSpecular;

uniform float scaleSpecular[3];
uniform float biasSpecular[3];
uniform float ks;
uniform int gChannel;

//////////////////////////////////////////////////////////////////////////////////////////
/// transform inputs ///
//////////////////////////////////////////////////////////////////////////////////////////

#ifdef TRNSFRM_TANGENT
  varying vec3 vNormalModel;
  varying vec3 vTangentModel;
  mat4 model2TangentMat;
#endif

#ifdef TRNSFRM_MODEL
  // not yet implemented
#endif

//////////////////////////////////////////////////////////////////////////////////////////
/// include statements for rti.js glsl prepreprocessor ///
//////////////////////////////////////////////////////////////////////////////////////////

!# include utils

//////////////////////////////////////////////////////////////////////////////////////////
/// main ///
//////////////////////////////////////////////////////////////////////////////////////////

void main(void) {

  vec3 color = vec3(0.0, 0.0, 0.0);


  #ifdef TILED_UV
    vec2 vUVLocal = vUV*numTiles - tileIndices;
  #else
    vec2 vUVLocal = vUV;
  #endif

  #ifdef CONTENT_LIMITS
    if (!isInsideUVLimits(vUV, contentLimitsU, contentLimitsV)) {
      discard;
    }
  #endif

  #ifdef TRNSFRM_TANGENT
    model2TangentMat = createModel2TangentMatrix(vTangentModel,vNormalModel);
  #endif

  #ifdef TRNSFRM_MODEL
    // not yet implemented
  #endif

  float aCoeffs[6];
  calcCoefficients(vUVLocal, texture012, texture345, scale, bias, aCoeffs);

  // read in specular coeff 'g' from user specified channel.
  float g = calcSpecularCoefficient(vUVLocal, textureGSpecular, gChannel, scaleSpecular, biasSpecular);

  vec3 gRGB = vec3(g);

  bool maxDirError;
  vec3 N = calcN(aCoeffs, g, maxDirError);
  vec3 Ndebug = N;
  if (N.z <= 0.0) {
    N = vec3(0.0, 0.0, 1.0);
  }

  vec3 diffuseRGB;
  if (useDiffuseColor > 0) {
    diffuseRGB = texture2D(textureRGB, vUVLocal).xyz;
  } else {
    diffuseRGB = vec3(0.5, 0.5, 0.5);
  }

  // for gl_FrontFacing issue on Touchbar MBPs
  vec3 fdx = dFdx(position_view.xyz);
  vec3 fdy = dFdy(position_view.xyz);
  vec3 faceNormal = normalize(cross(fdx,fdy));
  vec3 viewDir = vec3(0.0, 0.0, -1.0);

	// TODO: merge with other debug vals
	float HPTM_z_debug = 1.0;
  float lDirPTM_z_debug = 1.0;
  float lum_debug = 1.0;
  #if NUM_DIR_LIGHTS > 0

  // directional lights
  for (int l = 0; l < NUM_DIR_LIGHTS; l++) {

    // TODO: move to vShader, cpu?
    vec3 lightDir_world = viewMatrixTranspose * directionalLights[l].direction;
    lightDir_world = normalize(lightDir_world);

    vec3 lDirPTM = transform2PTM(lightDir_world);

    vec3 vDir = vec3( 0.0, 0.0, 1.0);
    vec3 H = normalize(lightDir_world + vDir);

    vec3 HPTM = transform2PTM(H);

    // if (!gl_FrontFacing) { // broken on Touchbar MBPs
    // if (gl_FrontFacing == false) { // fix a
    if (dot(viewDir, faceNormal) > 0.0) { // fix b

      // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      //return;
      lDirPTM.z = -lDirPTM.z;
      HPTM.z = -HPTM.z;
    }
    float nDotHPTM = dot(N,HPTM);
    if (useFlatNormalSpecular > 0) {
      nDotHPTM = dot(vec3(0.0, 0.0, 1.0),HPTM);
    }

    float lWeights[6];
    calcLWeights(lDirPTM,lWeights);

    // evaluate ptm polynomial
    float lum = calcLuminance(aCoeffs, lWeights);
    lum_debug = min(lum, lum_debug);
    lum = max(lum, 0.0); // we do not want lum < 0.0

    if (lDirPTM.z >= 0.0) {
    // if (dot(lDirPTM,N) >= 0.0) {

      float angleLDirSurface = PI_2 - acos(dot(lDirPTM,N));
      if (useFlatNormalEaseOut > 0) {
        angleLDirSurface = PI_2 - acos(dot(lDirPTM,vec3(0.0, 0.0, 1.0)));
      }
      float easeOutLum = 1.0;
      if (useEaseOutLum > 0) {
        easeOutLum = smoothstep(-PI_4, PI_4, angleLDirSurface)*2.0 - 1.0;
      }

      if (renderFuncIndex == 0) { // Malzbender
        color += directionalLights[l].color * lum * (easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotHPTM,0.0),alpha));
      } else if (renderFuncIndex == 1) { // Truvis
        color += directionalLights[l].color * (lum*easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotHPTM,0.0),alpha));
      } else if (renderFuncIndex == 2) { // Malzbender alt
        color += directionalLights[l].color * easeOutLum*lum * (kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotHPTM,0.0),alpha));
      }
    }

    HPTM_z_debug = min(HPTM.z, HPTM_z_debug);
    lDirPTM_z_debug = min(lDirPTM.z, lDirPTM_z_debug);
  }

	#endif

	#if NUM_POINT_LIGHTS > 0

  // point lights
  float H_point_PTM_z_debug = 1.0;
  float lDir_point_PTM_z_debug = 1.0;
  float lum_point_debug = 1.0;
  for (int l = 0; l < NUM_POINT_LIGHTS; l++) {

    // TODO: move to vShader, cpu?
    vec4 lightPos_world = viewMatrixInverse * vec4(pointLights[l].position, 1.0);
    // TODO: not necessary (under reasonable assumptions about view matrix?)
    lightPos_world = lightPos_world / lightPos_world.w;

    vec3 lDir_point = normalize(lightPos_world.xyz - position_world);
    vec3 lDir_point_PTM = transform2PTM(lDir_point);
    vec3 vDir_point = normalize(cameraPosition - position_world);
    vec3 H_point = normalize(lDir_point + vDir_point);
    vec3 H_point_PTM = transform2PTM(H_point);

//    if (!gl_FrontFacing) {
    if (dot(viewDir, faceNormal) > 0.0) { // fix b

      // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      //return;
      lDir_point_PTM.z = -lDir_point_PTM.z;
      H_point_PTM.z = -H_point_PTM.z;
    }
    float nDotH_point_PTM = dot(N,H_point_PTM);
    if (useFlatNormalSpecular > 0) {
      nDotH_point_PTM = dot(vec3(0.0, 0.0, 1.0),H_point_PTM);
    }

    float l_point_Weights[6];
    calcLWeights(lDir_point_PTM,l_point_Weights);

    // evaluate ptm polynomial
    float lum_point = calcLuminance(aCoeffs, l_point_Weights);
    lum_point_debug = min(lum_point, lum_point_debug);
    lum_point = max(lum_point, 0.0); // we do not want lum < 0.0

    if (lDir_point_PTM.z >= 0.0) {
    // if (dot(lDir_point_PTM,N) >= 0.0) {

      float angleLDir_point_Surface = PI_2 - acos(dot(lDir_point_PTM,N));
      if (useFlatNormalEaseOut > 0) {
        angleLDir_point_Surface = PI_2 - acos(dot(lDir_point_PTM,vec3(0.0, 0.0, 1.0)));
      }
      float easeOutLum = 1.0;
      if (useEaseOutLum > 0) {
        easeOutLum = smoothstep(-PI_4, PI_4, angleLDir_point_Surface)*2.0 - 1.0;
      }

      if (renderFuncIndex == 0) { // Malzbender
        color += pointLights[l].color * lum_point * (easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_point_PTM,0.0),alpha));
      } else if (renderFuncIndex == 1) { // Truvis
        color += pointLights[l].color * (lum_point*easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_point_PTM,0.0),alpha));
      } else if (renderFuncIndex == 2) { // Malzbender alt
        color += pointLights[l].color * easeOutLum*lum_point * (kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_point_PTM,0.0),alpha));
      }
    }

    H_point_PTM_z_debug = min(H_point_PTM.z, H_point_PTM_z_debug);
    lDir_point_PTM_z_debug = min(lDir_point_PTM.z, lDir_point_PTM_z_debug);
  }

	#endif

	#if NUM_SPOT_LIGHTS > 0

  // spot lights
  float H_spot_PTM_z_debug = 1.0;
  float lDir_spot_PTM_z_debug = 1.0;
  float lum_spot_debug = 1.0;
  for (int l = 0; l < NUM_SPOT_LIGHTS; l++) {

    // TODO: move to vShader, cpu?
    vec4 lightPos_world = viewMatrixInverse * vec4(spotLights[l].position, 1.0);
    // TODO: not necessary (under reasonable assumptions about view matrix?)
    lightPos_world = lightPos_world / lightPos_world.w;

    vec3 lDir_spot = normalize(lightPos_world.xyz - position_world);
    vec3 lDir_spot_PTM = transform2PTM(lDir_spot);
    vec3 vDir_spot = normalize(cameraPosition - position_world);
    vec3 H_spot = normalize(lDir_spot + vDir_spot);
    vec3 H_spot_PTM = transform2PTM(H_spot);

    // TODO: move to vShader, cpu?
    vec3 spotDir_world = viewMatrixTranspose * spotLights[l].direction;
    spotDir_world = normalize(spotDir_world);

    float angle2SpotDir = dot(spotDir_world, lDir_spot);
    if (angle2SpotDir > spotLights[l].coneCos) {

//   if (!gl_FrontFacing) {
   if (dot(viewDir, faceNormal) > 0.0) { // fix b

      // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      //return;
      lDir_spot_PTM.z = -lDir_spot_PTM.z;
      H_spot_PTM.z = -H_spot_PTM.z;
    }
    float nDotH_spot_PTM = dot(N,H_spot_PTM);
    if (useFlatNormalSpecular > 0) {
      nDotH_spot_PTM = dot(vec3(0.0, 0.0, 1.0),H_spot_PTM);
    }

    float l_spot_Weights[6];
    calcLWeights(lDir_spot_PTM,l_spot_Weights);

    // evaluate ptm polynomial
    float lum_spot = calcLuminance(aCoeffs, l_spot_Weights);
    lum_spot_debug = min(lum_spot, lum_spot_debug);
    lum_spot = max(lum_spot, 0.0); // we do not want lum < 0.0

    if (lDir_spot_PTM.z >= 0.0) {
    // if (dot(lDir_spot_PTM,N) >= 0.0) {

      float angleLDir_spot_Surface = PI_2 - acos(dot(lDir_spot_PTM,N));
      if (useFlatNormalEaseOut > 0) {
        angleLDir_spot_Surface = PI_2 - acos(dot(lDir_spot_PTM,vec3(0.0, 0.0, 1.0)));
      }
      float easeOutLum = 1.0;
      if (useEaseOutLum > 0) {
        easeOutLum = smoothstep(-PI_4, PI_4, angleLDir_spot_Surface)*2.0 - 1.0;
      }

      float penumbraFactor = smoothstep(spotLights[l].coneCos, spotLights[l].penumbraCos, angle2SpotDir);

      if (renderFuncIndex == 0) { // Malzbender
        color += penumbraFactor * spotLights[l].color * lum_spot * (easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_spot_PTM,0.0),alpha));
      } else if (renderFuncIndex == 1) { // Truvis
        color += penumbraFactor * spotLights[l].color * (lum_spot*easeOutLum*kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_spot_PTM,0.0),alpha));
      } else if (renderFuncIndex == 2) { // Malzbender alt
        color += penumbraFactor * spotLights[l].color * easeOutLum*lum_spot * (kd*diffuseRGB + kRGBs*(ks_flat+ks*gRGB)*pow(max(nDotH_spot_PTM,0.0),alpha));
      }
    }

    }

    H_spot_PTM_z_debug = min(H_spot_PTM.z, H_spot_PTM_z_debug);
    lDir_spot_PTM_z_debug = min(lDir_spot_PTM.z, lDir_spot_PTM_z_debug);
  }

	#endif

  color += ambientLightColor * diffuseRGB * 0.3; // MAGIC_VALUE



  color = k * kRGB * color;

  float opacity = 1.0;
  #ifdef OPACITY_MASK
    opacity = texture2D(textureOpacity, vUVLocal).x;
    float zerotol = 0.1;
    // apply opacity mask
    if (opacity < zerotol) {
      discard;
    }
    color = color * opacity;
    // TODO: premultiply?
  #endif

  if(visualizeErrors > 0){
    showErrors(visualizeErrorsIndex, maxDirError, Ndebug, HPTM_z_debug, lDirPTM_z_debug, lum_debug, color);
  }

//  gl_FragColor = vec4(color, 1.0);
   gl_FragColor = vec4(color, opacity);
}
