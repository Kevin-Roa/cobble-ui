import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../blit.ts';
import { resolveItem } from '../item-model.ts';
import {
  bakeBlockEntity,
  blockEntityTextures,
  parseBlockEntityModel,
  type BlockEntitySpec,
} from './block-entity-models.ts';
import type { Quad, Vec3 } from './engine.ts';
import { bakeParts, modelTextures } from './model.ts';

function opaque(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) };
}

const special = (base: string, model: unknown): Record<string, unknown> => ({
  type: 'minecraft:special',
  base: `minecraft:item/${base}`,
  model,
});

const files: Record<string, unknown> = {
  'assets/minecraft/models/item/template_chest.json': { display: {} },
  'assets/minecraft/models/item/chest.json': { parent: 'minecraft:item/template_chest' },
  'assets/minecraft/models/item/template_banner.json': { gui_light: 'front' },
  'assets/minecraft/models/item/shield.json': { gui_light: 'front' },
  'assets/minecraft/models/item/decorated_pot.json': { gui_light: 'front' },
  'assets/minecraft/models/item/conduit.json': {},
  'assets/minecraft/models/item/trident_in_hand.json': { gui_light: 'front' },
  'assets/minecraft/models/item/generated.json': { parent: 'builtin/generated' },
  'assets/minecraft/models/item/trident.json': {
    parent: 'minecraft:item/generated',
    textures: { layer0: 'minecraft:item/trident' },
  },
  'assets/minecraft/models/block/cube_all.json': {
    elements: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faces: { north: { texture: '#all', uv: [0, 0, 16, 16] } },
      },
    ],
  },
  'assets/minecraft/models/block/red_stained_glass.json': {
    parent: 'minecraft:block/cube_all',
    textures: { all: { force_translucent: true, sprite: 'minecraft:block/red_stained_glass' } },
  },
  'assets/minecraft/models/block/heavy_core.json': {
    textures: { all: 'block/heavy_core', particle: 'block/heavy_core' },
    elements: [
      { from: [4, 0, 4], to: [12, 8, 12], faces: { north: { texture: 'all', uv: [0, 8, 8, 16] } } },
    ],
  },
  'assets/minecraft/items/chest.json': {
    model: {
      type: 'minecraft:select',
      property: 'minecraft:local_time',
      pattern: 'MM-dd',
      cases: [
        {
          when: ['12-24'],
          model: special('chest', { type: 'minecraft:chest', texture: 'minecraft:christmas' }),
        },
      ],
      fallback: special('chest', { type: 'minecraft:chest', texture: 'minecraft:normal' }),
    },
  },
  'assets/minecraft/items/waxed_oxidized_copper_chest.json': {
    model: special('chest', { type: 'minecraft:chest', texture: 'minecraft:copper_oxidized' }),
  },
  'assets/minecraft/items/red_shulker_box.json': {
    model: special('chest', { type: 'minecraft:shulker_box', texture: 'minecraft:shulker_red' }),
  },
  'assets/minecraft/items/red_banner.json': {
    model: special('template_banner', { type: 'minecraft:banner', color: 'red' }),
  },
  'assets/minecraft/items/decorated_pot.json': {
    model: special('decorated_pot', { type: 'minecraft:decorated_pot' }),
  },
  'assets/minecraft/items/conduit.json': {
    model: special('conduit', { type: 'minecraft:conduit' }),
  },
  'assets/minecraft/items/shield.json': {
    model: {
      type: 'minecraft:condition',
      property: 'minecraft:using_item',
      on_true: special('shield', { type: 'minecraft:shield' }),
      on_false: special('shield', { type: 'minecraft:shield' }),
    },
  },
  'assets/minecraft/items/trident.json': {
    model: {
      type: 'minecraft:select',
      property: 'minecraft:display_context',
      cases: [
        {
          when: ['gui', 'ground', 'fixed', 'on_shelf'],
          model: { type: 'minecraft:model', model: 'minecraft:item/trident' },
        },
      ],
      fallback: special('trident_in_hand', { type: 'minecraft:trident' }),
    },
  },
  'assets/minecraft/items/red_stained_glass.json': {
    model: { type: 'minecraft:model', model: 'minecraft:block/red_stained_glass' },
  },
  'assets/minecraft/items/heavy_core.json': {
    model: { type: 'minecraft:model', model: 'minecraft:block/heavy_core' },
  },
};
const source = (path: string): unknown => files[path] ?? null;

