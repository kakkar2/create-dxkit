import path from "path";
import fs from "fs-extra";
import { logger } from "./logger.js";

// packageManager,
export async function modifyPackageJson(targetDir, features, huskyHooks = []) {
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = await fs.readJson(pkgPath);

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.scripts = pkg.scripts || {};

  // Husky
  if (features.includes("husky")) {
    pkg.devDependencies["husky"] = "^9.1.7";
    pkg.devDependencies["lint-staged"] = "^15.2.0";
    const hasEslint = Boolean(
      pkg.dependencies?.eslint || pkg.devDependencies?.eslint,
    );
    const codeTasks = [
      ...(hasEslint ? ["eslint --fix"] : []),
      ...(features.includes("prettier") ? ["prettier --write"] : []),
    ];
    const lintStaged = { ...(pkg["lint-staged"] || {}) };
    if (codeTasks.length > 0) {
      lintStaged["**/*.{js,jsx,ts,tsx}"] = codeTasks;
    }
    if (features.includes("prettier")) {
      lintStaged["**/*.{json,css,md}"] = ["prettier --write"];
    }
    if (Object.keys(lintStaged).length > 0) pkg["lint-staged"] = lintStaged;
    if (pkg.scripts.prepare && !pkg.scripts.prepare.includes("husky")) {
      pkg.scripts.prepare = `${pkg.scripts.prepare} && husky`;
    } else if (!pkg.scripts.prepare) {
      pkg.scripts.prepare = "husky";
    }

    if (huskyHooks.includes("commit-msg")) {
      pkg.devDependencies["@commitlint/cli"] = "^19.0.0";
      pkg.devDependencies["@commitlint/config-conventional"] = "^19.0.0";
    }
  }

  // release-it
  if (features.includes("release-it")) {
    pkg.devDependencies["release-it"] ??= "^20.2.1";
    pkg.devDependencies["@release-it/conventional-changelog"] ??= "^11.0.1";
    pkg.devDependencies["conventional-changelog-conventionalcommits"] ??=
      "^9.1.0";
    pkg.scripts["release"] ??= "release-it";
    pkg.scripts["release:patch"] ??= "release-it patch";
    pkg.scripts["release:minor"] ??= "release-it minor";
    pkg.scripts["release:major"] ??= "release-it major";
  }

  // Prettier + ESLint
  if (features.includes("prettier")) {
    pkg.devDependencies["prettier"] = "^3.2.0";
    pkg.devDependencies["eslint-config-prettier"] = "^9.1.0";
    pkg.devDependencies["@trivago/prettier-plugin-sort-imports"] = "^4.3.0";
    pkg.scripts["format"] ??= "prettier --write .";
    pkg.scripts["format:check"] ??= "prettier --check .";
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  logger.success("package.json updated");
}
