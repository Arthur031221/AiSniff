import { describe, expect, it } from "vitest";
import { countUnits, pickText } from "../src/engine";
import { bandFor, isCjkText } from "../src/engine/bands";
import { createSniffer } from "../src/engine/packs";
import { toTraditional } from "../src/engine/s2t";

const sniffer = createSniffer("auto");

describe("toTraditional", () => {
  it("keeps the length so offsets still point into the original text", () => {
    const text = "这个软件的质量很高😀 ok";
    expect(toTraditional(text)).toHaveLength(text.length);
  });

  it("converts Simplified characters one for one", () => {
    expect(toTraditional("总而言之，综上所述")).toBe("總而言之，綜上所述");
  });
});

describe("analyze", () => {
  it("matches Simplified Chinese text and reports offsets in the original", () => {
    const text = "总而言之，这个方案值得推广。";
    const { marks } = sniffer.analyze(text);
    const mark = marks.find((m) => m.ruleId === "zh-TW.closer.summary");
    expect(mark).toBeDefined();
    expect(text.slice(mark!.start, mark!.end)).toBe("总而言之");
  });

  it("does not flag mainland wording written in Simplified characters", () => {
    const { hits } = sniffer.analyze("这个视频的质量很高。");
    expect(hits.find((h) => h.ruleId === "zh-TW.wording.mainland")).toBeUndefined();
  });

  it("flags mainland wording written in Traditional characters", () => {
    const { marks } = sniffer.analyze("這個視頻的質量很高。");
    expect(marks.filter((m) => m.ruleId === "zh-TW.wording.mainland")).toHaveLength(2);
  });

  it("underlines only the capture groups when a rule highlights groups", () => {
    const text =
      "The tool is fast. Additionally, it is cheap. Moreover, it is open. Furthermore, it is small.";
    const marks = sniffer
      .analyze(text)
      .marks.filter((m) => m.ruleId === "en.vocabulary.additionally");
    expect(marks.map((m) => text.slice(m.start, m.end))).toEqual([
      "Additionally",
      "Moreover",
      "Furthermore",
    ]);
  });

  it("lets a stronger rule win an overlap and keeps the loser as also", () => {
    const text = "As an AI language model, I cannot help.";
    const { marks } = sniffer.analyze(text);
    const mark = marks.find((m) => m.start === 0)!;
    expect(mark.ruleId).toBe("en.residue.ai-self");
  });

  it("drops low confidence hits when the floor is raised", () => {
    const text = "Coffee is more than just a drink.";
    expect(sniffer.analyze(text, "low").hits.length).toBeGreaterThan(0);
    expect(sniffer.analyze(text, "medium").hits).toHaveLength(0);
  });

  it("returns no marks for an empty text", () => {
    const a = sniffer.analyze("");
    expect(a.marks).toEqual([]);
    expect(a.stats.density).toBe(0);
  });
});

describe("density", () => {
  it("counts one CJK character or one Latin word as a unit", () => {
    expect(countUnits("Hello world")).toBe(2);
    expect(countUnits("你好世界")).toBe(4);
    expect(countUnits("Use 5 GPUs，好嗎")).toBe(5);
  });

  it("is hits per 1,000 units", () => {
    const text = `${"word ".repeat(98)}Let's dive in.`;
    const { stats } = sniffer.analyze(text);
    expect(stats.units).toBe(101);
    expect(stats.hits).toBe(1);
    expect(stats.density).toBeCloseTo((1 / 101) * 1000, 5);
  });
});

describe("pickText", () => {
  const value = { en: "English", "zh-TW": "繁體" };
  it("uses the exact locale, then zh-TW for any zh, then English", () => {
    expect(pickText(value, "zh-TW")).toBe("繁體");
    expect(pickText(value, "zh-CN")).toBe("繁體");
    expect(pickText(value, "ja")).toBe("English");
  });
});

describe("sources", () => {
  it("links a section anchor only on web references", () => {
    const wp = sniffer.source(sniffer.rule("en.opener.arguing"));
    expect(wp.url).toContain("#Undue_emphasis");
    const list = sniffer.source(sniffer.rule("en.opener.runup"));
    expect(list.url).not.toContain("#");
  });
});

describe("bandFor", () => {
  it("says none when nothing matched", () => {
    expect(
      bandFor(sniffer.analyze("The cat sat on the mat.").stats, "The cat sat on the mat."),
    ).toBe("none");
  });

  it("says many for text packed with patterns and some for a stray hit", () => {
    const packed = "In conclusion, it is important to note that we delve into the tapestry.";
    expect(bandFor(sniffer.analyze(packed).stats, packed)).toBe("many");
    const stray = `${"word ".repeat(500)}. In conclusion, we stop.`;
    expect(bandFor(sniffer.analyze(stray).stats, stray)).toBe("some");
  });

  it("uses the Chinese limit for Chinese text", () => {
    expect(isCjkText("這是一段中文文字")).toBe(true);
    expect(isCjkText("This is English")).toBe(false);
  });
});
