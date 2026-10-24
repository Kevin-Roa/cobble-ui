import { describe, expect, it } from 'vitest';
import { resolveItem } from '../item-model.ts';
import type { RgbaImage } from '../blit.ts';
import { bakeParts, faceShade, modelTextures } from './model.ts';

function image(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

const files: Record<string, unknown> = {
  'assets/minecraft/items/cube.json': {
    model: { type: 'minecraft:model', model: 'minecraft:block/cube' },
  },
  'assets/minecraft/models/block/cube.json': {
    textures: { all: 'minecraft:block/stone' },
    elements: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faces: {
          up: { texture: '#all' },
          south: { texture: '#all', uv: [0, 0, 8, 8] },
          north: { texture: '#all', tintindex: 0 },
        },
      },
    ],
  },
  'assets/minecraft/items/flat.json': { model: { type: 'minecraft:model', model: 'item/flat' } },
  'assets/minecraft/models/item/flat.json': {
    parent: 'builtin/generated',
    textures: { layer0: 'item/apple' },
  },
};
const source = (path: string): unknown => files[path] ?? null;

describe('faceShade', () => {
  it('matches the vanilla directional shades', () => {
    expect(faceShade([0, 1, 0])).toBe(1);
    expect(faceShade([0, -1, 0])).toBe(0.5);
    expect(faceShade([0, 0, 1])).toBeCloseTo(0.8);
    expect(faceShade([-1, 0, 0])).toBeCloseTo(0.6);
  });
});

describe('bakeParts', () => {
  it('bakes element faces with uv, shade and tint', () => {
    const parts = resolveItem('cube', source);
    expect(parts).toBeTruthy();
    if (!parts) return;
    expect(modelTextures(parts)).toEqual(['block/stone']);
    const quads = bakeParts(parts, { texture: () => image(16, 16) });
    expect(quads).toHaveLength(3);
    // Face order follows the JSON: up, south, north. South uses the top-left quarter of the texture.
    expect(quads[1]?.uvs).toEqual([
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
    ]);
    // Block corners are centred on the origin.
    expect(Math.max(...quads.flatMap((quad) => quad.corners.flat()))).toBeCloseTo(0.5);
    // The up face is fully lit, the south face is shaded (0.8).
    expect(quads[0]?.color?.[0]).toBeCloseTo(1);
    expect(quads[1]?.color?.[0]).toBeCloseTo(0.8);
    expect(quads.every((quad) => quad.doubleSided)).toBe(true);
  });

  it('squashes the v of animated sheets to the first frame', () => {
    const parts = resolveItem('cube', source);
    if (!parts) throw new Error('missing');
    const [quad] = bakeParts(parts, { texture: () => image(16, 64) });
    expect(quad?.uvs[0]?.[1]).toBeCloseTo(0);
    expect(quad?.uvs[2]?.[1]).toBeCloseTo(0.25);
  });

  it('draws item/generated layers as one flat quad', () => {
    const parts = resolveItem('flat', source);
    if (!parts) throw new Error('missing');
    const quads = bakeParts(parts, { texture: () => image(16, 16) });
    expect(quads).toHaveLength(1);
    expect(bakeParts(parts, { texture: () => undefined })).toHaveLength(0);
  });
});
