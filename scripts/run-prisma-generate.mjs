import { spawnSync } from "node:child_process";

const result = spawnSync("prisma", ["generate", "--no-hints"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PRISMA_HIDE_UPDATE_MESSAGE: "1",
  },
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
