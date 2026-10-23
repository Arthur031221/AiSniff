<div align="center">

# AiSniff

**Text einfügen und sehen, welche Formulierungen nach KI klingen.**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[Live-Demo](https://arthur031221.github.io/AiSniff/) · [Dokumentation](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="Ein Absatz wird in AiSniff getippt. Formulierungen werden unterstrichen, und beim Darüberfahren erscheinen Regel, Umformulierungstipp und Quelle." width="820">

</div>

AiSniff markiert in englischen und chinesischen Texten genau die Formulierungen, die dokumentierten KI-Schreibmustern entsprechen. Jede Markierung nennt ihre Regel, belegt sie mit einer öffentlichen Quelle und schlägt eine schlichte Umformulierung vor. Aus einem Satz JSON-Regeln entstehen Web-Editor, CLI und Agent-Skill, ohne Server und ohne Modellaufruf.

**Es meldet Muster, keine Urheberschaft.** Ein leeres Ergebnis beweist nicht, dass ein Mensch den Text schrieb, und ein Treffer beweist nicht, dass es ein Modell war.

## Was es mit einem Text macht

| Vorher                                                                                                                                                       | Nachher                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 Treffer**: `en.opener.todays-world`, `en.promo.commitment`                                                                                               | **0 Treffer**                                                                                       |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 Treffer**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                            | **0 Treffer**                                                                                       |

Die Trefferzahlen stammen von `aisniff lint` auf genau diesen Sätzen. Die rechte Spalte wurde nach den Tipps von Hand umgeschrieben.

## Wie gut es trennt

Auf zurückgehaltenen Antworten aus HC3 (ein öffentlicher Satz Fragen mit menschlichen und Chatbot-Antworten) markierten die englischen Regeln in **29 % der Chatbot-Antworten und 2 % der menschlichen Antworten** mindestens eine Formulierung. Für Chinesisch waren es **24 % und 6 %**.

Bitte mit den Grenzen lesen. Die Testhälfte enthält 23.752 menschliche und 13.422 Chatbot-Antworten auf Englisch sowie 9.812 und 8.480 auf Chinesisch. Die Chatbot-Antworten stammen aus den ersten Monaten nach der Veröffentlichung, daher lassen sich die Vokabelregeln für neuere Modelle damit nicht prüfen. 71 % der englischen Chatbot-Antworten hatten gar keinen Treffer. Der AUROC der Dichte liegt bei 0,63 für Englisch und 0,59 für Chinesisch, die Dichte allein ist also ein schwacher Detektor. Einige Regeln hielten diesen Daten nicht stand, die Auswertungsseite listet sie. Methode und Zahlen je Regel stehen in [docs/evaluation.md](docs/evaluation.md). Mit `npm run eval` lässt es sich wiederholen.

## Befehle

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| Befehl                                    | Wirkung                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `aisniff lint [files...]`                 | Prüft Dateien, ohne Angabe die Standardeingabe. Gibt jeden Treffer mit Position, Sicherheit, Regel, Meldung und Tipp aus. |
| `aisniff lint --format json`              | Dieselben Treffer als JSON, mit Quell-URLs, Zahlen je Art und der Dichte.                                                 |
| `aisniff lint --format github`            | Eine GitHub-Actions-Anmerkung je Treffer.                                                                                 |
| `aisniff lint --min-confidence medium`    | Blendet schwache Signale aus. Werte: `low`, `medium`, `high`.                                                             |
| `aisniff lint --max-density 20`           | Beendet mit Code 1, wenn die Treffer pro 1.000 Einheiten die Zahl überschreiten.                                          |
| `aisniff lint --max-weighted-density 8.7` | Beendet mit Code 1, wenn die gewichtete Dichte, die Skala der Web-Anzeige, die Zahl überschreitet.                        |
| `aisniff lint --disable en.promo`         | Überspringt eine Regel oder alle Regeln unter einem Präfix wie `en.promo`. Die Option lässt sich wiederholen.             |
| `aisniff lint docs/`                      | Durchsucht einen Ordner und seine Unterordner nach `.md`-, `.markdown`-, `.mdx`- und `.txt`-Dateien.                      |
| `aisniff lint --lang en`                  | Lädt nur ein Regelpaket. Werte: `auto`, `en`, `zh-TW`.                                                                    |
| `aisniff lint --locale zh-TW`             | Meldungen und Tipps auf traditionellem Chinesisch.                                                                        |
| `aisniff rules`                           | Listet alle 61 Regeln mit ihrer Sicherheit.                                                                               |
| `aisniff explain <rule-id>`               | Zeigt eine Regel mit bestehenden und nicht bestehenden Beispielen und ihrer Quelle.                                       |

Exit-Codes: 0 geprüft und im Limit, 1 Limit überschritten, 2 falsche Verwendung. Die Textausgabe endet mit einer Zeile, die sagt, dass Muster gemessen werden und keine Urheberschaft.

## Der Editor

Öffne die [Live-Demo](https://arthur031221.github.io/AiSniff/) oder führe `npm install && npm run dev` aus.

- Über eine Markierung fahren oder sie antippen zeigt Regel, Umformulierungstipp und Quelle. Manche Regeln bieten eine Umformulierung per Klick an, Rückgängig funktioniert weiter.
- Ein Seitenfeld gruppiert die Treffer nach Art. Eine Anzeige zeigt Treffer pro 1.000 Wörter oder Zeichen und vermerkt, dass sie Muster zählt und keine Urheberschaft.
- Ein Vergleichs-Tab nimmt einen Vorher- und einen Nachher-Text auf und zeigt die Änderung der Trefferzahl.
- Der markierte Text lässt sich als PNG speichern.
- Neun Oberflächensprachen: English, 繁體中文, 简体中文, 日本語, 한국어, Español, Français, Deutsch, Português (BR). Die Regelmeldungen gibt es auf Englisch und traditionellem Chinesisch.
- Vereinfachtes Chinesisch wird mit den Regeln für traditionelles Chinesisch geprüft, über eine Zeichen-für-Zeichen-Umwandlung, die die Positionen erhält.

## Installation

<details>
<summary>Web</summary>

Nutze die [Live-Demo](https://arthur031221.github.io/AiSniff/). Nichts von dem, was du einfügst, verlässt die Seite. Zum eigenen Hosting `npm run build:web` ausführen und `dist/web` ausliefern.

</details>

<details>
<summary>Kommandozeile</summary>

Benötigt Node 22 oder neuer. Die CI läuft mit 22 und 24.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

Oder aus einem Checkout: `npm install && npm run build:cli && npm link`. Der npm-Paketname ist `aisniff-cli`, der Befehl `aisniff`.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

Dann bitten: "Prüfe diesen Entwurf mit AiSniff." Mit `<agent-dir>/skills/aisniff` in einem Projekt gilt es nur für dieses Projekt.

</details>

<details>
<summary>Codex und andere Agenten</summary>

Kopiere `skills/aisniff/SKILL.md` in dein Repository und verweise in `AGENTS.md` darauf, oder füge den Inhalt in die Anweisungen des Agenten ein. Der Agent braucht nur eine Shell, um `npx` auszuführen.

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## Woher die Regeln kommen

Jede Regel zitiert eine von sechs öffentlichen Quellen: den Wikipedia-Leitfaden [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), die Musterlisten von [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) und [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw), die chinesische Wikipedia-Seite zu [歐化中文](https://zh.wikipedia.org/wiki/歐化中文) und die Studie zu überhäufigem Vokabular von [Kobak et al., Science Advances 2025](https://www.science.org/doi/10.1126/sciadv.adt3813). Diese Listen sind Leitfäden in Prosa zum Umschreiben. AiSniff macht aus ihren Mustern Regeln, die an Beispielen getestet und an Daten gemessen werden, und lässt weg, was die Daten widerlegten. Jede Regel hat bestehende und nicht bestehende Beispiele, die als Tests laufen, und `npm run check:sources` prüft, ob jeder Quelllink und jeder Abschnitt existiert.

Einige Wortwahl-Regeln markieren festlandchinesischen Gebrauch in traditionellem Chinesisch (zum Beispiel 軟件 und 視頻). Sie markieren Wörter, die vom taiwanischen Gebrauch abweichen. Es sind keine KI-Merkmale.

## Grenzen

- Es sucht Formulierungen aus veröffentlichten Listen. Ein Modell, das sie meidet, oder ein Mensch, der sie benutzt, führt es in die Irre.
- Formelle, in einer Zweitsprache verfasste oder altmodische Texte lösen Regeln aus.
- Nur Englisch und Chinesisch. Andere Sprachen werden nicht geprüft.
- Die Linie "viele Muster" der Anzeige ist das 99. Perzentil der menschlichen HC3-Antworten (8,6 und 13,0 gewichtete Treffer pro 1.000 Einheiten). Sie stammt aus kurzen Frage-Antwort-Texten und ist eine Orientierung, keine Entscheidungsschwelle.

## Dokumentation

[Installation](docs/install.md) · [Verwendung](docs/usage.md) · [Konfiguration](docs/config.md) · [Architektur](docs/architecture.md) · [Eine Regel schreiben](docs/rules.md) · [Auswertung](docs/evaluation.md) · [Mitwirken](CONTRIBUTING.md)

Die Tabelle von vereinfacht zu traditionell stammt von OpenCC (Apache-2.0), siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Assisted by Claude/Codex.
