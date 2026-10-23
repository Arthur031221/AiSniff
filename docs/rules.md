# Writing a rule

A rule is one JSON object in `rules/en.json`, `rules/zh-TW.json` or `rules/common.json`. The packs are versioned. Change `version` and `updated` when you change a rule.

```json
{
  "id": "en.opener.in-an-era",
  "category": "opener",
  "confidence": "medium",
  "regex": "^In an era of [^,.]{1,40},",
  "flags": "im",
  "message": { "en": "A scene-setting opener that fits any topic." },
  "hint": { "en": "Start with the concrete thing the piece is about." },
  "source": {
    "id": "wp-signs",
    "anchor": "Undue emphasis on significance, legacy, and broader trends"
  },
  "examples": {
    "flag": ["In an era of constant change, teams need clear plans."],
    "pass": ["The era of steam ended slowly."]
  }
}
```

This is a sketch of the shape, not a rule in the packs. Every message and hint in the packs also has a `zh-TW` entry.

## Fields

- `id`: pack name, category and a short name, joined by dots. It must be unique.
- `category`: one of the keys in `meta.json`.
- `confidence`: `high` for text that a person would almost never write on purpose, `medium` for stock phrases, `low` for single words and weak signals.
- `phrases` or `regex`: use `phrases` for a list of literal strings. Latin edges match on word boundaries, and apostrophes match straight and curly. Use `regex` for anything else. `{{name}}` expands to an entry in the pack's `defs`. The `g`, `u` and `d` flags are always on, and `i` is on for `phrases`. Because of the `u` flag, do not escape quotes with a backslash.
- `highlight`: `groups` underlines only the capture groups, not the whole match.
- `minCount`: the rule fires only when it matches at least this many times. Used for rhythm rules such as a run of ordinals.
- `raw`: match the text as typed, without the Simplified to Traditional conversion.
- `fix`: `{ "delete": true }` or `{ "map": { "from": "to" } }`. Only add a fix when the rewrite is always safe.
- `source`: an id from `meta.json` and an optional section. A section becomes a link fragment only for web references.
- `examples`: at least one `flag` and one `pass`. `npm test` checks that every `flag` example matches the rule and every `pass` example does not.

## Before you add one

1. Cite a public source that describes the pattern. If you cannot, the rule is your opinion. Open an issue and say so.
2. Run `npm run eval`. If the rule fires more on human text than on chatbot text, say that in the pull request. The data in `docs/evaluation-data.json` lists what each rule does.
3. Add the source to `meta.json` when it is new. Run `npm run check:sources` to check that the link and the section exist.
4. Keep the hint short and concrete. It should tell the writer what to put in its place.

## Rules that were left out

Some candidates were dropped by hand after reading their matches on the HC3 dev half. The em dash rule is one of them. Several remaining rules do not separate the two groups on HC3 either. `docs/evaluation-data.json` lists them, because HC3 comes from a 2022 model and some of the documented patterns belong to newer ones.
