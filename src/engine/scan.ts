import { toTraditional } from "./s2t";
import type { Confidence, CompiledRule, Hit, Mark } from "./types";

const RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Finds every match of every rule. Counting rules (`minCount`) drop out when they match too rarely. */
export function findHits(text: string, rules: CompiledRule[]): Hit[] {
  const normalized = toTraditional(text);
  const hits: Hit[] = [];
  for (const rule of rules) {
    const subject = rule.def.raw ? text : normalized;
    const found: Hit[] = [];
    rule.re.lastIndex = 0;
    for (const m of subject.matchAll(rule.re)) {
      if (m[0].length === 0) continue;
      const indices = (m as RegExpMatchArray & { indices: Array<[number, number] | undefined> })
        .indices;
      let spans: Array<[number, number]>;
      if (rule.def.highlight === "groups") {
        spans = indices.slice(1).filter((s): s is [number, number] => !!s && s[1] > s[0]);
        if (!spans.length) continue;
      } else {
        spans = [indices[0]!];
      }
      found.push({ ruleId: rule.def.id, spans });
    }
    if (found.length >= (rule.def.minCount ?? 1)) hits.push(...found);
  }
  return hits;
}

interface Candidate {
  start: number;
  end: number;
  hit: number;
}

/**
 * Chooses the spans to underline. Stronger rules win an overlap, then longer matches, then earlier ones.
 * The losers are kept as `also` on the mark they overlap so no matching rule is hidden.
 */
export function resolveMarks(hits: Hit[], rankOf: (ruleId: string) => Confidence): Mark[] {
  const candidates: Candidate[] = [];
  hits.forEach((hit, index) => {
    for (const [start, end] of hit.spans) candidates.push({ start, end, hit: index });
  });
  candidates.sort(
    (a, b) =>
      RANK[rankOf(hits[b.hit].ruleId)] - RANK[rankOf(hits[a.hit].ruleId)] ||
      b.end - b.start - (a.end - a.start) ||
      a.start - b.start,
  );
  const chosen: Mark[] = [];
  for (const c of candidates) {
    const ruleId = hits[c.hit].ruleId;
    const clash = chosen.find((m) => c.start < m.end && c.end > m.start);
    if (clash) {
      if (clash.ruleId !== ruleId && !clash.also.includes(ruleId)) clash.also.push(ruleId);
      continue;
    }
    chosen.push({ start: c.start, end: c.end, hit: c.hit, ruleId, also: [] });
  }
  return chosen.sort((a, b) => a.start - b.start);
}
