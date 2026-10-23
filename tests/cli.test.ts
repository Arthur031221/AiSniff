import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function aisniff(args: string[], input?: string) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "src/cli/main.ts", ...args], {
    input,
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const SAMPLE = "In conclusion, it is not just a tool, it is a movement.\n";

describe("aisniff lint", () => {
  it("reads stdin and prints the rule, the hint and the disclaimer", () => {
    const r = aisniff(["lint"], SAMPLE);
    expect(r.code).toBe(0);
    expect(r.out).toContain("en.closer.in-conclusion");
    expect(r.out).toContain("Hint:");
    expect(r.out).toContain("not authorship");
  });

  it("reads a file and reports the line and column", () => {
    const file = join(mkdtempSync(join(tmpdir(), "aisniff-")), "a.md");
    writeFileSync(file, `Plain line.\n${SAMPLE}`);
    const r = aisniff(["lint", file]);
    expect(r.out).toContain(`${file}:2:1`);
  });

  it("prints JSON with offsets, source and the disclaimer", () => {
    const r = aisniff(["lint", "--format", "json"], SAMPLE);
    const body = JSON.parse(r.out);
    expect(body.disclaimer).toContain("not authorship");
    const first = body.files[0].marks[0];
    expect(first.source.url).toMatch(/^https:\/\//);
    expect(SAMPLE.slice(first.start, first.end)).toBe(first.text);
  });

  it("prints GitHub annotations", () => {
    const r = aisniff(["lint", "--format", "github"], SAMPLE);
    expect(r.out).toMatch(/^::notice file=<stdin>,line=1,col=1,title=en\.closer\.in-conclusion::/);
  });

  it("exits 1 only when density passes --max-density", () => {
    expect(aisniff(["lint", "--max-density", "1000"], SAMPLE).code).toBe(0);
    expect(aisniff(["lint", "--max-density", "5"], SAMPLE).code).toBe(1);
  });

  it("hides weaker rules with --min-confidence", () => {
    const r = aisniff(["lint", "--min-confidence", "high", "--format", "json"], SAMPLE);
    expect(JSON.parse(r.out).files[0].marks).toHaveLength(0);
  });

  it("writes messages in the requested locale", () => {
    const r = aisniff(["lint", "--locale", "zh-TW", "--format", "json"], SAMPLE);
    expect(JSON.parse(r.out).files[0].marks[0].message).toMatch(/[一-鿿]/);
  });

  it("exits 2 on bad usage", () => {
    expect(aisniff(["lint", "--format", "xml"], "x").code).toBe(2);
    expect(aisniff(["lint", "/no/such/file"]).code).toBe(2);
    expect(aisniff(["nope"]).code).toBe(2);
  });
});

describe("aisniff rules and explain", () => {
  it("lists rules of both languages", () => {
    const r = aisniff(["rules"]);
    expect(r.out).toContain("en.opener.runup");
    expect(r.out).toContain("zh-TW.closer.summary");
  });

  it("explains one rule with its source and examples", () => {
    const r = aisniff(["explain", "en.opener.runup"]);
    expect(r.out).toContain("Source:");
    expect(r.out).toContain("Flagged:");
  });

  it("rejects an unknown rule", () => {
    expect(aisniff(["explain", "en.nope"]).code).toBe(2);
  });
});
