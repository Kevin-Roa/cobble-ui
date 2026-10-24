import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../blit.ts';
import type { BlockEntitySpec } from './block-entity-models.ts';
import { guiBlockEntityQuads, renderBlockEntityIcon } from './entity-icon.ts';
import { hasPartialAlpha } from './model.ts';

function opaque(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) };
}

const gui = { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.6, 0.6, 0.6] } as const;
const textures = (id: string): RgbaImage | undefined =>
  id.startsWith('entity/') ? opaque(64, 64) : undefined;

describe('block entity slot icons', () => {
  it.each(['chest', 'shulker_box', 'decorated_pot', 'conduit', 'shield', 'trident'] as const)(
    'draws a %s',
    (type) => {
      const texture =
        type === 'chest'
          ? 'entity/chest/normal'
          : type === 'shulker_box'
            ? 'entity/shulker/shulker'
            : undefined;
      const spec: BlockEntitySpec = texture === undefined ? { type } : { type, texture };
      const quads = guiBlockEntityQuads(spec, textures, gui);
      expect(quads.length).toBeGreaterThan(0);
      const image = renderBlockEntityIcon(spec, textures, gui, 32);
      let painted = 0;
      for (let i = 3; i < image.data.length; i += 4) if ((image.data[i] as number) > 0) painted++;
      expect(painted).toBeGreaterThan(20);
    },
  );

  it('draws a banner with its dye colour and nothing while textures are missing', () => {
    const spec = { type: 'banner', color: 'red' } as const;
    const quads = guiBlockEntityQuads(spec, textures, gui, true);
    expect(quads.length).toBeGreaterThan(0);
    expect(guiBlockEntityQuads(spec, () => undefined, gui)).toEqual([]);
  });

  it('keeps the banner and the shield inside the slot with their real display.gui', () => {
    const cases = [
      [
        { type: 'banner', color: 'red' },
        { rotation: [30, 20, 0], translation: [0, -3.25, 0], scale: [0.5325, 0.5325, 0.5325] },
      ],
      [
        { type: 'shield' },
        { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
      ],
    ] as const;
    for (const [spec, transform] of cases) {
      const size = 64;
      const image = renderBlockEntityIcon(spec, textures, transform, size, true);
      let minX = size;
      let maxX = -1;
      let minY = size;
      let maxY = -1;
      for (let i = 0; i < size * size; i++) {
        if ((image.data[i * 4 + 3] as number) === 0) continue;
        minX = Math.min(minX, i % size);
        maxX = Math.max(maxX, i % size);
        minY = Math.min(minY, Math.floor(i / size));
        maxY = Math.max(maxY, Math.floor(i / size));
      }
      // Fully visible: nothing touches the slot's edges.
      expect(minX).toBeGreaterThan(0);
      expect(minY).toBeGreaterThan(0);
      expect(maxX).toBeLessThan(size - 1);
      expect(maxY).toBeLessThan(size - 1);
      // Roughly centred horizontally (within a tenth of the slot).
      expect(Math.abs((minX + maxX) / 2 - size / 2)).toBeLessThan(size * 0.1);
    }
  });

  it('lights faces by the GUI lights unless the light is flat', () => {
    const spec = { type: 'chest', texture: 'entity/chest/normal' } as const;
    const lit = guiBlockEntityQuads(spec, textures, gui).map((q) => q.color?.[0] ?? 1);
    const flat = guiBlockEntityQuads(spec, textures, gui, true).map((q) => q.color?.[0] ?? 1);
    expect(new Set(lit).size).toBeGreaterThan(1);
    expect(new Set(flat)).toEqual(new Set([1]));
  });
});

describe('hasPartialAlpha', () => {
  it('tells translucent textures from cutout ones', () => {
    expect(
      hasPartialAlpha({ width: 1, height: 1, data: new Uint8ClampedArray([1, 2, 3, 120]) }),
    ).toBe(true);
    expect(
      hasPartialAlpha({
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([1, 2, 3, 0, 1, 2, 3, 255]),
      }),
    ).toBe(false);
  });
});
