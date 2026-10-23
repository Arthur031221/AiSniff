import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("../src/web/i18n/locales/", import.meta.url);
const load = (file: string): Record<string, string> =>
  JSON.parse(readFileSync(new URL(file, dir), "utf8"));
const english = load("en.json");

describe("interface locales", () => {
  for (const file of readdirSync(dir).filter((f) => f !== "en.json")) {
    it(`${file} has exactly the English keys, with a value for each`, () => {
      const table = load(file);
      expect(Object.keys(table).sort()).toEqual(Object.keys(english).sort());
      for (const [key, value] of Object.entries(table)) {
        expect(value.trim(), key).not.toBe("");
        const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        expect(placeholders(value), key).toEqual(placeholders(english[key]));
      }
    });
  }
});
