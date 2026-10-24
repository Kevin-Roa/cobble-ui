/**
 * Code-defined geometry for the block-entity style `minecraft:special` item models (chests,
 * shulker boxes, banners, the decorated pot, the conduit, the shield and the trident), ported from
 * the vanilla `ModelPart` cubes (`ChestModel`, `ShulkerBoxRenderer$ShulkerBoxModel`,
 * `BannerModel`, `DecoratedPotRenderer`, `ConduitRenderer#createShellLayer`, `ShieldModel`,
 * `TridentModel`). No texture is bundled: every texture is read from the client at runtime
 * (`assets/minecraft/textures/entity/**`).
 *
 * Cubes follow `ModelPart.Cube` exactly (same corner order and uv rectangles per face, so the
 * texture nets match), poses follow `PartPose` (translate, then rotate Z·Y·X) and the final
 * placement is the `transformation` the 26.3 item definitions carry (or the renderer's own pose).
 * The result is in the viewer's space: y up, one block = 1 unit, centred on the origin.
 */
import type { RgbaImage } from '../blit.ts';
import type { Quad, Vec3 } from './engine.ts';

export type BlockEntityType =
  | 'chest'
  | 'shulker_box'
  | 'banner'
  | 'decorated_pot'
  | 'conduit'
  | 'shield'
  | 'trident';

/** What a block-entity `special` item model draws. */
export interface BlockEntitySpec {
  readonly type: BlockEntityType;
  /** Entity texture id of the model's main sheet (`entity/chest/copper_oxidized`). */
  readonly texture?: string;
  /** Dye colour name of a banner (`white`, `light_blue`, ...). */
  readonly color?: string;
}

/**
 * `DyeColor#getTextureDiffuseColor`: the colour a banner's base flag is multiplied with. Plain
 * numbers; not an asset.
 */
export const BANNER_COLORS: Readonly<Record<string, number>> = {
  white: 0xf9fffe,
  orange: 0xf9801d,
  magenta: 0xc74ebd,
  light_blue: 0x3ab3da,
  yellow: 0xfed83d,
  lime: 0x80c71f,
  pink: 0xf38baa,
  gray: 0x474f52,
  light_gray: 0x9d9d97,
  cyan: 0x169c9c,
  purple: 0x8932b8,
  blue: 0x3c44aa,
  brown: 0x835432,
  green: 0x5e7c16,
  red: 0xb02e26,
  black: 0x1d1d21,
};

function strip(id: string): string {
  return id.startsWith('minecraft:') ? id.slice('minecraft:'.length) : id;
}

/** A `texture` value as an entity texture id under `directory` (`entity/chest` + `normal`). */
function sheet(value: unknown, directory: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const id = strip(value);
  return id.includes('/') ? id : `${directory}/${id}`;
}

/**
 * Reads the `model` of a `minecraft:special` item node: `chest` (with `texture`), `shulker_box`
 * (with `texture`), `banner` (with `color`), `decorated_pot`, `conduit`, `shield` and `trident`.
 * Other types return `undefined`.
 */
export function parseBlockEntityModel(node: unknown): BlockEntitySpec | undefined {
  if (typeof node !== 'object' || node === null) return undefined;
  const record = node as Record<string, unknown>;
  switch (strip(String(record['type']))) {
    case 'chest': {
      const texture = sheet(record['texture'], 'entity/chest');
      return texture === undefined ? undefined : { type: 'chest', texture };
    }
    case 'shulker_box': {
      const texture = sheet(record['texture'], 'entity/shulker');
      return { type: 'shulker_box', texture: texture ?? 'entity/shulker/shulker' };
    }
    case 'banner':
      return { type: 'banner', color: strip(String(record['color'] ?? 'white')) };
    case 'decorated_pot':
      return { type: 'decorated_pot' };
    case 'conduit':
      return { type: 'conduit' };
    case 'shield':
      return { type: 'shield' };
    case 'trident':
      return { type: 'trident' };
    default:
      return undefined;
  }
}

