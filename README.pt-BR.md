<div align="center">

# AiSniff

**Cole um texto e veja quais trechos soam como escritos por IA.**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[Demo ao vivo](https://arthur031221.github.io/AiSniff/) · [Documentação](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="Digitando um parágrafo no AiSniff. Os trechos ficam sublinhados e, ao passar o cursor, aparecem a regra, uma dica de reescrita e a fonte." width="820">

</div>

O AiSniff marca os trechos exatos de um texto em inglês ou chinês que seguem padrões documentados de escrita de IA. Cada marca nomeia a regra, cita uma fonte pública e sugere uma reescrita simples. Funciona como editor web, CLI e skill para agentes a partir de um único conjunto de regras JSON, sem servidor e sem chamar nenhum modelo.

**Ele mostra padrões, não autoria.** Um resultado limpo não prova que uma pessoa escreveu o texto, e uma ocorrência não prova que foi um modelo.

## O que ele faz com um texto

| Antes                                                                                                                                                        | Depois                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 ocorrências**: `en.opener.todays-world`, `en.promo.commitment`                                                                                           | **0 ocorrências**                                                                                   |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 ocorrências**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                        | **0 ocorrências**                                                                                   |

As contagens vêm de `aisniff lint` rodando exatamente nessas frases. A coluna da direita foi reescrita à mão, seguindo as dicas.

## O quanto ele separa

Em respostas reservadas do HC3 (um conjunto público de perguntas com respostas humanas e do chatbot), as regras em inglês marcaram pelo menos um trecho em **29% das respostas do chatbot e 2% das humanas**. Em chinês foram **24% e 6%**.

Leia o número junto com os limites. A metade de teste tem 23.752 respostas humanas e 13.422 do chatbot em inglês, e 9.812 e 8.480 em chinês. As respostas do chatbot são dos primeiros meses dele, então as regras de vocabulário de modelos mais novos não podem ser conferidas nelas. 71% das respostas do chatbot em inglês não tiveram nenhuma ocorrência. O AUROC da densidade é 0,63 em inglês e 0,59 em chinês, então a densidade sozinha é um detector fraco. Algumas regras não resistiram a esses dados, e a página de avaliação as lista. O método e as contagens por regra estão em [docs/evaluation.md](docs/evaluation.md). Rode de novo com `npm run eval`.

## Comandos

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| Comando                                   | O que faz                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `aisniff lint [files...]`                 | Analisa arquivos, ou a entrada padrão se nenhum for dado. Imprime cada ocorrência com posição, confiança, regra, mensagem e dica. |
| `aisniff lint --format json`              | As mesmas ocorrências em JSON, com URLs das fontes, contagens por tipo e a densidade.                                             |
| `aisniff lint --format github`            | Uma anotação do GitHub Actions por ocorrência.                                                                                    |
| `aisniff lint --min-confidence medium`    | Oculta sinais fracos. Valores: `low`, `medium`, `high`.                                                                           |
| `aisniff lint --max-density 20`           | Sai com código 1 quando as ocorrências por 1.000 unidades passam do número.                                                       |
| `aisniff lint --max-weighted-density 8.7` | Sai com código 1 quando a densidade ponderada, a escala do medidor web, passa do número.                                          |
| `aisniff lint --disable en.promo`         | Ignora uma regra, ou todas as de um prefixo como `en.promo`. Repita a opção para ignorar mais.                                    |
| `aisniff lint docs/`                      | Percorre uma pasta e suas subpastas em busca de arquivos `.md`, `.markdown`, `.mdx` e `.txt`.                                     |
| `aisniff lint --lang en`                  | Carrega um único pacote de regras. Valores: `auto`, `en`, `zh-TW`.                                                                |
| `aisniff lint --locale zh-TW`             | Mensagens e dicas em chinês tradicional.                                                                                          |
| `aisniff rules`                           | Lista as 61 regras com a confiança de cada uma.                                                                                   |
| `aisniff explain <rule-id>`               | Mostra uma regra com exemplos que passam e que falham, e sua fonte.                                                               |

Códigos de saída: 0 análise dentro do limite, 1 limite excedido, 2 uso incorreto. A saída de texto termina com uma linha dizendo que mede padrões, não autoria.

## O editor

Abra a [demo ao vivo](https://arthur031221.github.io/AiSniff/) ou rode `npm install && npm run dev`.

- Passe o cursor ou toque numa marca para ver a regra, a dica de reescrita e a fonte. Algumas regras oferecem uma reescrita com um clique que mantém o Desfazer funcionando.
- Um painel lateral agrupa as ocorrências por tipo. Um medidor mostra as ocorrências por 1.000 palavras ou caracteres e avisa que conta padrões, não autoria.
- Uma aba de comparação guarda um texto antes e outro depois e mostra a mudança na contagem.
- Salve o texto anotado como PNG.
- Nove idiomas de interface: English, 繁體中文, 简体中文, 日本語, 한국어, Español, Français, Deutsch, Português (BR). As mensagens das regras existem em inglês e chinês tradicional.
- O chinês simplificado é verificado pelas regras do chinês tradicional por meio de uma conversão caractere a caractere que preserva as posições.

## Instalação

<details>
<summary>Web</summary>

Use a [demo ao vivo](https://arthur031221.github.io/AiSniff/). Nada do que você cola sai da página. Para hospedar você mesmo, rode `npm run build:web` e sirva `dist/web`.

</details>

<details>
<summary>Linha de comando</summary>

Requer Node 22 ou mais novo. A CI usa 22 e 24.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

Ou a partir de um clone: `npm install && npm run build:cli && npm link`. O pacote npm se chama `aisniff-cli` e o comando é `aisniff`.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

Depois peça: "verifique este rascunho com o AiSniff". Use `<agent-dir>/skills/aisniff` dentro de um projeto para limitar a esse projeto.

</details>

<details>
<summary>Codex e outros agentes</summary>

Copie `skills/aisniff/SKILL.md` para o seu repositório e aponte para ele a partir do `AGENTS.md`, ou cole o conteúdo nas instruções do agente. O agente só precisa de um shell para rodar `npx`.

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## De onde vêm as regras

Cada regra cita uma de seis fontes públicas: o guia da Wikipédia [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), as listas de padrões de [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) e [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw), a página da Wikipédia em chinês sobre [歐化中文](https://zh.wikipedia.org/wiki/歐化中文) e o estudo de vocabulário em excesso de [Kobak et al., Science Advances 2025](https://www.science.org/doi/10.1126/sciadv.adt3813). Essas listas são guias em prosa para reescrever. O AiSniff transforma os padrões delas em regras testadas com exemplos e medidas com dados, e deixa de fora as que os dados contradisseram. Toda regra tem exemplos que passam e que falham, executados como testes, e `npm run check:sources` confere se cada link e seção de fonte existe.

Algumas regras de vocabulário marcam usos do chinês continental dentro do chinês tradicional (por exemplo 軟件 e 視頻). Elas marcam palavras diferentes do uso de Taiwan. Não são sinais de IA.

## Limites

- Ele procura trechos de listas publicadas. Um modelo que os evita, ou uma pessoa que os usa, engana o detector.
- Escrita formal, em segunda língua ou antiquada vai disparar regras.
- Só inglês e chinês. Outros idiomas não são verificados.
- A linha de "muitos padrões" do medidor é o percentil 99 das respostas humanas do HC3 (8,6 e 13,0 ocorrências ponderadas por 1.000 unidades). Vem de textos curtos de perguntas e respostas e é uma referência, não um limiar de decisão.

## Documentação

[Instalação](docs/install.md) · [Uso](docs/usage.md) · [Configuração](docs/config.md) · [Arquitetura](docs/architecture.md) · [Escrever uma regra](docs/rules.md) · [Avaliação](docs/evaluation.md) · [Contribuir](CONTRIBUTING.md)

A tabela de simplificado para tradicional vem do OpenCC (Apache-2.0), veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Assisted by Claude/Codex.
