import type { Rect } from "./editor";

/** One floating card, shown on hover and pinned by a click or tap. */
export class Popover {
  readonly el: HTMLElement;
  private pinned = false;
  private timer = 0;
  private opener: HTMLElement | null = null;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "popover";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.tabIndex = -1;
    this.el.addEventListener("pointerenter", () => window.clearTimeout(this.timer));
    this.el.addEventListener("pointerleave", () => this.hideSoon());
    document.body.append(this.el);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || this.el.hidden) return;
      const restore = this.el.contains(document.activeElement) ? this.opener : null;
      this.hide();
      restore?.focus({ preventScroll: true });
    });
    let width = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      this.hide();
    });
    document.addEventListener("pointerdown", (e) => {
      if (!this.el.hidden && !this.el.contains(e.target as Node)) this.hide();
    });
  }

  get isPinned(): boolean {
    return this.pinned;
  }

  /**
   * Places the card under a viewport rect, in page coordinates, so it scrolls with its mark.
   * `focus` moves keyboard focus into the card and lets Escape hand it back.
   */
  show(rect: Rect, content: Node, pin: boolean, focus = false): void {
    window.clearTimeout(this.timer);
    this.opener = focus ? (document.activeElement as HTMLElement | null) : null;
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
    this.el.style.left = `${left + window.scrollX}px`;
    this.el.style.top = `${top + window.scrollY}px`;
    if (focus) this.el.focus({ preventScroll: true });
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
