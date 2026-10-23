<div align="center">

# AiSniff

**Pega un texto y mira qué frases suenan a escritas por una IA.**

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

[Demo en vivo](https://arthur031221.github.io/AiSniff/) · [Documentación](docs/usage.md) · [MIT](LICENSE)

<img src="assets/demo.gif" alt="Escribir un párrafo en AiSniff. Las frases se subrayan y, al pasar el cursor, aparecen la regla, una sugerencia de reescritura y la fuente." width="820">

</div>

AiSniff marca las frases exactas de un texto en inglés o chino que coinciden con patrones de escritura de IA documentados. Cada marca nombra su regla, cita una fuente pública y propone una reescritura sencilla. Funciona como editor web, CLI y skill para agentes con un único conjunto de reglas JSON, y no necesita servidor ni llamadas a ningún modelo.

**Informa de patrones, no de autoría.** Un resultado limpio no prueba que lo escribiera una persona, y una coincidencia no prueba que lo escribiera un modelo.

## Qué hace con un texto

| Antes                                                                                                                                                        | Después                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| In today's fast-paced world, our update is a game-changer that unlocks your full potential. We are committed to excellence, and we are thrilled to share it. | Version 2.1 fixes the crash on startup when the config file is empty. Details are in the changelog. |
| **3 coincidencias**: `en.opener.todays-world`, `en.promo.commitment`                                                                                         | **0 coincidencias**                                                                                 |
| 在當今快速發展的數位時代，溝通至關重要。                                                                                                                     | 這封信想請你在週五前確認報價。                                                                      |
| **2 coincidencias**: `zh-TW.opener.era-hat`, `zh-TW.significance.vocab`                                                                                      | **0 coincidencias**                                                                                 |

Los números salen de ejecutar `aisniff lint` sobre estas frases. La columna derecha se reescribió a mano siguiendo las sugerencias.

## Cuánto separa

En respuestas reservadas de HC3 (un conjunto público de preguntas con respuestas humanas y de chatbot), las reglas en inglés marcaron al menos una frase en **el 29% de las respuestas de chatbot y el 2% de las humanas**. En chino fue **24% y 6%**.

Lee la cifra con sus límites. La mitad de prueba tiene 23.752 respuestas humanas y 13.422 de chatbot en inglés, y 9.812 y 8.480 en chino. Las respuestas de chatbot son de sus primeros meses, así que las reglas de vocabulario de modelos más nuevos no se pueden comprobar con ellas. El 71% de las respuestas de chatbot en inglés no tuvo ninguna coincidencia. El AUROC de la densidad es 0,63 en inglés y 0,59 en chino, así que la densidad sola es un detector débil. Algunas reglas no resistieron estos datos y la página de evaluación las lista. El método y los recuentos por regla están en [docs/evaluation.md](docs/evaluation.md). Puedes repetirlo con `npm run eval`.

## Comandos

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

| Comando                                   | Qué hace                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `aisniff lint [files...]`                 | Analiza archivos, o la entrada estándar si no das ninguno. Imprime cada coincidencia con posición, confianza, regla, mensaje y sugerencia. |
| `aisniff lint --format json`              | Las mismas coincidencias en JSON, con URL de fuentes, recuentos por tipo y densidad.                                                       |
| `aisniff lint --format github`            | Una anotación de GitHub Actions por coincidencia.                                                                                          |
| `aisniff lint --min-confidence medium`    | Oculta las señales débiles. Valores: `low`, `medium`, `high`.                                                                              |
| `aisniff lint --max-density 20`           | Sale con código 1 cuando las coincidencias por 1.000 unidades superan el número.                                                           |
| `aisniff lint --max-weighted-density 8.7` | Sale con código 1 cuando la densidad ponderada, la escala del medidor web, supera el número.                                               |
| `aisniff lint --disable en.promo`         | Omite una regla, o todas las de un prefijo como `en.promo`. Repite la opción para omitir más.                                              |
| `aisniff lint docs/`                      | Recorre una carpeta y sus subcarpetas en busca de archivos `.md`, `.markdown`, `.mdx` y `.txt`.                                            |
| `aisniff lint --lang en`                  | Carga un solo paquete de reglas. Valores: `auto`, `en`, `zh-TW`.                                                                           |
| `aisniff lint --locale zh-TW`             | Mensajes y sugerencias en chino tradicional.                                                                                               |
| `aisniff rules`                           | Lista las 61 reglas con su confianza.                                                                                                      |
| `aisniff explain <rule-id>`               | Muestra una regla con ejemplos que pasan y que fallan, y su fuente.                                                                        |

Códigos de salida: 0 análisis dentro del límite, 1 límite superado, 2 uso incorrecto. La salida de texto termina con una línea que dice que mide patrones, no autoría.

## El editor

Abre la [demo en vivo](https://arthur031221.github.io/AiSniff/) o ejecuta `npm install && npm run dev`.

- Pasa el cursor o toca una marca para ver la regla, la sugerencia y la fuente. Algunas reglas ofrecen una reescritura con un clic que respeta Deshacer.
- Un panel lateral agrupa las coincidencias por tipo. Un medidor muestra las coincidencias por 1.000 palabras o caracteres, con la aclaración de que cuenta patrones, no autoría.
- Una pestaña de comparación contiene un texto antes y otro después y muestra el cambio en el número de coincidencias.
- Guarda el texto anotado como PNG.
- Nueve idiomas de interfaz: English, 繁體中文, 简体中文, 日本語, 한국어, Español, Français, Deutsch, Português (BR). Los mensajes de las reglas existen en inglés y chino tradicional.
- El chino simplificado se revisa con las reglas de chino tradicional mediante una conversión carácter a carácter que conserva las posiciones.

## Instalación

<details>
<summary>Web</summary>

Usa la [demo en vivo](https://arthur031221.github.io/AiSniff/). Nada de lo que pegas sale de la página. Para alojarla tú, ejecuta `npm run build:web` y sirve `dist/web`.

</details>

<details>
<summary>Línea de comandos</summary>

Requiere Node 22 o superior. La CI usa 22 y 24.

```bash
npx github:Arthur031221/AiSniff lint draft.md
```

O desde una copia del repositorio: `npm install && npm run build:cli && npm link`. El paquete de npm se llama `aisniff-cli` y el comando es `aisniff`.

</details>

<details>
<summary>Agent skill</summary>

```bash
git clone https://github.com/Arthur031221/AiSniff.git
cp -r AiSniff/skills/aisniff ~/<agent-dir>/skills/aisniff
```

Después pide: "revisa este borrador con AiSniff". Usa `<agent-dir>/skills/aisniff` dentro de un proyecto para limitarlo a ese proyecto.

</details>

<details>
<summary>Codex y otros agentes</summary>

Copia `skills/aisniff/SKILL.md` a tu repositorio y enlázalo desde `AGENTS.md`, o pega su contenido en las instrucciones del agente. El agente solo necesita una shell para ejecutar `npx`.

</details>

<details>
<summary>GitHub Actions</summary>

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx github:Arthur031221/AiSniff lint --format github --max-density 20 docs/*.md
```

</details>

## De dónde salen las reglas

Cada regla cita una de seis fuentes públicas: la guía de Wikipedia [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), las listas de patrones de [blader/humanizer](https://github.com/blader/humanizer), [Humanizer-zh-TW](https://github.com/kevintsai1202/Humanizer-zh-TW) y [speak-human-tw](https://github.com/Raymondhou0917/speak-human-tw), la página de Wikipedia en chino sobre [歐化中文](https://zh.wikipedia.org/wiki/歐化中文) y el estudio de vocabulario en exceso de [Kobak et al., Science Advances 2025](https://www.science.org/doi/10.1126/sciadv.adt3813). Esas listas son guías en prosa para reescribir. AiSniff convierte sus patrones en reglas que se prueban con ejemplos y se miden con datos, y deja fuera las que los datos contradijeron. Cada regla tiene ejemplos que pasan y que fallan y que se ejecutan como pruebas, y `npm run check:sources` comprueba que cada enlace y sección existe.

Algunas reglas de léxico marcan usos del chino continental dentro del chino tradicional (por ejemplo 軟件 y 視頻). Marcan palabras distintas del uso de Taiwán. No son señales de IA.

## Límites

- Busca frases de listas publicadas. Un modelo que las evita, o una persona que las usa, lo engaña.
- La escritura formal, en una segunda lengua o anticuada activará reglas.
- Solo inglés y chino. Otros idiomas no se revisan.
- La línea de "muchos patrones" del medidor es el percentil 99 de las respuestas humanas de HC3 (8,6 y 13,0 coincidencias ponderadas por 1.000 unidades). Sale de texto corto de preguntas y respuestas y es una referencia, no un umbral de decisión.

## Documentación

[Instalación](docs/install.md) · [Uso](docs/usage.md) · [Configuración](docs/config.md) · [Arquitectura](docs/architecture.md) · [Escribir una regla](docs/rules.md) · [Evaluación](docs/evaluation.md) · [Contribuir](CONTRIBUTING.md)

La tabla de simplificado a tradicional viene de OpenCC (Apache-2.0), véase [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Assisted by Claude/Codex.
