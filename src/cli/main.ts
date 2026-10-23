import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { pickText } from "../engine";
import type { Confidence, Mark, RuleDef } from "../engine";
import { createSniffer } from "../engine/packs";

const VERSION = "0.1.0";
const DISCLAIMER =
  "Measures writing patterns, not authorship. A high density does not show that an AI wrote the text.";
const CONFIDENCES: Confidence[] = ["low", "medium", "high"];

const HELP = `aisniff ${VERSION}
Highlights phrases that read like AI wrote them, with the rule, a source and a rewrite hint.
It reports patterns. It never decides who wrote a text.

Usage
  aisniff lint [files...]      Scan files, or stdin when no file or "-" is given
  aisniff rules                List every rule
  aisniff explain <rule-id>    Show one rule with its examples and source

Options for lint
  --format text|json|github    Output format (default text)
  --min-confidence low|medium|high
                               Hide weaker rules (default low)
  --max-density N              Exit 1 when hits per 1,000 units exceed N
  --lang auto|en|zh-TW         Rule packs to load (default auto)
  --locale CODE                Language of the messages (default en)
  -h, --help                   Show this help
  -v, --version                Show the version

Exit codes
  0 scanned, within the limit   1 --max-density exceeded   2 bad usage
`;

class UsageError extends Error {}

const escapeData = (s: string) =>
  s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProp = (s: string) => escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

type Format = "text" | "json" | "github";

function lineCol(text: string, offset: number): { line: number; col: number } {
  let line = 1;
  let last = -1;
  for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) {
    line++;
    last = i;
  }
  return { line, col: offset - last };
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ");
}

function describe(
  mark: Mark,
  text: string,
  sniffer: ReturnType<typeof createSniffer>,
  locale: string,
) {
  const rule = sniffer.rule(mark.ruleId);
  const { def, url } = sniffer.source(rule);
  return {
    rule: rule.id,
    category: rule.category,
    confidence: rule.confidence,
    start: mark.start,
    end: mark.end,
    ...lineCol(text, mark.start),
    text: text.slice(mark.start, mark.end),
    message: pickText(rule.message, locale),
    hint: pickText(rule.hint, locale),
    source: { title: def.title, url },
    also: mark.also,
  };
}

function readInput(file: string): string {
  try {
    return readFileSync(file === "-" ? 0 : file, "utf8");
  } catch (e) {
    throw new UsageError(`cannot read ${file === "-" ? "stdin" : file}: ${(e as Error).message}`);
  }
}

function lint(args: string[]): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      format: { type: "string", default: "text" },
      "min-confidence": { type: "string", default: "low" },
      "max-density": { type: "string" },
      lang: { type: "string", default: "auto" },
      locale: { type: "string", default: "en" },
    },
  });
  const format = values.format as Format;
  if (!["text", "json", "github"].includes(format))
    throw new UsageError(`unknown --format ${format}`);
  const floor = values["min-confidence"] as Confidence;
  if (!CONFIDENCES.includes(floor)) throw new UsageError(`unknown --min-confidence ${floor}`);
  const lang = values.lang as "auto" | "en" | "zh-TW";
  if (!["auto", "en", "zh-TW"].includes(lang)) throw new UsageError(`unknown --lang ${lang}`);
  const limit = values["max-density"] === undefined ? undefined : Number(values["max-density"]);
  if (limit !== undefined && !Number.isFinite(limit))
    throw new UsageError("--max-density needs a number");

  const sniffer = createSniffer(lang);
  const files = positionals.length ? positionals : ["-"];
  const reports = files.map((file) => {
    const text = readInput(file);
    const analysis = sniffer.analyze(text, floor);
    const marks = analysis.marks.map((m) => describe(m, text, sniffer, values.locale as string));
    return { file: file === "-" ? "<stdin>" : file, stats: analysis.stats, marks };
  });

  if (format === "json") {
    const body = reports.map((r) => ({ file: r.file, ...r.stats, marks: r.marks }));
    console.log(JSON.stringify({ version: VERSION, disclaimer: DISCLAIMER, files: body }, null, 2));
  } else {
    for (const r of reports) {
      for (const m of r.marks) {
        if (format === "github") {
          const level = m.confidence === "high" ? "warning" : "notice";
          console.log(
            `::${level} file=${escapeProp(r.file)},line=${m.line},col=${m.col},title=${escapeProp(m.rule)}::${escapeData(`${oneLine(m.message)} ${oneLine(m.hint)}`)}`,
          );
        } else {
          console.log(
            `${r.file}:${m.line}:${m.col}  ${m.confidence.padEnd(6)} ${m.rule}  "${oneLine(m.text)}"`,
          );
          console.log(`    ${m.message}`);
          console.log(`    Hint: ${m.hint}`);
        }
      }
      if (format === "text") {
        const s = r.stats;
        console.log(
          `${r.file}: ${s.hits} hits in ${s.units} units, ${s.density.toFixed(1)} per 1,000 (weighted ${s.weightedDensity.toFixed(1)})`,
        );
      }
    }
    if (format === "text") console.log(DISCLAIMER);
  }
  const over = limit !== undefined && reports.some((r) => r.stats.density > limit);
  if (over) console.error(`aisniff: density above the limit of ${limit} per 1,000 units`);
  return over ? 1 : 0;
}

function listRules(args: string[]): number {
  const { values } = parseArgs({
    args,
    options: { lang: { type: "string", default: "auto" }, json: { type: "boolean" } },
  });
  if (!["auto", "en", "zh-TW"].includes(values.lang as string))
    throw new UsageError(`unknown --lang ${values.lang}`);
  const sniffer = createSniffer(values.lang as "auto" | "en" | "zh-TW");
  const rows = sniffer.rules.map((r) => r.def);
  if (values.json) console.log(JSON.stringify(rows, null, 2));
  else
    for (const r of rows) console.log(`${r.id.padEnd(40)} ${r.confidence.padEnd(6)} ${r.category}`);
  return 0;
}

function explain(args: string[]): number {
  const id = args[0];
  if (!id) throw new UsageError("explain needs a rule id, for example en.opener.runup");
  const sniffer = createSniffer("auto");
  let rule: RuleDef;
  try {
    rule = sniffer.rule(id);
  } catch {
    throw new UsageError(`unknown rule ${id}. Run "aisniff rules" for the list`);
  }
  const { def, url } = sniffer.source(rule);
  console.log(`${rule.id}  (${rule.confidence}, ${rule.category})`);
  console.log(`\n${rule.message.en}\nHint: ${rule.hint.en}`);
  console.log(`\nSource: ${def.title}\n        ${url}`);
  console.log("\nFlagged:");
  for (const e of rule.examples.flag) console.log(`  ${oneLine(e)}`);
  console.log("Left alone:");
  for (const e of rule.examples.pass) console.log(`  ${oneLine(e)}`);
  return 0;
}

export function main(argv: string[]): number {
  const [cmd, ...rest] = argv;
  try {
    if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
      console.log(HELP);
      return 0;
    }
    if (cmd === "-v" || cmd === "--version") {
      console.log(VERSION);
      return 0;
    }
    if (cmd === "lint") return lint(rest);
    if (cmd === "rules") return listRules(rest);
    if (cmd === "explain") return explain(rest);
    throw new UsageError(`unknown command ${cmd}`);
  } catch (e) {
    if (e instanceof UsageError || (e as { code?: string }).code?.startsWith("ERR_PARSE_ARGS")) {
      console.error(`aisniff: ${(e as Error).message}\nRun "aisniff --help" for usage.`);
      return 2;
    }
    throw e;
  }
}

process.exitCode = main(process.argv.slice(2));
