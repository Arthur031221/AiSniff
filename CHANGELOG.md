# Changelog

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
