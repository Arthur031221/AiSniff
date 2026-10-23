#!/usr/bin/env bash
# Entry point of action.yml. Reads the action inputs from INPUT_* variables and runs aisniff lint.
# AISNIFF_BIN replaces the built CLI, which the tests use.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bin="${AISNIFF_BIN:-$here/dist/cli/aisniff.mjs}"

args=(lint --format "${INPUT_FORMAT:-github}")
add() { [[ -n "${2:-}" ]] && args+=("$1" "$2"); return 0; }
add --max-density "${INPUT_MAX_DENSITY:-}"
add --max-weighted-density "${INPUT_MAX_WEIGHTED_DENSITY:-}"
add --min-confidence "${INPUT_MIN_CONFIDENCE:-}"
add --lang "${INPUT_LANG:-}"
add --markdown "${INPUT_MARKDOWN:-}"
add --config "${INPUT_CONFIG:-}"

# Rule ids and prefixes may be separated by commas, spaces or new lines.
disable="${INPUT_DISABLE:-}"
for rule in ${disable//,/ }; do args+=(--disable "$rule"); done

# Paths are split on white space and left to the shell to expand, so docs/*.md works.
paths=()
for p in ${INPUT_PATHS:-.}; do paths+=("$p"); done

if [[ "$bin" == *.mjs ]]; then exec node "$bin" "${args[@]}" "${paths[@]}"; fi
exec "$bin" "${args[@]}" "${paths[@]}"
