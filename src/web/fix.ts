import { toTraditional } from "../engine/s2t";
import type { RuleDef } from "../engine";

/** The text to put in place of a match, or null when the rule offers no safe mechanical rewrite. */
export function fixFor(rule: RuleDef, matched: string): string | null {
  const fix = rule.fix;
  if (!fix) return null;
  if ("delete" in fix) return "";
  return fix.map[matched] ?? fix.map[toTraditional(matched)] ?? null;
}
