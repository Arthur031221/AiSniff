import type { Confidence, Hit, Mark, Stats } from "./types";

const CJK = String.raw`[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]`;
const WORD = String.raw`[\p{Script=Latin}\p{N}][\p{Script=Latin}\p{N}'’-]*`;
const UNIT = new RegExp(`${CJK}|${WORD}`, "gu");

const WEIGHT: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Length in units, where one CJK character and one Latin word each count as one. */
export function countUnits(text: string): number {
  return (text.match(UNIT) ?? []).length;
}

export function computeStats(
  text: string,
  hits: Hit[],
  marks: Mark[],
  info: (ruleId: string) => { category: string; confidence: Confidence },
): Stats {
  const visible = new Set(marks.map((m) => m.hit));
  const byCategory: Record<string, number> = {};
  const byConfidence: Record<Confidence, number> = { high: 0, medium: 0, low: 0 };
  let weighted = 0;
  for (const index of visible) {
    const { category, confidence } = info(hits[index].ruleId);
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    byConfidence[confidence]++;
    weighted += WEIGHT[confidence];
  }
  const units = countUnits(text);
  const per1000 = (n: number) => (units === 0 ? 0 : (n / units) * 1000);
  return {
    units,
    hits: visible.size,
    density: per1000(visible.size),
    byCategory,
    byConfidence,
    weightedDensity: per1000(weighted),
  };
}
