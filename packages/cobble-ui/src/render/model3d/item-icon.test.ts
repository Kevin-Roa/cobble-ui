import { describe, expect, it } from 'vitest';
import { resolveItem, type JsonSource } from '../item-model.ts';
import type { RgbaImage } from '../blit.ts';
import { renderPartsIcon } from './entity-icon.ts';

/** A texture of one flat colour, so a pixel of the icon names the face it came from. */
function solid(r: number, g: number, b: number): RgbaImage {
  const data = new Uint8ClampedArray(16 * 16 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([r, g, b, 255], i);
  return { width: 16, height: 16, data };
}

const COLORS: Record<string, readonly [number, number, number]> = {
  'block/red': [255, 0, 0],
  'block/blue': [0, 0, 255],
  'block/gray': [128, 128, 128],
};
const texture = (id: string): RgbaImage | undefined => {
  const c = COLORS[id];
  return c ? solid(...c) : undefined;
};

const SIZE = 64;
type Color = 'red' | 'blue' | 'gray' | 'none';

/** The colour at a pixel (the GUI lights only darken, so the dominant channel names it). */
function at(image: RgbaImage, x: number, y: number): Color {
  const i = (y * image.width + x) * 4;
  const [r, g, b, a] = [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
  if (a === 0) return 'none';
  if (r === g && g === b) return 'gray';
  return (r as number) > (b as number) ? 'red' : 'blue';
}

function count(image: RgbaImage, color: Color): number {
  let n = 0;
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) if (at(image, x, y) === color) n++;
  return n;
}

function centroid(image: RgbaImage, color: Color): readonly [x: number, y: number] {
  let n = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (at(image, x, y) === color) {
        n++;
        sx += x;
        sy += y;
      }
  return [sx / n, sy / n];
}

// Geometry and `display.gui` copied from the 26.3 client (`block/template_shelf_inventory`,
// `block/wall_inventory`, `block/template_bed*`); only the textures are flat colours.
const files: Record<string, unknown> = {
  'assets/minecraft/items/shelf.json': { model: { type: 'minecraft:model', model: 'block/shelf' } },
  'assets/minecraft/models/block/shelf.json': {
    display: {
      gui: { rotation: [30, 225, 0], translation: [2.5, -1.5, 0], scale: [0.625, 0.625, 0.625] },
    },
    textures: { body: 'block/gray', board: 'block/red' },
    elements: [
      {
        from: [0, 0, 13],
        to: [16, 16, 16],
        faces: {
          north: { uv: [0, 2, 8, 6], texture: '#body' },
          east: { uv: [8, 0, 9.5, 8], texture: '#body' },
          south: { uv: [8, 0, 16, 8], texture: '#body' },
          west: { uv: [14.5, 0, 16, 8], texture: '#body' },
          up: { uv: [16, 5, 8, 3.5], texture: '#body' },
          down: { uv: [16, 6, 8, 4.5], texture: '#body' },
        },
      },
      {
        from: [0, 0, 11],
        to: [16, 4, 13],
        faces: {
          north: { uv: [0, 6, 8, 8], texture: '#board' },
          east: { uv: [1.5, 6, 2.5, 8], texture: '#board' },
          south: { uv: [0, 0, 8, 1], texture: '#board' },
          west: { uv: [5.5, 6, 6.5, 8], texture: '#board' },
          up: { uv: [8, 3.5, 16, 4.5], texture: '#board' },
          down: { uv: [16, 4.5, 8, 3.5], texture: '#board' },
        },
      },
    ],
  },
  'assets/minecraft/items/wall.json': { model: { type: 'minecraft:model', model: 'block/wall' } },
  'assets/minecraft/models/block/wall.json': {
    display: {
      gui: { rotation: [30, 135, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] },
    },
    textures: { post: 'block/red', side: 'block/blue' },
    elements: [
      {
        from: [4, 0, 4],
        to: [12, 16, 12],
        faces: {
          down: { uv: [4, 4, 12, 12], texture: '#post' },
          up: { uv: [4, 4, 12, 12], texture: '#post' },
          north: { uv: [4, 0, 12, 16], texture: '#post' },
          south: { uv: [4, 0, 12, 16], texture: '#post' },
          west: { uv: [4, 0, 12, 16], texture: '#post' },
          east: { uv: [4, 0, 12, 16], texture: '#post' },
        },
      },
      {
        from: [5, 0, 0],
        to: [11, 13, 16],
        faces: {
          down: { uv: [5, 0, 11, 16], texture: '#side' },
          up: { uv: [5, 0, 11, 16], texture: '#side' },
          north: { uv: [5, 3, 11, 16], texture: '#side' },
          south: { uv: [5, 3, 11, 16], texture: '#side' },
          west: { uv: [0, 3, 16, 16], texture: '#side' },
          east: { uv: [0, 3, 16, 16], texture: '#side' },
        },
      },
    ],
  },
  'assets/minecraft/items/bed.json': {
    model: {
      type: 'minecraft:composite',
      models: [
        { type: 'minecraft:model', model: 'block/bed_head' },
        {
          type: 'minecraft:model',
          model: 'block/bed_foot',
          transformation: {
            left_rotation: [0, 0, 0, 1],
            right_rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
            translation: [0, 0, 1],
          },
        },
      ],
    },
  },
  'assets/minecraft/models/block/template_bed.json': {
    display: {
      gui: { rotation: [30, 340, 0], translation: [2, 3, 0], scale: [0.5325, 0.5325, 0.5325] },
    },
  },
  'assets/minecraft/models/block/bed_head.json': {
    parent: 'block/template_bed',
    textures: { up: 'block/red', side: 'block/gray' },
    elements: [
      {
        from: [0, 3, 0],
        to: [16, 9, 16],
        faces: {
          down: { uv: [0, 0, 16, 16], texture: '#side' },
          up: { uv: [0, 0, 16, 16], texture: '#up' },
          north: { uv: [0, 7, 16, 13], texture: '#side' },
          west: { uv: [0, 7, 16, 13], texture: '#side' },
          east: { uv: [0, 7, 16, 13], texture: '#side' },
        },
      },
    ],
  },
  'assets/minecraft/models/block/bed_foot.json': {
    parent: 'block/template_bed',
    textures: { up: 'block/blue', side: 'block/gray' },
    elements: [
      {
        from: [0, 3, 0],
        to: [16, 9, 16],
        faces: {
          down: { uv: [0, 0, 16, 16], texture: '#side' },
          up: { uv: [0, 0, 16, 16], texture: '#up' },
          south: { uv: [0, 7, 16, 13], texture: '#side' },
          west: { uv: [0, 7, 16, 13], texture: '#side' },
          east: { uv: [0, 7, 16, 13], texture: '#side' },
        },
      },
    ],
  },
};
const source: JsonSource = (path) => files[path] ?? null;

function icon(name: string): RgbaImage {
  const parts = resolveItem(name, source);
  if (!parts) throw new Error(`no parts for ${name}`);
  return renderPartsIcon(parts, texture, SIZE);
}

describe('element model slot icons (depth buffer, display.gui)', () => {
  it('draws the lower board of a shelf in front of its body', () => {
    const image = icon('shelf');
    // The board (red, z 11..13) sticks out in front of the body (gray, z 13..16): its front and top
    // faces cover the lower right of the body. A painter ordered by face centres drew it behind.
    expect(at(image, 35, 42)).toBe('red');
    expect(at(image, 45, 38)).toBe('red');
    // The body above and to the left of the board is still gray.
    expect(at(image, 30, 24)).toBe('gray');
    expect(at(image, 20, 40)).toBe('gray');
    expect(count(image, 'red')).toBeGreaterThan(200);
  });

  it('draws a wall post with its low sides at the right depths', () => {
    const image = icon('wall');
    // The post (red) is 3 units taller than the side (blue) and stands in front of the near side.
    expect(at(image, 40, 24)).toBe('red');
    expect(at(image, 20, 40)).toBe('blue');
    expect(at(image, 49, 30)).toBe('blue');
    expect(count(image, 'red')).toBeGreaterThan(300);
    expect(count(image, 'blue')).toBeGreaterThan(300);
  });

  it('shows both halves of a bed, placed by the foot transformation', () => {
    const image = icon('bed');
    // Both mattress tops are drawn, neither hidden under the other (the foot used to be projected
    // exactly on top of the head, so only one half showed).
    expect(count(image, 'red')).toBeGreaterThan(500);
    expect(count(image, 'blue')).toBeGreaterThan(500);
    const [headX, headY] = centroid(image, 'red');
    const [footX, footY] = centroid(image, 'blue');
    // The foot is one block further along +z: the GUI view shows it toward the lower left.
    expect(footX).toBeLessThan(headX - 8);
    expect(footY).toBeGreaterThan(headY + 8);
    // The whole 2-block bed stays inside the slot.
    for (let i = 0; i < SIZE; i++) {
      expect(at(image, i, 0)).toBe('none');
      expect(at(image, i, SIZE - 1)).toBe('none');
      expect(at(image, 0, i)).toBe('none');
      expect(at(image, SIZE - 1, i)).toBe('none');
    }
  });
});
