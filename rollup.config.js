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


// from three.js @91812f5 https://github.com/mrdoob/three.js/blob/dev/rollup.config.js
function glsl() {

	return {

		transform( code, id ) {

			if ( /\.glsl$/.test( id ) === false ) return;

			var transformedCode = 'export default ' + JSON.stringify(
				code
					.replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
					.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
					.replace( /\n{2,}/g, '\n' ) // # \n+ to \n
			) + ';';
			return {
				code: transformedCode,
				map: { mappings: '' }
			};

		}

	};

}



import resolve from '@rollup/plugin-node-resolve';
import image from 'rollup-plugin-img';
import buble from 'rollup-plugin-buble';

const pkg = require('./package.json');


export default [
	{
		input: 'src/rti.js',
		plugins: [
			image({
	      output: "build/",
	      exclude: 'node_modules/**',
	      include: 'resources/**'
	    }),
	    resolve({
	      jsnext: true
	    }),
	    glsl(),
			buble({
				transforms: {
					arrow: false,
					classes: true
				}
			})
		],
		output: [
			{
				banner: '/* rti.js @version ' + pkg.version + ' */',
				indent: '\t',
				format: 'umd',
				name: 'RTI',
				file: 'build/rti.js'
			}
		]
	},
	{
		input: 'src/rti.js',
		plugins: [
			image({
				output: "build/",
				exclude: 'node_modules/**',
				include: 'resources/**'
			}),
			resolve({
				jsnext: true
			}),
			glsl()
		],
		output: [
			{
				banner: '/* rti.js @version ' + pkg.version + ' */',
				indent: '\t',
	      format: 'es',
	      file: 'build/rti.module.js'
			}
		]
	}
];
