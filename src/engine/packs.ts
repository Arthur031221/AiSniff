import { Sniffer } from "./index";
import type { Meta, PackDef } from "./types";
import common from "../../rules/common.json";
import en from "../../rules/en.json";
import zhTW from "../../rules/zh-TW.json";
import meta from "../../rules/meta.json";

export const PACKS = { common, en, "zh-TW": zhTW } as unknown as Record<string, PackDef>;
export const META = meta as unknown as Meta;

/** Packs that apply to a text language. `common` always applies. */
export function packsFor(lang: "en" | "zh-TW" | "auto"): PackDef[] {
  if (lang === "auto") return Object.values(PACKS);
  return [PACKS.common, PACKS[lang]];
}

export function createSniffer(lang: "en" | "zh-TW" | "auto" = "auto"): Sniffer {
  return new Sniffer(packsFor(lang), META);
}
