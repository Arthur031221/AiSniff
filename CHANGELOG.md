# Changelog

## 0.1.0

First release.

- 61 rules in three versioned JSON packs: `common`, `en` and `zh-TW`. Every rule has a source and passing and failing examples that run as tests.
- Web editor with a live heatmap, a popover per hit, a side panel grouped by type, a density meter, a before and after compare view and PNG export.
- `aisniff` CLI with `lint`, `rules` and `explain`, text, JSON and GitHub annotation output, and exit codes for CI.
- Agent skill in `skills/aisniff`.
- Interface in nine languages.
- Evaluation on HC3 with the method and per-rule counts in `docs/evaluation.md`.
