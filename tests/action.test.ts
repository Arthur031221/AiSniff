import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = process.cwd();
const TSX = pathToFileURL(join(ROOT, "node_modules/tsx/dist/loader.mjs")).href;

// A stand-in for the built CLI that runs the source, so the test needs no build.
const dir = mkdtempSync(join(tmpdir(), "aisniff-action-"));
const bin = join(dir, "aisniff");
writeFileSync(
  bin,
  `#!/usr/bin/env bash\nexec "${process.execPath}" --import "${TSX}" "${join(ROOT, "src/cli/main.ts")}" "$@"\n`,
);
chmodSync(bin, 0o755);
writeFileSync(join(dir, "draft.md"), "In conclusion, it is not just a tool, it is a movement.\n");
writeFileSync(
  join(dir, "other.md"),
  "In today's fast-paced world, we are committed to excellence.\n",
);

function run(inputs: Record<string, string>) {
  const env: Record<string, string> = { PATH: process.env.PATH ?? "", AISNIFF_BIN: bin };
  for (const [k, v] of Object.entries(inputs)) env[`INPUT_${k}`] = v;
  const r = spawnSync(join(ROOT, "scripts/action.sh"), { cwd: dir, env, encoding: "utf8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe("action.yml and scripts/action.sh", () => {
  it("scans the current folder and prints annotations by default", () => {
    const r = run({});
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^::(notice|warning) file=.*draft\.md,line=1/m);
    expect(r.out).toContain("other.md");
  });

  it("scans only the paths it is given, and expands globs", () => {
    const one = run({ PATHS: "draft.md" });
    expect(one.out).toContain("draft.md");
    expect(one.out).not.toContain("other.md");
    const glob = run({ PATHS: "d*.md\nother.md" });
    expect(glob.out).toContain("draft.md");
    expect(glob.out).toContain("other.md");
  });

  it("fails the step when a density limit is passed", () => {
    expect(run({ PATHS: "draft.md", MAX_DENSITY: "1" }).code).toBe(1);
    expect(run({ PATHS: "draft.md", MAX_DENSITY: "100000" }).code).toBe(0);
    expect(run({ PATHS: "draft.md", MAX_WEIGHTED_DENSITY: "1" }).code).toBe(1);
  });

  it("passes format, confidence, disable and lang through", () => {
    const json = run({ PATHS: "draft.md", FORMAT: "json" });
    expect(JSON.parse(json.out).files[0].file).toBe("draft.md");
    const all = run({ PATHS: "draft.md", FORMAT: "text" });
    expect(all.out).toContain("en.closer.in-conclusion");
    const off = run({ PATHS: "draft.md", FORMAT: "text", DISABLE: "en.closer, en.promo" });
    expect(off.out).not.toContain("en.closer.in-conclusion");
    expect(run({ PATHS: "draft.md", MIN_CONFIDENCE: "high" }).code).toBe(0);
    expect(run({ PATHS: "draft.md", LANG: "en" }).code).toBe(0);
  });

  it("reports bad input as a usage error", () => {
    expect(run({ PATHS: "draft.md", DISABLE: "no.such.rule" }).code).toBe(2);
    expect(run({ PATHS: "missing.md" }).code).toBe(2);
  });

  it("declares every input the script reads", () => {
    const action = parse(readFileSync(join(ROOT, "action.yml"), "utf8"));
    const script = readFileSync(join(ROOT, "scripts/action.sh"), "utf8");
    const read = new Set([...script.matchAll(/INPUT_([A-Z_]+)/g)].map((m) => m[1]));
    const declared = Object.keys(action.inputs).map((n) => n.toUpperCase().replaceAll("-", "_"));
    expect([...read].sort()).toEqual(declared.sort());
    const env = action.runs.steps.find((s: { env?: object }) => s.env).env;
    for (const name of declared) expect(env).toHaveProperty(`INPUT_${name}`);
    expect(action.runs.using).toBe("composite");
  });
});
