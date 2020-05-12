# rti.js #

A JavaScript library enabling the rendering of RTI data in a web browser.

Built with JavaScript, ThreeJS and WebGL.


## Contents ##

- [Getting Started](#gettingStarted)

- [Examples](#Examples)

- [Build instructions](#Building)

- [License](#License)


## <a name="gettingStarted"></a> Getting Started ##

### Preparation ###

Before we start, you will need some RTI data to display.
You can either export your own scene from [Authentica Creator](https://truvis.ch/authentica-creator/) using the 'Export for Web' feature or download example data from [here](https://storage.googleapis.com/truvis-downloads-data/rtijs/rtijs-example-data.zip).


You will also need a running web server to load and display the RTI texture data in a browser. Loading textures via the 'file://' protocol will fail due to the browsers' same origin policy. For more information, see [here](https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally).



### Installation ###

Download the [rti.js library](https://storage.googleapis.com/truvis-downloads-data/rtijs/rti.js.zip) and unpack the .zip file.
Include the library in your HTML code like this:

```HTML
  <script src="/libs/rti.js/rti.min.js"></script>
```



### Minimal HTML, CSS and JavaScript Example ###

You should then be able to integrate the rti.js viewer into your HTML with the following code:

```HTML
<!DOCTYPE html>
<html>
<head>

  <script src="/libs/rti.js/rti.min.js"></script>

</head>
<body>

  <div id="viewerContainer" style="width: 400px; height: 400px;"></div>

  <script>

    var viewer = new RTI.RTIViewer( document.getElementById("viewerContainer") );

    viewer.loadConfig(
      "/data/myWebExport/fullConfig.json",
      function() {
        console.log("Success: loaded and applied configuration.");
        viewer.startRendering();
      },
      function(message) {
        console.log("ERROR: Could not load or set configuration. " + message);
      }
    );

  </script>

</body>
</html>
```


## <a name="Examples"></a> Examples ##

Have a look at the source code of the examples included folder *examples*.

We are working on providing more examples and documentation. Stay tuned!

You can download the example data for reproducing these examples on your own from [here](https://storage.googleapis.com/truvis-downloads-data/rtijs/rtijs-example-data.zip).



## <a name="Building"></a> Build instructions ##

Note: You don't need to build the library yourself, if you just want to use rti.js in your own project. Just follow the instructions under [Getting Started](#gettingStarted) to learn how to instal and use the library.

For building the library yourself from source, follow these instructions:

- Install [node.js](https://nodejs.org/)

- Clone (or download and unzip) rti.js to your file system:
```
git clone https://github.com/truvis-ch/rti.js.git
```

- Go into the rti.js directory:
```
cd rti.js
```

- Install build dependencies:
```
npm install
```

- Run the build script:
```
npm run build
```

You should now be able to find the built library files in the *build/* directory.


## <a name="License"></a> License ##

The rti.js library is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
