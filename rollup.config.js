import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';
import genHeader from './lib/header';
import css from 'rollup-plugin-css-porter';
import copy from 'rollup-plugin-copy';

const GLOBALS = {
	moment: "moment",
	hammerjs: "hammerjs"
};

const copyStatic = copy({
	targets: [
		{ src: 'types', dest: 'dist' }
	]
})

export default [{
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.esm.js',
		format: 'esm',
		banner: genHeader('timeline-graph2d'),
		sourcemap: true,
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		}),
		copyStatic
	],
}, {
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.min.js',
		name: 'vis',
		extend: true,
		exports: 'named',
		format: 'umd',
		banner: genHeader('timeline-graph2d'),
		sourcemap: true,
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(),
		minify({ comments: false }),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		}),
		copyStatic
	]
}];
