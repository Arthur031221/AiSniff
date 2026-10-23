import type { Stats } from "./types";

export type Band = "none" | "some" | "many";

/**
 * Weighted hits per 1,000 units above which a text sits higher than 99% of the human answers in the
 * dev half of HC3. Measured with `npm run eval`, see docs/evaluation.md. Rerun it when the rules change.
 */
export const MANY_ABOVE = { en: 8.7, zh: 13.0 } as const;

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

export function isCjkText(text: string): boolean {
  const cjk = (text.match(CJK) ?? []).length;
  return cjk * 2 > text.replace(/\s/g, "").length;
}

/** Three plain words, not a verdict: no hits, some hits, or more than almost all human answers had. */
export function bandFor(stats: Stats, text: string): Band {
  if (stats.hits === 0) return "none";
  const limit = isCjkText(text) ? MANY_ABOVE.zh : MANY_ABOVE.en;
  return stats.weightedDensity > limit ? "many" : "some";
}
