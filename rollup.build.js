import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import nodeBuiltins from "rollup-plugin-node-builtins";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import { generateHeader } from "vis-dev-utils";
import css from "rollup-plugin-css-porter";
import copy from "rollup-plugin-copy";
import packageJSON from "./package.json";

const banner = generateHeader({ name: "vis-timeline and vis-graph2d" });

const globals = {
  "vis-data": "vis",
  moment: "moment"
};

const external = Object.keys(packageJSON.peerDependencies);

const commonOutputESM = {
  banner,
  format: "esm",
  globals,
  sourcemap: true
};
const commonOutputUMD = {
  banner,
  exports: "named",
  extend: true,
  format: "umd",
  globals,
  name: "vis",
  sourcemap: true
};

const commonPlugins = [
  copy({
    targets: [
      {
        src: "dev-lib/bundle-esm.js",
        dest: ["peer", "standalone"],
        rename: "index.js"
      },
      {
        src: "dev-lib/bundle-index.js",
        dest: ["peer/esm", "peer/umd", "standalone/esm", "standalone/umd"],
        rename: "index.js"
      }
    ]
  }),
  css({
    dest: "styles/vis-timeline-graph2d.css"
  }),
  commonjs(),
  nodeBuiltins(),
  nodeResolve(),
  babel({
    runtimeHelpers: true
  })
];

export default [
  {
    input: "lib/bundle-standalone.js",
    output: [
      Object.assign({}, commonOutputESM, {
        file: "standalone/esm/vis-timeline-graph2d.js"
      }),
      Object.assign({}, commonOutputUMD, {
        file: "standalone/umd/vis-timeline-graph2d.js"
      })
    ],
    plugins: commonPlugins
  },
  {
    input: "lib/bundle-standalone.js",
    output: [
      Object.assign({}, commonOutputESM, {
        file: "standalone/esm/vis-timeline-graph2d.min.js"
      }),
      Object.assign({}, commonOutputUMD, {
        file: "standalone/umd/vis-timeline-graph2d.min.js"
      })
    ],
    plugins: [].concat(commonPlugins, [
      terser({
        output: {
          comments: "some"
        }
      })
    ])
  },

  {
    external,
    input: "lib/bundle-peer.js",
    output: [
      Object.assign({}, commonOutputESM, {
        file: "peer/esm/vis-timeline-graph2d.js"
      }),
      Object.assign({}, commonOutputUMD, {
        file: "peer/umd/vis-timeline-graph2d.js"
      })
    ],
    plugins: commonPlugins
  },
  {
    external,
    input: "lib/bundle-peer.js",
    output: [
      Object.assign({}, commonOutputESM, {
        file: "peer/esm/vis-timeline-graph2d.min.js"
      }),
      Object.assign({}, commonOutputUMD, {
        file: "peer/umd/vis-timeline-graph2d.min.js"
      })
    ],
    plugins: [].concat(commonPlugins, [
      terser({
        output: {
          comments: "some"
        }
      })
    ])
  }
];
