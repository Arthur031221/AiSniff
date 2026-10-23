# Configuration

AiSniff has no config file. Behaviour is set by flags (put them in your CI step), and rules are JSON files you can edit.

## CLI flags

| Flag                     | Values                   | Default | Effect                                        |
| ------------------------ | ------------------------ | ------- | --------------------------------------------- |
| `--format`               | `text`, `json`, `github` | `text`  | Output format                                 |
| `--min-confidence`       | `low`, `medium`, `high`  | `low`   | Hide weaker rules                             |
| `--max-density`          | number                   | none    | Exit 1 when hits per 1,000 units are above it |
| `--max-weighted-density` | number                   | none    | Exit 1 when the weighted density is above it  |
| `--disable`              | rule id or prefix        | none    | Skip a rule or a dotted prefix. Repeatable    |
| `--lang`                 | `auto`, `en`, `zh-TW`    | `auto`  | Rule packs to load. `common` always loads     |
| `--locale`               | `en`, `zh-TW` and others | `en`    | Language of messages and hints                |

## Density

Density is hits per 1,000 units. One CJK character counts as one unit and so does one Latin word. Hits that lose an overlap to a stronger rule are not counted. Hits from rules that need several matches (`minCount`) count only when the minimum is met.

Weighted density counts strong hits as 3, medium as 2 and weak as 1. The three words on the web meter come from the weighted density. `--max-density` checks the plain density and `--max-weighted-density` checks this one, so pick the scale you tuned the limit on. The "many patterns" lines are 8.7 for English and 13.0 for Chinese on the weighted scale. The limits are in `src/engine/bands.ts` and come from `npm run eval`.

## Simplified Chinese

Simplified input is converted to Traditional one character at a time before the Traditional Chinese rules run, so the positions in the original text stay correct. The conversion table comes from OpenCC (Apache-2.0, see `THIRD_PARTY_NOTICES.md`). Rules marked `raw` match the text as typed.

## Rule packs

Packs live in `rules/`. `meta.json` holds the sources and the category names. See [rules](rules.md) for the fields of a rule.
