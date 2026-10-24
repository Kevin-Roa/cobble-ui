/**
 * Code-defined entity geometry for the `minecraft:special` item models (heads and the copper
 * golem statue), ported from the vanilla `ModelPart` cubes. No texture is bundled: the textures are
 * read from the client at runtime. Cubes are written in vanilla model space (y down, front at -z,
 * pixels) with absolute pivots, as `CubeListBuilder`/`PartPose` define them; {@link bakeEntity}
 * converts to the renderer's space (y up, front at +z, one block = 1 unit, centred on the block).
 */
import type { RgbaImage } from '../blit.ts';
import { createBoxQuads } from './box.ts';
import type { Quad, Vec3 } from './engine.ts';

export type EntityModelId =
  | 'skull'
  | 'humanoid_head'
  | 'piglin_head'
  | 'dragon_head'
  | 'copper_golem';

/** What a `special` item model draws: a geometry and the entity texture id (`entity/creeper/creeper`). */
export interface EntitySpec {
  readonly model: EntityModelId;
  readonly texture: string;
  /** The texture is a player skin, so a caller-provided skin replaces it (`kind: "player"`). */
  readonly playerSkin?: true;
}

interface Cube {
  /** `texOffs(u, v)`. */
  readonly uv: readonly [number, number];
  /** `addBox(x, y, z, w, h, d)` relative to the pivot. */
  readonly box: readonly [number, number, number, number, number, number];
  /** `PartPose.offset` accumulated from the root. */
  readonly pivot?: Vec3;
  /** `PartPose` zRot in radians. */
  readonly zRot?: number;
  /** `PartPose` xRot in radians (the dragon's jaw). */
  readonly xRot?: number;
  /**
   * The pose of the part this one hangs from (`PartPose.offset(...).scaled(s)`): the cube's pose is
   * placed in the parent's frame, which is then scaled about the parent's pivot.
   */
  readonly parent?: { readonly offset: Vec3; readonly scale: number };
  /** `CubeDeformation`. */
  readonly grow?: number;
  readonly mirror?: boolean;
  /** Texels below this alpha are not drawn (overlay layers). */
  readonly alphaTest?: number;
}

const HEAD: Cube = { uv: [0, 0], box: [-4, -8, -4, 8, 8, 8] };

/** `SkullModel#createMobHeadLayer` (skeleton, wither skeleton, creeper). */
const SKULL: readonly Cube[] = [HEAD];

/** `SkullModel#createHumanoidHeadLayer` (zombie, player): head plus the 0.25 grown `hat`. */
const HUMANOID_HEAD: readonly Cube[] = [
  HEAD,
  { uv: [32, 0], box: [-4, -8, -4, 8, 8, 8], grow: 0.25, alphaTest: 0.5 },
];

/** `PiglinHeadModel#createHeadModel`: head, snout, tusks and the two tilted ears. */
const PIGLIN_HEAD: readonly Cube[] = [
  { uv: [0, 0], box: [-5, -8, -4, 10, 8, 8] },
  { uv: [31, 1], box: [-2, -4, -5, 4, 4, 1] },
  { uv: [2, 4], box: [2, -2, -5, 1, 2, 1] },
  { uv: [2, 0], box: [-3, -2, -5, 1, 2, 1] },
  { uv: [51, 6], box: [0, 0, -2, 1, 5, 4], pivot: [4.5, -6, 0], zRot: -Math.PI / 6 },
  { uv: [39, 6], box: [-1, 0, -2, 1, 5, 4], pivot: [-4.5, -6, 0], zRot: Math.PI / 6 },
];

/**
 * `DragonHeadModel#createHeadLayer`: lip, head, scales, nostrils and the jaw (pivot 0, 4, -8). The
 * `head` part is posed `offset(0, -7.986666, 0).scaled(0.75)`, so the whole head is three quarters of
 * its cube size, and `setupAnim` opens the jaw by `(sin(0) + 1) * 0.2` radians at animation 0.
 */
