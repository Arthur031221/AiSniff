import en from "./i18n/locales/en.json";

export type Key = keyof typeof en;

const modules = import.meta.glob<Record<string, string>>("./i18n/locales/*.json", {
  eager: true,
  import: "default",
});

export const LOCALES = [
  { code: "en", name: "English" },
  { code: "zh-TW", name: "繁體中文" },
  { code: "zh-CN", name: "简体中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt-BR", name: "Português (Brasil)" },
] as const;

const tables = new Map<string, Record<string, string>>();
for (const [path, table] of Object.entries(modules)) {
  tables.set(path.replace(/^.*\/(.+)\.json$/, "$1"), table);
}

let current = "en";

export function currentLocale(): string {
  return current;
}

/** The saved choice, else the browser language when it is supported, else English. */
export function detectLocale(saved: string | null, languages: readonly string[]): string {
  const known = (code: string | null) => LOCALES.find((l) => l.code === code)?.code;
  const fromSaved = known(saved);
  if (fromSaved) return fromSaved;
  for (const tag of languages) {
    const exact = known(tag);
    if (exact) return exact;
    const lang = tag.split("-")[0].toLowerCase();
    if (lang === "zh") return /tw|hk|mo|hant/i.test(tag) ? "zh-TW" : "zh-CN";
    const byLang = LOCALES.find((l) => l.code.split("-")[0] === lang);
    if (byLang) return byLang.code;
  }
  return "en";
}

export function setLocale(code: string): void {
  current = tables.has(code) ? code : "en";
  document.documentElement.lang = current;
}

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  const raw = tables.get(current)?.[key] ?? en[key];
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** Fills every element that carries a data-i18n attribute. */
export function applyStatic(root: ParentNode): void {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n as Key);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-placeholder]")) {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder as Key));
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-label]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nLabel as Key));
    el.setAttribute("title", t(el.dataset.i18nLabel as Key));
  }
}
