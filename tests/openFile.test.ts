import { describe, expect, it } from "vitest";
import { checkFile, MAX_FILE_BYTES } from "../src/web/openFile";

describe("checkFile", () => {
  it("accepts text and Markdown files whatever the letter case", () => {
    for (const name of ["a.txt", "notes.MD", "post.markdown", "page.mdx"]) {
      expect(checkFile({ name, size: 10 })).toBe("ok");
    }
  });

  it("rejects other types", () => {
    for (const name of ["a.pdf", "photo.png", "txt", "a.txt.exe", "archive.md.zip"]) {
      expect(checkFile({ name, size: 10 })).toBe("type");
    }
  });

  it("rejects a file over 2 MB but takes exactly 2 MB", () => {
    expect(checkFile({ name: "a.txt", size: MAX_FILE_BYTES })).toBe("ok");
    expect(checkFile({ name: "a.txt", size: MAX_FILE_BYTES + 1 })).toBe("size");
  });
});
