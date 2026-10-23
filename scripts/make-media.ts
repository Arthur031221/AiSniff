// Builds assets/demo.gif by driving the real built site, and assets/social-card.png from an HTML card.
// Needs Chrome (set CHROME), ffmpeg and a built site. Usage: npm run build:web && npm run media
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "playwright";
import { preview } from "vite";
import { createSniffer } from "../src/engine/packs";

const chrome = process.env.CHROME || "google-chrome";
const root = resolve(".");
const assets = join(root, "assets");
mkdirSync(assets, { recursive: true });
copyFileSync(join(root, "public/logo.svg"), join(assets, "logo.svg"));

const TYPED = `In today's fast-paced world, our app is not just a notes tool, it is a game-changer. It's important to note that it boasts a vibrant ecosystem. In conclusion, the future looks bright.`;

async function pause(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

async function hoverMark(page: Page, nth: number, ms: number): Promise<void> {
  const box = await page.locator("mark").nth(nth).boundingBox();
  if (!box) throw new Error(`mark ${nth} not found`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await pause(page, ms);
}

async function recordDemo(): Promise<void> {
  const server = await preview({
    root,
    build: { outDir: "dist/web" },
    preview: { port: 0, host: "127.0.0.1" },
  });
  const dir = mkdtempSync(join(tmpdir(), "aisniff-video-"));
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 660 },
    locale: "en-US",
    colorScheme: "light",
    recordVideo: { dir, size: { width: 1080, height: 660 } },
  });
  const page = await context.newPage();
  // Video frames carry no pointer, so draw one.
  await page.addInitScript(() => {
    addEventListener("DOMContentLoaded", () => {
      const dot = document.createElement("div");
      dot.style.cssText =
        "position:fixed;z-index:99;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#2b2622;border:2px solid #fff;pointer-events:none;left:-20px;top:-20px";
      document.body.append(dot);
      addEventListener("mousemove", (e) => {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
      });
    });
  });
  await page.goto(server.resolvedUrls!.local[0]);
  await page.waitForSelector("mark");
  await page.getByRole("button", { name: "Clear" }).click();
  await page.evaluate(() => scrollTo(0, 250));
  await pause(page, 500);
  await page.getByRole("textbox", { name: "Check" }).pressSequentially(TYPED, { delay: 28 });
  await pause(page, 700);
  await hoverMark(page, 0, 1500);
  await hoverMark(page, 1, 1500);
  await hoverMark(page, 3, 1500);
  await page.mouse.move(40, 40, { steps: 6 });
  await page.getByRole("combobox", { name: "Language" }).selectOption("zh-TW");
  await pause(page, 500);
  await page.getByRole("button", { name: "中文範例" }).click();
  await pause(page, 900);
  await hoverMark(page, 1, 1500);
  await page.mouse.move(40, 40, { steps: 6 });
  await pause(page, 600);

  const video = page.video()!;
  await context.close();
  const webm = await video.path();
  await browser.close();
  server.httpServer.close();

  const palette = join(dir, "palette.png");
  const filters = "fps=12,scale=900:-1:flags=lanczos";
  const run = (args: string[]) => {
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("ffmpeg failed");
  };
  run(["-i", webm, "-vf", `${filters},palettegen=max_colors=96`, palette]);
  run([
    "-i",
    webm,
    "-i",
    palette,
    "-lavfi",
    `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4`,
    join(assets, "demo.gif"),
  ]);
  rmSync(dir, { recursive: true, force: true });
}

function fontFace(family: string, file: string): string {
  const url = pathToFileURL(join(root, "node_modules", file)).href;
  return `@font-face{font-family:"${family}";src:url("${url}") format("woff2");font-weight:100 900}`;
}

/** The card sentence, with the marks the real engine finds, so the card never shows a hit that does not exist. */
function cardSentence(): string {
  const text =
    "In today's fast-paced world, our app is not just a notes tool, it is a game-changer. It's important to note that it works. Let me know if you'd like more.";
  const sniffer = createSniffer("auto");
  const css = { high: "h", medium: "m", low: "l" } as const;
  let out = "";
  let at = 0;
  for (const mark of sniffer.analyze(text).marks) {
    out += text.slice(at, mark.start);
    out += `<mark class="${css[sniffer.rule(mark.ruleId).confidence]}">${text.slice(mark.start, mark.end)}</mark>`;
    at = mark.end;
  }
  return out + text.slice(at);
}

function socialCard(): void {
  const logo = readFileSync(join(assets, "logo.svg"), "utf8");
  const html = `<!doctype html><meta charset="utf-8"><style>
${fontFace("Fraunces V", "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2")}
${fontFace("Inter V", "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")}
*{box-sizing:border-box}body{margin:0;width:1200px;height:675px;background:#f6f0e4;color:#2b2622;font-family:"Inter V",sans-serif;padding:64px 80px;position:relative;overflow:hidden}
.brand{display:flex;align-items:center;gap:16px;font:600 40px "Fraunces V",serif}.brand svg{width:56px;height:56px}
h1{font:600 68px/1.08 "Fraunces V",serif;margin:44px 0 0;max-width:980px;letter-spacing:-0.01em}
.sample{margin-top:44px;font-size:30px;line-height:1.7;max-width:1000px;background:#fbf8f1;border:1px solid rgba(43,38,34,.16);border-radius:18px;padding:26px 32px}
mark{color:inherit;border-radius:4px;text-underline-offset:6px;text-decoration-thickness:3px}
.l{background:rgba(120,110,90,.16);text-decoration:underline dotted #6b6258}.h{background:rgba(200,64,43,.2);text-decoration:underline wavy #c8402b}.m{background:rgba(240,138,36,.25);text-decoration:underline #f08a24}
.foot{position:absolute;left:80px;right:80px;bottom:44px;display:flex;justify-content:space-between;font-size:24px;color:#6b6258}
</style>
<div class="brand">${logo.replace("<svg", '<svg width="56" height="56"')}AiSniff</div>
<h1>Paste text. See which phrases read like AI wrote them.</h1>
<div class="sample">${cardSentence()}</div>
<div class="foot"><span>Rule, source and rewrite hint for every hit</span><span>Patterns, not authorship</span></div>`;
  const dir = mkdtempSync(join(tmpdir(), "aisniff-card-"));
  const page = join(dir, "card.html");
  writeFileSync(page, html);
  const out = join(dir, "card.png");
  const r = spawnSync(
    chrome,
    [
      "--headless=new",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,675",
      "--virtual-time-budget=3000",
      `--screenshot=${out}`,
      pathToFileURL(page).href,
    ],
    { stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error("Chrome screenshot failed");
  renameSync(out, join(assets, "social-card.png"));
  rmSync(dir, { recursive: true, force: true });
}

await recordDemo();
socialCard();
console.log("wrote assets/demo.gif, assets/social-card.png and assets/logo.svg");
