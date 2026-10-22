/** The 16 named text colors (`net.minecraft.network.chat.TextColor`). */
export const TEXT_COLORS = {
  black: '#000000',
  dark_blue: '#0000aa',
  dark_green: '#00aa00',
  dark_aqua: '#00aaaa',
  dark_red: '#aa0000',
  dark_purple: '#aa00aa',
  gold: '#ffaa00',
  gray: '#aaaaaa',
  dark_gray: '#555555',
  blue: '#5555ff',
  green: '#55ff55',
  aqua: '#55ffff',
  red: '#ff5555',
  light_purple: '#ff55ff',
  yellow: '#ffff55',
  white: '#ffffff',
} as const;

export type TextColorName = keyof typeof TEXT_COLORS;
/** A named color or a `#rrggbb` hex color. */
export type TextColor = TextColorName | `#${string}`;

const LEGACY_COLOR_CODES: Readonly<Record<string, TextColorName>> = {
  '0': 'black',
  '1': 'dark_blue',
  '2': 'dark_green',
  '3': 'dark_aqua',
  '4': 'dark_red',
  '5': 'dark_purple',
  '6': 'gold',
  '7': 'gray',
  '8': 'dark_gray',
  '9': 'blue',
  a: 'green',
  b: 'aqua',
  c: 'red',
  d: 'light_purple',
  e: 'yellow',
  f: 'white',
};

/** Resolved style of a run of text. Mirrors the relevant parts of `Style`. */
export interface TextStyle {
  /** `#rrggbb`. */
  readonly color?: string;
  /** `#rrggbbaa` or `#rrggbb`; overrides the automatic 25% shadow. */
  readonly shadowColor?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underlined?: boolean;
  readonly strikethrough?: boolean;
  readonly obfuscated?: boolean;
}

export interface TextRun {
  readonly text: string;
  readonly style: TextStyle;
}

/** A JSON text component, as used in commands, books, signs and `tellraw`. */
export type TextComponent = string | readonly TextComponent[] | TextComponentObject;

export interface TextComponentObject {
  readonly text?: string;
  readonly color?: TextColor;
  /** ARGB integer, or `[r, g, b, a]` floats, like the game's `shadow_color`. */
  readonly shadow_color?: number | readonly [number, number, number, number];
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underlined?: boolean;
  readonly strikethrough?: boolean;
  readonly obfuscated?: boolean;
  readonly extra?: readonly TextComponent[];
}

/** Returns `#rrggbb` for a named or hex color, or `undefined` if invalid. */
export function resolveTextColor(color: string | undefined): string | undefined {
  if (color === undefined) return undefined;
  if (color in TEXT_COLORS) return TEXT_COLORS[color as TextColorName];
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  return undefined;
}

function hex2(value: number): string {
  return Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

function resolveShadowColor(value: TextComponentObject['shadow_color']): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') {
    const argb = value >>> 0;
    return `#${hex2((argb >>> 16) & 255)}${hex2((argb >>> 8) & 255)}${hex2(argb & 255)}${hex2(argb >>> 24)}`;
  }
  const [r, g, b, a] = value;
  return `#${hex2(r * 255)}${hex2(g * 255)}${hex2(b * 255)}${hex2(a * 255)}`;
}

/**
 * Computes the default drop-shadow color for a text color: every channel
 * scaled by 0.25 and truncated (`ARGB.scaleRGB(color, 0.25F)`).
 */
