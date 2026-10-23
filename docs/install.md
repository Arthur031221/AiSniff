# Install

AiSniff needs Node 22 or newer for the CLI. The web editor needs only a browser.

## Web editor

Open the live demo at https://arthur031221.github.io/AiSniff/. Nothing leaves your browser: there is no server and no model call.

To run it locally:

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cd AiSniff
npm install
npm run dev
```

`npm run build:web` writes the static site to `dist/web`. Any static host serves it. Set `GITHUB_PAGES=1` when the site lives under `/AiSniff/`.

## CLI

Run it without installing:

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

The first run builds the CLI through the package `prepare` script, so it takes a few seconds.

Install it for good from a checkout:

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cd AiSniff
npm install
npm run build:cli
npm link
aisniff lint draft.md
```

The npm package name is `aisniff-cli` because `aisniff` belongs to another project. The command is still `aisniff`.

## Agent skill

The skill is one file, `skills/aisniff/SKILL.md`. It tells an agent to run the CLI, work through the hits and report the count before and after.

- Agent skill: copy `skills/aisniff` to `~/<agent-dir>/skills/aisniff` for every project, or to `<agent-dir>/skills/aisniff` inside one project.
- Codex and other agents that read `AGENTS.md`: copy the folder anywhere in the repo and point to `skills/aisniff/SKILL.md` from `AGENTS.md`.
- Any other agent: paste the body of `SKILL.md` into its instructions. It only needs shell access to run `npx`.

## GitHub Actions

```yaml
- uses: actions/checkout@v4
- uses: Arthur031221/AiSniff@v0.5.0
  with:
    paths: docs/
    max-weighted-density: 8.7
```

The action builds the CLI, scans the paths and prints one annotation per hit. It fails the job only when a limit you set is passed.

| Input                  | Default  | Effect                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------- |
| `paths`                | `.`      | Files, folders or globs, separated by spaces or new lines                 |
| `format`               | `github` | `github`, `text` or `json`                                                |
| `max-density`          | none     | Fail when hits per 1,000 units are above it                               |
| `max-weighted-density` | none     | Fail when the weighted density is above it. 8.7 is the English meter line |
| `min-confidence`       | `low`    | `low`, `medium` or `high`                                                 |
| `disable`              | none     | Rule ids or prefixes such as `en.promo`, separated by commas or spaces    |
| `lang`                 | `auto`   | `auto`, `en` or `zh-TW`                                                   |
| `markdown`             | `auto`   | `auto`, `on` or `off`                                                     |
| `config`               | none     | Path to an `.aisniff.json`. By default the nearest one is used            |

Without the action, `npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/` does the same in a `run` step after `actions/setup-node`. `.aisniff.json` in the repository is read in both cases.
