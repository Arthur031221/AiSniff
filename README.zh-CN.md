<div align="center">

# AiSniff

**粘贴文字，看哪些句子读起来像 AI 写的。**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[在线体验](https://arthur031221.github.io/AiSniff/) · [文档](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="在 AiSniff 输入一段文字。句子被画上下划线，悬停会看到规则、改写建议和来源。" width="820">

</div>

AiSniff 会标出英文和中文文字里，符合已公开记载的 AI 写作模式的那几个词句。每个标记都写明命中的规则、附上公开来源，并给出平实的改写建议。同一组 JSON 规则可用于网页编辑器、命令行和 agent skill，不需要服务器，也不调用任何模型。

**它呈现的是模式，不是作者。** 没有命中不代表是人写的，有命中也不代表是模型写的。

## 对文字做了什么

| 修改前                                                                                                                                                       | 修改后                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 处**: `en.opener.todays-world`, `en.promo.commitment`                                                                                                    | **0 处**                                                                                            |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 处**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                                 | **0 处**                                                                                            |

命中数是对这几句话运行 `aisniff lint` 的结果。右栏是按建议手工改写的。

## 区分得有多准

在 HC3（公开的问答数据集，同时有人类和 聊天机器人 的回答）留出不用的测试一半上，英文规则在 **29% 的 聊天机器人 回答和 2% 的人类回答**中至少标出一处。中文是 **24% 对 6%**。

请连同限制一起读。测试一半里有英文人类回答 23,752 条、聊天机器人 13,422 条，中文分别是 9,812 和 8,480 条。聊天机器人 的回答来自它刚发布的几个月，所以较新模型的词汇规则无法在上面验证。英文 聊天机器人 回答有 71% 完全没有命中。密度的 AUROC 英文为 0.63、中文为 0.59，所以单靠密度只是很弱的检测器。部分规则在这份数据上站不住脚，评估页有列出。方法和逐规则的数字见 [docs/evaluation.md](docs/evaluation.md)，也可以用 `npm run eval` 重跑。

## 命令

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| 命令                                      | 作用                                                                                                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aisniff lint [files...]`                 | 扫描文件，没有给文件时读标准输入。逐项打印位置、置信度、规则、说明和建议。                                                                                                                                                           |
| `aisniff lint --format json`              | 同样的结果输出为 JSON，含来源网址、各类型数量和密度。                                                                                                                                                                                |
| `aisniff lint --format github`            | 每个命中输出一条 GitHub Actions 注解。                                                                                                                                                                                               |
| `aisniff lint --min-confidence medium`    | 隐藏弱信号。可用值：`low`、`medium`、`high`。                                                                                                                                                                                        |
| `aisniff lint --max-density 20`           | 每千单位的命中数超过该数字时以代码 1 退出。                                                                                                                                                                                          |
| `aisniff lint --max-weighted-density 8.7` | 加权密度（网页仪表使用的刻度）超过该数字时以代码 1 退出。                                                                                                                                                                            |
| `aisniff lint --disable en.promo`         | 跳过一条规则，或某个前缀（例如 `en.promo`）下的所有规则。重复使用该标志可跳过更多。                                                                                                                                                  |
| `aisniff lint docs/`                      | 扫描文件夹及其子文件夹中的 `.md`、`.markdown`、`.mdx` 和 `.txt` 文件。                                                                                                                                                               |
| `aisniff lint --markdown off`             | 把 Markdown 文件当作纯文本扫描。默认会跳过 `.md`、`.markdown` 和 `.mdx` 文件中的代码块、行内代码、前置元数据、注释和链接地址。可选值：`auto`、`on`、`off`。                                                                          |
| `.aisniff.json`                           | 为项目设置同样的选项：`format`、`minConfidence`、`maxDensity`、`maxWeightedDensity`、`disable`、`markdown`、`lang`、`locale`。从当前文件夹向上查找，直到仓库根目录。命令行标志优先。`--config FILE` 指定文件，`--no-config` 忽略它。 |
| `aisniff lint --lang en`                  | 只加载一个规则包。可用值：`auto`、`en`、`zh-TW`。                                                                                                                                                                                    |
| `aisniff lint --locale zh-TW`             | 以繁体中文显示说明和建议。                                                                                                                                                                                                           |
| `aisniff rules`                           | 列出全部 61 条规则及其置信度。                                                                                                                                                                                                       |
| `aisniff explain <rule-id>`               | 显示单条规则、通过和不通过的示例，以及来源。                                                                                                                                                                                         |

退出码：0 为扫描完成且未超过上限，1 为超过上限，2 为用法错误。文字输出的最后一行会说明它衡量的是模式，不是作者。

## 编辑器

打开[在线体验](https://arthur031221.github.io/AiSniff/)，或运行 `npm install && npm run dev`。

- 悬停或点按标记，查看规则、改写建议和来源。部分规则提供一键改写，并保留撤销功能。
- 侧栏按类型分组。仪表显示每千字或每千个字符的命中数，并注明它统计的是模式，不是作者。
- 对照标签页放修改前和修改后的文字，并显示命中数的变化。
- 可把标注后的文字保存为 PNG。
- 九种界面语言：English、繁體中文、简体中文、日本語、한국어、Español、Français、Deutsch、Português (BR)。规则说明有英文和繁体中文。
- 输入简体中文时，会经由保留位置的逐字转换，用繁体中文规则检查。

## 安装

<details>
<summary>网页</summary>

使用[在线体验](https://arthur031221.github.io/AiSniff/)。粘贴的内容不会离开这个页面。若要自己部署，运行 `npm run build:web` 后提供 `dist/web`。

</details>

<details>
<summary>命令行</summary>

需要 Node 22 或更新版本，CI 用 22 和 24 测试。

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

或从源码：`npm install && npm run build:cli && npm link`。npm 包名是 `aisniff-cli`，命令是 `aisniff`。

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

然后说"用 AiSniff 检查这份草稿"。放在项目内的 `<agent-dir>/skills/aisniff` 则只对该项目生效。

</details>

<details>
<summary>Codex 和其他 agent</summary>

把 `skills/aisniff/SKILL.md` 复制到你的仓库，并在 `AGENTS.md` 中指向它，或把内容粘贴进 agent 的指示。agent 只需要能运行 `npx` 的 shell。

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## 规则的来源

每条规则引用六个公开来源之一：维基百科的指南 [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)、[blader/humanizer](https://github.com/blader/humanizer)、[Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) 和 [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw) 的模式清单、中文维基百科的 [歐化中文](https://zh.wikipedia.org/wiki/歐化中文)，以及 [Kobak 等人 2025 年发表于 Science Advances 的过量词汇研究](https://www.science.org/doi/10.1126/sciadv.adt3813)。这些清单是改写用的文字指南。AiSniff 把其中的模式做成规则，用示例测试、用数据度量，并删掉数据不支持的规则。每条规则都有会作为测试运行的通过和不通过示例，`npm run check:sources` 会检查每个来源链接和章节是否存在。

部分用语规则会标出繁体中文里的大陆用法（例如 軟件、視頻）。它们标的是与台湾用法不同的措辞，不是 AI 的特征。

## 限制

- 它找的是已发表清单里的词句。避开这些词的模型，或爱用这些词的人，都会让它失准。
- 正式文体、第二语言写作和老派文章都会触发规则。
- 只支持英文和中文，其他语言不会检查。
- 仪表上的"很多模式"是 HC3 人类回答的第 99 百分位（每千单位加权命中 8.7 和 13.0）。它来自短篇问答文字，是参考线，不是判定阈值。

## 文档

[安装](docs/install.md) · [使用](docs/usage.md) · [配置](docs/config.md) · [架构](docs/architecture.md) · [编写规则](docs/rules.md) · [评估](docs/evaluation.md) · [贡献](CONTRIBUTING.md)

简体转繁体的对照表来自 OpenCC（Apache-2.0），见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

Assisted by Claude/Codex.
