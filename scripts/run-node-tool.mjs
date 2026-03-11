import { spawnSync } from "node:child_process";
import path from "node:path";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Missing command");
  process.exit(1);
}

const preloadPath = path.resolve("scripts/preload-baseline-warning.cjs");
const env = {
  ...process.env,
  BROWSERSLIST_IGNORE_OLD_DATA: "1",
  BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "1",
};

delete env.NO_COLOR;
delete env.FORCE_COLOR;

env.NODE_OPTIONS = [env.NODE_OPTIONS, `--require=${preloadPath}`]
  .filter(Boolean)
  .join(" ");

const result = spawnSync(command, args, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
