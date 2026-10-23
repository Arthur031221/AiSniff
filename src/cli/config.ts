import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const CONFIG_NAME = ".aisniff.json";

export interface Config {
  format?: string;
  minConfidence?: string;
  maxDensity?: number;
  maxWeightedDensity?: number;
  disable?: string[];
  markdown?: string;
  lang?: string;
  locale?: string;
}

const STRINGS = ["format", "minConfidence", "markdown", "lang", "locale"] as const;
const NUMBERS = ["maxDensity", "maxWeightedDensity"] as const;

export class ConfigError extends Error {}

/** The closest .aisniff.json from `from` upwards, stopping after the folder that holds .git. */
export function findConfig(from: string): string | undefined {
  let dir = resolve(from);
  for (;;) {
    const candidate = join(dir, CONFIG_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (existsSync(join(dir, ".git")) || parent === dir) return undefined;
    dir = parent;
  }
}

export function loadConfig(path: string): Config {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new ConfigError(`cannot read ${path}: ${(e as Error).message}`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data))
    throw new ConfigError(`${path} must hold a JSON object`);
  const known = new Set<string>([...STRINGS, ...NUMBERS, "disable"]);
  for (const key of Object.keys(data))
    if (!known.has(key))
      throw new ConfigError(`${path}: unknown key "${key}". Known keys: ${[...known].join(", ")}`);
  const config = data as Record<string, unknown>;
  for (const key of STRINGS)
    if (config[key] !== undefined && typeof config[key] !== "string")
      throw new ConfigError(`${path}: "${key}" must be a string`);
  for (const key of NUMBERS)
    if (
      config[key] !== undefined &&
      !(typeof config[key] === "number" && Number.isFinite(config[key]))
    )
      throw new ConfigError(`${path}: "${key}" must be a number`);
  const disable = config.disable;
  if (
    disable !== undefined &&
    !(Array.isArray(disable) && disable.every((d) => typeof d === "string"))
  )
    throw new ConfigError(`${path}: "disable" must be a list of rule ids or prefixes`);
  return config as Config;
}
