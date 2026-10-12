import path from "path";
import fs from "fs-extra";
import { execa } from "execa";
import { runStep } from "../utils/runStep.js";

export async function setupHusky({ targetDir, huskyHooks }) {
  await runStep("Setting up Husky hooks...", async () => {
    await fs.ensureDir(path.join(targetDir, ".husky"));

    if (huskyHooks.includes("pre-commit")) {
      const hookPath = path.join(targetDir, ".husky", "pre-commit");
      await fs.outputFile(hookPath, "npx lint-staged\n");
      // husky v9 sets executable bit automatically during init — no chmod needed
    }

    if (huskyHooks.includes("commit-msg")) {
      const hookPath = path.join(targetDir, ".husky", "commit-msg");
      await fs.outputFile(hookPath, "npx --no -- commitlint --edit $1\n");
      // commitlint config — uses conventional commit rules
      await fs.outputFile(
        path.join(targetDir, "commitlint.config.mjs"),
        `export default { extends: ['@commitlint/config-conventional'] }\n`,
      );
    }

    await execa("npx", ["husky"], { cwd: targetDir, stdio: "pipe" });
  });
}
