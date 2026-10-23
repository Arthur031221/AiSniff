# Usage

## Web editor

1. Paste text into the editor, or press an example button.
2. Marked phrases are underlined. The line style shows the confidence: wavy for strong, solid for medium, dotted for weak.
3. Hover a mark on a desktop, or tap it on a phone, to see the rule, the rewrite hint and the source. Press Escape to close the card.
4. Rules with a safe mechanical rewrite show a button. It edits the text through the browser, so Undo works.
5. The panel on the right groups the hits by type. Selecting a row scrolls to the phrase.
6. The density meter shows the hit count, the length in units and hits per 1,000 units. A unit is one English word or one CJK character.
7. The Compare tab holds a before and an after text. Press "Start from the current text", edit the right side and read the hit count change.
8. "Save as image" writes a PNG of the annotated text with the density line.

The filter next to the buttons hides weaker rules. Medium and strong signals is a good setting for a final pass.

The language menu changes the interface and the rule messages. Rule messages exist in English and Traditional Chinese. The other languages show the closest of those two.

### The three words on the meter

- No patterns found: no rule matched. This does not show that a person wrote the text.
- Some patterns: at least one rule matched.
- Many patterns: the weighted density is above what 99% of the human answers in the dev half of HC3 had. See [evaluation](evaluation.md) for the method and its limits.

## CLI

```bash
aisniff lint draft.md notes.md       # scan files
cat draft.md | aisniff lint          # scan stdin
aisniff lint --min-confidence medium draft.md
aisniff lint --format json draft.md  # for scripts
aisniff lint --format github docs/*.md
aisniff lint --max-density 20 draft.md
aisniff rules                        # every rule
aisniff explain en.hedge.important-to-note
```

Text output prints the position, confidence, rule id and matched text, then the message and the hint. A summary line gives the hit count, the units and the density. The last line always says that the tool measures patterns, not authorship.

Exit codes: 0 when the scan ran and stayed within `--max-density`, 1 when the limit was exceeded, 2 for bad usage.

## Agent skill

Ask the agent to "check this draft with AiSniff". It runs `aisniff lint`, rewrites the flagged phrases by their hints and reports the count before and after. See `skills/aisniff/SKILL.md`.
