# Evaluation

This page says what was measured, how, and what the numbers do not show.

## Headline

On held-out answers from the HC3 corpus, the English rules marked at least one phrase in **29% of chatbot answers and 2% of human answers**. The Chinese rules marked **24% of chatbot answers and 6% of human answers**.

That is a difference in how often known patterns appear. It is not a detector. The AUROC of the weighted density is 0.63 for English and 0.59 for Chinese, which is weak. 71% of the English chatbot answers and 76% of the Chinese ones had no hit at all.

## Method

- Corpus: HC3 (Guo et al., 2023), `Hello-SimpleAI/HC3` for English and `Hello-SimpleAI/HC3-Chinese`. Each question has human answers and chatbot answers. The chatbot answers come from the first months after its release.
- Split: by a hash of the question, 50/50, so every answer to a question lands on the same side. Rule choices and the "many" limits were set on the dev half. Every number in the headline comes from the test half.
- Filter: answers of at least 30 units (one Latin word or one CJK character).
- English text is detokenised first, because HC3 stores it as `do n't` and `word .`.
- Test half sizes: English 23,752 human and 13,422 chatbot answers. Chinese 9,812 human and 8,480 chatbot answers.
- The Chinese corpus is Simplified. It goes through the Traditional Chinese rules by the character conversion in the engine. No Traditional Chinese corpus was used, so the Traditional Chinese numbers are an assumption that the conversion is faithful.
- Run it yourself with `npm run eval`. It downloads the corpus to `~/.cache/aisniff-hc3` and writes `docs/evaluation-data.json`. The corpus is not stored in this repository.

## The "many patterns" limit

The meter says "many" when the weighted density is above the 99th percentile of human answers in the dev half: 8.7 for English and 13.0 for Chinese. Weighted density counts strong hits as 3, medium as 2 and weak as 1, per 1,000 units.

On the test half, 1.0% of English human answers and 23.0% of English chatbot answers are above that line. For Chinese it is 1.1% and 6.1%.

The limit comes from short Q&A answers. Longer text, other registers and other models can sit differently. Treat it as a reference line, not a threshold for a decision.

## What the data does not show

- HC3 comes from one old model and one register, question and answer. The newer-model vocabulary rules cannot be validated on it, because chatbot in 2023 did not write that way. Those rules rest on their cited sources, not on this data.
- Some rules do not separate the groups here. Per-rule counts are in `docs/evaluation-data.json`. The opener "in today's world", the "more than just" frame and the Markdown bold rule fire more often on human answers in this sample, and the AI vocabulary list and the "not just" frame fire about as often on both. They stay because their sources document them, and their confidence is low or medium. If you disagree, the data is there to argue with.
- Rules were adjusted by hand while looking at the dev half. The per-rule counts below come from the test half only, so the headline is not tuned on the data it reports. The script does not rerun the dev half.
- Rules that fire more often on human answers in the test half are kept because their cited sources describe them as AI patterns: `en.opener.todays-world`, `en.contrast.more-than-just`, `en.closer.future`, `en.contrast.not-x-but-y`, `en.closer.one-liner` and `zh-TW.significance.vocab`. The data does not support them. 15 rules had no hits in either group, so the data says nothing about them.
- Human answers in HC3 include copied web text and Reddit posts. A phrase in a human answer may itself have been written by a model or an editor.
- A person who writes formal text, or a writer using a second language, will trigger these rules. Text a model wrote and a person edited may trigger none.

None of this supports saying who wrote a text. The tool says that on its own meter and in its CLI output.
