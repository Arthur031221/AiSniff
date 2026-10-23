<div align="center">

# AiSniff

**글을 붙여 넣으면 AI가 쓴 것처럼 읽히는 표현을 찾아 줍니다.**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[라이브 데모](https://arthur031221.github.io/AiSniff/) · [문서](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="AiSniff에 문단을 입력하는 모습. 표현에 밑줄이 그어지고, 올려 두면 규칙, 고쳐쓰기 힌트, 출처가 나옵니다." width="820">

</div>

AiSniff는 영어와 중국어 글에서 공개적으로 기록된 AI 글쓰기 패턴에 해당하는 표현을 정확히 표시합니다. 각 표시에는 해당 규칙, 공개 출처, 담백한 고쳐쓰기 제안이 붙습니다. 같은 JSON 규칙을 웹 편집기, CLI, 에이전트 스킬에서 쓰며 서버도 모델 호출도 필요 없습니다.

**보여 주는 것은 패턴이지 작성자가 아닙니다.** 걸리지 않았다고 사람이 쓴 것은 아니고, 걸렸다고 모델이 쓴 것도 아닙니다.

## 글에 어떤 일이 생기는가

| 수정 전                                                                                                                                                      | 수정 후                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 건**: `en.opener.todays-world`, `en.promo.commitment`                                                                                                    | **0건**                                                                                             |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 건**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                                 | **0건**                                                                                             |

걸린 건수는 이 문장들에 `aisniff lint`를 실행한 결과입니다. 오른쪽 열은 힌트에 따라 손으로 고쳐 쓴 것입니다.

## 얼마나 구분하는가

HC3(사람과 챗봇의 답변이 함께 있는 공개 질의응답 데이터)에서 따로 떼어 둔 테스트 절반에서, 영어 규칙은 **챗봇 답변의 29%와 사람 답변의 2%**에서 하나 이상 표시했습니다. 중국어는 **24% 대 6%**입니다.

한계와 함께 읽어 주세요. 테스트 절반에는 영어 사람 답변 23,752개와 챗봇 답변 13,422개, 중국어는 각각 9,812개와 8,480개가 있습니다. 챗봇 답변은 출시 직후의 것이라 최신 모델의 어휘 규칙은 여기서 검증할 수 없습니다. 영어 챗봇 답변의 71%는 아무것도 걸리지 않았습니다. 밀도의 AUROC는 영어 0.63, 중국어 0.59라서 밀도만으로는 약한 탐지기입니다. 이 데이터에서 맞지 않은 규칙도 있으며 평가 페이지에 나와 있습니다. 방법과 규칙별 수치는 [docs/evaluation.md](docs/evaluation.md)에 있고 `npm run eval`로 다시 돌릴 수 있습니다.

## 명령

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| 명령                                      | 동작                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aisniff lint [files...]`                 | 파일을 검사합니다. 파일이 없으면 표준 입력을 읽습니다. 걸린 항목마다 위치, 신뢰도, 규칙, 설명, 힌트를 출력합니다.                                                                                                                                                                     |
| `aisniff lint --format json`              | 같은 결과를 JSON으로 출력합니다. 출처 URL, 유형별 건수, 밀도가 들어 있습니다.                                                                                                                                                                                                         |
| `aisniff lint --format github`            | 걸린 항목마다 GitHub Actions 주석을 하나씩 출력합니다.                                                                                                                                                                                                                                |
| `aisniff lint --min-confidence medium`    | 약한 신호를 숨깁니다. 값: `low`, `medium`, `high`.                                                                                                                                                                                                                                    |
| `aisniff lint --max-density 20`           | 1,000단위당 건수가 이 숫자를 넘으면 종료 코드 1로 끝납니다.                                                                                                                                                                                                                           |
| `aisniff lint --max-weighted-density 8.7` | 가중 밀도(웹 미터와 같은 척도)가 이 숫자를 넘으면 종료 코드 1로 끝납니다.                                                                                                                                                                                                             |
| `aisniff lint --disable en.promo`         | 규칙 하나, 또는 `en.promo` 같은 접두어 아래의 모든 규칙을 건너뜁니다. 여러 번 지정할 수 있습니다.                                                                                                                                                                                     |
| `aisniff lint docs/`                      | 폴더와 하위 폴더의 `.md`, `.markdown`, `.mdx`, `.txt` 파일을 검사합니다.                                                                                                                                                                                                              |
| `aisniff lint --markdown off`             | Markdown 파일을 일반 텍스트로 검사합니다. 기본적으로 `.md`, `.markdown`, `.mdx` 파일의 코드 블록, 인라인 코드, 프런트 매터, 주석, 링크 주소는 건너뜁니다. 값: `auto`, `on`, `off`.                                                                                                    |
| `.aisniff.json`                           | 프로젝트에 같은 옵션을 설정합니다: `format`, `minConfidence`, `maxDensity`, `maxWeightedDensity`, `disable`, `markdown`, `lang`, `locale`. 현재 폴더에서 저장소 루트까지 올라가며 찾습니다. 명령줄 플래그가 우선합니다. `--config FILE`은 파일을 지정하고 `--no-config`는 무시합니다. |
| `aisniff lint --lang en`                  | 규칙 팩 하나만 불러옵니다. 값: `auto`, `en`, `zh-TW`.                                                                                                                                                                                                                                 |
| `aisniff lint --locale zh-TW`             | 설명과 힌트를 번체 중국어로 표시합니다.                                                                                                                                                                                                                                               |
| `aisniff rules`                           | 61개 규칙 전체를 신뢰도와 함께 나열합니다.                                                                                                                                                                                                                                            |
| `aisniff explain <rule-id>`               | 규칙 하나를 통과 예시와 실패 예시, 출처와 함께 보여 줍니다.                                                                                                                                                                                                                           |

종료 코드: 0은 한도 안에서 검사 완료, 1은 한도 초과, 2는 사용법 오류입니다. 텍스트 출력의 마지막 줄에는 패턴을 재는 것이지 작성자를 재는 것이 아니라고 적힙니다.

## 편집기

[라이브 데모](https://arthur031221.github.io/AiSniff/)를 열거나 `npm install && npm run dev`를 실행하세요.

- 표시 위에 올리거나 탭하면 규칙, 고쳐쓰기 힌트, 출처가 나옵니다. 일부 규칙은 한 번에 고쳐 주며 실행 취소도 그대로 동작합니다.
- 사이드 패널이 걸린 항목을 유형별로 묶습니다. 미터는 1,000단어 또는 1,000자당 건수를 보여 주며, 세는 것은 패턴이지 작성자가 아니라고 밝힙니다.
- 비교 탭에 수정 전과 수정 후 글을 놓고 건수 변화를 볼 수 있습니다.
- 표시가 달린 글을 PNG로 저장할 수 있습니다.
- 버튼을 누르거나 편집기에 끌어다 놓아 2 MB 이하의 `.txt`, `.md`, `.markdown`, `.mdx` 파일을 열 수 있습니다. 파일은 브라우저 안에서만 읽습니다. 웹 편집기는 Markdown을 일반 텍스트로 검사하므로 코드 블록을 건너뛰려면 CLI를 쓰세요.
- 인터페이스 언어 9개: English, 繁體中文, 简体中文, 日本語, 한국어, Español, Français, Deutsch, Português (BR). 규칙 설명은 영어와 번체 중국어로 제공됩니다.
- 간체 중국어 입력은 위치를 유지하는 글자 단위 변환을 거쳐 번체 중국어 규칙으로 검사합니다.

## 설치

<details>
<summary>웹</summary>

[라이브 데모](https://arthur031221.github.io/AiSniff/)를 사용하세요. 붙여 넣은 글은 페이지 밖으로 나가지 않습니다. 직접 호스팅하려면 `npm run build:web`을 실행하고 `dist/web`을 서비스하세요.

</details>

<details>
<summary>명령줄</summary>

Node 22 이상이 필요합니다. CI는 22와 24로 돌립니다.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

체크아웃에서는 `npm install && npm run build:cli && npm link`를 쓰세요. npm 패키지 이름은 `aisniff-cli`, 명령은 `aisniff`입니다.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

그런 다음 "AiSniff로 이 초안을 검사해 줘"라고 요청하세요. 프로젝트 안의 `<agent-dir>/skills/aisniff`에 두면 그 프로젝트에만 적용됩니다.

</details>

<details>
<summary>Codex 및 기타 에이전트</summary>

`skills/aisniff/SKILL.md`를 저장소에 복사해 `AGENTS.md`에서 가리키거나, 본문을 에이전트 지시문에 붙여 넣으세요. 에이전트에 필요한 것은 `npx`를 실행할 수 있는 셸뿐입니다.

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## 규칙의 출처

각 규칙은 공개 출처 여섯 곳 중 하나를 인용합니다. 위키백과 가이드 [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW), [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw)의 패턴 목록, 중국어 위키백과의 [歐化中文](https://zh.wikipedia.org/wiki/歐化中文), 그리고 [Kobak 등의 2025년 Science Advances 과잉 어휘 연구](https://www.science.org/doi/10.1126/sciadv.adt3813)입니다. 이 목록들은 고쳐쓰기를 위한 글 가이드입니다. AiSniff는 그 패턴을 규칙으로 만들어 예시로 테스트하고 데이터로 측정했으며, 데이터와 어긋난 규칙은 뺐습니다. 모든 규칙에는 테스트로 실행되는 통과 예시와 실패 예시가 있고, `npm run check:sources`가 출처 링크와 절이 있는지 확인합니다.

일부 용어 규칙은 번체 중국어에 섞인 중국 본토 표현(예: 軟件, 視頻)을 표시합니다. 이는 대만 표현과 다른 말씨를 표시하는 것이며 AI의 특징이 아닙니다.

## 한계

- 공개된 목록에 있는 표현을 찾을 뿐입니다. 그 표현을 피하는 모델이나 즐겨 쓰는 사람에게는 맞지 않습니다.
- 격식체 글, 제2언어로 쓴 글, 예스러운 글도 규칙에 걸립니다.
- 영어와 중국어만 지원합니다. 다른 언어는 검사하지 않습니다.
- 미터의 "많은 패턴"은 HC3 사람 답변의 99번째 백분위수(1,000단위당 가중 건수 8.7과 13.0)입니다. 짧은 질의응답 글에서 얻은 기준선이며 판정 기준이 아닙니다.

## 문서

[설치](docs/install.md) · [사용법](docs/usage.md) · [설정](docs/config.md) · [아키텍처](docs/architecture.md) · [규칙 작성](docs/rules.md) · [평가](docs/evaluation.md) · [기여](CONTRIBUTING.md)

간체에서 번체로의 변환표는 OpenCC(Apache-2.0)에서 가져왔습니다. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 보세요.

Assisted by Claude/Codex.
