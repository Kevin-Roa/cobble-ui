import { describe, expect, it } from 'vitest';
import { resolveItem, type GuiTransform } from '../item-model.ts';
import type { RgbaImage } from '../blit.ts';
import { bakeEntity, parseSpecialModel } from './entity-models.ts';
import type { Quad, Vec3 } from './engine.ts';
import { guiEntityQuads, renderEntityIcon } from './entity-icon.ts';
import { bakeParts, modelTextures } from './model.ts';

function opaque(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) };
}

const GUI = { rotation: [30, 45, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] };
const files: Record<string, unknown> = {
  'assets/minecraft/models/item/template_skull.json': {
    parent: 'builtin/entity',
    display: { gui: GUI },
  },
  'assets/minecraft/models/item/copper_golem_statue.json': {
    parent: 'minecraft:item/template_skull',
  },
  'assets/minecraft/models/item/chest.json': { parent: 'builtin/entity' },
};
const head = (kind: string): unknown => ({
  model: {
    type: 'minecraft:special',
    base: 'minecraft:item/template_skull',
    model: { type: 'minecraft:head', kind },
  },
});
for (const kind of [
  'creeper',
  'dragon',
  'piglin',
  'player',
  'skeleton',
  'wither_skeleton',
  'zombie',
]) {
  files[`assets/minecraft/items/${kind}_head.json`] = head(kind);
}
files['assets/minecraft/items/copper_golem_statue.json'] = {
  model: {
    type: 'minecraft:special',
    base: 'minecraft:item/copper_golem_statue',
    model: {
      type: 'minecraft:copper_golem_statue',
      pose: 'standing',
      texture: 'minecraft:textures/entity/copper_golem/copper_golem_exposed.png',
    },
  },
};
files['assets/minecraft/items/chest.json'] = {
  model: {
    type: 'minecraft:special',
    base: 'minecraft:item/chest',
    model: { type: 'minecraft:chest', texture: 'minecraft:normal' },
  },
};
const source = (path: string): unknown => files[path] ?? null;

const count = (model: Parameters<typeof bakeEntity>[0], texture: RgbaImage): number =>
  bakeEntity(model, texture, () => 1).length;

type Box3 = { min: Vec3; max: Vec3 };

function bounds(quads: readonly Quad[]): Box3 {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const quad of quads)
    for (const corner of quad.corners)
      for (const axis of [0, 1, 2] as const) {
        min[axis] = Math.min(min[axis], corner[axis]);
        max[axis] = Math.max(max[axis], corner[axis]);
      }
  return { min, max };
}

/** The pixel bounds `[x0, y0, x1, y1]` of the drawn (non-transparent) pixels. */
function alphaBounds(image: RgbaImage): [number, number, number, number] {
  const box: [number, number, number, number] = [image.width, image.height, -1, -1];
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if ((image.data[(y * image.width + x) * 4 + 3] as number) > 0) {
        box[0] = Math.min(box[0], x);
        box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x);
        box[3] = Math.max(box[3], y);
      }
  return box;
}

