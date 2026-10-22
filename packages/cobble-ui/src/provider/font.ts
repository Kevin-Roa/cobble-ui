/** URLs of the font files used for text. */
export interface FontOptions {
  /** CSS font family name to register the files under. Defaults to `"Cobble UI"`. */
  readonly family?: string;
  readonly regular?: string;
  readonly bold?: string;
  readonly italic?: string;
  readonly boldItalic?: string;
}

export const DEFAULT_FONT_FAMILY = 'Cobble UI';

/** File names of the TTFs published at https://github.com/tryashtar/minecraft-ttf. */
export const MINECRAFT_TTF_FILES = {
  regular: 'MinecraftDefault-Regular.ttf',
  bold: 'MinecraftDefault-Bold.ttf',
  italic: 'MinecraftDefault-Italic.ttf',
  boldItalic: 'MinecraftDefault-BoldItalic.ttf',
} as const;

/**
 * Builds {@link FontOptions} for the `minecraft-ttf` fonts hosted under
 * `baseUrl` (for example the folder written by `npx cobble-ui fonts public/fonts`).
 */
export function minecraftTtf(baseUrl: string, family: string = DEFAULT_FONT_FAMILY): FontOptions {
  const base = baseUrl.replace(/\/$/, '');
  return {
    family,
    regular: `${base}/${MINECRAFT_TTF_FILES.regular}`,
    bold: `${base}/${MINECRAFT_TTF_FILES.bold}`,
    italic: `${base}/${MINECRAFT_TTF_FILES.italic}`,
    boldItalic: `${base}/${MINECRAFT_TTF_FILES.boldItalic}`,
  };
}

function cssString(value: string): string {
  return `"${value.replace(/["\\]/g, '\\$&')}"`;
}

/**
 * The `minecraft-ttf` fonts use 100 font units per texel on a 1200-unit em,
 * so `font-size: 12 × unit` draws one texel per GUI unit. The metric overrides
 * put the baseline 7 units below the top of a 9-unit line box, which is where
 * the game draws it.
 */
export function fontFaceCss(options: FontOptions): string {
  const family = cssString(options.family ?? DEFAULT_FONT_FAMILY);
  const faces: [string | undefined, number, string][] = [
    [options.regular, 400, 'normal'],
    [options.bold, 700, 'normal'],
    [options.italic, 400, 'italic'],
    [options.boldItalic, 700, 'italic'],
  ];
  return faces
    .filter((face): face is [string, number, string] => face[0] !== undefined)
    .map(
      ([url, weight, style]) =>
        `@font-face{font-family:${family};src:url(${cssString(url)}) format("truetype");` +
        `font-weight:${String(weight)};font-style:${style};font-display:block;` +
        `ascent-override:58.333333%;descent-override:16.666667%;line-gap-override:0%}`,
    )
    .join('\n');
}
