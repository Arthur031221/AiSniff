// Measures how the rules separate ChatGPT answers from human answers on HC3 (Guo et al. 2023).
// The corpus is downloaded to a cache folder and is never committed. Usage: npm run eval [-- --cache DIR]
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { countUnits } from "../src/engine";
import { createSniffer } from "../src/engine/packs";

const FILES = {
  en: "https://huggingface.co/datasets/Hello-SimpleAI/HC3/resolve/main/all.jsonl",
  zh: "https://huggingface.co/datasets/Hello-SimpleAI/HC3-Chinese/resolve/main/all.jsonl",
} as const;
type Lang = keyof typeof FILES;

const { values } = parseArgs({
  options: {
    cache: { type: "string", default: join(homedir(), ".cache", "aisniff-hc3") },
    out: { type: "string" },
  },
});
const MIN_UNITS = 30;

interface Row {
  question: string;
  source: string;
  human_answers: string[];
  chatgpt_answers: string[];
}

/** HC3 English comes pre-tokenised ("do n't", "word ."). Undo that so the text reads as typed. */
function detokenize(s: string): string {
  return s
    .replace(/\s+([.,;:!?%)\]])/g, "$1")
    .replace(/([(\[$])\s+/g, "$1")
    .replace(/\s+(n't|'s|'re|'ve|'ll|'d|'m)\b/gi, "$1")
    .replace(/"\s+([^"]*?)\s+"/g, '"$1"');
}

/** Stable 50/50 split by question, so every answer to one question lands on the same side. */
function side(question: string): "dev" | "test" {
  let h = 2166136261;
  for (const ch of question) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  return h % 2 === 0 ? "dev" : "test";
}

async function fetchFile(lang: Lang): Promise<string> {
  mkdirSync(values.cache!, { recursive: true });
  const path = join(values.cache!, `hc3-${lang}.jsonl`);
  if (!existsSync(path)) {
    console.error(`downloading ${FILES[lang]}`);
    const res = await fetch(FILES[lang]);
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    await writeFile(path, Buffer.from(await res.arrayBuffer()));
  }
  return path;
}

function auroc(pos: number[], neg: number[]): number {
  // Probability that a random ChatGPT answer scores above a random human answer, ties count half.
  const all = [...pos.map((v) => [v, 1] as const), ...neg.map((v) => [v, 0] as const)].sort(
    (a, b) => a[0] - b[0],
  );
  let rank = 1;
  let sum = 0;
  for (let i = 0; i < all.length;) {
    let j = i;
    while (j < all.length && all[j][0] === all[i][0]) j++;
    const mid = (rank + rank + (j - i) - 1) / 2;
    for (let k = i; k < j; k++) if (all[k][1] === 1) sum += mid;
    rank += j - i;
    i = j;
  }
  return (sum - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function quantile(a: number[], q: number): number {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
}

interface Score {
  d: number;
  w: number;
  units: number;
  rules: string[];
}

async function run(lang: Lang) {
  const sniffer = createSniffer(lang === "en" ? "en" : "zh-TW");
  const scores: Record<"dev" | "test", Record<"human" | "chatgpt", Map<string, Score[]>>> = {
    dev: { human: new Map(), chatgpt: new Map() },
    test: { human: new Map(), chatgpt: new Map() },
  };
  const rl = createInterface({ input: createReadStream(await fetchFile(lang)) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Row;
    const which = side(row.question);
    for (const [kind, answers] of [
      ["human", row.human_answers],
      ["chatgpt", row.chatgpt_answers],
    ] as const) {
      for (const raw of answers) {
        if (typeof raw !== "string") continue;
        const text = lang === "en" ? detokenize(raw) : raw;
        const units = countUnits(text);
        if (units < MIN_UNITS) continue;
        const a = sniffer.analyze(text);
        const bucket = scores[which][kind];
        const list = bucket.get(row.source) ?? [];
        list.push({
          d: a.stats.density,
          w: a.stats.weightedDensity,
          units,
          rules: a.marks.map((m) => m.ruleId),
        });
        bucket.set(row.source, list);
      }
    }
  }
  return scores;
}

const report: Record<string, unknown> = {};
const lines: string[] = [];
for (const lang of ["en", "zh"] as Lang[]) {
  const sniffer = createSniffer(lang === "en" ? "en" : "zh-TW");
  const s = await run(lang);
  const flat = (w: "dev" | "test", k: "human" | "chatgpt") => [...s[w][k].values()].flat();
  const devHuman = flat("dev", "human").map((x) => x.w);
  const bands = {
    p95: quantile(devHuman, 0.95),
    p99: quantile(devHuman, 0.99),
  };
  const th = flat("test", "human");
  const tc = flat("test", "chatgpt");
  const overall = {
    humanN: th.length,
    chatgptN: tc.length,
    humanMeanDensity: mean(th.map((x) => x.d)),
    chatgptMeanDensity: mean(tc.map((x) => x.d)),
    auroc: auroc(
      tc.map((x) => x.w),
      th.map((x) => x.w),
    ),
    humanFlagged: th.filter((x) => x.rules.length > 0).length / th.length,
    chatgptFlagged: tc.filter((x) => x.rules.length > 0).length / tc.length,
    humanAbove95: th.filter((x) => x.w > bands.p95).length / th.length,
    humanAbove99: th.filter((x) => x.w > bands.p99).length / th.length,
    chatgptAbove95: tc.filter((x) => x.w > bands.p95).length / tc.length,
    chatgptAbove99: tc.filter((x) => x.w > bands.p99).length / tc.length,
  };
  const domains = [...s.test.human.keys()].map((src) => {
    const h = s.test.human.get(src) ?? [];
    const c = s.test.chatgpt.get(src) ?? [];
    return {
      domain: src,
      humanN: h.length,
      chatgptN: c.length,
      humanDensity: mean(h.map((x) => x.d)),
      chatgptDensity: mean(c.map((x) => x.d)),
      auroc:
        h.length && c.length
          ? auroc(
              c.map((x) => x.w),
              h.map((x) => x.w),
            )
          : NaN,
    };
  });
  const unitsOf = (a: Score[]) => a.reduce((n, x) => n + x.units, 0);
  const ruleStats = sniffer.rules.map(({ def }) => {
    const count = (a: Score[]) =>
      a.reduce((n, x) => n + x.rules.filter((r) => r === def.id).length, 0);
    const hc = count(th) / unitsOf(th);
    const cc = count(tc) / unitsOf(tc);
    return {
      id: def.id,
      human: count(th),
      chatgpt: count(tc),
      ratio: hc === 0 ? (cc === 0 ? NaN : Infinity) : cc / hc,
    };
  });
  report[lang] = { bands, overall, domains, rules: ruleStats };

  lines.push(
    `## ${lang === "en" ? "English" : "Chinese (Simplified, matched through the zh-TW pack)"}`,
  );
  lines.push(
    "",
    `Band thresholds from the dev half (weighted density, human answers): p95 ${bands.p95.toFixed(1)}, p99 ${bands.p99.toFixed(1)}`,
    "",
  );
  lines.push(
    `Test half: ${overall.humanN} human and ${overall.chatgptN} ChatGPT answers of ${MIN_UNITS}+ units.`,
    "",
  );
  lines.push("| | Human | ChatGPT |", "|---|---|---|");
  lines.push(
    `| Mean hits per 1,000 units | ${overall.humanMeanDensity.toFixed(1)} | ${overall.chatgptMeanDensity.toFixed(1)} |`,
  );
  lines.push(
    `| Answers with at least one hit | ${(overall.humanFlagged * 100).toFixed(0)}% | ${(overall.chatgptFlagged * 100).toFixed(0)}% |`,
  );
  lines.push(
    `| Answers above the dev p95 band | ${(overall.humanAbove95 * 100).toFixed(0)}% | ${(overall.chatgptAbove95 * 100).toFixed(0)}% |`,
    `| Answers above the dev p99 band | ${(overall.humanAbove99 * 100).toFixed(1)}% | ${(overall.chatgptAbove99 * 100).toFixed(1)}% |`,
  );
  lines.push(
    "",
    `AUROC of weighted density, ChatGPT against human: ${overall.auroc.toFixed(2)}`,
    "",
  );
  lines.push(
    "| Domain | Human n | ChatGPT n | Human density | ChatGPT density | AUROC |",
    "|---|---|---|---|---|---|",
  );
  for (const d of domains)
    lines.push(
      `| ${d.domain} | ${d.humanN} | ${d.chatgptN} | ${d.humanDensity.toFixed(1)} | ${d.chatgptDensity.toFixed(1)} | ${d.auroc.toFixed(2)} |`,
    );
  lines.push("", "| Rule | Hits in human | Hits in ChatGPT | Rate ratio |", "|---|---|---|---|");
  for (const r of ruleStats
    .sort((a, b) => b.chatgpt + b.human - (a.chatgpt + a.human))
    .filter((r) => r.chatgpt + r.human > 0))
    lines.push(
      `| ${r.id} | ${r.human} | ${r.chatgpt} | ${Number.isFinite(r.ratio) ? r.ratio.toFixed(1) : r.ratio > 0 ? "only ChatGPT" : "none"} |`,
    );
  lines.push("");
}
const outPath = values.out ?? "docs/evaluation-data.json";
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(lines.join("\n"));