export function shadowColorFor(color: string): string {
  const value = Number.parseInt(color.slice(1, 7), 16);
  const r = Math.trunc(((value >> 16) & 255) * 0.25);
  const g = Math.trunc(((value >> 8) & 255) * 0.25);
  const b = Math.trunc((value & 255) * 0.25);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/** `Style.applyLegacyFormat`. Returns `undefined` for an unknown code. */
function applyLegacyCode(style: TextStyle, reset: TextStyle, code: string): TextStyle | undefined {
  switch (code) {
    case 'k':
      return { ...style, obfuscated: true };
    case 'l':
      return { ...style, bold: true };
    case 'm':
      return { ...style, strikethrough: true };
    case 'n':
      return { ...style, underlined: true };
    case 'o':
      return { ...style, italic: true };
    case 'r':
      return reset;
    default: {
      const name = LEGACY_COLOR_CODES[code];
      if (name === undefined) return undefined;
      const next: TextStyle = { color: TEXT_COLORS[name] };
      return style.shadowColor === undefined ? next : { ...next, shadowColor: style.shadowColor };
    }
  }
}

function pushRun(runs: TextRun[], text: string, style: TextStyle): void {
  if (text === '') return;
  const last = runs.at(-1);
  if (last && sameStyle(last.style, style)) {
    runs[runs.length - 1] = { text: last.text + text, style };
  } else {
    runs.push({ text, style });
  }
}

function sameStyle(a: TextStyle, b: TextStyle): boolean {
  return (
    a.color === b.color &&
    a.shadowColor === b.shadowColor &&
    Boolean(a.bold) === Boolean(b.bold) &&
    Boolean(a.italic) === Boolean(b.italic) &&
    Boolean(a.underlined) === Boolean(b.underlined) &&
    Boolean(a.strikethrough) === Boolean(b.strikethrough) &&
    Boolean(a.obfuscated) === Boolean(b.obfuscated)
  );
}

/**
 * Splits a string containing `§` formatting codes into styled runs, like
 * `StringDecomposer.iterateFormatted`. A color code clears bold/italic/etc.,
 * `§r` returns to `base`, and unknown codes are dropped.
 */
export function parseLegacyText(
  input: string,
  base: TextStyle = {},
  runs: TextRun[] = [],
): TextRun[] {
  let style = base;
  let buffer = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '§') {
      if (i + 1 >= input.length) break;
      const code = (input[i + 1] ?? '').toLowerCase();
      i++;
      const next = applyLegacyCode(style, base, code);
      if (next === undefined) continue;
      pushRun(runs, buffer, style);
      buffer = '';
      style = next;
    } else {
      buffer += char;
    }
  }
  pushRun(runs, buffer, style);
  return runs;
}

function mergeComponentStyle(parent: TextStyle, component: TextComponentObject): TextStyle {
  const color = resolveTextColor(component.color) ?? parent.color;
  const shadowColor = resolveShadowColor(component.shadow_color) ?? parent.shadowColor;
  const style: Record<string, string | boolean> = {};
  if (color !== undefined) style['color'] = color;
  if (shadowColor !== undefined) style['shadowColor'] = shadowColor;
  const flags = ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'] as const;
  for (const flag of flags) {
    const value = component[flag] ?? parent[flag];
    if (value !== undefined) style[flag] = value;
  }
  return style as TextStyle;
}

/** Flattens a JSON text component into styled runs (`§` codes inside are honoured). */
export function flattenTextComponent(
  component: TextComponent,
  parent: TextStyle = {},
  runs: TextRun[] = [],
): TextRun[] {
  if (typeof component === 'string') return parseLegacyText(component, parent, runs);
  if (Array.isArray(component)) {
    const [first, ...rest] = component as readonly TextComponent[];
    if (first === undefined) return runs;
    // Like vanilla, siblings in an array inherit the style of the first element.
    const firstStyle =
      typeof first === 'object' && !Array.isArray(first)
        ? mergeComponentStyle(parent, first as TextComponentObject)
        : parent;
    flattenTextComponent(first, parent, runs);
    for (const child of rest) flattenTextComponent(child, firstStyle, runs);
    return runs;
  }
  const object = component as TextComponentObject;
  const style = mergeComponentStyle(parent, object);
  if (object.text !== undefined) parseLegacyText(object.text, style, runs);
  for (const child of object.extra ?? []) flattenTextComponent(child, style, runs);
  return runs;
}

/** Removes `§` formatting codes, like `ChatFormatting.stripFormatting`. */
export function stripFormatting(input: string): string {
  return input.replace(/§[0-9a-fk-or]/gi, '');
}