type Face = 'down' | 'up' | 'west' | 'north' | 'east' | 'south';
const ALL_FACES: readonly Face[] = ['down', 'up', 'west', 'north', 'east', 'south'];

interface CubeDef {
  /** `texOffs(u, v)`. */
  readonly uv: readonly [number, number];
  /** `addBox(x, y, z, w, h, d)` relative to the part's pivot. */
  readonly box: readonly [number, number, number, number, number, number];
  /** `CubeDeformation`. */
  readonly grow?: number;
  readonly mirror?: boolean;
  /** The faces that exist (`addBox(..., Set<Direction>)`). */
  readonly faces?: readonly Face[];
}

interface PartDef {
  readonly cubes: readonly CubeDef[];
  /** `PartPose.offset` in pixels. */
  readonly pos?: Vec3;
  /** `PartPose` rotation in radians about x, y and z (applied Z, then Y, then X order: `rotationZYX`). */
  readonly rot?: Vec3;
  /** Multiplies the part's faces (banner flag dye). Defaults to white. */
  readonly tint?: number;
  /** The sheet the part samples; defaults to the layer's main sheet. */
  readonly texture?: string;
  /** Size of that sheet as the layer defines it. */
  readonly size?: readonly [number, number];
}

/** A point in model pixels to blocks. */
type Place = (point: Vec3) => Vec3;

interface Layer {
  readonly texture: string;
  /** `LayerDefinition#create` texture size. */
  readonly size: readonly [number, number];
  readonly parts: readonly PartDef[];
  /** Model pixels to item-space blocks (the item definition's `transformation`). */
  readonly place: Place;
  /**
   * How a free-standing viewer centres the placed model: on the block (`block`) or on its bounding
   * box, shrunk to fit (`fit`). The slot icon never refits (see {@link BakeView}).
   */
  readonly fit: 'block' | 'fit';
}

const PI = Math.PI;

function cubeFaces(
  cube: CubeDef,
  size: readonly [number, number],
): { readonly face: Face; readonly corners: Vec3[]; readonly uvs: [number, number][] }[] {
  const [u, v] = cube.uv;
  const [x, y, z, w, h, d] = cube.box;
  const g = cube.grow ?? 0;
  // `ModelPart.Cube`: the box grown by the deformation; x1/x2 swap when mirrored.
  let minX = x - g;
  const minY = y - g;
  const minZ = z - g;
  let maxX = x + w + g;
  const maxY = y + h + g;
  const maxZ = z + d + g;
  if (cube.mirror) [minX, maxX] = [maxX, minX];
  const p = {
    v0: [minX, minY, minZ],
    v1: [maxX, minY, minZ],
    v2: [maxX, maxY, minZ],
    v3: [minX, maxY, minZ],
    v4: [minX, minY, maxZ],
    v5: [maxX, minY, maxZ],
    v6: [maxX, maxY, maxZ],
    v7: [minX, maxY, maxZ],
  } as const satisfies Record<string, Vec3>;
  const u1 = u + d;
  const u2 = u + d + w;
  const u3 = u + d + w + w;
  const u4 = u + d + w + d;
  const u5 = u + d + w + d + w;
  const v1 = v + d;
  const v2 = v + d + h;
  // Face, vertices, then (u0, v0, u1, v1) as `Polygon` takes them.
  const polygons: readonly [Face, readonly Vec3[], number, number, number, number][] = [
    ['down', [p.v5, p.v4, p.v0, p.v1], u1, v, u2, v1],
    ['up', [p.v2, p.v3, p.v7, p.v6], u2, v1, u3, v],
    ['west', [p.v0, p.v4, p.v7, p.v3], u, v1, u1, v2],
    ['north', [p.v1, p.v0, p.v3, p.v2], u1, v1, u2, v2],
    ['east', [p.v5, p.v1, p.v2, p.v6], u2, v1, u4, v2],
    ['south', [p.v4, p.v5, p.v6, p.v7], u4, v1, u5, v2],
  ];
  const visible = cube.faces ?? ALL_FACES;
  const out: { face: Face; corners: Vec3[]; uvs: [number, number][] }[] = [];
  for (const [face, vertices, a, b, c, e] of polygons) {
    if (!visible.includes(face)) continue;
    // `Polygon`: vertex 0 -> (u1, v0), 1 -> (u0, v0), 2 -> (u0, v1), 3 -> (u1, v1).
    let corners = [...vertices];
    let uvs: [number, number][] = [
      [c / size[0], b / size[1]],
      [a / size[0], b / size[1]],
      [a / size[0], e / size[1]],
      [c / size[0], e / size[1]],
    ];
    if (cube.mirror) {
      corners = corners.toReversed();
      uvs = uvs.toReversed();
    }
    out.push({ face, corners, uvs });
  }
  return out;
}

