const js = require("@eslint/js");
const jsdoc = require("eslint-plugin-jsdoc");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    plugins: {
      jsdoc,
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.node,
        ...globals.mocha,
      },
    },
    rules: {
      complexity: [2, 55],
      "max-statements": [2, 115],
      "no-unreachable": 1,
      "no-useless-escape": 0,
      "no-console": 0,
      "guard-for-in": 1,
      "jsdoc/require-jsdoc": ["error", {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
        },
      }],
      "jsdoc/require-returns-type": "error",
      "jsdoc/require-returns": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
    },
  },
];
