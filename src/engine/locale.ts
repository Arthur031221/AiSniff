import type { Localized } from "./types";

/** zh-CN reads zh-TW text before English, every other locale falls back to English. */
export function pickText(value: Localized, locale: string): string {
  if (value[locale]) return value[locale];
  const lang = locale.split("-")[0];
  if (lang === "zh") return value["zh-TW"] ?? value.en;
  return value[lang] ?? value.en;
}
