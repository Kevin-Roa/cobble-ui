/**
 * Mirrors `net.minecraft.client.resources.metadata.gui.GuiSpriteScaling`.
 *
 * Every GUI sprite may ship a `<sprite>.png.mcmeta` file whose `gui.scaling`
 * object decides how the sprite is drawn when the requested size differs from
 * the texture size.
 */
export type SpriteScaling = StretchScaling | TileScaling | NineSliceScaling;

export interface StretchScaling {
  readonly type: 'stretch';
}

export interface TileScaling {
  readonly type: 'tile';
  readonly width: number;
  readonly height: number;
}

export interface NineSliceBorder {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface NineSliceScaling {
  readonly type: 'nine_slice';
  readonly width: number;
  readonly height: number;
  readonly border: NineSliceBorder;
  readonly stretchInner: boolean;
}

export const STRETCH: StretchScaling = { type: 'stretch' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInt(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`Invalid sprite scaling: "${name}" must be a positive integer`);
  }
  return value;
}

function nonNegativeInt(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TypeError(`Invalid sprite scaling: "${name}" must be a non-negative integer`);
  }
  return value;
}

function parseBorder(value: unknown): NineSliceBorder {
  if (typeof value === 'number') {
    const size = nonNegativeInt(value, 'border');
    return { left: size, top: size, right: size, bottom: size };
  }
  if (!isRecord(value)) {
    throw new TypeError('Invalid sprite scaling: "border" must be a number or an object');
  }
  return {
    left: nonNegativeInt(value['left'], 'border.left'),
    top: nonNegativeInt(value['top'], 'border.top'),
    right: nonNegativeInt(value['right'], 'border.right'),
    bottom: nonNegativeInt(value['bottom'], 'border.bottom'),
  };
}

/**
 * Parses the contents of a `.png.mcmeta` file. Missing metadata (or metadata
 * without a `gui` section) means the sprite is stretched, matching vanilla.
 */
export function parseSpriteScaling(mcmeta: unknown): SpriteScaling {
  if (!isRecord(mcmeta)) return STRETCH;
  const gui = mcmeta['gui'];
  if (!isRecord(gui)) return STRETCH;
  const scaling = gui['scaling'];
  if (!isRecord(scaling)) return STRETCH;

  switch (scaling['type']) {
    case 'tile':
      return {
        type: 'tile',
        width: positiveInt(scaling['width'], 'width'),
        height: positiveInt(scaling['height'], 'height'),
      };
    case 'nine_slice':
      return {
        type: 'nine_slice',
        width: positiveInt(scaling['width'], 'width'),
        height: positiveInt(scaling['height'], 'height'),
        border: parseBorder(scaling['border']),
        stretchInner: scaling['stretch_inner'] === true,
      };
    default:
      return STRETCH;
  }
}