describe('block-entity special item models', () => {
  it('resolves chests, taking the fallback of the date select', () => {
    const [part] = resolveItem('chest', source) ?? [];
    expect(part?.blockEntity).toEqual({ type: 'chest', texture: 'entity/chest/normal' });
    const [copper] = resolveItem('waxed_oxidized_copper_chest', source) ?? [];
    expect(copper?.blockEntity?.texture).toBe('entity/chest/copper_oxidized');
  });

  it('resolves shulker boxes, banners, the pot, the conduit and the shield', () => {
    expect(resolveItem('red_shulker_box', source)?.[0]?.blockEntity).toEqual({
      type: 'shulker_box',
      texture: 'entity/shulker/shulker_red',
    });
    expect(resolveItem('red_banner', source)?.[0]?.blockEntity).toEqual({
      type: 'banner',
      color: 'red',
    });
    expect(resolveItem('decorated_pot', source)?.[0]?.blockEntity?.type).toBe('decorated_pot');
    expect(resolveItem('conduit', source)?.[0]?.blockEntity?.type).toBe('conduit');
    expect(resolveItem('shield', source)?.[0]?.blockEntity?.type).toBe('shield');
  });

  it('keeps the base model, which carries the lighting', () => {
    expect(resolveItem('red_banner', source)?.[0]?.model.light).toBe('front');
    expect(resolveItem('chest', source)?.[0]?.model.light).toBe('side');
  });

  it('picks the display_context case: the flat sprite in the GUI, the model in hand', () => {
    const gui = resolveItem('trident', source);
    expect(gui?.[0]?.blockEntity).toBeUndefined();
    expect(gui?.[0]?.model.layers).toEqual(['item/trident']);
    const hand = resolveItem('trident', source, 'thirdperson_righthand');
    expect(hand?.[0]?.blockEntity?.type).toBe('trident');
  });

  it('lists the textures each model samples', () => {
    expect(blockEntityTextures({ type: 'banner', color: 'red' })).toEqual([
      'entity/banner/banner_base',
    ]);
    expect(blockEntityTextures({ type: 'decorated_pot' })).toEqual([
      'entity/decorated_pot/decorated_pot_base',
      'entity/decorated_pot/decorated_pot_side',
    ]);
    expect(blockEntityTextures({ type: 'shield' })).toEqual([
      'entity/shield/shield_base_nopattern',
    ]);
    expect(blockEntityTextures({ type: 'trident' })).toEqual(['entity/trident/trident']);
    expect(blockEntityTextures({ type: 'conduit' })).toEqual(['entity/conduit/base']);
    expect(modelTextures(resolveItem('chest', source) ?? [])).toEqual(['entity/chest/normal']);
  });

  it('ignores special models it does not draw', () => {
    expect(parseBlockEntityModel({ type: 'minecraft:head', kind: 'creeper' })).toBeUndefined();
    expect(parseBlockEntityModel(undefined)).toBeUndefined();
  });
});

describe('regular models behind the broken-looking items', () => {
  it('reads object texture references (stained glass)', () => {
    const parts = resolveItem('red_stained_glass', source) ?? [];
    expect(parts[0]?.model.textures['all']).toBe('block/red_stained_glass');
    expect(modelTextures(parts)).toEqual(['block/red_stained_glass']);
    expect(bakeParts(parts, { texture: () => opaque(16, 16) })).toHaveLength(1);
  });

  it('reads a bare texture variable name (heavy core)', () => {
    const parts = resolveItem('heavy_core', source) ?? [];
    expect(modelTextures(parts)).toEqual(['block/heavy_core']);
  });
});

function bake(spec: BlockEntitySpec): Quad[] {
  return bakeBlockEntity(
    spec,
    () => opaque(64, 64),
    () => 1,
  );
}

function bakeGui(spec: BlockEntitySpec): Quad[] {
  return bakeBlockEntity(
    spec,
    () => opaque(64, 64),
    () => 1,
    'gui',
  );
}

function bounds(quads: readonly Quad[]): { min: number[]; max: number[] } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const { corners } of quads)
    for (const corner of corners)
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i] as number, corner[i] as number);
        max[i] = Math.max(max[i] as number, corner[i] as number);
      }
  return { min, max };
}

function normalOf(quad: Quad): Vec3 {
  const [a, b, , d] = quad.corners;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]] as const;
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

