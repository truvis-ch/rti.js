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
* @constant {int} LOG_LEVEVEL - set log behaviour.
* <br> -1: off, 0: error, 1: warn, 2: info, 3: debug, 4: trace
* @default 1
* @private
*/
var LOG_LEVEVEL = 1;

/**
*
* @namespace
* @private
*/
var Log = {
};

Log.error = function(message) {
  Log.log(0, "ERROR: "+message);
}

Log.warn = function(message) {
  Log.log(1, "WARNING: "+message);
}

Log.info = function(message) {
  Log.log(2, message);
}

Log.debug = function(message) {
  Log.log(3, message);
}

Log.trace = function(message) {
  Log.log(4, message);
}

Log.log = function(level, message) {
  if (level <= LOG_LEVEVEL) {
    console.log(message);
  }
}

export { Log }