const DRAGON_POSE = { offset: [0, -7.986666, 0], scale: 0.75 } as const;
const DRAGON_HEAD: readonly Cube[] = [
  { uv: [176, 44], box: [-6, -1, -24, 12, 5, 16], parent: DRAGON_POSE },
  { uv: [112, 30], box: [-8, -8, -10, 16, 16, 16], parent: DRAGON_POSE },
  { uv: [0, 0], box: [-5, -12, -4, 2, 4, 6], mirror: true, parent: DRAGON_POSE },
  { uv: [112, 0], box: [-5, -3, -22, 2, 2, 4], mirror: true, parent: DRAGON_POSE },
  { uv: [0, 0], box: [3, -12, -4, 2, 4, 6], parent: DRAGON_POSE },
  { uv: [112, 0], box: [3, -3, -22, 2, 2, 4], parent: DRAGON_POSE },
  {
    uv: [176, 65],
    box: [-6, 0, -16, 12, 4, 16],
    pivot: [0, 4, -8],
    xRot: 0.2,
    parent: DRAGON_POSE,
  },
];

/**
 * The copper golem (`CopperGolemModel#createBodyLayer`, the standing pose, 64x64 texture). The layer
 * root sits at y = 24 and the parts are posed from it: body (0, -5, 0) with the head (0, -6, 0) and the
 * arms (+-4, -6, 0) as its children, and the legs (0, -5, 0) on the root. The boxes below are the
 * cubes with those poses added up, so y is measured down from the top of the 24 pixel tall model.
 */
const COPPER_GOLEM: readonly Cube[] = [
  { uv: [0, 15], box: [-4, 13, -3, 8, 6, 6] },
  { uv: [0, 0], box: [-4, 8, -5, 8, 5, 10], grow: 0.015 },
  { uv: [56, 0], box: [-1, 11, -6, 2, 3, 2] },
  { uv: [37, 8], box: [-1, 4, -1, 2, 4, 2], grow: -0.015 },
  { uv: [37, 0], box: [-2, 0, -2, 4, 4, 4], grow: -0.015 },
  { uv: [36, 16], box: [-7, 12, -2, 3, 10, 4] },
  { uv: [50, 16], box: [4, 12, -2, 3, 10, 4] },
  { uv: [0, 27], box: [-4, 19, -2, 4, 5, 4] },
  { uv: [16, 27], box: [0, 19, -2, 4, 5, 4] },
];

/** Pixels from a model's own origin down to the floor: the golem is authored with its feet at y = 24. */
const FLOOR_OFFSET: Readonly<Partial<Record<EntityModelId, number>>> = { copper_golem: 24 };

const MODELS: Readonly<Record<EntityModelId, readonly Cube[]>> = {
  skull: SKULL,
  humanoid_head: HUMANOID_HEAD,
  piglin_head: PIGLIN_HEAD,
  dragon_head: DRAGON_HEAD,
  copper_golem: COPPER_GOLEM,
};

/** `SkullBlock.Types` by `kind`. */
const HEADS: Readonly<Record<string, EntitySpec>> = {
  skeleton: { model: 'skull', texture: 'entity/skeleton/skeleton' },
  wither_skeleton: { model: 'skull', texture: 'entity/skeleton/wither_skeleton' },
  creeper: { model: 'skull', texture: 'entity/creeper/creeper' },
  zombie: { model: 'humanoid_head', texture: 'entity/zombie/zombie' },
  player: { model: 'humanoid_head', texture: 'entity/player/wide/steve', playerSkin: true },
  piglin: { model: 'piglin_head', texture: 'entity/piglin/piglin' },
  dragon: { model: 'dragon_head', texture: 'entity/enderdragon/dragon' },
};

function strip(id: string): string {
  return id.startsWith('minecraft:') ? id.slice('minecraft:'.length) : id;
}

/** `minecraft:textures/entity/x.png`, `minecraft:entity/x` or `x` as an `entity/x` texture id. */
function entityTexture(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  let id = strip(value);
  if (id.startsWith('textures/')) id = id.slice('textures/'.length);
  if (id.endsWith('.png')) id = id.slice(0, -'.png'.length);
  return id.startsWith('entity/') ? id : `entity/${id}`;
}

/**
 * Reads the `model` of a `minecraft:special` item node (`SpecialModelRenderers`): `head` with a
 * `kind` (`SkullBlock.Types`) and `copper_golem_statue`. Other special types return `undefined`.
 */
