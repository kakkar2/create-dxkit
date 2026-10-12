import path from "path";
import fs from "fs-extra";
import { runStep } from "../utils/runStep.js";
import { logger } from "../utils/logger.js";

const PRETTIER_CONFIGS = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
];

export async function setupPrettier(targetDir) {
  await runStep("Adding Prettier config...", async () => {
    const existing = await Promise.all(
      PRETTIER_CONFIGS.map((f) => fs.pathExists(path.join(targetDir, f))),
    );

    // .prettierrc — framework agnostic
    if (!existing.some(Boolean)) {
      await fs.writeJson(
        path.join(targetDir, ".prettierrc"),
        {
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
          printWidth: 100,
          plugins: ["@trivago/prettier-plugin-sort-imports"],
          importOrder: ["<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
          importOrderSeparation: true,
          importOrderSortSpecifiers: true,
        },
        { spaces: 2 },
      );
    }

    // .prettierignore
    await fs.outputFile(
      path.join(targetDir, ".prettierignore"),
      `node_modules\ndist\nbuild\n.next\n.cache\ncoverage\n`,
    );

    // extend existing ESLint config if found — supports both legacy and flat config
    const eslintLegacy = path.join(targetDir, ".eslintrc.json");
    const eslintFlat = path.join(targetDir, "eslint.config.mjs");

    if (await fs.pathExists(eslintLegacy)) {
      const eslint = await fs.readJson(eslintLegacy);
      eslint.extends = [...new Set([...(eslint.extends || []), "prettier"])];
      await fs.writeJson(eslintLegacy, eslint, { spaces: 2 });
    } else if (await fs.pathExists(eslintFlat)) {
      logger.warn(
        "Flat ESLint config found. Add eslint-config-prettier to it manually.",
      );
    }
  });
}
