# Configuration

Behaviour is set by flags, by an optional `.aisniff.json` file, and by the rule packs, which are JSON files you can edit.

## CLI flags

| Flag                     | Values                   | Default | Effect                                               |
| ------------------------ | ------------------------ | ------- | ---------------------------------------------------- |
| `--format`               | `text`, `json`, `github` | `text`  | Output format                                        |
| `--min-confidence`       | `low`, `medium`, `high`  | `low`   | Hide weaker rules                                    |
| `--max-density`          | number                   | none    | Exit 1 when hits per 1,000 units are above it        |
| `--max-weighted-density` | number                   | none    | Exit 1 when the weighted density is above it         |
| `--disable`              | rule id or prefix        | none    | Skip a rule or a dotted prefix. Repeatable           |
| `--markdown`             | `auto`, `on`, `off`      | `auto`  | Skip code, front matter, comments and link addresses |
| `--config`               | file path                | none    | Read options from this file                          |
| `--no-config`            | none                     | off     | Ignore any `.aisniff.json`                           |
| `--lang`                 | `auto`, `en`, `zh-TW`    | `auto`  | Rule packs to load. `common` always loads            |
| `--locale`               | `en`, `zh-TW` and others | `en`    | Language of messages and hints                       |

## Project file

Put a `.aisniff.json` in your repository so every run and every teammate uses the same settings:

```json
{
  "disable": ["en.promo", "en.vocabulary.ai-words"],
  "minConfidence": "medium",
  "maxWeightedDensity": 8.7,
  "markdown": "auto"
}
```

The keys are `format`, `minConfidence`, `maxDensity`, `maxWeightedDensity`, `disable`, `markdown`, `lang` and `locale`, with the same values as the flags. AiSniff looks for the file in the current folder and then in each parent folder, and stops after the folder that holds `.git`. `--config FILE` reads a specific file and `--no-config` ignores the search. A flag overrides the same key in the file, except `disable`, where both lists apply. A bad file, an unknown key or a `disable` entry that matches no rule exits with code 2, so a typo can't switch a check off without notice.

## Markdown files

For `.md`, `.markdown` and `.mdx` files, AiSniff blanks fenced code, inline code, front matter, HTML comments and link addresses before it scans. Line numbers, columns and offsets still refer to the original file, and the blanked text doesn't count toward the density. `.txt` files and stdin are scanned as typed. Use `--markdown on` to apply the same masking to stdin, or `--markdown off` to scan Markdown files whole.

## Density

Density is hits per 1,000 units. One CJK character counts as one unit and so does one Latin word. Hits that lose an overlap to a stronger rule are not counted. Hits from rules that need several matches (`minCount`) count only when the minimum is met.

Weighted density counts strong hits as 3, medium as 2 and weak as 1. The three words on the web meter come from the weighted density. `--max-density` checks the plain density and `--max-weighted-density` checks this one, so pick the scale you tuned the limit on. The "many patterns" lines are 8.7 for English and 13.0 for Chinese on the weighted scale. The limits are in `src/engine/bands.ts` and come from `npm run eval`.

## Simplified Chinese

Simplified input is converted to Traditional one character at a time before the Traditional Chinese rules run, so the positions in the original text stay correct. The conversion table comes from OpenCC (Apache-2.0, see `THIRD_PARTY_NOTICES.md`). Rules marked `raw` match the text as typed.

## Rule packs

Packs live in `rules/`. `meta.json` holds the sources and the category names. See [rules](rules.md) for the fields of a rule.
