import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { generateHeader } from 'vis-dev-utils';
import css from "rollup-plugin-postcss";
import copy from 'rollup-plugin-copy';
import { BABEL_IGNORE_RE } from 'vis-dev-utils';

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
	babelHelpers: 'runtime',
	exclude: BABEL_IGNORE_RE,
};

export default [{
	input: 'lib/bundle-legacy.js',
	output: {
		file: 'dist/vis-timeline-graph2d.esm.js',
		format: 'esm',
		banner,
		sourcemap: true,
		globals: GLOBALS
	},
	plugins: [
		commonjs(),
		nodeResolve({ browser: true }),
		babel(babelConfig),
		css({
			extract: 'vis-timeline-graph2d.css',
			minimize: false,
		}),
		copyStatic
	]
}, {
	input: 'lib/bundle-legacy.js',
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
		nodeResolve({ browser: true }),
		babel(babelConfig),
		terser({
			output: {
				comments: "some"
			}
		}),
		css({
			extract: 'vis-timeline-graph2d.min.css',
			minimize: true,
		}),
		copyStatic
	]
}];
