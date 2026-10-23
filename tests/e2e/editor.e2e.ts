import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";

let server: PreviewServer;
let browser: Browser;
let page: Page;
let url = "";

beforeAll(async () => {
  server = await preview({
    build: { outDir: "dist/web" },
    preview: { port: 0, host: "127.0.0.1" },
  });
  url = server.resolvedUrls!.local[0];
  browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    headless: true,
  });
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.httpServer.close(resolve));
});

beforeEach(async () => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    acceptDownloads: true,
  });
  page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector("mark");
});

async function hoverFirst(selector: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

async function typeText(text: string): Promise<void> {
  const area = page.getByRole("textbox", { name: "Check" });
  await area.fill(text);
}

describe("editor", () => {
  it("loads a sample with highlights and a meter that says patterns, not authorship", async () => {
    expect(await page.locator("mark").count()).toBeGreaterThan(5);
    expect(await page.locator("#meter-band").textContent()).toBe("Many patterns");
    expect(await page.locator("#meter").textContent()).toContain(
      "does not show who wrote the text",
    );
  });

  it("shows the rule, hint and source on hover", async () => {
    await hoverFirst("mark");
    const popover = page.locator(".popover");
    await popover.waitFor({ state: "visible" });
    const text = (await popover.textContent()) ?? "";
    expect(text).toContain("Rewrite hint");
    expect(text).toMatch(/en\.\w+\.[\w-]+/);
    const href = await popover.locator("a.card-source").getAttribute("href");
    expect(href).toMatch(/^https:\/\//);
  });

  it("pins the card on click and closes it with Escape", async () => {
    await hoverFirst("mark");
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(400);
    expect(await page.locator(".popover").isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    expect(await page.locator(".popover").isVisible()).toBe(false);
  });

  it("applies a one-click fix and the hit disappears", async () => {
    await typeText("It's important to note that the build passed.");
    expect(await page.locator("mark").count()).toBe(1);
    await hoverFirst("mark");
    await page.locator(".popover button.chip").click();
    await page.waitForFunction(() => document.querySelectorAll("mark").length === 0);
    const value = await page.getByRole("textbox", { name: "Check" }).inputValue();
    expect(value.trim()).toBe("the build passed.");
  });

  it("undoes a one-click fix with Ctrl+Z", async () => {
    await typeText("It's important to note that the build passed.");
    await hoverFirst("mark");
    await page.locator(".popover button.chip").click();
    await page.waitForFunction(() => document.querySelectorAll("mark").length === 0);
    await page.keyboard.press("Control+z");
    await page.waitForFunction(() => document.querySelectorAll("mark").length === 1);
  });

  it("says nothing was found without claiming a person wrote it", async () => {
    await typeText("The build passed on Tuesday. I reran it twice to be sure.");
    expect(await page.locator("mark").count()).toBe(0);
    expect(await page.locator("#meter-band").textContent()).toBe("No patterns found");
    expect(await page.locator("#panel-body").textContent()).toContain("does not prove");
  });

  it("groups hits by type in the side panel and jumps to a hit", async () => {
    expect(await page.locator(".group").count()).toBeGreaterThan(3);
    await page.locator(".hit-row").first().click();
    await page.locator(".popover").waitFor({ state: "visible" });
  });

  it("checks Traditional Chinese and Simplified Chinese text", async () => {
    await typeText("在當今快速發展的數位時代，這一點至關重要。");
    expect(await page.locator("mark").count()).toBeGreaterThanOrEqual(2);
    await typeText("在当今快速发展的数字时代，这一点至关重要。");
    expect(await page.locator("mark").count()).toBeGreaterThanOrEqual(2);
  });

  it("filters by confidence", async () => {
    const all = await page.locator("mark").count();
    await page.getByRole("combobox", { name: "Confidence" }).selectOption("high");
    expect(await page.locator("mark").count()).toBeLessThan(all);
  });

  it("switches language and keeps the rule explanations readable", async () => {
    await page.getByRole("combobox", { name: "Language" }).selectOption("zh-TW");
    expect(await page.locator("h1").textContent()).toContain("貼上文字");
    expect(await page.locator("html").getAttribute("lang")).toBe("zh-TW");
    await hoverFirst("mark");
    expect(await page.locator(".popover").textContent()).toContain("改寫建議");
    await page.getByRole("combobox", { name: /Language|語言/ }).selectOption("ja");
    expect(await page.locator("#meter-band").textContent()).toBe("多くのパターン");
  });

  it("compares a before and an after text", async () => {
    await page.getByRole("tab", { name: "Compare" }).click();
    await page.getByRole("button", { name: "Start from the current text" }).click();
    await page.getByRole("textbox", { name: "After" }).fill("The build passed.");
    const summary = (await page.locator("#compare-summary").textContent()) ?? "";
    expect(summary).toMatch(/hits before, 0 hits after/);
    expect(summary).toContain("-");
    expect(await page.locator("#view-compare").textContent()).toContain(
      "does not mean the text is more human",
    );
  });

  it("exports the annotated text as a PNG", async () => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Save as image" }).click(),
    ]);
    const path = await download.path();
    const bytes = readFileSync(path);
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(bytes.length).toBeGreaterThan(20_000);
  });

  it("does not overflow a phone screen", async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  it("keeps the whole text visible after the screen is resized", async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(200);
    const { client, scroll } = await page
      .locator(".editor-input")
      .first()
      .evaluate((el) => ({
        client: el.clientHeight,
        scroll: el.scrollHeight,
      }));
    expect(scroll).toBeLessThanOrEqual(client);
  });

  it("makes no network request after the page has loaded", async () => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await typeText("In conclusion, the future looks bright.");
    await page.getByRole("button", { name: "Save as image" }).click();
    await page.waitForTimeout(300);
    expect(requests.filter((u) => !u.startsWith("blob:") && !u.startsWith("data:"))).toEqual([]);
  });
});
