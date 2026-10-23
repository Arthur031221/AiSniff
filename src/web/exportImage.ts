import type { Confidence, Mark } from "../engine";

export interface ExportInput {
  text: string;
  marks: Array<Pick<Mark, "start" | "end"> & { confidence: Confidence }>;
  title: string;
  summary: string;
  note: string;
}

const WIDTH = 1200;
const PAD = 72;
const FONT_SIZE = 28;
const LINE = 46;
const FAMILY = `"Inter Variable", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`;
const COLORS: Record<Confidence, { fill: string; line: string }> = {
  high: { fill: "rgba(200,64,43,0.2)", line: "#c8402b" },
  medium: { fill: "rgba(240,138,36,0.22)", line: "#d9741a" },
  low: { fill: "rgba(120,110,90,0.16)", line: "#8a8070" },
};

interface Run {
  text: string;
  start: number;
  x: number;
  y: number;
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const CLOSERS = "，。、！？；：）」』”’》〉】,.!?;:)]";

/** Splits text into pieces that may not break apart: a word, or one CJK character with its closing mark. */
function pieces(text: string): Array<{ text: string; start: number }> {
  const out: Array<{ text: string; start: number }> = [];
  const chars = [...text];
  let offset = 0;
  let i = 0;
  while (i < chars.length) {
    const start = offset;
    let piece = chars[i];
    i++;
    offset += piece.length;
    if (piece === "\n" || /\s/u.test(piece)) {
      out.push({ text: piece, start });
      continue;
    }
    if (CJK.test(piece)) {
      while (i < chars.length && CLOSERS.includes(chars[i])) {
        piece += chars[i];
        offset += chars[i].length;
        i++;
      }
    } else {
      while (i < chars.length && !/\s/u.test(chars[i]) && !CJK.test(chars[i])) {
        piece += chars[i];
        offset += chars[i].length;
        i++;
      }
    }
    out.push({ text: piece, start });
  }
  return out;
}

export async function renderPng(input: ExportInput): Promise<Blob> {
  await document.fonts.load(`${FONT_SIZE}px "Inter Variable"`).catch(() => []);
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `${FONT_SIZE}px ${FAMILY}`;
  const maxX = WIDTH - PAD;

  const runs: Run[] = [];
  let x = PAD;
  let y = 0;
  for (const piece of pieces(input.text)) {
    if (piece.text === "\n") {
      x = PAD;
      y += LINE;
      continue;
    }
    const w = probe.measureText(piece.text).width;
    if (x + w > maxX && x > PAD && !/^\s/u.test(piece.text)) {
      x = PAD;
      y += LINE;
    }
    if (!(x === PAD && /^\s/u.test(piece.text))) runs.push({ ...piece, x, y });
    x += w;
  }
  const bodyHeight = y + LINE;
  const headerH = 120;
  const footerH = 130;
  const height = headerH + bodyHeight + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.fillStyle = "#f6f0e4";
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#2b2622";
  ctx.font = `600 34px "Fraunces Variable", Georgia, serif`;
  ctx.fillText(input.title, PAD, 78);

  ctx.font = `${FONT_SIZE}px ${FAMILY}`;
  const top = headerH;
  for (const run of runs) {
    const end = run.start + run.text.length;
    for (const m of input.marks) {
      if (m.end <= run.start || m.start >= end) continue;
      const from = Math.max(m.start, run.start) - run.start;
      const to = Math.min(m.end, end) - run.start;
      const x1 = run.x + ctx.measureText(run.text.slice(0, from)).width;
      const x2 = run.x + ctx.measureText(run.text.slice(0, to)).width;
      const c = COLORS[m.confidence];
      ctx.fillStyle = c.fill;
      ctx.fillRect(x1, top + run.y - 2, x2 - x1, LINE - 6);
      ctx.fillStyle = c.line;
      ctx.fillRect(x1, top + run.y + LINE - 12, x2 - x1, m.confidence === "high" ? 3 : 2);
    }
  }
  ctx.fillStyle = "#2b2622";
  for (const run of runs) ctx.fillText(run.text, run.x, top + run.y + FONT_SIZE);

  const footTop = headerH + bodyHeight + 24;
  ctx.fillStyle = "rgba(43,38,34,0.25)";
  ctx.fillRect(PAD, footTop, WIDTH - PAD * 2, 1);
  ctx.fillStyle = "#2b2622";
  ctx.font = `600 24px ${FAMILY}`;
  ctx.fillText(input.summary, PAD, footTop + 44);
  ctx.fillStyle = "#6b6258";
  ctx.font = `20px ${FAMILY}`;
  ctx.fillText(input.note, PAD, footTop + 80);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png"),
  );
}
