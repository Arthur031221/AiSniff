<div align="center">

# AiSniff

**文章を貼り付けると、AIが書いたように読める表現が見つかります。**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[ライブデモ](https://arthur031221.github.io/AiSniff/) · [ドキュメント](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="AiSniffに段落を入力する様子。表現に下線が引かれ、ホバーするとルール、書き換えのヒント、出典が表示されます。" width="820">

</div>

AiSniffは、英語と中国語の文章の中から、公開されているAI文章のパターンに当てはまる表現を正確に示します。各マークには該当ルール、公開された出典、素直な書き換えの提案が付きます。同じJSONルールをWebエディタ、CLI、エージェントスキルで使い、サーバーもモデル呼び出しも必要ありません。

**示すのはパターンであり、書き手ではありません。** ヒットがなくても人が書いた証明にはならず、ヒットがあってもモデルが書いた証明にはなりません。

## 文章がどう変わるか

| 修正前                                                                                                                                                       | 修正後                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 件**: `en.opener.todays-world`, `en.promo.commitment`                                                                                                    | **0件**                                                                                             |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 件**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                                 | **0件**                                                                                             |

ヒット数は、この文そのものに `aisniff lint` を実行した結果です。右列はヒントに従って手で書き直したものです。

## どこまで見分けられるか

HC3（人間とチャットボットの回答が並ぶ公開の質問応答データ）のうち、取り分けておいたテスト側で、英語のルールは **チャットボットの回答の29%、人間の回答の2%** で1件以上ヒットしました。中国語は **24%対6%** です。

制約と合わせて読んでください。テスト側には英語の人間の回答23,752件とチャットボットの回答13,422件、中国語はそれぞれ9,812件と8,480件があります。チャットボットの回答は公開直後のもので、新しいモデル向けの語彙ルールはここでは検証できません。英語のチャットボット回答の71%はヒットがありませんでした。密度のAUROCは英語0.63、中国語0.59で、密度だけでは弱い検出器です。このデータで成り立たなかったルールもあり、評価ページに一覧があります。方法とルールごとの件数は [docs/evaluation.md](docs/evaluation.md) にあり、`npm run eval` で再実行できます。

## コマンド

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| コマンド                                  | 内容                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aisniff lint [files...]`                 | ファイルを走査します。ファイルがなければ標準入力を読みます。位置、確度、ルール、説明、ヒントを1件ずつ表示します。                                                                                                                                                                                                          |
| `aisniff lint --format json`              | 同じ結果をJSONで出力します。出典URL、種類別の件数、密度を含みます。                                                                                                                                                                                                                                                        |
| `aisniff lint --format github`            | ヒットごとにGitHub Actionsのアノテーションを1つ出力します。                                                                                                                                                                                                                                                                |
| `aisniff lint --min-confidence medium`    | 弱いシグナルを隠します。値は `low`、`medium`、`high` です。                                                                                                                                                                                                                                                                |
| `aisniff lint --max-density 20`           | 1,000単位あたりのヒット数がこの値を超えると終了コード1で終わります。                                                                                                                                                                                                                                                       |
| `aisniff lint --max-weighted-density 8.7` | 重み付き密度（Web のメーターと同じ尺度）がこの値を超えると終了コード1で終わります。                                                                                                                                                                                                                                        |
| `aisniff lint --disable en.promo`         | ルール1つ、または `en.promo` のような接頭辞の下にあるすべてのルールを除外します。複数回指定できます。                                                                                                                                                                                                                      |
| `aisniff lint docs/`                      | フォルダとそのサブフォルダにある `.md`、`.markdown`、`.mdx`、`.txt` ファイルを調べます。                                                                                                                                                                                                                                   |
| `aisniff lint --markdown off`             | Markdown ファイルをプレーンテキストとして調べます。既定では `.md`、`.markdown`、`.mdx` ファイル内のコードブロック、インラインコード、フロントマター、コメント、リンク先アドレスを除外します。値: `auto`、`on`、`off`。                                                                                                     |
| `.aisniff.json`                           | プロジェクト共通の同じオプションを設定します: `format`、`minConfidence`、`maxDensity`、`maxWeightedDensity`、`disable`、`markdown`、`lang`、`locale`。現在のフォルダからリポジトリのルートまで順にたどって探します。コマンドラインのフラグが優先されます。`--config FILE` でファイルを指定し、`--no-config` で無視します。 |
| `aisniff lint --lang en`                  | ルールパックを1つだけ読み込みます。値は `auto`、`en`、`zh-TW` です。                                                                                                                                                                                                                                                       |
| `aisniff lint --locale zh-TW`             | 説明とヒントを繁体字中国語で表示します。                                                                                                                                                                                                                                                                                   |
| `aisniff rules`                           | 61件のルールすべてを確度つきで一覧表示します。                                                                                                                                                                                                                                                                             |
| `aisniff explain <rule-id>`               | 1つのルールを、通る例と通らない例、出典つきで表示します。                                                                                                                                                                                                                                                                  |

終了コード：0は制限内で走査完了、1は制限超過、2は使い方の誤りです。テキスト出力の最後の行に、パターンを測るもので書き手を測るものではないと書かれます。

## エディタ

[ライブデモ](https://arthur031221.github.io/AiSniff/)を開くか、`npm install && npm run dev` を実行します。

- マークにホバーまたはタップすると、ルール、書き換えのヒント、出典が出ます。一部のルールはワンクリックで書き換えられ、元に戻す操作も使えます。
- サイドパネルがヒットを種類別にまとめます。メーターは1,000語または1,000文字あたりのヒット数を示し、数えているのはパターンで書き手ではないと明記します。
- 比較タブに修正前と修正後の文章を置き、ヒット数の変化を確認できます。
- 注釈つきの文章をPNGで保存できます。
- ボタンか、エディタへのドロップで、2 MB までの `.txt`、`.md`、`.markdown`、`.mdx` ファイルを開けます。ファイルはブラウザー内だけで読み込まれます。Web版は Markdown をプレーンテキストとして調べるので、コードブロックを除外するには CLI を使ってください。
- インターフェースは9言語：English、繁體中文、简体中文、日本語、한국어、Español、Français、Deutsch、Português (BR)。ルールの説明は英語と繁体字中国語です。
- 簡体字の入力は、位置を保つ1文字ずつの変換を通して繁体字中国語のルールで調べます。

## インストール

<details>
<summary>Web</summary>

[ライブデモ](https://arthur031221.github.io/AiSniff/)を使います。貼り付けた文章はページの外に出ません。自分でホストするには `npm run build:web` を実行して `dist/web` を配信します。

</details>

<details>
<summary>コマンドライン</summary>

Node 22以降が必要です。CIは22と24で動かしています。

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

チェックアウトからは `npm install && npm run build:cli && npm link` です。npmのパッケージ名は `aisniff-cli`、コマンドは `aisniff` です。

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

そのあと「AiSniffでこの下書きをチェックして」と頼みます。プロジェクト内の `<agent-dir>/skills/aisniff` に置くと、そのプロジェクトだけに効きます。

</details>

<details>
<summary>Codexとその他のエージェント</summary>

`skills/aisniff/SKILL.md` をリポジトリにコピーして `AGENTS.md` から指すか、本文をエージェントの指示に貼り付けます。エージェントに必要なのは `npx` を実行できるシェルだけです。

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/checkout@v4
- uses: Arthur031221/AiSniff@v0.5.0
  with:
    paths: docs/
    max-weighted-density: 8.7
```

</details>

## ルールの出典

各ルールは6つの公開出典のどれかを引用します。Wikipediaのガイド [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)、[blader/humanizer](https://github.com/blader/humanizer)、[Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW)、[speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw) のパターン一覧、中国語版Wikipediaの [歐化中文](https://zh.wikipedia.org/wiki/歐化中文)、そして [Kobakらによる2025年のScience Advancesの過剰語彙の研究](https://www.science.org/doi/10.1126/sciadv.adt3813) です。これらの一覧は書き換えのための文章ガイドです。AiSniffはそのパターンをルールにし、例でテストし、データで測り、データに反したものは外しました。各ルールにはテストとして実行される通る例と通らない例があり、`npm run check:sources` が出典のリンクと節の存在を確認します。

一部の用語ルールは、繁体字中国語に混じる中国大陸の用語（例：軟件、視頻）を示します。これは台湾の用法と違う言い回しを示すもので、AIの特徴ではありません。

## 制約

- 公開された一覧にある表現を探すだけです。それを避けるモデルや、よく使う人には外れます。
- フォーマルな文章、第二言語での文章、古風な文章もルールに当たります。
- 英語と中国語のみです。ほかの言語は調べません。
- メーターの「多くのパターン」は、HC3の人間の回答の99パーセンタイル（1,000単位あたりの加重ヒット8.7と13.0）です。短い質問応答の文章から得た参考線で、判定のしきい値ではありません。

## ドキュメント

[インストール](docs/install.md) · [使い方](docs/usage.md) · [設定](docs/config.md) · [アーキテクチャ](docs/architecture.md) · [ルールの書き方](docs/rules.md) · [評価](docs/evaluation.md) · [コントリビュート](CONTRIBUTING.md)

簡体字から繁体字への変換表はOpenCC（Apache-2.0）のものです。[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

Assisted by Claude/Codex.
