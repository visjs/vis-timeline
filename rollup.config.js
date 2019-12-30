import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import {generateHeader} from 'vis-dev-utils';
import css from 'rollup-plugin-css-porter';
import copy from 'rollup-plugin-copy';

const banner = generateHeader({ name: 'vis-timeline and vis-graph2d' });

const GLOBALS = {
	moment: "moment",
	hammerjs: "hammerjs"
};

const copyStatic = copy({
	targets: [
		{ src: 'types', dest: 'dist' }
	]
});

const babelConfig = {
	runtimeHelpers: true
};

export default [{
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.esm.js',
		format: 'esm',
		banner,
		sourcemap: true,
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(babelConfig),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		}),
		copyStatic
	]
}, {
	input: 'index.js',
	output: {
		file: 'dist/vis-timeline-graph2d.min.js',
		name: 'vis',
		extend: true,
		exports: 'named',
		format: 'umd',
		banner,
		sourcemap: true,
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeBuiltins(),
		nodeResolve(),
		babel(babelConfig),
		terser({
                    output: {
                        comments: "some"
                    }
                }),
		css({
			dest: 'dist/vis-timeline-graph2d.css'
		}),
		copyStatic
	]
}];
