// Checks that every source URL answers and that every cited section exists on the page.
// It needs the network, so it is not part of CI. Usage: npm run check:sources
import { createSniffer } from "../src/engine/packs";
import { META } from "../src/engine/packs";

const sniffer = createSniffer("auto");
const headers = { "user-agent": "aisniff-source-check (https://github.com/Arthur031221/AiSniff)" };

/** Raw file URL for a GitHub blob page, so the heading text can be searched. */
function rawUrl(url: string): string {
  return url
    .replace("https://github.com/", "https://raw.githubusercontent.com/")
    .replace("/blob/", "/");
}

const cache = new Map<string, Promise<{ status: number; body: string }>>();
function load(url: string) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url, { headers, redirect: "follow" }).then(async (res) => ({
        status: res.status,
        body: res.ok ? await res.text() : "",
      })),
    );
  }
  return cache.get(url)!;
}

let failures = 0;
const fail = (message: string) => {
  failures++;
  console.log(`FAIL ${message}`);
};

for (const [id, source] of Object.entries(META.sources)) {
  const page = await load(source.kind === "community-list" ? rawUrl(source.url) : source.url).catch(
    () => ({ status: 0, body: "" }),
  );
  if (page.status === 200) console.log(`ok   ${id} ${source.url}`);
  else if (page.status === 403 || page.status === 429)
    console.log(`skip ${id} answers ${page.status} to scripts, open it by hand: ${source.url}`);
  else fail(`${id} ${source.url} answered ${page.status}`);
}

for (const rule of sniffer.rules.map((r) => r.def)) {
  const { anchor } = rule.source;
  if (!anchor) continue;
  const source = META.sources[rule.source.id];
  const page = await load(source.kind === "community-list" ? rawUrl(source.url) : source.url).catch(
    () => ({ status: 0, body: "" }),
  );
  if (page.status !== 200) continue;
  const id = anchor.replace(/ /g, "_");
  const found =
    source.kind === "reference"
      ? page.body.replaceAll("&quot;", '"').includes(`id="${id}"`)
      : page.body.toLowerCase().includes(anchor.toLowerCase());
  if (!found) fail(`${rule.id} cites a section that is not on the page: ${anchor}`);
}

console.log(failures === 0 ? "all sources check out" : `${failures} problems`);
process.exitCode = failures === 0 ? 0 : 1;
