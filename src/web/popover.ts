import type { Rect } from "./editor";

/** One floating card, shown on hover and pinned by a click or tap. */
export class Popover {
  readonly el: HTMLElement;
  private pinned = false;
  private timer = 0;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "popover";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.addEventListener("pointerenter", () => window.clearTimeout(this.timer));
    this.el.addEventListener("pointerleave", () => this.hideSoon());
    document.body.append(this.el);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.hide();
    });
    document.addEventListener("pointerdown", (e) => {
      if (!this.el.hidden && !this.el.contains(e.target as Node)) this.hide();
    });
  }

  get isPinned(): boolean {
    return this.pinned;
  }

  show(rect: Rect, content: Node, pin: boolean): void {
    window.clearTimeout(this.timer);
    this.pinned = pin;
    this.el.classList.toggle("pinned", pin);
    this.el.replaceChildren(content);
    this.el.hidden = false;
    const margin = 8;
    const box = this.el.getBoundingClientRect();
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - box.width - margin));
    const below = rect.bottom + margin;
    const top =
      below + box.height > window.innerHeight && rect.top - box.height - margin > 0
        ? rect.top - box.height - margin
        : below;
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }

  hideSoon(): void {
    if (this.pinned) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.hide(), 220);
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.pinned = false;
    this.el.hidden = true;
  }
}
