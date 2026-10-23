import { describe, expect, it } from "vitest";
import { createSniffer, META, PACKS } from "../src/engine/packs";

const sniffer = createSniffer("auto");
const lookup = new Map(sniffer.rules.map((r) => [r.def.id, r]));

describe("every rule", () => {
  for (const { def } of sniffer.rules) {
    describe(def.id, () => {
      const only = (text: string) =>
        sniffer.analyze(text).hits.filter((h) => h.ruleId === def.id).length;

      it("flags each flag example", () => {
        expect(def.examples.flag.length).toBeGreaterThan(0);
        for (const text of def.examples.flag) {
          expect(only(text), text).toBeGreaterThan(0);
        }
      });

      it("leaves each pass example alone", () => {
        expect(def.examples.pass.length).toBeGreaterThan(0);
        for (const text of def.examples.pass) {
          expect(only(text), text).toBe(0);
        }
      });
    });
  }
});

describe("rule metadata", () => {
  it("has unique ids that start with their pack name", () => {
    const seen = new Set<string>();
    for (const [name, pack] of Object.entries(PACKS)) {
      for (const r of pack.rules) {
        expect(r.id.startsWith(`${name}.`), r.id).toBe(true);
        expect(seen.has(r.id), r.id).toBe(false);
        seen.add(r.id);
      }
    }
  });

  it("cites a known source and category for every rule", () => {
    for (const { def } of lookup.values()) {
      expect(META.sources[def.source.id], def.id).toBeDefined();
      expect(META.categories[def.category], def.id).toBeDefined();
    }
  });

  it("gives every rule an English and a Traditional Chinese message and hint", () => {
    for (const { def } of lookup.values()) {
      for (const field of [def.message, def.hint]) {
        expect(field.en.length, def.id).toBeGreaterThan(10);
        expect(field["zh-TW"].length, def.id).toBeGreaterThan(4);
      }
    }
  });

  it("uses no dash punctuation in prose", () => {
    for (const { def } of lookup.values()) {
      for (const text of [def.message.en, def.hint.en]) {
        expect(text, def.id).not.toMatch(/ [—–] |—/);
      }
    }
  });
});
