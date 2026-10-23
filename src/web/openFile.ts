export const MAX_FILE_BYTES = 2 * 1024 * 1024;

const TEXT_FILE = /\.(txt|md|markdown|mdx)$/i;

/** Whether a dropped or chosen file can be read as text, and why not when it cannot. */
export function checkFile(file: { name: string; size: number }): "ok" | "type" | "size" {
  if (!TEXT_FILE.test(file.name)) return "type";
  return file.size > MAX_FILE_BYTES ? "size" : "ok";
}
