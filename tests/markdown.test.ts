import { describe, expect, it } from "vitest";
import { isMarkdownFile, maskMarkdown } from "../src/engine";

const visible = (s: string) => maskMarkdown(s).replace(/\s+/g, " ").trim();

describe("maskMarkdown", () => {
  it("keeps the length and every line break", () => {
    const text = "---\ntitle: x\n---\nHi `code` there.\r\n```js\nlet a = 1;\n```\nEnd 中文 `字`\n";
    const masked = maskMarkdown(text);
    expect(masked.length).toBe(text.length);
    expect([...masked].map((c) => c === "\n" || c === "\r")).toEqual(
      [...text].map((c) => c === "\n" || c === "\r"),
    );
  });

  it("blanks fenced code with backticks or tildes and an unclosed fence", () => {
    expect(visible("a\n```\ndelve\n```\nb")).toBe("a b");
    expect(visible("a\n~~~py\ndelve\n~~~\nb")).toBe("a b");
    expect(visible("a\n````\n```\ndelve\n```\n````\nb")).toBe("a b");
    expect(visible("a\n```\ndelve\nstill code")).toBe("a");
  });

  it("does not treat a different fence character or a short fence as a close", () => {
    expect(visible("a\n```\nx\n~~~\ny\n```\nb")).toBe("a b");
    expect(visible("a\n````\nx\n```\ny\n````\nb")).toBe("a b");
  });

  it("blanks inline code but leaves a lone backtick alone", () => {
    expect(visible("Use `delve` and ``a`b`` here")).toBe("Use and here");
    expect(visible("It costs 5` and then more")).toBe("It costs 5` and then more");
  });

  it("does not let inline code cross a blank line", () => {
    expect(visible("one ` two\n\nthree ` four")).toBe("one ` two three ` four");
  });

  it("blanks front matter only at the start of the file", () => {
    expect(visible("---\ntitle: delve\n---\nBody")).toBe("Body");
    expect(visible("Body\n---\ntitle: delve\n---\nMore")).toBe("Body --- title: delve --- More");
  });

  it("blanks comments, link addresses and bare URLs but keeps link text", () => {
    expect(visible("See [the guide](https://x.io/delve-in) now <!-- aisniff note --> ok")).toBe(
      "See [the guide] now ok",
    );
    expect(visible("Go to https://x.io/a_b, then <https://y.io/z> end")).toBe("Go to , then end");
  });

  it("recognises Markdown file names", () => {
    expect(isMarkdownFile("a/B.MD")).toBe(true);
    expect(isMarkdownFile("a.mdx")).toBe(true);
    expect(isMarkdownFile("a.txt")).toBe(false);
  });
});
