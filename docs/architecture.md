# Architecture

```
rules/*.json -> src/engine -> src/web         (browser editor)
                     |-> src/cli              (aisniff command)
                     |-> skills/aisniff       (calls the CLI)
                     '-> tests, scripts/eval-hc3.ts
```

The engine is plain TypeScript with no DOM and no Node APIs. The web editor, the CLI and the tests all import it.

## Engine

- `compile.ts` turns a rule into a regular expression. `{{name}}` expands from `defs`, phrases are escaped and wrapped in word boundaries where they start or end with a Latin letter.
- `s2t.ts` converts Simplified to Traditional one UTF-16 unit for one unit. Offsets in the converted text equal offsets in the original, so a hit found in converted text underlines the right characters.
- `scan.ts` collects every match, then chooses the spans to draw. When two rules overlap, the stronger confidence wins, then the longer match, then the earlier one. The losing rules stay attached as `also`, so the card can still name them.
- `stats.ts` counts units and density.
- `bands.ts` holds the two limits that turn the weighted density into "many".
- `index.ts` has the `Sniffer` class, which holds the packs and the shared sources.

## Web

No framework. `editor.ts` places a textarea over a layer that mirrors its text, with a `mark` element for each hit. The textarea grows with its content, so no scroll syncing is needed and typing with an input method editor is untouched. The browser gives no hover events for text inside a textarea's mirror, so `markAt` tests the pointer against the rectangles of each mark.

`exportImage.ts` draws the annotated text on a canvas. It wraps CJK text per character and Latin text per word, and keeps closing punctuation with the character before it.

Language files are in `src/web/i18n/locales`. A missing key falls back to English.

## CLI and build

`vite.cli.config.ts` builds the CLI as one ES module in `dist/cli/aisniff.mjs`, with the rule packs inlined. `scripts/prepare.mjs` builds it on install so `npx github:...` works.

## Tests

- `tests/rules.test.ts` runs every example of every rule.
- `tests/engine.test.ts` covers compile, overlap, conversion, density and bands.
- `tests/cli.test.ts` runs the CLI as a process.
- `tests/e2e` drives the built site in Chrome.
- `npm run check:sources` makes network requests to check each source link and section. It is not part of CI, because it depends on other sites.
