export type Confidence = "high" | "medium" | "low";

/** Text per locale. `en` is required, other locales fall back through `pickText`. */
export type Localized = { en: string } & Record<string, string>;

export interface SourceDef {
  title: string;
  url: string;
  /** study: peer reviewed. reference: an editorial guide. community-list: a public list kept by a project. */
  kind: "study" | "reference" | "community-list";
  /** Date the page was read when the rule was written. */
  accessed: string;
}

export interface RuleSourceRef {
  id: string;
  /** Section heading or id inside the source, used as the URL fragment when the source is a web page. */
  anchor?: string;
}

export interface RuleDef {
  id: string;
  category: string;
  confidence: Confidence;
  /** Literal phrases. Latin edges match on word boundaries, apostrophes match straight and curly. */
  phrases?: string[];
  /** Regular expression source. `{{name}}` expands to an entry of the pack's `defs`. */
  regex?: string;
  flags?: string;
  /** With `groups`, only the capture groups are underlined, not the whole match. */
  highlight?: "match" | "groups";
  /** The rule fires only when it matches at least this many times in the text. */
  minCount?: number;
  /** Match the text as typed. Without it Simplified Chinese is converted character by character first. */
  raw?: boolean;
  message: Localized;
  hint: Localized;
  /** A safe mechanical rewrite offered as one click. */
  fix?: { delete: true } | { map: Record<string, string> };
  source: RuleSourceRef;
  examples: { flag: string[]; pass: string[] };
}

export interface PackDef {
  pack: string;
  version: string;
  updated: string;
  defs?: Record<string, string>;
  rules: RuleDef[];
}

/** Sources and category labels shared by every pack. */
export interface Meta {
  sources: Record<string, SourceDef>;
  categories: Record<string, Localized>;
}

export interface CompiledRule {
  def: RuleDef;
  pack: string;
  re: RegExp;
}

export interface Hit {
  ruleId: string;
  /** Visible spans of one match. Most rules have one. */
  spans: Array<[number, number]>;
}

export interface Mark {
  start: number;
  end: number;
  hit: number;
  ruleId: string;
  /** Other rules that matched the same words. */
  also: string[];
}

export interface Stats {
  units: number;
  hits: number;
  density: number;
  byCategory: Record<string, number>;
  byConfidence: Record<Confidence, number>;
  /** Weighted hits per 1,000 units, high counts 3, medium 2 and low 1. */
  weightedDensity: number;
}

export interface Analysis {
  hits: Hit[];
  marks: Mark[];
  stats: Stats;
}
