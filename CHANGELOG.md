# Changelog

## 0.5.0

- GitHub Actions: `uses: Arthur031221/AiSniff@v0.5.0` runs the CLI in a workflow, with inputs for `paths`, `format`, `max-density`, `max-weighted-density`, `min-confidence`, `disable`, `lang`, `markdown` and `config`. It fails the job only when a limit is passed. The repository's own CI runs it on its docs.
- CLI: `-h` and `--help` after a subcommand (`aisniff lint --help`) print the help instead of exiting with an error.
- Tests: the action script is run against the real CLI for paths, globs, limits and bad input.

## 0.4.0

- Web: "Open a file" and drag and drop load a `.txt`, `.md`, `.markdown` or `.mdx` file of up to 2 MB into the Check box. The file is read in the browser, a leading byte order mark is dropped, and other types or larger files get a message in the interface language.
- Web: the Check and Compare tabs follow the arrow keys, Home and End, and only the selected tab is a tab stop.
- Web: on a phone the text box now comes right after the buttons, with the density meter below it, and the header uses less height.
- Tests: every interface language file is checked for the same keys and placeholders as English.

## 0.3.0

- CLI: Markdown files (`.md`, `.markdown`, `.mdx`) are scanned without their fenced code, inline code, front matter, HTML comments and link addresses, so docs that quote a flagged phrase no longer trip the gate. Positions still refer to the original file. `--markdown auto|on|off` controls it.
- CLI: an optional `.aisniff.json` holds the project's options. It is found from the current folder up to the repository root, flags override it, and `--config` and `--no-config` pick or skip it. Unknown keys and rule ids that match nothing exit with code 2.

## 0.2.0

- CLI: `--disable` skips a rule or a dotted prefix of rules, `lint` accepts folders and scans their `.md`, `.markdown`, `.mdx` and `.txt` files in order, and `--max-weighted-density` gates on the same scale as the web meter. `--max-density` is unchanged. `--version` now reads `package.json`.
- Web: a pinned card stays attached to its mark when the page scrolls, a card opened from the side panel takes keyboard focus and Escape returns it, tapping a mark on a phone closes the keyboard, and the PNG download no longer races the URL cleanup.
- Web: the Check text survives a reload in the same tab, and the default sample follows the interface language until you type.

## 0.1.0

First release.

- 61 rules in three versioned JSON packs: `common`, `en` and `zh-TW`. Every rule has a source and passing and failing examples that run as tests.
- Web editor with a live heatmap, a popover per hit, a side panel grouped by type, a density meter, a before and after compare view and PNG export.
- `aisniff` CLI with `lint`, `rules` and `explain`, text, JSON and GitHub annotation output, and exit codes for CI.
- Agent skill in `skills/aisniff`.
- Interface in nine languages.
- Evaluation on HC3 with the method and per-rule counts in `docs/evaluation.md`.
