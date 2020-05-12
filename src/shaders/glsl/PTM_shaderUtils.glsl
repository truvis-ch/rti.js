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

///////////////////////////////////////////////////////////////////////////////
/// PTM evaluation functions. All vectors assumed to be in PTM coord system ///
///////////////////////////////////////////////////////////////////////////////

vec3 calcMaxDir(in float a[6], out bool error) {
  // see ptm.pdf (Polynomial Texture Maps, Tom Malzbender et al.). Equations 16,17 and 18
  float zerotol = 0.000000001;

  error=false;

  vec3 maxDir;
  float denominator = 4.0*a[0]*a[1] - a[2]*a[2];
  if (abs(denominator) < zerotol) {
    maxDir = vec3(0.0, 0.0, 1.0);
    error = true;
  } else {
    float lu0 = (a[2]*a[4] - 2.0*a[1]*a[3])/denominator;
    float lv0 = (a[2]*a[3] - 2.0*a[0]*a[4])/denominator;
    float sumSquares = lu0*lu0 + lv0*lv0;
    float squareRoot = 0.0;
    if (sumSquares > 1.0){
      squareRoot = sqrt(sumSquares);
      lu0 = lu0/squareRoot;
      lv0 = lv0/squareRoot;
      maxDir = vec3(lu0, lv0, 0.0);
      error = true;
    } else {
      squareRoot = sqrt(1.0 - sumSquares);
      maxDir = vec3(lu0, lv0, squareRoot);
    }
  }
  return maxDir;
}

vec3 calcN(in float a[6], in float glossFactor, out bool error) {
  float zerotol = 0.000000001;
  vec3 maxDir = calcMaxDir(a, error);

  // account for maxDirError?

  vec3 N;
  if (glossFactor > zerotol) {

  #ifdef POLAR_NORMAL
    float thetaN = acos(sqrt(1.0 - maxDir.x*maxDir.x - maxDir.y*maxDir.y)) / 2.0;
    float phiN = atan(maxDir.y, maxDir.x);
    N = vec3(cos(phiN)*sin(thetaN), sin(phiN)*sin(thetaN), cos(thetaN));
  #else
    N = vec3(maxDir.x, maxDir.y, maxDir.z + 1.0);
    N = normalize(N);
  #endif
  } else {
    N = maxDir;
  }
  return N;
}

void calcLWeights(in vec3 lDir, out float lWeights[6]) {
  lWeights[0] = lDir.x * lDir.x;
  lWeights[1] = lDir.y * lDir.y;
  lWeights[2] = lDir.x * lDir.y;
  lWeights[3] = lDir.x;
  lWeights[4] = lDir.y;
  lWeights[5] = 1.0;
}

bool isInsideUVLimits(in vec2 uv, in vec2 uLimits, in vec2 vLimits) {
  return !(uv.x < uLimits.x || uv.x > uLimits.y || uv.y < vLimits.x || uv.y > vLimits.y );
}

void calcCoefficients(in vec2 uv, in sampler2D texture012, in sampler2D texture345, in float scale[6], in float bias[6], out float a[6]) {
  vec3 coeff012 = texture2D(texture012, uv).xyz;
  vec3 coeff345 = texture2D(texture345, uv).xyz;
  a[0] = (coeff012.x - bias[0] / 255.0) * scale[0];
  a[1] = (coeff012.y - bias[1] / 255.0) * scale[1];
  a[2] = (coeff012.z - bias[2] / 255.0) * scale[2];
  a[3] = (coeff345.x - bias[3] / 255.0) * scale[3];
  a[4] = (coeff345.y - bias[4] / 255.0) * scale[4];
  a[5] = (coeff345.z - bias[5] / 255.0) * scale[5];
}

float calcSpecularCoefficient(in vec2 uv, in sampler2D textureGSpecular, in int gChannel, in float scaleSpecular[3], in float biasSpecular[3]) {
  vec3 specularCoeffs = texture2D(textureGSpecular, uv).xyz;
  float g;
  if (gChannel == 0) {
    g = (specularCoeffs.x - biasSpecular[0] / 255.0) * scaleSpecular[0];
    } else if (gChannel == 1) {
    g = (specularCoeffs.y - biasSpecular[1] / 255.0) * scaleSpecular[1];
    } else {
    g = (specularCoeffs.z - biasSpecular[2] / 255.0) * scaleSpecular[2];
  }
  return g;
}

float calcLuminance(in float aCoeffs[6], in float lWeights[6]) {
  float lum =
  (
    aCoeffs[0] * lWeights[0] +
    aCoeffs[1] * lWeights[1] +
    aCoeffs[2] * lWeights[2] +
    aCoeffs[3] * lWeights[3] +
    aCoeffs[4] * lWeights[4] +
    aCoeffs[5] * lWeights[5]
  );
  return lum;
}

