/**
 * Blank out the parts of a Markdown file that are not prose: front matter, fenced code, inline
 * code, HTML comments and link addresses. Every character becomes a space except line breaks, so
 * offsets, line numbers and columns in the original text stay valid.
 */
const blank = (s: string) => s.replace(/[^\r\n]/g, " ");

const FENCE = /^ {0,3}(`{3,}|~{3,})/;

function blankFences(text: string): string {
  const lines = text.split(/(\r?\n)/);
  let open: { char: string; size: number } | null = null;
  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i];
    const m = FENCE.exec(line);
    if (open) {
      const closes =
        m !== null &&
        m[1][0] === open.char &&
        m[1].length >= open.size &&
        line.slice(m[0].length).trim() === "";
      lines[i] = blank(line);
      if (closes) open = null;
    } else if (m && !(m[1][0] === "`" && line.slice(m[0].length).includes("`"))) {
      open = { char: m[1][0], size: m[1].length };
      lines[i] = blank(line);
    }
  }
  return lines.join("");
}

const FRONT_MATTER = /^(?:﻿)?---[ \t]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?=\r?\n|$)/;
const NO_BLANK_LINE = String.raw`(?:(?!\r?\n[ \t]*\r?\n)[\s\S])`;
const INLINE_CODE = new RegExp("(`+)(?!`)" + NO_BLANK_LINE + "*?[^`]\\1(?!`)", "g");
const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/g;
const LINK_TARGET = /\]\([^)\s]*(?:\s+"[^"\n]*")?\)/g;
const BARE_URL = /<?\bhttps?:\/\/[^\s)>\]]*[^\s)>\].,;:!?'\"]>?/g;

export function maskMarkdown(text: string): string {
  let out = text.replace(FRONT_MATTER, blank);
  out = blankFences(out);
  for (const re of [INLINE_CODE, HTML_COMMENT, LINK_TARGET, BARE_URL])
    out = out.replace(re, (m) => (re === LINK_TARGET ? "]" + blank(m.slice(1)) : blank(m)));
  return out;
}

export const isMarkdownFile = (file: string) => /\.(md|markdown|mdx)$/i.test(file);
