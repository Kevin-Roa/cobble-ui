import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { composeSprite, composeTiledTexture, deviceSize, type RgbaImage } from './blit.ts';
import { projectModel, resolveItem } from './item-model.ts';
import { decodePng } from './png.ts';
import { parseSpriteScaling, type SpriteScaling } from './scaling.ts';

/** A texture whose red channel is the texel's x and green channel its y. */
function coordinateTexture(width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      data[o] = x;
      data[o + 1] = y;
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }
  return { width, height, data };
}

function texelAt(image: RgbaImage, x: number, y: number): [number, number] {
  const o = (y * image.width + x) * 4;
  return [image.data[o] ?? -1, image.data[o + 1] ?? -1];
}

describe('parseSpriteScaling', () => {
  it('defaults to stretch', () => {
    expect(parseSpriteScaling(undefined)).toEqual({ type: 'stretch' });
    expect(parseSpriteScaling({ animation: {} })).toEqual({ type: 'stretch' });
  });

  it('parses uniform and per-side nine-slice borders', () => {
    expect(
      parseSpriteScaling({
        gui: { scaling: { type: 'nine_slice', width: 200, height: 20, border: 3 } },
      }),
    ).toEqual({
      type: 'nine_slice',
      width: 200,
      height: 20,
      border: { left: 3, top: 3, right: 3, bottom: 3 },
      stretchInner: false,
    });
    expect(
      parseSpriteScaling({
        gui: {
          scaling: {
            type: 'nine_slice',
            width: 8,
            height: 20,
            border: { left: 2, top: 2, right: 2, bottom: 3 },
            stretch_inner: true,
          },
        },
      }),
    ).toMatchObject({ border: { left: 2, top: 2, right: 2, bottom: 3 }, stretchInner: true });
  });

  it('rejects malformed metadata', () => {
    expect(() =>
      parseSpriteScaling({ gui: { scaling: { type: 'tile', width: 0, height: 4 } } }),
    ).toThrow(TypeError);
  });
});

describe('composeSprite', () => {
  const button: SpriteScaling = {
    type: 'nine_slice',
    width: 200,
    height: 20,
    border: { left: 3, top: 3, right: 3, bottom: 3 },
    stretchInner: false,
  };
  const texture = coordinateTexture(200, 20);

  it('draws the sprite unchanged at its natural size', () => {
    const image = composeSprite({ image: texture, scaling: button }, 200, 20, 1);
    expect(texelAt(image, 0, 0)).toEqual([0, 0]);
    expect(texelAt(image, 199, 19)).toEqual([199, 19]);
  });

  it('keeps the borders and tiles the centre of a narrower button', () => {
    // Height matches, so this is the "height == nineSlice.height" branch.
    const image = composeSprite({ image: texture, scaling: button }, 100, 20, 1);
    expect(texelAt(image, 0, 5)).toEqual([0, 5]);
    expect(texelAt(image, 2, 5)).toEqual([2, 5]);
    expect(texelAt(image, 3, 5)).toEqual([3, 5]);
    expect(texelAt(image, 96, 5)).toEqual([96, 5]);
    // The right border comes from the right edge of the texture.
    expect(texelAt(image, 97, 5)).toEqual([197, 5]);
    expect(texelAt(image, 99, 5)).toEqual([199, 5]);
  });

  it('repeats the centre region when the sprite is wider than the texture', () => {
    const image = composeSprite({ image: texture, scaling: button }, 400, 20, 1);
    // Inner region is texels 3..196 (194 wide), repeated from x = 3.
    expect(texelAt(image, 3, 0)).toEqual([3, 0]);
    expect(texelAt(image, 3 + 194, 0)).toEqual([3, 0]);
    expect(texelAt(image, 3 + 195, 0)).toEqual([4, 0]);
    expect(texelAt(image, 399, 0)).toEqual([199, 0]);
  });

  it('clamps borders to half the size, like vanilla', () => {
    const image = composeSprite({ image: texture, scaling: button }, 4, 4, 1);
    expect(texelAt(image, 0, 0)).toEqual([0, 0]);
    expect(texelAt(image, 1, 1)).toEqual([1, 1]);
    expect(texelAt(image, 2, 2)).toEqual([198, 18]);
    expect(texelAt(image, 3, 3)).toEqual([199, 19]);
  });

  it('samples device pixels at their centre when stretching', () => {
    // The 20×20 checkbox sprite is drawn into a 17×17 box.
    const checkbox = coordinateTexture(20, 20);
    const image = composeSprite({ image: checkbox, scaling: { type: 'stretch' } }, 17, 17, 1);
    expect(image.width).toBe(17);
    expect(texelAt(image, 0, 0)).toEqual([0, 0]);
    expect(texelAt(image, 8, 8)).toEqual([10, 10]);
    expect(texelAt(image, 16, 16)).toEqual([19, 19]);
  });

  it('renders at device resolution', () => {
    const image = composeSprite({ image: texture, scaling: button }, 100, 20, 3);
    expect(image.width).toBe(300);
    expect(image.height).toBe(60);
    // Each GUI unit becomes 3×3 identical device pixels.
    expect(texelAt(image, 0, 0)).toEqual([0, 0]);
    expect(texelAt(image, 2, 2)).toEqual([0, 0]);
    expect(texelAt(image, 3, 3)).toEqual([1, 1]);
    expect(texelAt(image, 299, 59)).toEqual([199, 19]);
  });

  it('stretches the inner region when stretch_inner is set', () => {
    const frame: SpriteScaling = {
      type: 'nine_slice',
      width: 100,
      height: 100,
      border: { left: 10, top: 10, right: 10, bottom: 10 },
      stretchInner: true,
    };
    const image = composeSprite(
      { image: coordinateTexture(100, 100), scaling: frame },
      200,
      200,
      1,
    );
    expect(texelAt(image, 100, 100)).toEqual([50, 50]);
  });

  it('validates its arguments', () => {
    expect(() => composeSprite({ image: texture, scaling: button }, 1.5, 2, 1)).toThrow(RangeError);
    expect(() => composeSprite({ image: texture, scaling: button }, 1, 2, 0)).toThrow(RangeError);
  });
});

