import { describe, expect, it } from 'vitest';
import { formatTranslation, parseLanguage, translate } from './i18n/format.ts';
import { parseSpriteAnimation } from './render/animation.ts';
import {
  scrollerHeight,
  scrollerY,
  scrollerDragScale,
} from './components/scroll-area/scrolling.ts';
import { menuBlurSigma } from './components/screen/Screen.tsx';
import { splashScale } from './components/screen/SplashText.tsx';
import { sliderToValue, valueToSlider } from './components/slider/Slider.tsx';
import { arrangeTabs } from './components/tabs/Tabs.tsx';
import { scrollTo } from './components/text-field/TextField.tsx';
import {
  belowOrAboveTooltipPosition,
  defaultTooltipPosition,
  menuTooltipPosition,
} from './components/tooltip/positioners.ts';
import { calculateAutoGuiScale, resolveScale } from './provider/scale.ts';
import { fontFaceCss, minecraftTtf } from './provider/font.ts';
import {
  flattenTextComponent,
  parseLegacyText,
  resolveTextColor,
  shadowColorFor,
  stripFormatting,
} from './text/formatting.ts';
import { headByWidth, tailByWidth, textWidth } from './text/metrics.ts';
import { centeredTextLeft, scrollingTextOffset, scrollingTextTop } from './text/ScrollingText.tsx';

describe('GUI scale', () => {
  it('picks the largest scale that keeps at least 320×240 units', () => {
    expect(calculateAutoGuiScale(1920, 1080)).toBe(4);
    expect(calculateAutoGuiScale(1280, 720)).toBe(3);
    expect(calculateAutoGuiScale(800, 600)).toBe(2);
    expect(calculateAutoGuiScale(320, 240)).toBe(1);
    expect(calculateAutoGuiScale(3840, 2160, 3)).toBe(3);
  });

  it('snaps units to whole device pixels', () => {
    expect(resolveScale(2, 1.25, true)).toEqual({ unit: 2.4, device: 3 });
    expect(resolveScale(2, 1.25, false)).toEqual({ unit: 2, device: 2.5 });
    expect(resolveScale(3, 2, true)).toEqual({ unit: 3, device: 6 });
  });
});

describe('fonts', () => {
  it('builds URLs for the minecraft-ttf files', () => {
    expect(minecraftTtf('/fonts/').regular).toBe('/fonts/MinecraftDefault-Regular.ttf');
  });

  it('places the baseline on row 7 of a 9-unit line', () => {
    const css = fontFaceCss({ regular: '/a.ttf', bold: '/b.ttf' });
    expect(css).toContain('ascent-override:58.333333%');
    expect(css).toContain('descent-override:16.666667%');
    expect(css.match(/@font-face/g)).toHaveLength(2);
  });
});

describe('formatting codes', () => {
  it('resolves colors', () => {
    expect(resolveTextColor('gold')).toBe('#ffaa00');
    expect(resolveTextColor('#ABCDEF')).toBe('#abcdef');
    expect(resolveTextColor('not-a-color')).toBeUndefined();
  });

  it('computes the 25% drop shadow with truncation', () => {
    expect(shadowColorFor('#ffffff')).toBe('#3f3f3f');
    expect(shadowColorFor('#a0a0a0')).toBe('#282828');
    expect(shadowColorFor('#ffff55')).toBe('#3f3f15');
  });

  it('applies § codes like Style.applyLegacyFormat', () => {
    expect(parseLegacyText('§6Gold §lbold§c red §rplain')).toEqual([
      { text: 'Gold ', style: { color: '#ffaa00' } },
      { text: 'bold', style: { color: '#ffaa00', bold: true } },
      // A color code clears bold.
      { text: ' red ', style: { color: '#ff5555' } },
      { text: 'plain', style: {} },
    ]);
  });

  it('drops unknown codes and a trailing §', () => {
    expect(parseLegacyText('a§zb§')).toEqual([{ text: 'ab', style: {} }]);
    expect(stripFormatting('§aHi §lthere')).toBe('Hi there');
  });

  it('flattens JSON text components with inheritance', () => {
    expect(
      flattenTextComponent({
        text: 'A',
        color: 'red',
        extra: [{ text: 'B', bold: true }, 'C', { text: 'D', color: 'blue' }],
      }),
    ).toEqual([
      { text: 'A', style: { color: '#ff5555' } },
      { text: 'B', style: { color: '#ff5555', bold: true } },
      { text: 'C', style: { color: '#ff5555' } },
      { text: 'D', style: { color: '#5555ff' } },
    ]);
  });

  it('converts shadow_color to hex', () => {
    expect(flattenTextComponent({ text: 'x', shadow_color: 0xff112233 })).toEqual([
      { text: 'x', style: { shadowColor: '#112233ff' } },
    ]);
  });
});

