import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";

import { ignorePatterns } from "./linting-and-formatting-ignore-patterns.ts";

export default defineConfig<OxlintConfig>({
  plugins: ["eslint", "import", "oxc", "oxc", "typescript", "unicorn"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  rules: {
    // Enabled by the categories but we don't want to enforce
    "import/no-unassigned-import": "off",

    // Enabled by the categories but disabled for now, PRs welcome (even if only partial)
    "eslint/block-scoped-var": "off",
    "eslint/no-console": "off",
    "eslint/no-new": "off",
    "eslint/no-shadow": "off",
    "eslint/no-underscore-dangle": "off", // We'll eventually migrate to # (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements)
    "eslint/no-unused-expressions": "off",
    "eslint/no-useless-concat": "off",
    "eslint/no-var": "off",
    "import/no-named-as-default-member": "off",
    "typescript/no-extraneous-class": "off",
    "typescript/no-unsafe-declaration-merging": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/no-instanceof-builtins": "off",
    "unicorn/no-new-array": "off",
    "unicorn/prefer-add-event-listener": "off",

    // Enabled beyond the categories
    "eslint/guard-for-in": "error",
    "eslint/no-array-constructor": "error",
    "eslint/no-empty": "error",
    "eslint/no-fallthrough": "error",
    "eslint/no-regex-spaces": "error",
    "eslint/no-useless-return": "error",
    "eslint/sort-imports": ["error", { ignoreDeclarationSort: true }],
    "eslint/unicode-bom": "error",
    "import/consistent-type-specifier-style": "error",
    "import/no-cycle": "error",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "import/no-named-default": "error",
    "typescript/array-type": "error",
    "typescript/explicit-member-accessibility": "error",
    "typescript/no-import-type-side-effects": "error",
    "typescript/no-non-null-asserted-nullish-coalescing": "error",
    "typescript/non-nullable-type-assertion-style": "error",
    "typescript/only-throw-error": "error",
    "unicorn/no-abusive-eslint-disable": "error",
    "unicorn/no-length-as-slice-end": "error",
    "unicorn/prefer-node-protocol": "error",
    "vitest/consistent-test-it": "error",
    "vitest/no-test-prefixes": "error",
  },
  overrides: [
    {
      files: ["lib/**"],
      rules: {
        "import/no-nodejs-modules": "error",
      },
    },
    {
      files: ["cypress/**", "**/*.test.js", "**/*.test.ts"],
      rules: {
        "eslint/no-unused-expressions": "off",
      },
    },
  ],
  ignorePatterns,
});