describe('composeTiledTexture', () => {
  it('repeats a 16×16 texture every 32 units (menu backgrounds)', () => {
    const image = composeTiledTexture(coordinateTexture(16, 16), 64, 32, 32, 32, 1);
    expect(texelAt(image, 0, 0)).toEqual([0, 0]);
    expect(texelAt(image, 1, 1)).toEqual([0, 0]);
    expect(texelAt(image, 2, 2)).toEqual([1, 1]);
    expect(texelAt(image, 32, 0)).toEqual([0, 0]);
  });

  it('applies the texture offset', () => {
    const image = composeTiledTexture(coordinateTexture(32, 2), 4, 2, 32, 2, 1, 30, 0);
    expect(texelAt(image, 0, 0)).toEqual([30, 0]);
    expect(texelAt(image, 2, 0)).toEqual([0, 0]);
  });
});

describe('deviceSize', () => {
  it('rounds half-device-pixels down', () => {
    expect(deviceSize(10, 1.5)).toBe(15);
    expect(deviceSize(1, 2.5)).toBe(2);
  });
});

function encode(options: ConstructorParameters<typeof PNG>[0], data: number[]): Uint8Array {
  const image = new PNG(options);
  image.data.set(data);
  return new Uint8Array(PNG.sync.write(image, options));
}

describe('decodePng', () => {
  const pixels = [255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 40, 40, 40, 255];

  it.each([
    ['RGBA', { colorType: 6 as const }],
    ['RGB', { colorType: 2 as const }],
    ['grayscale + alpha', { colorType: 4 as const }],
  ])('decodes %s images like pngjs', (_name, colorOptions) => {
    const bytes = encode({ width: 2, height: 2, ...colorOptions }, pixels);
    const expected = PNG.sync.read(Buffer.from(bytes));
    const decoded = decodePng(bytes);
    expect(decoded.width).toBe(2);
    expect(Array.from(decoded.data)).toEqual(Array.from(expected.data));
  });

  it('rejects non-PNG data', () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3]))).toThrow('Not a PNG file');
  });
});

function failNoModel(): never {
  throw new Error('item has no model');
}

describe('item models', () => {
  const files: Record<string, unknown> = {
    'assets/minecraft/items/stone.json': {
      model: { type: 'minecraft:model', model: 'minecraft:block/stone' },
    },
    'assets/minecraft/items/stick.json': {
      model: { type: 'minecraft:model', model: 'minecraft:item/stick' },
    },
    'assets/minecraft/models/block/stone.json': {
      parent: 'minecraft:block/cube_all',
      textures: { all: 'minecraft:block/stone' },
    },
    'assets/minecraft/models/block/cube_all.json': {
      parent: 'block/cube',
      textures: {
        down: '#all',
        up: '#all',
        north: '#all',
        south: '#all',
        west: '#all',
        east: '#all',
      },
    },
    'assets/minecraft/models/block/cube.json': {
      parent: 'block/block',
      elements: [
        {
          from: [0, 0, 0],
          to: [16, 16, 16],
          faces: {
            down: { texture: '#down' },
            up: { texture: '#up' },
            north: { texture: '#north' },
            south: { texture: '#south' },
            west: { texture: '#west' },
            east: { texture: '#east' },
          },
        },
      ],
    },
    'assets/minecraft/models/block/block.json': {
      display: {
        gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] },
      },
    },
    'assets/minecraft/models/item/stick.json': {
      parent: 'minecraft:item/generated',
      textures: { layer0: 'minecraft:item/stick' },
    },
    'assets/minecraft/models/item/generated.json': {
      parent: 'builtin/generated',
      gui_light: 'front',
    },
  };
  const source = (path: string): unknown => files[path] ?? null;

  it('draws a block as three lit faces seen from above', () => {
    const parts = resolveItem('stone', source);
    expect(parts).toHaveLength(1);
    const faces = projectModel(parts?.[0]?.model ?? failNoModel(), []);
    expect(faces.map((face) => face.texture)).toEqual([
      'block/stone',
      'block/stone',
      'block/stone',
    ]);
    // The top face is the brightest, and the cube fits the 16-unit slot.
    expect(Math.max(...faces.map((face) => face.shade))).toBe(1);
    for (const face of faces) {
      expect(face.origin[0]).toBeGreaterThanOrEqual(0);
      expect(face.origin[0]).toBeLessThanOrEqual(16);
    }
  });

  it('reads flat item layers from generated models', () => {
    const parts = resolveItem('stick', source);
    expect(parts?.[0]?.model.layers).toEqual(['item/stick']);
  });

  it('reports files that are still loading and items that have no model', () => {
    expect(resolveItem('stone', () => undefined)).toBeUndefined();
    expect(resolveItem('nothing', source)).toBeNull();
  });
});