describe('special entity item models', () => {
  const textures: Record<string, string> = {
    creeper: 'entity/creeper/creeper',
    dragon: 'entity/enderdragon/dragon',
    piglin: 'entity/piglin/piglin',
    player: 'entity/player/wide/steve',
    skeleton: 'entity/skeleton/skeleton',
    wither_skeleton: 'entity/skeleton/wither_skeleton',
    zombie: 'entity/zombie/zombie',
  };
  for (const [kind, texture] of Object.entries(textures)) {
    it(`resolves ${kind}_head with the base gui transform`, () => {
      const parts = resolveItem(`${kind}_head`, source);
      expect(parts).toHaveLength(1);
      expect(parts?.[0]?.entity?.texture).toBe(texture);
      expect(parts?.[0]?.model.gui?.rotation).toEqual([30, 45, 0]);
      expect(modelTextures(parts ?? [])).toEqual([texture]);
    });
  }

  it('resolves the copper golem, honouring a texture override and an inherited gui', () => {
    const parts = resolveItem('copper_golem_statue', source);
    expect(parts?.[0]?.entity).toEqual({
      model: 'copper_golem',
      texture: 'entity/copper_golem/copper_golem_exposed',
    });
    expect(parts?.[0]?.model.gui?.scale).toEqual([0.625, 0.625, 0.625]);
  });

  it('leaves special types it does not draw as heads without an entity (chests have a block entity)', () => {
    expect(parseSpecialModel({ type: 'minecraft:chest' })).toBeUndefined();
    expect(resolveItem('chest', source)?.[0]?.entity).toBeUndefined();
  });

  it('is pending while the base model loads', () => {
    expect(
      resolveItem('creeper_head', (p) => (p.includes('models') ? undefined : source(p))),
    ).toBeUndefined();
  });

  it('bakes the cubes of each model', () => {
    expect(count('skull', opaque(64, 32))).toBe(6);
    expect(count('humanoid_head', opaque(64, 64))).toBe(12);
    expect(count('piglin_head', opaque(128, 64))).toBe(36);
    expect(count('dragon_head', opaque(256, 256))).toBe(42);
    expect(count('copper_golem', opaque(64, 64))).toBe(54);
  });

  it('puts the skull on the block floor facing +z', () => {
    const quads = bakeEntity('skull', opaque(64, 32), () => 1);
    const ys = quads.flatMap((q) => q.corners.map((c) => c[1]));
    expect(Math.min(...ys)).toBeCloseTo(-0.5);
    expect(Math.max(...ys)).toBeCloseTo(0);
    // The front face (texture column u+d) is the +z one.
    const front = quads[0];
    expect(front?.corners.every((c) => Math.abs(c[2] - 0.25) < 1e-9)).toBe(true);
  });

  it('bakes entity parts for BlockModel and draws them into a slot icon', () => {
    const parts = resolveItem('creeper_head', source) ?? [];
    const texture = opaque(64, 32);
    expect(bakeParts(parts, { texture: () => texture })).toHaveLength(6);
    expect(bakeParts(parts, { texture: () => undefined })).toHaveLength(0);
    const gui = parts[0]?.model.gui;
    const spec = parts[0]?.entity;
    if (!spec) throw new Error('missing entity');
    const image = renderEntityIcon(spec, texture, gui, 32);
    let drawn = 0;
    for (let i = 3; i < image.data.length; i += 4) if ((image.data[i] as number) > 0) drawn++;
    expect(drawn).toBeGreaterThan(100);
    // Faces turned away from the lights are darker than the top.
    const shades = guiEntityQuads(spec, texture, gui).map((q) => q.color?.[0] ?? 1);
    expect(Math.max(...shades)).toBeGreaterThan(Math.min(...shades));
  });

  it('stands the copper golem upright on the block floor, 1.5 blocks tall (CopperGolemStatueModel)', () => {
    const { min, max } = bounds(bakeEntity('copper_golem', opaque(64, 64), () => 1));
    expect(min[1]).toBeCloseTo(-0.5, 1);
    expect(max[1]).toBeCloseTo(1, 1);
    // 7 pixel arms each side, 5 pixel deep head and 3 pixel nose in front (+z).
    expect(max[0]).toBeCloseTo(7 / 16, 1);
    expect(min[0]).toBeCloseTo(-7 / 16, 1);
    expect(max[2]).toBeCloseTo(6 / 16, 1);
  });

  it('draws the copper golem item upright and inside the slot with the statue gui transform', () => {
    const gui: GuiTransform = {
      rotation: [30, 45, 180],
      translation: [0, 2, 0],
      scale: [0.55, 0.55, 0.55],
    };
    const spec = { model: 'copper_golem', texture: 'entity/copper_golem/copper_golem' } as const;
    // Legs (texture rows 27+) are red, the rest blue: red must be drawn lower on screen than blue.
    const texture = opaque(64, 64);
    for (let i = 0; i < 64 * 64; i++) {
      const red = Math.floor(i / 64) >= 27;
      texture.data[i * 4] = red ? 255 : 0;
      texture.data[i * 4 + 2] = red ? 0 : 255;
    }
    const painted = renderEntityIcon(spec, texture, gui, 64);
    let redSum = 0;
    let redCount = 0;
    let blueSum = 0;
    let blueCount = 0;
    for (let i = 0; i < 64 * 64; i++) {
      if ((painted.data[i * 4 + 3] as number) === 0) continue;
      const row = Math.floor(i / 64);
      if ((painted.data[i * 4] as number) > (painted.data[i * 4 + 2] as number)) {
        redSum += row;
        redCount++;
      } else {
        blueSum += row;
        blueCount++;
      }
    }
    expect(redCount).toBeGreaterThan(20);
    expect(blueCount).toBeGreaterThan(redCount);
    expect(redSum / redCount).toBeGreaterThan(blueSum / blueCount + 10);
    const image = renderEntityIcon(spec, opaque(64, 64), gui, 64);
    const [x0, y0, x1, y1] = alphaBounds(image);
    expect(x0).toBeGreaterThan(0);
    expect(y0).toBeGreaterThan(0);
    expect(x1).toBeLessThan(63);
    expect(y1).toBeLessThan(63);
    // Whole golem, not just its head: it spans most of the slot's height.
    expect(y1 - y0).toBeGreaterThan(40);
  });

  it('scales the dragon head to 0.75 and keeps all of it inside the gui slot', () => {
    const { min, max } = bounds(bakeEntity('dragon_head', opaque(256, 256), () => 1));
    // The lip starts 24 pixels in front of the head origin, scaled by 0.75.
    expect(max[2]).toBeCloseTo(18 / 16, 2);
    expect(max[0]).toBeCloseTo((8 * 0.75) / 16, 2);
    // The head sits about 2 pixels above the floor; only the opened jaw tip dips below it.
    expect(min[1]).toBeGreaterThan(-0.55);
    const gui: GuiTransform = {
      rotation: [30, 45, 0],
      translation: [-2, 2, 0],
      scale: [0.6, 0.6, 0.6],
    };
    const spec = { model: 'dragon_head', texture: 'entity/enderdragon/dragon' } as const;
    const [x0, y0, x1, y1] = alphaBounds(renderEntityIcon(spec, opaque(256, 256), gui, 64));
    expect(x0).toBeGreaterThan(0);
    expect(y0).toBeGreaterThan(0);
    expect(x1).toBeLessThan(63);
    expect(y1).toBeLessThan(63);
  });

  it('opens the dragon jaw by 0.2 radians (setupAnim at animation 0)', () => {
    const quads = bakeEntity('dragon_head', opaque(256, 256), () => 1);
    const jaw = quads.slice(-6);
    const { min, max } = bounds(jaw);
    // A closed 4 pixel jaw is 3 pixels tall once scaled; opening tilts the tip down.
    expect(max[1] - min[1]).toBeGreaterThan((4 * 0.75) / 16 + 0.05);
  });

  it('centres and fits tall or long entity models in the BlockModel viewport', () => {
    const parts = resolveItem('copper_golem_statue', source) ?? [];
    const golem = bakeParts(parts, { texture: () => opaque(64, 64) });
    const { min, max } = bounds(golem);
    for (const axis of [0, 1, 2] as const) expect((min[axis] + max[axis]) / 2).toBeCloseTo(0, 5);
    expect(max[1] - min[1]).toBeCloseTo(1.5, 1);
  });
});
