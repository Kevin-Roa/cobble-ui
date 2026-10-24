import { describe, expect, it } from 'vitest';
import { parseTransformation, resolveItem } from '../item-model.ts';
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
    // Corners run counter-clockwise from the front (bottom-left first), so the engine's culling works.
    expect(quads[1]?.uvs).toEqual([
      [0, 0.5],
      [0.5, 0.5],
      [0.5, 0],
      [0, 0],
    ]);
    // Block corners are centred on the origin.
    expect(Math.max(...quads.flatMap((quad) => quad.corners.flat()))).toBeCloseTo(0.5);
    // The up face is fully lit, the south face is shaded (0.8).
    expect(quads[0]?.color?.[0]).toBeCloseTo(1);
    expect(quads[1]?.color?.[0]).toBeCloseTo(0.8);
    // Elements are back-face culled, so coincident back-to-back faces of two elements never fight.
    expect(quads.every((quad) => !quad.doubleSided)).toBe(true);
  });

  it('winds every element face counter-clockwise, facing outward', () => {
    const parts = resolveItem('cube', source);
    if (!parts) throw new Error('missing');
    const quads = bakeParts(parts, { texture: () => image(16, 16) });
    // up, south, north of a block centred on the origin.
    const expected = [
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    quads.forEach((quad, index) => {
      const [a, b, , d] = quad.corners;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
      const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]] as const;
      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const want = expected[index] as number[];
      const dot = normal.reduce((sum, n, i) => sum + n * (want[i] as number), 0);
      expect(dot).toBeGreaterThan(0);
    });
  });

  it('places the halves of a composite (bed) with their transformation and centres the result', () => {
    const bed = {
      'assets/minecraft/items/bed.json': {
        model: {
          type: 'minecraft:composite',
          models: [
            { type: 'minecraft:model', model: 'block/half' },
            {
              type: 'minecraft:model',
              model: 'block/half',
              transformation: { translation: [0, 0, 1] },
            },
          ],
        },
      },
      'assets/minecraft/models/block/half.json': {
        textures: { all: 'block/stone' },
        elements: [{ from: [0, 0, 0], to: [16, 8, 16], faces: { up: { texture: '#all' } } }],
      },
    };
    const parts = resolveItem('bed', (path) => (bed as Record<string, unknown>)[path] ?? null);
    expect(parts).toHaveLength(2);
    expect(parts?.[0]?.transformation).toBeUndefined();
    expect(parts?.[1]?.transformation).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1]);
    if (!parts) return;
    const quads = bakeParts(parts, { texture: () => image(16, 16) });
    expect(quads).toHaveLength(2);
    const zs = quads.flatMap((quad) => quad.corners.map((corner) => corner[2]));
    // Two blocks long (z 0 to 2) shrunk to fit 1.5, centred on the origin.
    expect(Math.max(...zs)).toBeCloseTo(0.75);
    expect(Math.min(...zs)).toBeCloseTo(-0.75);
  });
});

describe('parseTransformation', () => {
  it('composes translation, rotations and scale', () => {
    const half = Math.SQRT1_2;
    // A 180 degree turn around y (left rotation) with a translation of one block, as the straw bed does.
    const m = parseTransformation({
      left_rotation: [0, 1, 0, 0],
      scale: [1, 1, 1],
      translation: [1, 0, 1],
    });
    expect(m?.map((v) => Math.round(v))).toEqual([-1, 0, 0, 1, 0, 1, 0, 0, 0, 0, -1, 1]);
    const quarter = parseTransformation({ left_rotation: [0, half, 0, half], scale: [2, 2, 2] });
    expect(quarter?.[2]).toBeCloseTo(2);
    expect(quarter?.[8]).toBeCloseTo(-2);
    expect(parseTransformation('nope')).toBeUndefined();
    expect(parseTransformation([1, 0, 0, 5, 0, 1, 0, 6, 0, 0, 1, 7, 0, 0, 0, 1])).toEqual([
      1, 0, 0, 5, 0, 1, 0, 6, 0, 0, 1, 7,
    ]);
  });
});

describe('bakeParts layers', () => {
  it('squashes the v of animated sheets to the first frame', () => {
    const parts = resolveItem('cube', source);
    if (!parts) throw new Error('missing');
    const [quad] = bakeParts(parts, { texture: () => image(16, 64) });
    // Corners start at the bottom left: v grows downward.
    expect(quad?.uvs[3]?.[1]).toBeCloseTo(0);
    expect(quad?.uvs[0]?.[1]).toBeCloseTo(0.25);
  });

  it('draws item/generated layers as one flat quad', () => {
    const parts = resolveItem('flat', source);
    if (!parts) throw new Error('missing');
    const quads = bakeParts(parts, { texture: () => image(16, 16) });
    expect(quads).toHaveLength(1);
    expect(bakeParts(parts, { texture: () => undefined })).toHaveLength(0);
  });
});
