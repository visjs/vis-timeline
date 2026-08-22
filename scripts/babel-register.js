"use strict";

// vis-dev-utils dropped its `babel-register` export in v5 (no more
// `@babel/register` peer dependency). This replicates what it used to do:
// untranspiled `esnext` builds of sibling vis-* packages have to be run
// through Babel too, so `node_modules` can't be ignored wholesale.
const { BABEL_IGNORE_RE } = require("vis-dev-utils");

require.extensions[".css"] = function () {};
require("@babel/register")({
  extensions: [".ts", ".js"],
  ignore: [BABEL_IGNORE_RE],
});
