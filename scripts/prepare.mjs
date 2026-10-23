// Runs on `npm install` from a git checkout so `npx github:Arthur031221/AiSniff` gets a built CLI.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync("dist/cli/aisniff.mjs") && existsSync("vite.cli.config.ts")) {
  const r = spawnSync("npx", ["vite", "build", "-c", "vite.cli.config.ts"], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
