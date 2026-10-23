import { S2T_PAIRS } from "./s2t-table";

const TABLE = new Map<string, string>();
for (let i = 0; i < S2T_PAIRS.length; i += 2) TABLE.set(S2T_PAIRS[i], S2T_PAIRS[i + 1]);

/** Converts Simplified Chinese characters to Traditional one for one, so offsets stay valid. */
export function toTraditional(text: string): string {
  let out = "";
  let changed = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const t = TABLE.get(ch);
    if (t) changed = true;
    out += t ?? ch;
  }
  return changed ? out : text;
}