/** `rotationZYX(z, y, x)`: a point turns about X first, then Y, then Z. */
function rotateZyx(point: Vec3, [rx, ry, rz]: Vec3): Vec3 {
  let [x, y, z] = point;
  if (rx !== 0) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (ry !== 0) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (rz !== 0) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return [x, y, z];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

const FIT = 1.5;

// ----------------------------------------------------------------------------------- the layers

/** `ChestModel#createSingleBodyLayer`; the item definition has no `transformation`. */
function chest(texture: string): Layer {
  return {
    texture,
    size: [64, 64],
    place: ([x, y, z]) => [x / 16, y / 16, z / 16],
    fit: 'block',
    parts: [
      { cubes: [{ uv: [0, 19], box: [1, 0, 1, 14, 10, 14] }] },
      { cubes: [{ uv: [0, 0], box: [1, 0, 0, 14, 5, 14] }], pos: [0, 9, 1] },
      { cubes: [{ uv: [0, 0], box: [7, -2, 14, 2, 4, 1] }], pos: [0, 9, 1] },
    ],
  };
}

/**
 * `ShulkerBoxRenderer$ShulkerBoxModel` (`ShulkerModel#createShellMesh`, closed lid) with the item's
 * `transformation`: a half turn about x, scale 0.9995, translation (0.5, 1.4995, 0.5).
 */
function shulkerBox(texture: string): Layer {
  return {
    texture,
    size: [64, 64],
    place: ([x, y, z]) => [
      0.5 + (0.9995 * x) / 16,
      1.4995 - (0.9995 * y) / 16,
      0.5 - (0.9995 * z) / 16,
    ],
    fit: 'block',
    parts: [
      { cubes: [{ uv: [0, 0], box: [-8, -16, -8, 16, 12, 16] }], pos: [0, 24, 0] },
      { cubes: [{ uv: [0, 28], box: [-8, -8, -8, 16, 8, 16] }], pos: [0, 24, 0] },
    ],
  };
}

/**
 * `BannerModel#createBodyLayer(standing)` plus the `BannerFlagModel` flag, with the item's
 * `transformation` (scale 0.6666667, -0.6666667, -0.6666667, translation 0.5, 0, 0.5). The pole and
 * bar sample the base sheet untinted; the flag is multiplied with the dye colour.
 */
function banner(color: string): Layer {
  const tint = BANNER_COLORS[color] ?? BANNER_COLORS['white'];
  const k = 0.6666667 / 16;
  return {
    texture: 'entity/banner/banner_base',
    size: [64, 64],
    place: ([x, y, z]) => [0.5 + k * x, -k * y, 0.5 - k * z],
    fit: 'fit',
    parts: [
      { cubes: [{ uv: [44, 0], box: [-1, -42, -1, 2, 42, 2] }] },
      { cubes: [{ uv: [0, 42], box: [-10, -44, -1, 20, 2, 2] }] },
      {
        cubes: [{ uv: [0, 0], box: [-10, 0, -2, 20, 40, 1] }],
        pos: [0, -44, 0],
        ...(tint === undefined ? {} : { tint }),
      },
    ],
  };
}

/**
 * `DecoratedPotRenderer#createBaseLayer` (neck, top and bottom planes) and `createSidesLayer` (four
 * planes) with no decorations, so every side samples the blank side sheet. No `transformation`.
 */
function decoratedPot(): Layer {
  const side: CubeDef = { uv: [1, 0], box: [0, 0, 0, 14, 16, 0], faces: ['north'] };
  const sides = { texture: 'entity/decorated_pot/decorated_pot_side', size: [16, 16] } as const;
  const plane: CubeDef = { uv: [-14, 13], box: [0, 0, 0, 14, 0, 14] };
  return {
    texture: 'entity/decorated_pot/decorated_pot_base',
    size: [32, 32],
    place: ([x, y, z]) => [x / 16, y / 16, z / 16],
    fit: 'block',
    parts: [
      {
        cubes: [
          { uv: [0, 0], box: [4, 17, 4, 8, 3, 8], grow: -0.1 },
          { uv: [0, 5], box: [5, 20, 5, 6, 1, 6], grow: 0.2 },
        ],
        pos: [0, 37, 16],
        rot: [PI, 0, 0],
      },
      { cubes: [plane], pos: [1, 16, 1] },
      { cubes: [plane], pos: [1, 0, 1] },
      { cubes: [side], pos: [15, 16, 1], rot: [0, 0, PI], ...sides },
      { cubes: [side], pos: [1, 16, 1], rot: [0, -PI / 2, PI], ...sides },
      { cubes: [side], pos: [15, 16, 15], rot: [0, PI / 2, PI], ...sides },
      { cubes: [side], pos: [1, 16, 15], rot: [PI, 0, 0], ...sides },
    ],
  };
}

/** `ConduitRenderer#createShellLayer` with the item's `transformation` (translation 0.5). */
function conduit(): Layer {
  return {
    texture: 'entity/conduit/base',
    size: [32, 16],
    place: ([x, y, z]) => [0.5 + x / 16, 0.5 + y / 16, 0.5 + z / 16],
    fit: 'block',
    parts: [{ cubes: [{ uv: [0, 0], box: [-3, -3, -3, 6, 6, 6] }] }],
  };
}

/** `ShieldModel#createLayer` without patterns, flipped by `ShieldSpecialRenderer.DEFAULT_TRANSFORMATION`. */
function shield(): Layer {
  return {
    texture: 'entity/shield/shield_base_nopattern',
    size: [64, 64],
    place: ([x, y, z]) => [x / 16, -y / 16, -z / 16],
    fit: 'fit',
    parts: [
      { cubes: [{ uv: [0, 0], box: [-6, -11, -2, 12, 22, 1] }] },
      { cubes: [{ uv: [26, 0], box: [-1, -3, -1, 2, 6, 6] }] },
    ],
  };
}

/** `TridentModel#createLayer`, flipped by `TridentSpecialRenderer.DEFAULT_TRANSFORMATION`. */
function trident(): Layer {
  return {
    texture: 'entity/trident/trident',
    size: [32, 32],
    place: ([x, y, z]) => [x / 16, -y / 16, -z / 16],
    fit: 'fit',
    parts: [
      { cubes: [{ uv: [0, 6], box: [-0.5, 2, -0.5, 1, 25, 1] }] },
      { cubes: [{ uv: [4, 0], box: [-1.5, 0, -0.5, 3, 2, 1] }] },
      { cubes: [{ uv: [4, 3], box: [-2.5, -3, -0.5, 1, 4, 1] }] },
      { cubes: [{ uv: [0, 0], box: [-0.5, -4, -0.5, 1, 4, 1] }] },
      { cubes: [{ uv: [4, 3], box: [1.5, -3, -0.5, 1, 4, 1], mirror: true }] },
    ],
  };
}

function layerOf(spec: BlockEntitySpec): Layer | undefined {
  switch (spec.type) {
    case 'chest':
      return spec.texture === undefined ? undefined : chest(spec.texture);
    case 'shulker_box':
      return shulkerBox(spec.texture ?? 'entity/shulker/shulker');
    case 'banner':
      return banner(spec.color ?? 'white');
    case 'decorated_pot':
      return decoratedPot();
    case 'conduit':
      return conduit();
    case 'shield':
      return shield();
    case 'trident':
      return trident();
  }
}

/** The texture ids the model samples. */
export function blockEntityTextures(spec: BlockEntitySpec): string[] {
  const layer = layerOf(spec);
  if (!layer) return [];
  return [...new Set([layer.texture, ...layer.parts.map((part) => part.texture ?? layer.texture)])];
}

/**
 * Where the baked quads are going. `gui` keeps the item definition's placement exactly: vanilla
 * draws a `special` model with its origin at the block corner, then the `display.gui` transform
 * (whose translation is tuned for that origin, for example the banner's `-3.25`) turns it about the
 * block centre, so a slot icon must not recentre or rescale. `viewer` (the default) has no
 * `display` transform, so a `fit` layer is centred on its bounding box and shrunk into view.
 */
export type BakeView = 'gui' | 'viewer';

/**
 * Builds the quads of a block-entity model.
 *
 * @param view `gui` for the slot icon (placement untouched), `viewer` for free 3D views.
 * @param texture A decoded entity texture by id; a part whose sheet is missing is skipped.
 * @param shade Brightness of a face from its unit normal in the baked space (`1` for flat lighting).
 */
export function bakeBlockEntity(
  spec: BlockEntitySpec,
  texture: (id: string) => RgbaImage | undefined,
  shade: (normal: Vec3) => number,
  view: BakeView = 'viewer',
): Quad[] {
  const layer = layerOf(spec);
  if (!layer) return [];
  const quads: { quad: Quad; tint: number | undefined }[] = [];
  for (const part of layer.parts) {
    const image = texture(part.texture ?? layer.texture);
    if (!image) continue;
    const size = part.size ?? layer.size;
    const pos = part.pos ?? [0, 0, 0];
    for (const cube of part.cubes) {
      for (const { corners, uvs } of cubeFaces(cube, size)) {
        const placed = corners.map((corner) => {
          const turned = part.rot ? rotateZyx(corner, part.rot) : corner;
          return layer.place([turned[0] + pos[0], turned[1] + pos[1], turned[2] + pos[2]]);
        }) as unknown as Quad['corners'];
        quads.push({
          quad: {
            corners: placed,
            uvs: uvs as unknown as Quad['uvs'],
            texture: image,
            alphaTest: 0.1,
          },
          tint: part.tint,
        });
      }
    }
  }
  if (quads.length === 0) return [];

  // Centre the model: on the block for block-sized ones, on its bounding box (shrunk to fit) otherwise.
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const { quad } of quads) {
    for (const corner of quad.corners) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis] as number, corner[axis] as number);
        max[axis] = Math.max(max[axis] as number, corner[axis] as number);
      }
    }
  }
  let centre: Vec3 = [0.5, 0.5, 0.5];
  let scale = 1;
  if (layer.fit === 'fit' && view === 'viewer') {
    centre = [0, 1, 2].map(
      (axis) => ((min[axis] as number) + (max[axis] as number)) / 2,
    ) as unknown as Vec3;
    const extent = Math.max(
      ...[0, 1, 2].map((axis) => (max[axis] as number) - (min[axis] as number)),
    );
    if (extent > FIT) scale = FIT / extent;
  }
  const move = (p: Vec3): Vec3 => [
    (p[0] - centre[0]) * scale,
    (p[1] - centre[1]) * scale,
    (p[2] - centre[2]) * scale,
  ];
  return quads.map(({ quad, tint }) => {
    const corners = quad.corners.map(move) as unknown as Quad['corners'];
    const [a, b, , d] = corners;
    const n = cross(
      [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      [d[0] - a[0], d[1] - a[1], d[2] - a[2]],
    );
    const length = Math.hypot(n[0], n[1], n[2]) || 1;
    const s = shade([n[0] / length, n[1] / length, n[2] / length]);
    const r = tint === undefined ? 1 : ((tint >> 16) & 255) / 255;
    const g = tint === undefined ? 1 : ((tint >> 8) & 255) / 255;
    const bl = tint === undefined ? 1 : (tint & 255) / 255;
    return { ...quad, corners, color: [s * r, s * g, s * bl] };
  });
}
