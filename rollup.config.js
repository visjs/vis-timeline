import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import sourcemaps from 'rollup-plugin-sourcemaps';
import babel from 'rollup-plugin-babel';
import { uglify } from "rollup-plugin-uglify";
import banner from 'rollup-plugin-banner';
import genHeader from './lib/header';
import css from 'rollup-plugin-css-porter';

const GLOBALS = {
	moment: "moment",
	hammerjs: "hammerjs"
};

export default [{
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.esm.js',
		format: 'esm',
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(),
		banner(genHeader('timeline-graph2d')),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		}),
	],
}, {
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.min.js',
		name: 'vis',
		exports: 'default',
		format: 'umd',
		globals: GLOBALS,
		sourceMap: true
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(),
		sourcemaps(),
		// uglify(),
		banner(genHeader('timeline-graph2d')),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		})
	]
}];
