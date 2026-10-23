import type { CompiledRule, PackDef, RuleDef } from "./types";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseSource(phrase: string): string {
  const body = escapeRegex(phrase).replace(/['’]/g, "['’]");
  const first = [...phrase][0];
  const last = [...phrase].at(-1)!;
  // Only Latin edges need a boundary. A Chinese phrase may sit inside a longer sentence.
  const before = /[A-Za-z0-9]/.test(first) ? "(?<![\\p{L}\\p{N}])" : "";
  const after = /[A-Za-z0-9]/.test(last) ? "(?![\\p{L}\\p{N}])" : "";
  return `${before}${body}${after}`;
}

export function expandDefs(source: string, defs: Record<string, string> = {}): string {
  return source.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = defs[name];
    if (value === undefined) throw new Error(`unknown def {{${name}}}`);
    return value;
  });
}

export function compileRule(def: RuleDef, pack: PackDef): CompiledRule {
  let source: string;
  if (def.phrases?.length) {
    const sorted = [...def.phrases].sort((a, b) => b.length - a.length);
    source = sorted.map(phraseSource).join("|");
  } else if (def.regex) {
    source = expandDefs(def.regex, pack.defs);
  } else {
    throw new Error(`rule ${def.id} has neither phrases nor regex`);
  }
  const flags = new Set(`${def.flags ?? ""}gud`.split(""));
  if (def.phrases) flags.add("i");
  try {
    return { def, pack: pack.pack, re: new RegExp(source, [...flags].join("")) };
  } catch (e) {
    throw new Error(`rule ${def.id}: ${(e as Error).message}`);
  }
}

export function compilePack(pack: PackDef): CompiledRule[] {
  return pack.rules.map((r) => compileRule(r, pack));
}
