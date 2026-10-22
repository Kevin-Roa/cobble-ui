import { useEffect, useState } from 'react';
import { useCobble } from '../provider/context.ts';

/** Advance width of a character in GUI units. */
export type CharWidth = (char: string) => number;

/** Fallback advance used before the font can be measured (most glyphs are 6 wide). */
const FALLBACK_ADVANCE = 6;

const caches = new Map<string, Map<string, number>>();
let context: CanvasRenderingContext2D | null | undefined;

function measureContext(): CanvasRenderingContext2D | null {
  if (context === undefined) {
    try {
      context =
        typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    } catch {
      context = null;
    }
  }
  return context;
}

function fontString(family: string, bold: boolean): string {
  // At 12px one font texel is exactly one CSS pixel, i.e. one GUI unit.
  return `${bold ? 'bold ' : ''}12px ${JSON.stringify(family)}`;
}

function fontSet(): FontFaceSet | undefined {
  return typeof document === 'undefined' ? undefined : (document.fonts as FontFaceSet | undefined);
}

/**
 * - `loaded`: a matching `@font-face` has loaded, so measurements are final.
 * - `pending`: a matching `@font-face` exists but has not loaded yet.
 * - `system`: no `@font-face` declares the family (it may be a system font).
 *
 * `document.fonts.check()` is not used: it reports `true` when no face matches
 * yet, e.g. before the provider's `@font-face` rule is inserted.
 */
export function fontState(family: string, bold = false): 'loaded' | 'pending' | 'system' {
  const fonts = fontSet();
  if (!fonts) return 'pending';
  let declared = false;
  for (const face of fonts) {
    if (face.family.replace(/^["']|["']$/g, '') !== family) continue;
    declared = true;
    const isBold = face.weight === 'bold' || Number(face.weight) >= 600;
    if (isBold === bold && face.style === 'normal' && face.status === 'loaded') return 'loaded';
  }
  return declared ? 'pending' : 'system';
}

function measure(ctx: CanvasRenderingContext2D, font: string, char: string): number {
  ctx.font = font;
  return Math.round(ctx.measureText(char).width);
}

/** Creates a width function for a font family; results are cached once the font has loaded. */
export function charWidthFor(family: string, bold = false): CharWidth {
  const font = fontString(family, bold);
  const state = fontState(family, bold);
  const ctx = state === 'pending' ? null : measureContext();
  if (!ctx) return (char) => (char === ' ' ? 4 : FALLBACK_ADVANCE) + (bold ? 1 : 0);
  let widths = state === 'loaded' ? caches.get(font) : undefined;
  if (!widths) {
    widths = new Map();
    if (state === 'loaded') caches.set(font, widths);
  }
  const cache = widths;
  return (char) => {
    let width = cache.get(char);
    if (width === undefined) {
      width = measure(ctx, font, char);
      cache.set(char, width);
    }
    return width;
  };
}

/** Width of a string in GUI units (`Font#width`). */
export function textWidth(text: string, width: CharWidth): number {
  let total = 0;
  for (const char of text) total += width(char);
  return total;
}

/** `StringSplitter#plainHeadByWidth`: the longest prefix no wider than `maxWidth`. */
export function headByWidth(text: string, maxWidth: number, width: CharWidth): string {
  let remaining = maxWidth;
  let end = 0;
  for (const char of text) {
    remaining -= width(char);
    if (remaining < 0) break;
    end += char.length;
  }
  return text.slice(0, end);
}

/** `StringSplitter#plainTailByWidth`: the longest suffix no wider than `maxWidth`. */
export function tailByWidth(text: string, maxWidth: number, width: CharWidth): string {
  const chars = Array.from(text);
  let remaining = maxWidth;
  let start = text.length;
  for (let i = chars.length - 1; i >= 0; i--) {
    const char = chars[i] ?? '';
    remaining -= width(char);
    if (remaining < 0) break;
    start -= char.length;
  }
  return text.slice(start);
}

/**
 * A width function for the provider's font that updates once the font has
 * loaded (before that, approximate widths are used).
 */
export function useCharWidth(bold = false): CharWidth {
  const { fontFamily } = useCobble();
  const [, setVersion] = useState(0);
  useEffect(() => {
    const fonts = fontSet();
    if (!fonts || fontState(fontFamily, bold) !== 'pending') return undefined;
    const refresh = (): void => {
      if (fontState(fontFamily, bold) !== 'pending') setVersion((v) => v + 1);
    };
    fonts.addEventListener('loadingdone', refresh);
    fonts.load(fontString(fontFamily, bold)).then(refresh, () => undefined);
    return () => fonts.removeEventListener('loadingdone', refresh);
  }, [fontFamily, bold]);
  return charWidthFor(fontFamily, bold);
}
