import { useRef, type JSX } from 'react';
import { useAnimationFrame } from '../internal/hooks.ts';
import { useCobble } from '../provider/context.ts';
import { fontState } from './metrics.ts';

/** Candidate glyphs for obfuscated text. */
const CANDIDATES = Array.from({ length: 0x17f - 0x21 + 1 }, (_, i) =>
  String.fromCodePoint(0x21 + i),
).filter((char) => !/[\u007f- ­]/.test(char));

const groupsByFont = new Map<string, Map<number, string[]>>();
let measureContext: CanvasRenderingContext2D | null | undefined;

/**
 * Groups candidate glyphs by advance width, like `FontSet.getRandomGlyph`.
 * Returns `undefined` until the font can be measured.
 */
function glyphGroups(family: string): Map<number, string[]> | undefined {
  const cached = groupsByFont.get(family);
  if (cached) return cached;
  if (typeof document === 'undefined' || fontState(family) === 'pending') return undefined;
  // The font is measured at 12px, where one texel is exactly one pixel.
  const font = `12px ${JSON.stringify(family)}`;
  if (measureContext === undefined) {
    try {
      measureContext = document.createElement('canvas').getContext('2d');
    } catch {
      measureContext = null;
    }
  }
  if (!measureContext) return undefined;
  measureContext.font = font;
  const groups = new Map<number, string[]>();
  for (const char of CANDIDATES) {
    const width = Math.ceil(measureContext.measureText(char).width - 1e-3);
    let group = groups.get(width);
    if (!group) {
      group = [];
      groups.set(width, group);
    }
    group.push(char);
  }
  groupsByFont.set(family, groups);
  return groups;
}

function widthOf(groups: Map<number, string[]>, char: string): number | undefined {
  for (const [width, chars] of groups) if (chars.includes(char)) return width;
  return undefined;
}

export interface ObfuscatedTextProps {
  readonly text: string;
  readonly bold: boolean;
}

/** Replaces every non-space character with a random glyph of the same width, every frame. */
export function ObfuscatedText(props: ObfuscatedTextProps): JSX.Element {
  const { fontFamily } = useCobble();
  const ref = useRef<HTMLSpanElement>(null);

  useAnimationFrame(true, () => {
    const element = ref.current;
    const groups = glyphGroups(fontFamily);
    if (!element || !groups) return;
    let output = '';
    for (const char of props.text) {
      const width = char === ' ' ? undefined : widthOf(groups, char);
      const group = width === undefined ? undefined : groups.get(width);
      output += group ? (group[Math.floor(Math.random() * group.length)] ?? char) : char;
    }
    element.textContent = output;
  });

  return (
    <span ref={ref} aria-hidden data-bold={props.bold ? '' : undefined}>
      {props.text}
    </span>
  );
}
