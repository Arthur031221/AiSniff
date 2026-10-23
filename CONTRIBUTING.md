# Contributing

Thanks for helping. The most useful contribution is a good rule, or evidence that a rule is wrong.

## Setup

Node 22 or newer.

```bash
npm install
npm test
npm run typecheck
npm run format:check
```

Browser tests drive a real Chrome through Playwright:

```bash
npm run build:web
CHROME=/usr/bin/google-chrome npm run test:e2e
```

`npm run build` builds the web app into `dist/web` and the CLI into `dist/cli`.

## Adding a rule

Rules live in `rules/common.json`, `rules/en.json` and `rules/zh-TW.json`. See [docs/rules.md](docs/rules.md) for the fields.

A rule needs all of these before it is merged:

1. A pattern that matches the phrase and little else.
2. A message and a hint. The hint is a plain rewrite, not a scolding.
3. A source from `rules/meta.json`, with an anchor when the page has one. Add the source there if it is new.
4. At least two `flag` examples and two `pass` examples. The pass examples should include a legitimate use of the same words. `npm test` runs every example.
5. A confidence level. Use `high` only for patterns that are rare in ordinary writing.

Then run `npm run eval` to see how the rule behaves on HC3, and mention the result in the pull request. A rule that fires about as often on human answers as on chatbot answers is probably not worth shipping, and the pull request is the place to say so.

## Reporting a false positive

Open an issue with the sentence, the rule id from `aisniff lint --format json` and a link to where the sentence was published. Sentences from real writers are the strongest evidence.

## Style

TypeScript with strict settings, no framework in the web app, and Prettier for formatting. Keep the engine in `src/engine` free of DOM and Node APIs, since the browser, the CLI and the skill all share it.

## Claims

AiSniff reports patterns, not authorship. Please keep that wording in the interface, the docs and any pull request text.