/** Test font: "i" is 2 units wide, everything else 6. */
function narrowI(char: string): number {
  return char === 'i' ? 2 : 6;
}

/** Test font: every character is 6 units wide. */
function sixWide(): number {
  return 6;
}

describe('text metrics', () => {
  const width = narrowI;

  it('measures and cuts strings like StringSplitter', () => {
    expect(textWidth('aai', width)).toBe(14);
    expect(headByWidth('aaaa', 13, width)).toBe('aa');
    expect(headByWidth('aaaa', 12, width)).toBe('aa');
    expect(tailByWidth('abci', 8, width)).toBe('ci');
  });
});

describe('scrolling text', () => {
  it('vertically centres a line in a 20-unit button at y = 6', () => {
    expect(scrollingTextTop(0, 20)).toBe(6);
    expect(scrollingTextTop(3, 24)).toBe(10);
  });

  it('centres a fitting line but keeps it inside the box', () => {
    expect(centeredTextLeft(50, 2, 148, 75)).toBe(50);
    expect(centeredTextLeft(31, 2, 148, 75)).toBe(60);
  });

  it('scrolls an overflowing line back and forth', () => {
    // At t = 0 the line is scrolled all the way; half a period later it is back at the start.
    expect(scrollingTextOffset(150, 100, 0)).toBe(50);
    const period = Math.max(50 * 0.5, 3) * 1000;
    expect(scrollingTextOffset(150, 100, period / 2)).toBe(0);
  });
});

describe('slider values', () => {
  const ints = { min: 0, max: 10, step: 1, count: 11 };

  it('maps positions to values like IntRange.fromSliderValue', () => {
    expect(sliderToValue(0, ints)).toBe(0);
    expect(sliderToValue(0.5, ints)).toBe(5);
    expect(sliderToValue(1, ints)).toBe(10);
    expect(sliderToValue(0.99, ints)).toBe(10);
  });

  it('maps values to handle positions like IntRange.toSliderValue', () => {
    expect(valueToSlider(0, ints)).toBe(0);
    expect(valueToSlider(10, ints)).toBe(1);
    expect(valueToSlider(5, ints)).toBeCloseTo(5.5 / 11);
  });

  it('supports continuous sliders', () => {
    const continuous = { min: 0, max: 1, step: 0, count: 0 };
    expect(sliderToValue(0.25, continuous)).toBe(0.25);
    expect(valueToSlider(0.75, continuous)).toBe(0.75);
  });
});

describe('EditBox scrolling', () => {
  const width = sixWide;

  it('scrolls right to keep the cursor visible', () => {
    const value = 'a'.repeat(40);
    // 32 units of space fit 5 characters.
    expect(scrollTo(value, 0, 10, 32, width)).toBe(5);
  });

  it('scrolls back a page when the cursor reaches the left edge', () => {
    const value = 'a'.repeat(40);
    expect(scrollTo(value, 20, 20, 32, width)).toBe(15);
  });

  it('never scrolls past the text', () => {
    expect(scrollTo('abc', 10, 3, 32, width)).toBe(0);
  });
});

describe('tooltip positioners', () => {
  const widget = { left: 100, top: 50, width: 150, height: 20 };

  it('follows the mouse (MenuTooltipPositioner)', () => {
    const position = menuTooltipPosition(480, 270, 120, 60, 60, 8, widget);
    expect(position.x).toBe(132);
    // Pushed below the widget, depending on how far the mouse is from its top.
    expect(position.y).toBe(63 + Math.round(17 + (Math.min(13, 20) / 20) * (5 - 17)));
  });

  it('flips to the left near the right edge', () => {
    expect(menuTooltipPosition(480, 270, 460, 60, 60, 8, widget).x).toBe(460 - 12 - 60);
  });

  it('sits below the widget for keyboard focus', () => {
    expect(belowOrAboveTooltipPosition(480, 270, 60, 8, widget)).toEqual({ x: 103, y: 74 });
    expect(belowOrAboveTooltipPosition(480, 80, 60, 8, widget)).toEqual({ x: 103, y: 38 });
  });

  it('positions item tooltips (DefaultTooltipPositioner)', () => {
    expect(defaultTooltipPosition(480, 270, 10, 30, 50, 8)).toEqual({ x: 22, y: 18 });
  });
});