describe('bakeBlockEntity', () => {
  it('builds the cubes of each model', () => {
    expect(bake({ type: 'chest', texture: 'entity/chest/normal' })).toHaveLength(18);
    expect(bake({ type: 'shulker_box', texture: 'entity/shulker/shulker' })).toHaveLength(12);
    expect(bake({ type: 'banner', color: 'white' })).toHaveLength(18);
    expect(bake({ type: 'decorated_pot' })).toHaveLength(28);
    expect(bake({ type: 'conduit' })).toHaveLength(6);
    expect(bake({ type: 'shield' })).toHaveLength(12);
    expect(bake({ type: 'trident' })).toHaveLength(30);
  });

  it('places the chest on the floor of its block, lid on top, latch in front', () => {
    const { min, max } = bounds(bake({ type: 'chest', texture: 'entity/chest/normal' }));
    expect(min[1]).toBeCloseTo(-0.5);
    expect(max[1]).toBeCloseTo(14 / 16 - 0.5);
    expect(min[0]).toBeCloseTo(1 / 16 - 0.5);
    expect(max[0]).toBeCloseTo(15 / 16 - 0.5);
    expect(max[2]).toBeCloseTo(0.5);
  });

  it('places the shulker box on the floor, 0.9995 of a block wide', () => {
    const { min, max } = bounds(bake({ type: 'shulker_box', texture: 'entity/shulker/shulker' }));
    expect(min[1]).toBeCloseTo(-0.5, 3);
    expect((max[0] as number) - (min[0] as number)).toBeCloseTo(0.9995, 3);
  });

  it('winds the faces of a cube counter-clockwise from outside', () => {
    const quads = bake({ type: 'conduit' });
    const { min, max } = bounds(quads);
    const centre = [0, 1, 2].map((i) => ((min[i] as number) + (max[i] as number)) / 2);
    for (const quad of quads) {
      const n = normalOf(quad);
      const c = quad.corners[0];
      const dot =
        n[0] * (c[0] - (centre[0] as number)) +
        n[1] * (c[1] - (centre[1] as number)) +
        n[2] * (c[2] - (centre[2] as number));
      expect(dot).toBeGreaterThan(0);
    }
  });

  it('tints only the banner flag and fits the banner into the view', () => {
    const quads = bake({ type: 'banner', color: 'red' });
    expect(quads.filter((q) => (q.color?.[1] ?? 1) < 0.5)).toHaveLength(6);
    expect(quads.filter((q) => (q.color?.[1] ?? 1) === 1)).toHaveLength(12);
    const { min, max } = bounds(quads);
    expect((min[0] as number) + (max[0] as number)).toBeCloseTo(0);
    expect((max[1] as number) - (min[1] as number)).toBeLessThanOrEqual(1.5 + 1e-6);
  });

  it('keeps the item definition placement for slot icons (no refit)', () => {
    // Banner: transformation translation (0.5, 0, 0.5) puts the pole on the block's floor centre,
    // scale 0.6666667 makes the 44px pole + bar 1.83 blocks tall (taller than the block).
    const banner = bounds(bakeGui({ type: 'banner', color: 'red' }));
    expect((banner.min[0] as number) + (banner.max[0] as number)).toBeCloseTo(0);
    expect((banner.min[2] as number) + (banner.max[2] as number)).toBeCloseTo(0, 1);
    expect(banner.min[1]).toBeCloseTo(-0.5);
    expect((banner.max[1] as number) - (banner.min[1] as number)).toBeCloseTo((44 * 2) / 3 / 16, 2);
    // Shield: identity translation, so the plate is centred on the block corner.
    const shield = bounds(bakeGui({ type: 'shield' }));
    expect(shield.min[0]).toBeCloseTo(-6 / 16 - 0.5);
    expect(shield.max[0]).toBeCloseTo(6 / 16 - 0.5);
  });

  it('faces the banner cloth and the shield plate toward the viewer (+z)', () => {
    for (const spec of [{ type: 'banner', color: 'red' }, { type: 'shield' }] as const) {
      for (const view of ['gui', 'viewer'] as const) {
        const quads = bakeBlockEntity(
          spec,
          () => opaque(64, 64),
          () => 1,
          view,
        );
        // The faces lying in the front-most plane (the cloth, the plate) point at +z.
        const maxZ = bounds(quads).max[2] as number;
        const front = quads.filter((q) => q.corners.every((c) => Math.abs(c[2] - maxZ) < 1e-9));
        expect(front.length).toBeGreaterThan(0);
        for (const q of front) expect(normalOf(q)[2]).toBeGreaterThan(0);
      }
    }
  });

  it('draws nothing while a texture is missing', () => {
    expect(
      bakeBlockEntity(
        { type: 'conduit' },
        () => undefined,
        () => 1,
      ),
    ).toEqual([]);
  });

  it('shades flat for gui_light front items in bakeParts', () => {
    const parts = resolveItem('red_banner', source) ?? [];
    const quads = bakeParts(parts, { texture: () => opaque(64, 64) });
    expect(quads).toHaveLength(18);
    expect(quads.filter((q) => q.color?.[1] === 1)).toHaveLength(12);
  });
});
