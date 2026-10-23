import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./style.css";
import { bandFor, isCjkText, MANY_ABOVE } from "../engine/bands";
import { createSniffer } from "../engine/packs";
import { pickText } from "../engine";
import type { Analysis, Confidence, Mark } from "../engine";
import { MarkedEditor } from "./editor";
import { renderPng } from "./exportImage";
import { fixFor } from "./fix";
import { applyStatic, currentLocale, detectLocale, LOCALES, setLocale, t } from "./i18n";
import { checkFile } from "./openFile";
import { Popover } from "./popover";
import { SAMPLE_EN, SAMPLE_ZH } from "./samples";

const sniffer = createSniffer("auto");
const popover = new Popover();
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(`aisniff.${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(`aisniff.${key}`, value);
    } catch {
      /* private mode: the choice just does not persist */
    }
  },
};

/** The Check text lives in sessionStorage, so a reload keeps it but a closed tab does not. */
const draft = {
  get(): string | null {
    try {
      return sessionStorage.getItem("aisniff.draft");
    } catch {
      return null;
    }
  },
  set(text: string | null): void {
    try {
      if (text === null) sessionStorage.removeItem("aisniff.draft");
      else sessionStorage.setItem("aisniff.draft", text);
    } catch {
      /* private mode or a full quota: the draft just does not survive a reload */
    }
  },
};

let minConfidence: Confidence = "low";

const ruleOf = (mark: Mark) => sniffer.rule(mark.ruleId);
const markClass = (mark: Mark) => `hit ${ruleOf(mark).confidence}`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** The card that explains one mark: rule, hint, optional one-click fix, source. */
function buildCard(pane: Pane, index: number): HTMLElement {
  const mark = pane.analysis.marks[index];
  const rule = ruleOf(mark);
  const locale = currentLocale();
  const card = el("div", "card");

  const head = el("div", "card-head");
  head.append(
    el("span", `badge ${rule.confidence}`, t(`pop.${rule.confidence}`)),
    el("span", "card-cat", pickText(sniffer.categoryLabel(rule.category), locale)),
  );
  card.append(head, el("p", "card-msg", pickText(rule.message, locale)));

  const hint = el("p", "card-hint");
  hint.append(el("strong", "", `${t("pop.hint")}: `), pickText(rule.hint, locale));
  card.append(hint);

  const replacement = fixFor(rule, pane.text.slice(mark.start, mark.end));
  if (replacement !== null) {
    const button = el(
      "button",
      "chip primary",
      replacement === "" ? t("pop.delete") : t("pop.fix", { text: replacement }),
    );
    button.type = "button";
    button.addEventListener("click", () => {
      popover.hide();
      pane.editor.replace(mark.start, mark.end, replacement);
    });
    card.append(button);
  }

  if (mark.also.length) {
    const also = el("p", "card-also");
    also.append(
      el("strong", "", `${t("pop.also")}: `),
      mark.also.map((id) => pickText(sniffer.rule(id).message, locale)).join(" / "),
    );
    card.append(also);
  }

  const source = sniffer.source(rule);
  const link = el("a", "card-source", source.def.title);
  link.href = source.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const foot = el("p", "card-foot");
  foot.append(`${t("pop.source")}: `, link, ` · ${rule.id}`);
  card.append(foot);
  return card;
}

class Pane {
  readonly editor: MarkedEditor;
  text = "";
  analysis: Analysis = sniffer.analyze("");

  constructor(label: string, onChange: () => void) {
    this.editor = new MarkedEditor(label, () => {
      popover.hide();
      this.refresh();
      onChange();
    });
    const area = this.editor.textarea;
    area.addEventListener("mousemove", (e) => {
      const i = this.editor.markAt(e.clientX, e.clientY);
      area.classList.toggle("over-mark", i >= 0);
      if (popover.isPinned) return;
      if (i < 0) return popover.hideSoon();
      popover.show(this.editor.rectOf(i)!, buildCard(this, i), false);
    });
    area.addEventListener("mouseleave", () => popover.hideSoon());
    area.addEventListener("click", (e) => {
      const i = this.editor.markAt(e.clientX, e.clientY);
      if (i < 0) return;
      popover.show(this.editor.rectOf(i)!, buildCard(this, i), true);
      // On a phone the tap also opened the keyboard, which would cover the card.
      if (matchMedia("(pointer: coarse)").matches) area.blur();
    });
  }

  refresh(): void {
    this.text = this.editor.value;
    this.analysis = sniffer.analyze(this.text, minConfidence);
    this.editor.setMarks(this.text, this.analysis.marks, markClass);
  }

  load(text: string): void {
    this.editor.value = text;
    this.refresh();
  }
}

let sampleUntouched = false;
/** True while the box still holds the sample picked for the interface language. */
let defaultSample = false;

const check = new Pane(t("tab.check"), () => {
  sampleUntouched = false;
  defaultSample = false;
  draft.set(check.text);
  renderCheck();
});
const before = new Pane(t("compare.before"), renderCompare);
const after = new Pane(t("compare.after"), renderCompare);

function formatDelta(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function renderMeter(): void {
  const { stats } = check.analysis;
  const empty = stats.units === 0;
  const band = bandFor(stats, check.text);
  const limit = isCjkText(check.text) ? MANY_ABOVE.zh : MANY_ABOVE.en;
  const badge = $("meter-band");
  badge.textContent = empty ? "" : t(`meter.${band}`);
  badge.className = `band ${empty ? "" : band}`;
  $("meter-fill").style.width =
    `${empty ? 0 : Math.min(100, (stats.weightedDensity / (limit * 1.5)) * 100)}%`;
  $("meter-fill").className = empty ? "" : band;
  $("meter-line").textContent = empty
    ? " "
    : t("meter.line", {
        hits: stats.hits,
        units: stats.units,
        density: stats.density.toFixed(1),
      });
}

function renderPanel(): void {
  const body = $("panel-body");
  const { marks, stats } = check.analysis;
  if (stats.units === 0) return void body.replaceChildren(el("p", "panel-empty", t("panel.blank")));
  if (marks.length === 0)
    return void body.replaceChildren(el("p", "panel-empty", t("panel.empty")));

  const groups = new Map<string, number[]>();
  marks.forEach((m, i) => {
    const category = ruleOf(m).category;
    groups.set(category, [...(groups.get(category) ?? []), i]);
  });
  const locale = currentLocale();
  const nodes = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([category, indexes]) => {
      const section = el("section", "group");
      const title = el("h3", "", pickText(sniffer.categoryLabel(category), locale));
      title.append(el("span", "count", String(indexes.length)));
      const list = el("ul");
      for (const i of indexes) {
        const mark = marks[i];
        const rule = ruleOf(mark);
        const item = el("li");
        const button = el("button", "hit-row");
        button.type = "button";
        const snippet = check.text.slice(mark.start, mark.end).replace(/\s+/g, " ");
        button.append(
          el("span", `dot ${rule.confidence}`),
          el("span", "hit-text", snippet.length > 48 ? `${snippet.slice(0, 47)}…` : snippet),
        );
        button.addEventListener("click", () => {
          check.editor.flash(i);
          popover.show(check.editor.rectOf(i)!, buildCard(check, i), true, true);
        });
        item.append(button);
        list.append(item);
      }
      section.append(title, list);
      return section;
    });
  body.replaceChildren(...nodes);
}

function renderCheck(): void {
  renderMeter();
  renderPanel();
}

function paneStat(pane: Pane): string {
  if (pane.analysis.stats.units === 0) return "";
  const band = bandFor(pane.analysis.stats, pane.text);
  return `${pane.analysis.stats.hits} · ${t(`meter.${band}`)}`;
}

function renderCompare(): void {
  $("before-stat").textContent = paneStat(before);
  $("after-stat").textContent = paneStat(after);
  const both = before.analysis.stats.units > 0 && after.analysis.stats.units > 0;
  $("compare-summary").textContent = both
    ? t("compare.summary", {
        before: before.analysis.stats.hits,
        after: after.analysis.stats.hits,
        delta: formatDelta(after.analysis.stats.hits - before.analysis.stats.hits),
      })
    : " ";
}

function renderAll(): void {
  for (const pane of [check, before, after]) pane.refresh();
  renderCheck();
  renderCompare();
}

function retranslate(): void {
  applyStatic(document);
  document.title = `AiSniff · ${t("tagline")}`;
  check.editor.setPlaceholder(t("placeholder"));
  before.editor.setPlaceholder(t("placeholder"));
  after.editor.setPlaceholder(t("placeholder"));
  check.editor.setLabel(t("tab.check"));
  before.editor.setLabel(t("compare.before"));
  after.editor.setLabel(t("compare.after"));
  popover.hide();
  renderCheck();
  renderCompare();
}

function sampleFor(locale: string): string {
  return locale.startsWith("zh") ? SAMPLE_ZH : SAMPLE_EN;
}

function showView(name: "check" | "compare"): void {
  for (const id of ["check", "compare"] as const) {
    $(`view-${id}`).hidden = id !== name;
    $(`tab-${id}`).setAttribute("aria-selected", String(id === name));
    $(`tab-${id}`).tabIndex = id === name ? 0 : -1;
  }
  popover.hide();
  const pane = name === "check" ? [check] : [before, after];
  for (const p of pane) p.refresh();
}

async function exportImage(): Promise<void> {
  const { stats, marks } = check.analysis;
  const band =
    stats.units === 0 ? "" : `${t("meter.title")}: ${t(`meter.${bandFor(stats, check.text)}`)}. `;
  const blob = await renderPng({
    text: check.text,
    marks: marks.map((m) => ({ start: m.start, end: m.end, confidence: ruleOf(m).confidence })),
    title: "AiSniff",
    summary:
      stats.units === 0
        ? "AiSniff"
        : `${band}${t("meter.line", { hits: stats.hits, units: stats.units, density: stats.density.toFixed(1) })}`,
    note: `${t("export.footer")} · arthur031221.github.io/AiSniff`,
  });
  const link = el("a");
  link.href = URL.createObjectURL(blob);
  link.download = "aisniff.png";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function openFile(file: File): Promise<void> {
  const note = $("open-note");
  const problem = checkFile(file);
  note.textContent = problem === "ok" ? "" : t(`open.${problem}`);
  if (problem !== "ok") return;
  const text = (await file.text()).replace(/^\uFEFF/, "");
  check.load(text);
  renderCheck();
  sampleUntouched = false;
  defaultSample = false;
  draft.set(text);
  popover.hide();
  window.scrollTo({ top: 0 });
}

/** Arrow keys, Home and End move between the tabs, and only the selected tab is a tab stop. */
function wireTabs(): void {
  const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
  for (const tab of tabs) {
    tab.addEventListener("keydown", (e) => {
      const at = tabs.indexOf(tab);
      const next =
        e.key === "ArrowRight"
          ? (at + 1) % tabs.length
          : e.key === "ArrowLeft"
            ? (at + tabs.length - 1) % tabs.length
            : e.key === "Home"
              ? 0
              : e.key === "End"
                ? tabs.length - 1
                : -1;
      if (next < 0) return;
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  }
}

function boot(): void {
  $("check-editor").append(check.editor.el);
  $("before-editor").append(before.editor.el);
  $("after-editor").append(after.editor.el);

  const select = $<HTMLSelectElement>("lang");
  select.append(
    ...LOCALES.map((l) => {
      const option = el("option", "", l.name);
      option.value = l.code;
      return option;
    }),
  );
  const locale = detectLocale(store.get("lang"), navigator.languages ?? [navigator.language]);
  setLocale(locale);
  select.value = locale;
  select.addEventListener("change", () => {
    setLocale(select.value);
    store.set("lang", select.value);
    if (defaultSample) check.load(sampleFor(select.value));
    retranslate();
  });

  $("theme").addEventListener("click", () => {
    const root = document.documentElement;
    const dark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  });

  wireTabs();
  $("tab-check").addEventListener("click", () => showView("check"));
  $("tab-compare").addEventListener("click", () => showView("compare"));
  for (const [id, sample] of [
    ["sample-en", SAMPLE_EN],
    ["sample-zh", SAMPLE_ZH],
  ] as const) {
    $(id).addEventListener("click", () => {
      $("open-note").textContent = "";
      check.load(sample);
      renderCheck();
      sampleUntouched = true;
      defaultSample = false;
      draft.set(null);
    });
  }
  const picker = $<HTMLInputElement>("open-input");
  $("open").addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => {
    const file = picker.files?.[0];
    picker.value = "";
    if (file) void openFile(file);
  });
  const dropZone = check.editor.el;
  dropZone.addEventListener("dragover", (e) => {
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
    dropZone.classList.add("dropping");
  });
  for (const type of ["dragleave", "drop"]) {
    dropZone.addEventListener(type, () => dropZone.classList.remove("dropping"));
  }
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    e.preventDefault();
    void openFile(file);
  });
  $("clear").addEventListener("click", () => {
    $("open-note").textContent = "";
    check.load("");
    renderCheck();
    sampleUntouched = false;
    defaultSample = false;
    draft.set("");
    check.editor.textarea.focus();
  });
  $<HTMLSelectElement>("filter").addEventListener("change", (e) => {
    minConfidence = (e.target as HTMLSelectElement).value as Confidence;
    renderAll();
  });
  $("export").addEventListener("click", () => void exportImage());
  $("copy-current").addEventListener("click", () => {
    before.load(check.text);
    after.load(check.text);
    renderCompare();
    after.editor.textarea.focus();
  });
  check.editor.textarea.addEventListener("focus", () => {
    if (sampleUntouched) check.editor.textarea.select();
  });

  const saved = draft.get();
  check.load(saved ?? sampleFor(locale));
  sampleUntouched = saved === null;
  defaultSample = saved === null;
  retranslate();
}

boot();
