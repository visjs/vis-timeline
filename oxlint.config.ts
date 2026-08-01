import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";
import oxlintSharedConfig from "vis-dev-utils/oxlint-shared-config";

import { ignorePatterns } from "./linting-and-formatting-ignore-patterns.ts";

export default defineConfig<OxlintConfig>({
  extends: [oxlintSharedConfig],
  rules: {
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
