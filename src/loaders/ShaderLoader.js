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

import { Log } from '../utils/Log.js';
import { Utils } from '../utils/Utils.js';
import { RTIShader } from '../core/RTIShader.js';
import { ShaderChunk } from '../shaders/ShaderChunk.js';


/**
*
* @class
* @private
*/
function ShaderLoader() {
}

ShaderLoader.prototype.loadShaderModel = function(rtiModel, shaderReference) {
  if (shaderReference) {
    return this.loadFromURLs(shaderReference);
  } else {
    return this.loadFromShaderLib(rtiModel);
  }
}

ShaderLoader.prototype.loadFromShaderLib = function(rtiModel) {
  switch (rtiModel.type) {
    case "LRGB_PTM":
      var vShader = ShaderChunk.LRGB_PTM_VShader;
      var fShader = ShaderChunk.LRGB_PTM_FShader;
      if (fShader.indexOf("!# include utils") > -1) {
        var utilsShader = ShaderChunk.PTM_ShaderUtils;
        fShader = fShader.replace("!# include utils", utilsShader);
      }
      return new RTIShader(vShader, fShader);
    case "LRGBG_PTM":
      var vShader = ShaderChunk.LRGB_PTM_VShader;
      var fShader = ShaderChunk.LRGBG_PTM_FShader;
      if (fShader.indexOf("!# include utils") > -1) {
        var utilsShader = ShaderChunk.PTM_ShaderUtils;
        fShader = fShader.replace("!# include utils", utilsShader);
      }
      return new RTIShader(vShader, fShader);
    default:
      Log.error("ShaderLoader.loadFromShaderLib: Unknown rtiModel type "+rtiModel.type);
      return undefined;
  }
}

ShaderLoader.prototype.loadFromURLs = function(shaderReference) {
  var vShader = "";
  var fShader = "";

  if (shaderReference.vShader) {
    vShader = shaderReference.vShader;
  } else {
    var vShaderRequest = Utils.sendSyncRequest(shaderReference.vShaderURL);
    if (vShaderRequest.status >= 400) {
      Log.error("ShaderLoader.loadShaderModel: Unable to load shader from " + shaderReference.vShaderURL);
      return false;
    }
    vShader = vShaderRequest.responseText;
  }

  if (shaderReference.fShader) {
    fShader = shaderReference.fShader;
  } else {
    var fShaderRequest = Utils.sendSyncRequest(shaderReference.fShaderURL);
    if (fShaderRequest.status >= 400) {
      Log.error("ShaderLoader.loadShaderModel: Unable to load shader from " + shaderReference.fShaderURL);
      return false;
    }
    fShader = fShaderRequest.responseText;
  }

  // compatibility with legacy rti.js shader preprocessor
  if (fShader.indexOf("// !# include utils") > -1) {
    fShader = fShader.replace("// !# include utils", "!# include utils");
  }

  if (shaderReference.utilsShader) {
    var utilsShader = shaderReference.utilsShader;
    fShader = fShader.replace("!# include utils", utilsShader);
  } else {
    if (fShader.indexOf("!# include utils") > -1) {
      var utilsShaderReq = Utils.sendSyncRequest(shaderReference.utilsShaderURL);
      if (utilsShaderReq.status >= 400) {
        Log.error("ShaderLoader.loadShaderModel: Unable to load shader from " + shaderReference.utilsShaderURL);
        return false;
      }
      var utilsShader = utilsShaderReq.responseText;
      fShader = fShader.replace("!# include utils", utilsShader);
    }
  }

  return new RTIShader(vShader, fShader);
}

export { ShaderLoader }
