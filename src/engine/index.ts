import { compilePack } from "./compile";
import { findHits, resolveMarks } from "./scan";
import { computeStats } from "./stats";
import type {
  Analysis,
  CompiledRule,
  Confidence,
  Localized,
  Meta,
  PackDef,
  RuleDef,
  SourceDef,
} from "./types";

export * from "./types";
export { pickText } from "./locale";
export { countUnits } from "./stats";

export class Sniffer {
  readonly packs: PackDef[];
  readonly meta: Meta;
  readonly rules: CompiledRule[];
  private readonly byId = new Map<string, CompiledRule>();

  constructor(packs: PackDef[], meta: Meta) {
    this.packs = packs;
    this.meta = meta;
    this.rules = packs.flatMap(compilePack);
    for (const r of this.rules) {
      if (this.byId.has(r.def.id)) throw new Error(`duplicate rule id ${r.def.id}`);
      this.byId.set(r.def.id, r);
    }
  }

  rule(id: string): RuleDef {
    const r = this.byId.get(id);
    if (!r) throw new Error(`unknown rule ${id}`);
    return r.def;
  }

  /** The cited source. A section anchor becomes a URL fragment only for web references. */
  source(rule: RuleDef): { def: SourceDef; url: string } {
    const def = this.meta.sources[rule.source.id];
    if (!def) throw new Error(`rule ${rule.id} cites unknown source ${rule.source.id}`);
    const anchor =
      rule.source.anchor && def.kind === "reference"
        ? `#${rule.source.anchor.replace(/ /g, "_")}`
        : "";
    return { def, url: def.url + anchor };
  }

  categoryLabel(category: string): Localized {
    const label = this.meta.categories[category];
    if (!label) throw new Error(`unknown category ${category}`);
    return label;
  }

  /** Rule ids a selector names: one id, or every rule under a dotted prefix such as `en.promo`. */
  select(selector: string): string[] {
    return this.rules
      .map((r) => r.def.id)
      .filter((id) => id === selector || id.startsWith(`${selector}.`));
  }

  analyze(
    text: string,
    minConfidence: Confidence = "low",
    disabled: ReadonlySet<string> = new Set(),
  ): Analysis {
    const order: Confidence[] = ["low", "medium", "high"];
    const floor = order.indexOf(minConfidence);
    const active = this.rules.filter(
      (r) => order.indexOf(r.def.confidence) >= floor && !disabled.has(r.def.id),
    );
    const hits = findHits(text, active);
    const rankOf = (id: string) => this.rule(id).confidence;
    const marks = resolveMarks(hits, rankOf);
    const stats = computeStats(text, hits, marks, (id) => ({
      category: this.rule(id).category,
      confidence: this.rule(id).confidence,
    }));
    return { hits, marks, stats };
  }
}