describe('scroll areas', () => {
  it('sizes the scroller like AbstractScrollArea', () => {
    expect(scrollerHeight(100, 1000)).toBe(32);
    expect(scrollerHeight(100, 200)).toBe(50);
    expect(scrollerHeight(100, 101)).toBe(92);
  });

  it('positions the scroller', () => {
    expect(scrollerY(0, 100, 200)).toBe(0);
    expect(scrollerY(100, 100, 200)).toBe(50);
    expect(scrollerY(50, 100, 200)).toBe(25);
  });

  it('scales scroller drags', () => {
    expect(scrollerDragScale(100, 200)).toBe(2);
    expect(scrollerDragScale(100, 101)).toBe(1);
  });
});

describe('tabs', () => {
  it('lays out tabs like MenuTabBar', () => {
    expect(arrangeTabs(427, 3)).toEqual({ tabWidth: 124, x: 28 });
    expect(arrangeTabs(320, 3)).toEqual({ tabWidth: 98, x: 14 });
  });
});

describe('screens', () => {
  it('converts the menu blur radius to a gaussian sigma', () => {
    expect(menuBlurSigma(5)).toBeCloseTo(Math.sqrt(30));
    expect(menuBlurSigma(0)).toBe(0);
  });

  it('pulses the splash text', () => {
    expect(splashScale(68, 0)).toBeCloseTo(1.8);
    expect(splashScale(68, 250)).toBeCloseTo(1.7);
  });
});

describe('parseSpriteAnimation', () => {
  it('reads sizes, frame times and explicit frames from the mcmeta', () => {
    expect(
      parseSpriteAnimation(
        { animation: { width: 8, height: 8, frametime: 2, frames: [{ index: 0, time: 10 }, 1] } },
        8,
        48,
      ),
    ).toEqual({
      frameWidth: 8,
      frameHeight: 8,
      frametime: 2,
      frames: [
        { index: 0, time: 10 },
        { index: 1, time: 2 },
      ],
    });
  });

  it('makes frames square and one tick long by default, and ignores other metadata', () => {
    expect(parseSpriteAnimation({ animation: {} }, 16, 64)).toEqual({
      frameWidth: 16,
      frameHeight: 16,
      frametime: 1,
      frames: undefined,
    });
    expect(parseSpriteAnimation({ gui: {} }, 16, 16)).toBeUndefined();
    expect(parseSpriteAnimation(undefined, 16, 16)).toBeUndefined();
  });
});

describe('translations', () => {
  it('substitutes %s, %d and positional arguments', () => {
    expect(formatTranslation('Hello %s and %s', ['a', 'b'])).toBe('Hello a and b');
    expect(formatTranslation('%2$s before %1$s', ['a', 'b'])).toBe('b before a');
    expect(formatTranslation('%1$s %s %s', ['a', 'b'])).toBe('a a b');
    expect(formatTranslation('%d%% done', [50])).toBe('50% done');
    expect(formatTranslation('plain', [])).toBe('plain');
  });

  it('throws on bad templates like vanilla', () => {
    expect(() => formatTranslation('%s', [])).toThrow('Missing argument');
    expect(() => formatTranslation('%x', ['a'])).toThrow('Unsupported format');
    expect(() => formatTranslation('100%', [])).toThrow('Unsupported format');
  });

  it('parses language files and rewrites %d/%f formats', () => {
    expect(parseLanguage({ a: 'x %d', b: '%1$.2f y', c: 3 })).toEqual({
      a: 'x %s',
      b: '%1$s y',
    });
    expect(parseLanguage(null)).toEqual({});
  });

  it('falls back to the fallback template, then the key', () => {
    const table = { ok: 'Hi %s', bad: '%s %s' };
    expect(translate(table, 'ok', ['you'])).toBe('Hi you');
    expect(translate(table, 'missing')).toBe('missing');
    expect(translate(table, 'missing', ['x'], 'Fallback %s')).toBe('Fallback x');
    expect(translate(table, 'bad', ['x'])).toBe('%s %s');
  });
});
