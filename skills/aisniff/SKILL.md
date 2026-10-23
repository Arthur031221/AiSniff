---
name: aisniff
description: Scan a draft for phrases that read like AI wrote them, using the AiSniff rule packs for English and Traditional or Simplified Chinese. Use when asked to check, de-AI, tighten or review prose, a README, a post or a report. Reports patterns with a rule id, a source and a rewrite hint. Never claims who wrote a text.
---

# AiSniff

AiSniff finds phrases that match documented AI-writing patterns. It reports patterns, not authorship. Never tell the user that a text was or was not written by an AI because of a score.

## Run it

```bash
npx github:Arthur031221/AiSniff lint FILE [FILE...]
```

If `aisniff` is already installed, call `aisniff lint FILE`. Use `-` or no file to read stdin. Add `--format json` when you need to process the hits, and `--locale zh-TW` for Traditional Chinese messages. Pass a folder to scan its Markdown and text files, and `--disable RULE_OR_PREFIX` to skip a rule the user does not want flagged. A `.aisniff.json` in the project sets the same options, and Markdown code blocks and front matter are skipped on their own.

Other commands:

- `aisniff rules` lists every rule with its confidence.
- `aisniff explain RULE_ID` shows one rule with passing and failing examples and its source.

## Work through the hits

1. Run `lint` on the draft and read every hit with its hint.
2. Rewrite each flagged phrase by the hint. Prefer a concrete fact over a different filler phrase. If a sentence says nothing once the phrase is gone, delete the sentence.
3. Keep the author's meaning, numbers, names and voice. Do not add claims to fill a gap.
4. Run `lint` again. Report the hit count before and after.
5. Ignore a hit when the phrase is quoted, is a name, or is the subject of the text. Say which hits you left and why.

## Confidence

- `high`: chatbot leftovers and tracking parameters a chatbot added to links. Almost never written by a person on purpose. Fix these.
- `medium`: stock openers, closers and filler. Fix unless the phrase does real work.
- `low`: weak signals, such as single words. Look at the sentence, not the word.

## What not to do

- Do not use the density number as a verdict. It is hits per 1,000 words or characters, nothing more. Many people write like this, and clean text can still come from a model.
- Do not run a detector loop that rewrites until the count reaches zero. Fewer hits means fewer known patterns, not a more human text.
- Wording rules for mainland usage in Traditional Chinese (for example the mainland words for software and video) mark wording that differs from Taiwan usage. They are not AI tells. Offer them only when the target reader is in Taiwan.

## Rules

The rule packs are JSON files in `rules/`: `en.json`, `zh-TW.json` and `common.json`. Each rule carries a pattern, a message, a hint, a source and examples that run as tests. To add a rule, follow `docs/rules.md`.
