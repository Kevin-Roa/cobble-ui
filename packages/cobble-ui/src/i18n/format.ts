/** Path of the default language file inside the client jar. */
export const DEFAULT_LANGUAGE_PATH = 'assets/minecraft/lang/en_us.json';

/** A flat translation table: key to template, like a `lang/*.json` file. */
export type TranslationTable = Readonly<Record<string, string>>;

/** A value substituted into a translation template. */
export type TranslationArg = string | number;

// `TranslatableContents#FORMAT_PATTERN`.
const FORMAT_PATTERN = /%(?:(\d+)\$)?([A-Za-z%]|$)/g;
// `Language#UNSUPPORTED_FORMAT_PATTERN`.
const UNSUPPORTED_FORMAT_PATTERN = /%(\d+\$)?[\d.]*[df]/g;

/**
 * Substitutes arguments into a vanilla translation template
 * (`TranslatableContents#decomposeTemplate`): `%s` and `%d` take the next argument, `%1$s`
 * takes argument 1 (1-based) without moving the cursor, and `%%` is a literal percent sign.
 * Throws on any other `%` sequence or a missing argument, like `TranslatableFormatException`.
 */
export function formatTranslation(template: string, args: readonly TranslationArg[]): string {
  let out = '';
  let last = 0;
  let next = 0;
  for (const match of template.matchAll(FORMAT_PATTERN)) {
    out += template.slice(last, match.index);
    last = match.index + match[0].length;
    if (match[0] === '%%') {
      out += '%';
      continue;
    }
    const [, position, kind] = match;
    if (kind !== 's' && kind !== 'd') {
      throw new Error(`Unsupported format: '${match[0]}' in '${template}'`);
    }
    const index = position === undefined ? next++ : Number(position) - 1;
    const arg = args[index];
    if (arg === undefined) {
      throw new Error(`Missing argument ${String(index + 1)} in '${template}'`);
    }
    out += String(arg);
  }
  return out + template.slice(last);
}

/**
 * Parses a `lang/*.json` file (`Language#loadFromJson`): string values only, with the
 * unsupported `%d`/`%f` style formats rewritten to `%s`.
 */
export function parseLanguage(json: unknown): TranslationTable {
  const table: Record<string, string> = {};
  if (typeof json !== 'object' || json === null) return table;
  for (const [key, value] of Object.entries(json)) {
    if (typeof value === 'string') {
      table[key] = value.replace(UNSUPPORTED_FORMAT_PATTERN, '%$1s');
    }
  }
  return table;
}

/**
 * Translates a key (`Language#getOrDefault` plus `TranslatableContents#decompose`): the
 * fallback template when the key is missing, and the key itself when neither exists. A template
 * that cannot be formatted is returned as is.
 */
export function translate(
  table: TranslationTable,
  key: string,
  args: readonly TranslationArg[] = [],
  fallback?: string,
): string {
  const template = table[key] ?? fallback;
  if (template === undefined) return key;
  try {
    return formatTranslation(template, args);
  } catch {
    return template;
  }
}