///////////////////////////////////////////////////////////////////////////////
/// Coord system transformation functions. ///
///////////////////////////////////////////////////////////////////////////////

// TODO: rename vars
vec3 orient2PTM(in vec3 vWorld, in int orientation, in vec2 mirror) {
  vec3 vMirrored = vec3(vWorld.x, vWorld.y, vWorld.z);
  if (mirror.x > 0.0) {
    vMirrored.x = -vMirrored.x;
  }
  if (mirror.y > 0.0) {
    vMirrored.y = -vMirrored.y;
  }
  vec3 vPTM;
  if (orientation == 0) {
    vPTM.x = vMirrored.x;
    vPTM.y = vMirrored.y;
  } else if (orientation == 1) {
    vPTM.x = vMirrored.y;
    vPTM.y = -vMirrored.x;
  } else if (orientation == 2) {
    vPTM.x = -vMirrored.x;
    vPTM.y = -vMirrored.y;
  } else if (orientation == 3) {
    vPTM.x = -vMirrored.y;
    vPTM.y = vMirrored.x;
  }
  vPTM.z = vMirrored.z;
  return vPTM;
}

#ifdef TRNSFRM_TANGENT
mat4 createModel2TangentMatrix(in vec3 xDirWorld, in vec3 normalGrid) {
  xDirWorld = normalize(xDirWorld);
  normalGrid = normalize(normalGrid);
  vec3 yDirWorld = cross(normalize(- xDirWorld), normalize(normalGrid));
  yDirWorld = normalize(yDirWorld);

 mat4 mat = mat4(  xDirWorld.x, yDirWorld.x, normalGrid.x,  0.0,
  						 		 xDirWorld.y, yDirWorld.y, normalGrid.y,  0.0,
   						 	 	 xDirWorld.z, yDirWorld.z, normalGrid.z,  0.0,
   								 0.0, 0.0, 0.0, 1.0);
  return mat;
}
vec3 model2Tangent(in mat4 model2TangentMat, in vec3 vecWorld) {
  return vec3(model2TangentMat * vec4(vecWorld, 0.0));
}
#endif

vec3 transform2PTM(in vec3 vWorld) {
  vec3 vPTM = vWorld;

  #ifdef TRNSFRM_MODEL
    // not yet implemented
  #endif

  #ifdef TRNSFRM_TANGENT
    vPTM = model2Tangent(model2TangentMat, vPTM);
  #endif

  vPTM = orient2PTM(vPTM, orientation, mirror);

  vPTM = normalize(vPTM);
  return vPTM;
}

///////////////////////////////////////////////////////////////////////////////
/// Utils ///
///////////////////////////////////////////////////////////////////////////////

void showErrors(in int visualizeErrorsIndex, in bool normalError, in vec3 NPTM, in float HPTM_z, in float lDirPTM_z, in float lum, inout vec3 color) {
  vec3 debugColMagenta = vec3(1.0, 0.0, 1.0);
  vec3 debugColCyan = vec3(0.0, 1.0, 1.0);

  if (visualizeErrorsIndex == 0) {
    if (normalError)
      color = debugColMagenta;
  } else if (visualizeErrorsIndex == 1) {
      vec3 falseColor = vec3(NPTM.x, NPTM.y, NPTM.z);
      falseColor = falseColor * 0.5;
      falseColor = falseColor + 0.5;
      color = falseColor;
  } else if (visualizeErrorsIndex == 2) {
    if (NPTM.z <= 0.0) {
      color = debugColMagenta;
      if (NPTM.z < 0.0)
        color = debugColCyan;
    }
  } else if (visualizeErrorsIndex == 3) {
    if (HPTM_z <= 0.0) {
      color = debugColMagenta;
      if (HPTM_z < 0.0)
        color = debugColCyan;
    }
  } else if (visualizeErrorsIndex == 4) {
    if (lDirPTM_z <= 0.0) {
      color = debugColMagenta;
      if (lDirPTM_z < 0.0)
        color = debugColCyan;
    }
  } else if (visualizeErrorsIndex == 5) {
    if (lum <= 0.0) {
      color = debugColMagenta;
      if (lum < 0.0)
        color = debugColCyan;
    }
  } else if (visualizeErrorsIndex == 6) {
    if (color.x <= 0.0 || color.y <= 0.0 || color.z <= 0.0) {
      color = debugColMagenta;
      if (color.x < 0.0 || color.y < 0.0 || color.z < 0.0)
        color = debugColCyan;
    }
  }
}
