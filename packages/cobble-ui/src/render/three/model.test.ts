import { describe, expect, it } from 'vitest';
import { resolveItem } from '../item-model.ts';
import { bakeParts, faceShade, modelTextures, srgbToLinear } from './model.ts';

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
  it('converts sRGB to linear', () => {
    expect(srgbToLinear(1)).toBeCloseTo(1);
    expect(srgbToLinear(0.5)).toBeCloseTo(0.214, 2);
  });
});

describe('bakeParts', () => {
  it('bakes element faces by texture with uv, shade and tint', () => {
    const parts = resolveItem('cube', source);
    expect(parts).toBeTruthy();
    if (!parts) return;
    expect(modelTextures(parts)).toEqual(['block/stone']);
    const [mesh] = bakeParts(parts, { textureSize: () => ({ width: 16, height: 16 }) });
    expect(mesh?.texture).toBe('block/stone');
    expect(mesh?.positions).toHaveLength(3 * 4 * 3);
    expect(mesh?.indices).toHaveLength(6 * 3);
    // Face order follows the JSON: up, south, north. South uses the top-left quarter of the texture.
    expect(mesh?.uvs.slice(8, 16)).toEqual([0, 0, 0.5, 0, 0.5, 0.5, 0, 0.5]);
    // Block corners are centred on the origin.
    expect(Math.max(...(mesh?.positions ?? []))).toBeCloseTo(0.5);
    // The up face is fully lit, the south face is shaded (0.8 in sRGB).
    expect(mesh?.colors[0]).toBeCloseTo(1);
    expect(mesh?.colors[4 * 3]).toBeCloseTo(srgbToLinear(0.8));
  });

  it('squashes the v of animated sheets to the first frame', () => {
    const parts = resolveItem('cube', source);
    if (!parts) throw new Error('missing');
    const [mesh] = bakeParts(parts, { textureSize: () => ({ width: 16, height: 64 }) });
    expect(mesh?.uvs[1]).toBeCloseTo(0);
    expect(mesh?.uvs[5]).toBeCloseTo(0.25);
  });

  it('draws item/generated layers as one flat quad', () => {
    const parts = resolveItem('flat', source);
    if (!parts) throw new Error('missing');
    const [mesh] = bakeParts(parts, { textureSize: () => undefined });
    expect(mesh?.texture).toBe('item/apple');
    expect(mesh?.indices).toHaveLength(6);
  });
});
