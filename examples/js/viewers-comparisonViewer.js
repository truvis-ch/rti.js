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

//// stats
var stats = new Stats();
stats.showPanel( 0 );
//// /stats

function initComparisonViewer() {

  var viewerCont = document.getElementById('viewerCont');
  var viewer = new RTI.RTIComparisonViewer(viewerCont);

  //// stats
  document.body.appendChild( stats.dom );
  requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});
  //// /stats

  var objectLoader = new RTI.ObjectLoader();
  objectLoader.loadRTIViewerConfig(
    "../rtijs-examples-data/configs/viewers-comparisonViewer.json",
    function(viewerConfig) {
      viewer.setSettings(viewerConfig.viewerSettings);
      viewer.setMasterScene(viewerConfig.scene);
      viewer.setRTIObject(0, viewerConfig.scene.rtiObjects[0]);
      viewer.setRTIObject(1, viewerConfig.scene.rtiObjects[1]);
      viewer.startRendering();
    },
    function(message) {
      console.log("ERROR: Could not load viewerConfig "+message);
    }
  );

}
