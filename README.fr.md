<div align="center">

# AiSniff

**Collez un texte et voyez quelles phrases sonnent comme écrites par une IA.**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[Démo en ligne](https://arthur031221.github.io/AiSniff/) · [Documentation](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="Saisie d'un paragraphe dans AiSniff. Les passages sont soulignés et, au survol, on voit la règle, une piste de réécriture et la source." width="820">

</div>

AiSniff repère les passages exacts d'un texte anglais ou chinois qui correspondent à des motifs d'écriture d'IA documentés. Chaque marque nomme sa règle, cite une source publique et propose une réécriture simple. Il existe en éditeur web, en CLI et en skill d'agent à partir d'un seul jeu de règles JSON, sans serveur et sans appel à un modèle.

**Il signale des motifs, pas un auteur.** Un résultat vide ne prouve pas qu'une personne a écrit le texte, et une détection ne prouve pas qu'un modèle l'a fait.

## Ce qu'il fait à un texte

| Avant                                                                                                                                                        | Après                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 détections**: `en.opener.todays-world`, `en.promo.commitment`                                                                                            | **0 détection**                                                                                     |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 détections**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                         | **0 détection**                                                                                     |

Les nombres viennent de `aisniff lint` exécuté sur ces phrases. La colonne de droite a été réécrite à la main d'après les pistes.

## Dans quelle mesure il sépare les deux

Sur des réponses mises de côté de HC3 (un jeu public de questions avec réponses humaines et de chatbot), les règles anglaises ont marqué au moins un passage dans **29 % des réponses de chatbot et 2 % des réponses humaines**. En chinois : **24 % et 6 %**.

Lisez ce chiffre avec ses limites. La moitié test contient 23 752 réponses humaines et 13 422 de chatbot en anglais, et 9 812 et 8 480 en chinois. Les réponses de chatbot datent de ses premiers mois, donc les règles de vocabulaire des modèles plus récents ne peuvent pas y être vérifiées. 71 % des réponses anglaises de chatbot n'avaient aucune détection. L'AUROC de la densité est de 0,63 en anglais et 0,59 en chinois : la densité seule est un détecteur faible. Certaines règles n'ont pas résisté à ces données, et la page d'évaluation les liste. La méthode et les comptes par règle sont dans [docs/evaluation.md](docs/evaluation.md). Relancez avec `npm run eval`.

## Commandes

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| Commande                                  | Effet                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aisniff lint [files...]`                 | Analyse des fichiers, ou l'entrée standard sans fichier. Affiche chaque détection avec position, confiance, règle, message et piste.                                                                                                                                                                                                  |
| `aisniff lint --format json`              | Les mêmes détections en JSON, avec les URL des sources, les comptes par type et la densité.                                                                                                                                                                                                                                           |
| `aisniff lint --format github`            | Une annotation GitHub Actions par détection.                                                                                                                                                                                                                                                                                          |
| `aisniff lint --min-confidence medium`    | Masque les signaux faibles. Valeurs : `low`, `medium`, `high`.                                                                                                                                                                                                                                                                        |
| `aisniff lint --max-density 20`           | Sort avec le code 1 quand les détections pour 1 000 unités dépassent ce nombre.                                                                                                                                                                                                                                                       |
| `aisniff lint --max-weighted-density 8.7` | Sort avec le code 1 quand la densité pondérée, l'échelle du compteur web, dépasse ce nombre.                                                                                                                                                                                                                                          |
| `aisniff lint --disable en.promo`         | Ignore une règle, ou toutes celles d'un préfixe comme `en.promo`. Répétez l'option pour en ignorer d'autres.                                                                                                                                                                                                                          |
| `aisniff lint docs/`                      | Parcourt un dossier et ses sous-dossiers à la recherche de fichiers `.md`, `.markdown`, `.mdx` et `.txt`.                                                                                                                                                                                                                             |
| `aisniff lint --markdown off`             | Analyse les fichiers Markdown comme du texte brut. Par défaut, les blocs de code, le code en ligne, le front matter, les commentaires et les adresses de liens des fichiers `.md`, `.markdown` et `.mdx` sont ignorés. Valeurs : `auto`, `on`, `off`.                                                                                 |
| `.aisniff.json`                           | Définit les mêmes options pour un projet : `format`, `minConfidence`, `maxDensity`, `maxWeightedDensity`, `disable`, `markdown`, `lang`, `locale`. Le fichier est cherché du dossier courant jusqu'à la racine du dépôt. Les options de la ligne de commande l'emportent. `--config FILE` choisit un fichier, `--no-config` l'ignore. |
| `aisniff lint --lang en`                  | Charge un seul pack de règles. Valeurs : `auto`, `en`, `zh-TW`.                                                                                                                                                                                                                                                                       |
| `aisniff lint --locale zh-TW`             | Messages et pistes en chinois traditionnel.                                                                                                                                                                                                                                                                                           |
| `aisniff rules`                           | Liste les 61 règles avec leur confiance.                                                                                                                                                                                                                                                                                              |
| `aisniff explain <rule-id>`               | Montre une règle avec ses exemples qui passent et qui échouent, et sa source.                                                                                                                                                                                                                                                         |

Codes de sortie : 0 analyse dans la limite, 1 limite dépassée, 2 usage incorrect. La sortie texte se termine par une ligne disant qu'il mesure des motifs, pas l'auteur.

## L'éditeur

Ouvrez la [démo en ligne](https://arthur031221.github.io/AiSniff/) ou lancez `npm install && npm run dev`.

- Survolez ou touchez une marque pour voir la règle, la piste de réécriture et la source. Certaines règles proposent une réécriture en un clic qui garde Annuler fonctionnel.
- Un panneau latéral regroupe les détections par type. Un indicateur affiche les détections pour 1 000 mots ou caractères, en précisant qu'il compte des motifs, pas un auteur.
- Un onglet de comparaison contient un texte avant et un texte après et montre l'évolution du nombre de détections.
- Enregistrez le texte annoté en PNG.
- Ouvrez un fichier `.txt`, `.md`, `.markdown` ou `.mdx` de 2 Mo au plus avec le bouton ou en le déposant sur l'éditeur. Le fichier est lu dans le navigateur. L'éditeur web analyse le Markdown comme du texte brut ; pour ignorer les blocs de code, utilisez la CLI.
- Neuf langues d'interface : English, 繁體中文, 简体中文, 日本語, 한국어, Español, Français, Deutsch, Português (BR). Les messages des règles existent en anglais et en chinois traditionnel.
- Le chinois simplifié est vérifié par les règles du chinois traditionnel grâce à une conversion caractère par caractère qui conserve les positions.

## Installation

<details>
<summary>Web</summary>

Utilisez la [démo en ligne](https://arthur031221.github.io/AiSniff/). Rien de ce que vous collez ne quitte la page. Pour l'héberger vous-même, lancez `npm run build:web` et servez `dist/web`.

</details>

<details>
<summary>Ligne de commande</summary>

Nécessite Node 22 ou plus. La CI utilise 22 et 24.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

Ou depuis un clone : `npm install && npm run build:cli && npm link`. Le paquet npm s'appelle `aisniff-cli`, la commande est `aisniff`.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

Demandez ensuite : « vérifie ce brouillon avec AiSniff ». Utilisez `<agent-dir>/skills/aisniff` dans un projet pour le limiter à ce projet.

</details>

<details>
<summary>Codex et autres agents</summary>

Copiez `skills/aisniff/SKILL.md` dans votre dépôt et pointez vers lui depuis `AGENTS.md`, ou collez son contenu dans les instructions de l'agent. L'agent n'a besoin que d'un shell pour lancer `npx`.

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

## D'où viennent les règles

Chaque règle cite l'une de six sources publiques : le guide Wikipédia [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), les listes de motifs de [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) et [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw), la page de Wikipédia en chinois sur [歐化中文](https://zh.wikipedia.org/wiki/歐化中文) et l'étude sur le vocabulaire en excès de [Kobak et al., Science Advances 2025](https://www.science.org/doi/10.1126/sciadv.adt3813). Ces listes sont des guides rédigés pour réécrire. AiSniff transforme leurs motifs en règles testées sur des exemples et mesurées sur des données, et écarte celles que les données contredisaient. Chaque règle a des exemples qui passent et qui échouent, exécutés comme tests, et `npm run check:sources` vérifie que chaque lien et chaque section existent.

Quelques règles de vocabulaire marquent des termes de la Chine continentale dans du chinois traditionnel (par exemple 軟件 et 視頻). Elles marquent une formulation différente de l'usage taïwanais. Ce ne sont pas des marques d'IA.

## Limites

- Il cherche des passages issus de listes publiées. Un modèle qui les évite, ou une personne qui les emploie, le met en défaut.
- Un texte formel, écrit dans une seconde langue ou à l'ancienne déclenchera des règles.
- Anglais et chinois seulement. Les autres langues ne sont pas vérifiées.
- La ligne « beaucoup de motifs » de l'indicateur est le 99e centile des réponses humaines de HC3 (8,6 et 13,0 détections pondérées pour 1 000 unités). Elle vient de textes courts de questions-réponses : c'est un repère, pas un seuil de décision.

## Documentation

[Installation](docs/install.md) · [Utilisation](docs/usage.md) · [Configuration](docs/config.md) · [Architecture](docs/architecture.md) · [Écrire une règle](docs/rules.md) · [Évaluation](docs/evaluation.md) · [Contribuer](CONTRIBUTING.md)

La table simplifié vers traditionnel vient d'OpenCC (Apache-2.0), voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Assisted by Claude/Codex.