export function parseSpecialModel(node: unknown): EntitySpec | undefined {
  if (typeof node !== 'object' || node === null) return undefined;
  const record = node as Record<string, unknown>;
  const texture = entityTexture(record['texture']);
  switch (strip(String(record['type']))) {
    case 'head': {
      const base = HEADS[strip(String(record['kind']))];
      if (!base) return undefined;
      return texture === undefined ? base : { model: base.model, texture };
    }
    case 'copper_golem_statue':
      return { model: 'copper_golem', texture: texture ?? 'entity/copper_golem/copper_golem' };
    default:
      return undefined;
  }
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/**
 * Builds the quads of an entity model. Vanilla draws a skull with `scale(-1, -1, 1)` plus a 180
 * degree turn of the head, which leaves it facing +z (toward the viewer) with x unchanged: a vanilla
 * point `(x, y, z)` becomes `(x, -y, -z)` pixels, then `/ 16`, with the feet on the block's floor
 * (centred model space, so y starts at -0.5).
 *
 * @param shade Brightness of a face from its unit normal in the baked space.
 */
export function bakeEntity(
  model: EntityModelId,
  texture: RgbaImage,
  shade: (normal: Vec3) => number,
): Quad[] {
  const out: Quad[] = [];
  for (const cube of MODELS[model]) {
    const [bx, by, bz, w, h, d] = cube.box;
    const [px, py, pz] = cube.pivot ?? [0, 0, 0];
    const [ox, oy, oz] = cube.parent?.offset ?? [0, 0, 0];
    const scale = cube.parent?.scale ?? 1;
    const floor = FLOOR_OFFSET[model] ?? 0;
    const cz = Math.cos(cube.zRot ?? 0);
    const sz = Math.sin(cube.zRot ?? 0);
    const cx = Math.cos(cube.xRot ?? 0);
    const sx = Math.sin(cube.xRot ?? 0);
    // `createBoxQuads` works in the flipped frame (x, -y, -z); go back to the vanilla frame (y down,
    // front at -z), pose the cube there (rotate, offset by its pivot, then the parent's pose and
    // scale), and flip again into the baked frame.
    const place = (f: Vec3): Vec3 => {
      const x = f[0];
      const y = -f[1];
      const z = -f[2];
      const ry = y * cx - z * sx;
      const rz = y * sx + z * cx;
      const qx = x * cz - ry * sz + px;
      const qy = x * sz + ry * cz + py;
      const qz = rz + pz;
      return [
        (ox + scale * qx) / 16,
        (floor - (oy + scale * qy)) / 16 - 0.5,
        -(oz + scale * qz) / 16,
      ];
    };
    const quads = createBoxQuads({
      u: cube.uv[0],
      v: cube.uv[1],
      width: w,
      height: h,
      depth: d,
      origin: [bx, -(by + h), -(bz + d)],
      ...(cube.grow === undefined ? {} : { inflate: cube.grow }),
      ...(cube.mirror ? { mirror: true } : {}),
      ...(cube.alphaTest === undefined ? {} : { alphaTest: cube.alphaTest }),
      texture,
      lit: false,
    });
    for (const quad of quads) {
      const corners = quad.corners.map(place) as unknown as Quad['corners'];
      const [a, b, , e] = corners;
      const n = cross(
        [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
        [e[0] - a[0], e[1] - a[1], e[2] - a[2]],
      );
      const length = Math.hypot(n[0], n[1], n[2]) || 1;
      const s = shade([n[0] / length, n[1] / length, n[2] / length]);
      out.push({ ...quad, corners, color: [s, s, s] });
    }
  }
  return out;
}

/**
 * The item-space placement of a model before the `display` transform. Skulls are baked upright, but
 * the copper golem item's `transformation` (scale 1, -1, -1 about (0.5, 1.5, 0.5)) leaves it upside
 * down and its `display` rotations include a 180 degree turn about z to set it upright again, so the
 * gui path has to start from the same inverted pose: (x, y, z) -> (-x, 0.5 - y, z) in block-centred
 * coordinates.
 */
export function entityItemSpace(model: EntityModelId, point: Vec3): Vec3 {
  return model === 'copper_golem' ? [-point[0], 0.5 - point[1], point[2]] : point;
}
