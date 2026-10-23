import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const MAIN = join(process.cwd(), "src/cli/main.ts");
const TSX = pathToFileURL(join(process.cwd(), "node_modules/tsx/dist/loader.mjs")).href;

function aisniff(args: string[], input?: string, cwd?: string) {
  const r = spawnSync(process.execPath, ["--import", TSX, MAIN, ...args], {
    input,
    cwd,
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

  it("gates on the weighted density with --max-weighted-density", () => {
    expect(aisniff(["lint", "--max-weighted-density", "1000"], SAMPLE).code).toBe(0);
    const r = aisniff(["lint", "--max-weighted-density", "200"], SAMPLE);
    expect(r.code).toBe(1);
    expect(r.err).toContain("weighted density");
    expect(aisniff(["lint", "--max-weighted-density", "x"], SAMPLE).code).toBe(2);
    expect(aisniff(["lint", "--max-density", ""], SAMPLE).code).toBe(2);
  });

  it("hides weaker rules with --min-confidence", () => {
    const r = aisniff(["lint", "--min-confidence", "high", "--format", "json"], SAMPLE);
    expect(JSON.parse(r.out).files[0].marks).toHaveLength(0);
  });

  it("writes messages in the requested locale", () => {
    const r = aisniff(["lint", "--locale", "zh-TW", "--format", "json"], SAMPLE);
    expect(JSON.parse(r.out).files[0].marks[0].message).toMatch(/[一-鿿]/);
  });

  it("skips a rule or a dotted prefix with --disable", () => {
    const hits = (...flags: string[]) =>
      JSON.parse(aisniff(["lint", "--format", "json", ...flags], SAMPLE).out).files[0].marks.map(
        (m: { rule: string }) => m.rule,
      );
    expect(hits()).toContain("en.closer.in-conclusion");
    expect(hits("--disable", "en.closer.in-conclusion")).not.toContain("en.closer.in-conclusion");
    expect(hits("--disable", "en.closer")).not.toContain("en.closer.in-conclusion");
    expect(hits("--disable", "en", "--disable", "common")).toHaveLength(0);
  });

  it("matches --disable prefixes on a dot boundary and rejects unknown ones", () => {
    expect(aisniff(["lint", "--disable", "en.clos"], SAMPLE).code).toBe(2);
    expect(aisniff(["lint", "--disable", "en.nope"], SAMPLE).code).toBe(2);
  });

  it("scans a folder recursively, in order, and skips other files", () => {
    const dir = mkdtempSync(join(tmpdir(), "aisniff-dir-"));
    mkdirSync(join(dir, "sub"));
    mkdirSync(join(dir, "node_modules"));
    mkdirSync(join(dir, ".hidden"));
    writeFileSync(join(dir, "b.md"), SAMPLE);
    writeFileSync(join(dir, "a.txt"), SAMPLE);
    writeFileSync(join(dir, "sub", "c.mdx"), SAMPLE);
    writeFileSync(join(dir, "code.ts"), SAMPLE);
    writeFileSync(join(dir, "node_modules", "d.md"), SAMPLE);
    writeFileSync(join(dir, ".hidden", "e.md"), SAMPLE);
    const r = aisniff(["lint", "--format", "json", dir]);
    expect(r.code).toBe(0);
    const files = JSON.parse(r.out).files.map((f: { file: string }) =>
      f.file.slice(dir.length + 1),
    );
    expect(files).toEqual(["a.txt", "b.md", "sub/c.mdx"]);
  });

  it("exits 2 for a folder with no text files", () => {
    const dir = mkdtempSync(join(tmpdir(), "aisniff-empty-"));
    writeFileSync(join(dir, "code.ts"), SAMPLE);
    const r = aisniff(["lint", dir]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("no .md");
  });

  it("reports the version from package.json", () => {
    const version = JSON.parse(readFileSync("package.json", "utf8")).version;
    expect(aisniff(["--version"]).out.trim()).toBe(version);
  });

  it("exits 2 on bad usage", () => {
    expect(aisniff(["lint", "--format", "xml"], "x").code).toBe(2);
    expect(aisniff(["lint", "/no/such/file"]).code).toBe(2);
    expect(aisniff(["nope"]).code).toBe(2);
  });
});

describe("aisniff lint on Markdown", () => {
  const doc =
    "---\ntitle: delve\n---\nPlain line.\n\n```\n" + SAMPLE + "```\n\nUse `delve` here.\n" + SAMPLE;
  const write = (name: string) => {
    const file = join(mkdtempSync(join(tmpdir(), "aisniff-")), name);
    writeFileSync(file, doc);
    return file;
  };

  it("skips code, front matter and inline code in .md files and keeps line numbers", () => {
    const file = write("a.md");
    const r = aisniff(["lint", "--format", "json", file]);
    const marks = JSON.parse(r.out).files[0].marks;
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.every((m: { line: number }) => m.line === 11)).toBe(true);
    expect(
      marks.every(
        (m: { text: string; start: number }) =>
          doc.slice(m.start, m.start + m.text.length) === m.text,
      ),
    ).toBe(true);
  });

  it("scans .txt files and stdin as plain text", () => {
    const hits = (r: { out: string }) => JSON.parse(r.out).files[0].marks.length;
    const md = hits(aisniff(["lint", "--format", "json", write("a.md")]));
    expect(hits(aisniff(["lint", "--format", "json", write("a.txt")]))).toBeGreaterThan(md);
    expect(hits(aisniff(["lint", "--format", "json"], doc))).toBeGreaterThan(md);
  });

  it("--markdown on masks stdin and --markdown off keeps .md files whole", () => {
    const hits = (r: { out: string }) => JSON.parse(r.out).files[0].marks.length;
    const md = hits(aisniff(["lint", "--format", "json", write("a.md")]));
    expect(hits(aisniff(["lint", "--format", "json", "--markdown", "on"], doc))).toBe(md);
    expect(
      hits(aisniff(["lint", "--format", "json", "--markdown", "off", write("a.md")])),
    ).toBeGreaterThan(md);
    expect(aisniff(["lint", "--markdown", "maybe"], "x").code).toBe(2);
  });
});

describe("aisniff config file", () => {
  const project = (config: unknown, sub = "docs") => {
    const root = mkdtempSync(join(tmpdir(), "aisniff-cfg-"));
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, sub), { recursive: true });
    writeFileSync(
      join(root, ".aisniff.json"),
      typeof config === "string" ? config : JSON.stringify(config),
    );
    return { root, sub: join(root, sub) };
  };
  const ids = (r: { out: string }) =>
    JSON.parse(r.out).files[0].marks.map((m: { rule: string }) => m.rule);

  it("is found from a subfolder and applies its options", () => {
    const { sub } = project({ disable: ["en.closer"], format: "json" });
    const r = aisniff(["lint"], SAMPLE, sub);
    expect(ids(r)).not.toContain("en.closer.in-conclusion");
    expect(ids(r).length).toBeGreaterThan(0);
  });

  it("gives way to flags, merges disable lists and can be switched off", () => {
    const { root } = project({ format: "json", disable: ["en.closer"], maxDensity: 1000 });
    const flagged = aisniff(["lint", "--max-density", "1"], SAMPLE, root);
    expect(flagged.code).toBe(1);
    const merged = aisniff(["lint", "--disable", "en.promo"], SAMPLE, root);
    expect(ids(merged)).not.toContain("en.closer.in-conclusion");
    const off = aisniff(["lint", "--no-config", "--format", "json"], SAMPLE, root);
    expect(ids(off)).toContain("en.closer.in-conclusion");
    const text = aisniff(["lint", "--format", "text"], SAMPLE, root);
    expect(text.out).toContain("not authorship");
  });

  it("reads a gate from the file and exits 1", () => {
    const { root } = project({ maxWeightedDensity: 1 });
    expect(aisniff(["lint"], SAMPLE, root).code).toBe(1);
    expect(aisniff(["lint", "--config", join(root, ".aisniff.json")], SAMPLE).code).toBe(1);
  });

  it("stops looking at the repository root", () => {
    const { root } = project({ maxDensity: 0 });
    const inner = join(root, "inner");
    mkdirSync(join(inner, ".git"), { recursive: true });
    expect(aisniff(["lint"], SAMPLE, inner).code).toBe(0);
  });

  it("rejects a bad file, an unknown key and a rule that matches nothing", () => {
    for (const bad of [
      "{",
      "[]",
      { nope: 1 },
      { maxDensity: "5" },
      { disable: "en.promo" },
      { disable: ["en.nope"] },
    ]) {
      const { root } = project(bad);
      expect(aisniff(["lint"], SAMPLE, root).code).toBe(2);
      expect(aisniff(["lint", "--no-config"], SAMPLE, root).code).toBe(0);
    }
    expect(aisniff(["lint", "--config", "/no/such.json"], SAMPLE).code).toBe(2);
    expect(aisniff(["lint", "--config", "a.json", "--no-config"], SAMPLE).code).toBe(2);
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
