import type { Mark } from "../engine";

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A textarea with a mirrored layer behind it that carries the highlights. */
export class MarkedEditor {
  readonly el: HTMLElement;
  readonly textarea: HTMLTextAreaElement;
  private readonly backdrop: HTMLElement;
  private readonly marks = new Map<number, HTMLElement[]>();

  constructor(
    label: string,
    private readonly onInput: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "editor";
    this.backdrop = document.createElement("div");
    this.backdrop.className = "editor-backdrop";
    this.backdrop.setAttribute("aria-hidden", "true");
    this.textarea = document.createElement("textarea");
    this.textarea.className = "editor-input";
    this.textarea.spellcheck = false;
    this.textarea.setAttribute("aria-label", label);
    this.el.append(this.backdrop, this.textarea);
    let width = 0;
    new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      this.fit();
    }).observe(this.el);
    this.textarea.addEventListener("input", () => {
      this.fit();
      this.onInput();
    });
  }

  get value(): string {
    return this.textarea.value;
  }

  set value(text: string) {
    this.textarea.value = text;
    this.fit();
  }

  setPlaceholder(text: string): void {
    this.textarea.placeholder = text;
  }

  setLabel(text: string): void {
    this.textarea.setAttribute("aria-label", text);
  }

  /** The textarea grows with its text, so the page scrolls and the two layers never drift apart. */
  fit(): void {
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  setMarks(text: string, marks: Mark[], classOf: (mark: Mark) => string): void {
    this.marks.clear();
    const nodes: Node[] = [];
    let at = 0;
    for (const [i, mark] of [...marks.entries()].sort((a, b) => a[1].start - b[1].start)) {
      if (mark.start < at) continue;
      nodes.push(document.createTextNode(text.slice(at, mark.start)));
      const el = document.createElement("mark");
      el.className = classOf(mark);
      el.textContent = text.slice(mark.start, mark.end);
      this.marks.set(i, [el]);
      nodes.push(el);
      at = mark.end;
    }
    nodes.push(document.createTextNode(text.slice(at) + (text.endsWith("\n") ? "​" : "")));
    this.backdrop.replaceChildren(...nodes);
    this.fit();
  }

  /** Index of the mark under a viewport point, or -1. */
  markAt(x: number, y: number): number {
    for (const [i, els] of this.marks) {
      for (const el of els) {
        for (const r of el.getClientRects()) {
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
        }
      }
    }
    return -1;
  }

  rectOf(index: number): Rect | null {
    const el = this.marks.get(index)?.[0];
    if (!el) return null;
    const r = el.getClientRects()[0] ?? el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }

  flash(index: number): void {
    const el = this.marks.get(index)?.[0];
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "auto" });
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  /** Replaces a range through the browser so Undo keeps working. */
  replace(start: number, end: number, text: string): void {
    const area = this.textarea;
    area.focus({ preventScroll: true });
    area.setSelectionRange(start, end);
    if (!document.execCommand("insertText", false, text)) {
      area.setRangeText(text, start, end, "end");
      this.fit();
      this.onInput();
    }
  }
}
