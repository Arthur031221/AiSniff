<div align="center">

# AiSniff

**Paste text. See which phrases read like AI wrote them.**

[English](README.md) | [Traditional Chinese](README.zh-TW.md) | [Simplified Chinese](README.zh-CN.md) | [Japanese](README.ja.md) | [Korean](README.ko.md) | [Spanish](README.es.md) | [French](README.fr.md) | [German](README.de.md) | [Portuguese (BR)](README.pt-BR.md)

[Live demo](https://arthur031221.github.io/AiSniff/) | [Docs](docs/usage.md) | [MIT](LICENSE)

<img src="assets/demo.gif" alt="Typing a paragraph into AiSniff. Phrases get underlined, and hovering one shows the rule, a rewrite hint and the source." width="820">

</div>

AiSniff marks phrases in English and Chinese text that match documented AI-writing patterns. Each mark names its rule, cites a public source and suggests a plain rewrite. The web editor, the CLI and the agent skill all run from one set of JSON rules, with no server and no model call.

**It reports patterns and says nothing about who wrote the text.** A clean result doesn't prove a person wrote it, and a hit doesn't prove a model did.

## What it does to a text

| Before                                                                                                                                                       | After                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 hits**: `en.opener.todays-world`, `en.promo.commitment`                                                                                                  | **0 hits**                                                                                          |

Hit counts come from `aisniff lint` run on these exact sentences. I rewrote the right column by hand, following the hints.

## How well it separates the two

On answers held out from HC3 (a public set of questions with human and chatbot answers), the English rules marked at least one phrase in 29% of chatbot answers and 2% of human answers. For Chinese it was 24% and 6%.

The limits matter. The test half holds 23,752 human and 13,422 chatbot English answers, and 9,812 and 8,480 Chinese ones. The chatbot answers date from its first months, so the rules for newer-model vocabulary can't be checked against them. 71% of the English chatbot answers had no hit at all. The AUROC of the density is 0.63 for English and 0.59 for Chinese, so density alone is a weak detector. Several rules fire as often on human answers as on chatbot ones, and the evaluation page lists them. Method and per-rule counts are in [docs/evaluation.md](docs/evaluation.md). Rerun it with `npm run eval`.

## Commands

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| Command                                   | What it does                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aisniff lint [files...]`                 | Scans files, or stdin when no file is given. Prints each hit with position, confidence, rule, message and hint.                                                                                                                                                          |
| `aisniff lint --format json`              | Same hits as JSON, with source URLs, counts per type and the density.                                                                                                                                                                                                    |
| `aisniff lint --format github`            | One GitHub Actions annotation per hit.                                                                                                                                                                                                                                   |
| `aisniff lint --min-confidence medium`    | Hides weak signals. Values: `low`, `medium`, `high`.                                                                                                                                                                                                                     |
| `aisniff lint --max-density 20`           | Exits 1 when hits per 1,000 units are above the number.                                                                                                                                                                                                                  |
| `aisniff lint --max-weighted-density 8.7` | Exits 1 when the weighted density, the scale of the web meter, is above the number.                                                                                                                                                                                      |
| `aisniff lint --disable en.promo`         | Skips one rule, or every rule under a prefix such as `en.promo`. Repeat the flag to skip more.                                                                                                                                                                           |
| `aisniff lint docs/`                      | Scans a folder and its subfolders for `.md`, `.markdown`, `.mdx` and `.txt` files.                                                                                                                                                                                       |
| `aisniff lint --markdown off`             | Scans Markdown files as plain text. By default, code blocks, inline code, front matter, comments and link addresses in `.md`, `.markdown` and `.mdx` files are skipped. Values: `auto`, `on`, `off`.                                                                     |
| `.aisniff.json`                           | Sets the same options for a project: `format`, `minConfidence`, `maxDensity`, `maxWeightedDensity`, `disable`, `markdown`, `lang`, `locale`. Found from the current folder up to the repository root. Flags win. `--config FILE` picks a file, `--no-config` ignores it. |
| `aisniff lint --lang en`                  | Loads one pack. Values: `auto`, `en`, `zh-TW`.                                                                                                                                                                                                                           |
| `aisniff lint --locale zh-TW`             | Messages and hints in Traditional Chinese.                                                                                                                                                                                                                               |
| `aisniff rules`                           | Lists all 61 rules with their confidence.                                                                                                                                                                                                                                |
| `aisniff explain <rule-id>`               | Shows one rule with passing and failing examples and its source.                                                                                                                                                                                                         |

Exit codes: 0 scanned within the limit, 1 limit exceeded, 2 bad usage. The text output ends with a line saying it measures patterns, not authorship.

## The editor

Open the [live demo](https://arthur031221.github.io/AiSniff/) or run `npm install && npm run dev`.

- Hover or tap a mark to see the rule, the rewrite hint and the source. Some rules offer a one-click rewrite, and Undo still works after it.
- A side panel groups the hits by type. A meter shows hits per 1,000 words or characters, next to a line saying it counts patterns, not authorship.
- A compare tab holds a before and an after text and shows how the hit count changed.
- Save the annotated text as a PNG.
- Open a `.txt`, `.md`, `.markdown` or `.mdx` file of up to 2 MB with the button or by dropping it on the editor. The file is read in the browser. The web editor scans Markdown as plain text, so use the CLI to skip code blocks.
- Nine interface languages: English, Traditional Chinese, Simplified Chinese, Japanese, Korean, Spanish, French, German, Portuguese (BR). Rule messages exist in English and Traditional Chinese.
- Simplified Chinese input goes through the Traditional Chinese rules after a character conversion that keeps positions intact.

## Install

<details>
<summary>Web</summary>

Use the [live demo](https://arthur031221.github.io/AiSniff/). Nothing you paste leaves the page. To host it yourself, run `npm run build:web` and serve `dist/web`.

</details>

<details>
<summary>Command line</summary>

Needs Node 22 or newer. CI runs 22 and 24.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

Or from a checkout: `npm install && npm run build:cli && npm link`. The npm package name is `aisniff-cli`, the command is `aisniff`.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

Then ask: "check this draft with AiSniff". Use `<agent-dir>/skills/aisniff` inside a project to scope it to that project.

</details>

<details>
<summary>Codex and other agents</summary>

Copy `skills/aisniff/SKILL.md` into your repository and point to it from `AGENTS.md`, or paste its body into the agent's instructions. The agent only needs a shell to run `npx`.

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## Where the rules come from

Each rule cites one of six public sources: the Wikipedia guide [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), the pattern lists in [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) and [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw), the Chinese Wikipedia page on [Europeanized Chinese](https://zh.wikipedia.org/wiki/%E6%AD%90%E5%8C%96%E4%B8%AD%E6%96%87), and the excess-vocabulary study by [Kobak et al., Science Advances 2025](https://www.science.org/doi/10.1126/sciadv.adt3813). Those lists are prose guides for rewriting. AiSniff turns their patterns into rules, tests them against examples and measures them on data. It also keeps some rules the data doesn't support, and the evaluation page lists each one. Every rule has passing and failing examples that run as tests, and `npm run check:sources` checks that each source link and section exists.

Some wording rules mark mainland usage in Traditional Chinese (for example the mainland words for software and video). They flag wording that differs from Taiwan usage. They aren't AI tells.

## Limits

- It finds phrases from published lists. A model that avoids them, or a person who uses them, defeats it.
- Formal writing, second-language writing and old-fashioned prose will trigger rules.
- English and Chinese only. Other languages are not checked.
- The "many patterns" line on the meter is the 99th percentile of human HC3 answers (8.7 and 13.0 weighted hits per 1,000 units). It comes from short Q&A text and is a reference line, not a decision threshold.

## Docs

[Install](docs/install.md) | [Usage](docs/usage.md) | [Configuration](docs/config.md) | [Architecture](docs/architecture.md) | [Writing a rule](docs/rules.md) | [Evaluation](docs/evaluation.md) | [Contributing](CONTRIBUTING.md)

The Simplified to Traditional table comes from OpenCC (Apache-2.0), see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Assisted by Claude/Codex.
