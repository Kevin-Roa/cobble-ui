import type { RgbaImage } from '../../render/blit.ts';
import { createBoxQuads } from '../../render/model3d/box.ts';
import { Node3D } from '../../render/model3d/engine.ts';

/** Skin texture used when no skin is given (`DefaultPlayerSkin`'s Steve). */
export const STEVE_SKIN = 'entity/player/wide/steve';
/** The slim (Alex) default skin. */
export const ALEX_SKIN = 'entity/player/slim/alex';

/** The arm shape of a skin (`PlayerModelType`). */
export type PlayerModelType = 'wide' | 'slim';

const SIZE = 64;

/** The parts that move, in the model space the model is built in (y up, facing +z). */
export interface PlayerParts {
  readonly head: Node3D;
  readonly body: Node3D;
  readonly rightArm: Node3D;
  readonly leftArm: Node3D;
  readonly rightLeg: Node3D;
  readonly leftLeg: Node3D;
}

interface PartDefinition {
  readonly name: keyof PlayerParts;
  /** Pivot (`PartPose.offset`) in vanilla model space (y down). */
  readonly pivot: readonly [number, number, number];
  /** `addBox(x, y, z, w, h, d)` in vanilla model space. */
  readonly box: readonly [number, number, number, number, number, number];
  readonly texOffs: readonly [number, number];
  readonly overlayTexOffs: readonly [number, number];
  /** `CubeDeformation` of the overlay layer. */
  readonly overlayGrow: number;
}

/**
 * The cubes of `PlayerModel#createMesh` on top of `HumanoidModel#createMesh`, with the wide or
 * slim (`PlayerModel#createMesh(..., slim)`) arms. The overlay layers are the `hat` (grown 0.5),
 * `jacket`, `*_sleeve` and `*_pants` (grown 0.25) parts of the same shapes, using the second set of
 * texture offsets of the 64x64 skin.
 */
function definitions(slim: boolean): readonly PartDefinition[] {
  const armWidth = slim ? 3 : 4;
  return [
    {
      name: 'head',
      pivot: [0, 0, 0],
      box: [-4, -8, -4, 8, 8, 8],
      texOffs: [0, 0],
      overlayTexOffs: [32, 0],
      overlayGrow: 0.5,
    },
    {
      name: 'body',
      pivot: [0, 0, 0],
      box: [-4, 0, -2, 8, 12, 4],
      texOffs: [16, 16],
      overlayTexOffs: [16, 32],
      overlayGrow: 0.25,
    },
    {
      name: 'rightArm',
      pivot: [-5, slim ? 2.5 : 2, 0],
      box: [slim ? -2 : -3, -2, -2, armWidth, 12, 4],
      texOffs: [40, 16],
      overlayTexOffs: [40, 32],
      overlayGrow: 0.25,
    },
    {
      name: 'leftArm',
      pivot: [5, slim ? 2.5 : 2, 0],
      box: [-1, -2, -2, armWidth, 12, 4],
      texOffs: [32, 48],
      overlayTexOffs: [48, 48],
      overlayGrow: 0.25,
    },
    {
      name: 'rightLeg',
      pivot: [-1.9, 12, 0],
      box: [-2, 0, -2, 4, 12, 4],
      texOffs: [0, 16],
      overlayTexOffs: [0, 32],
      overlayGrow: 0.25,
    },
    {
      name: 'leftLeg',
      pivot: [1.9, 12, 0],
      box: [-2, 0, -2, 4, 12, 4],
      texOffs: [16, 48],
      overlayTexOffs: [0, 48],
      overlayGrow: 0.25,
    },
  ];
}

/** Vertical offset that centres the 32 pixel tall model (head top at -8, feet at 24) on the origin. */
const CENTER_Y = 8;

export interface PlayerModelOptions {
  readonly slim: boolean;
  readonly texture: RgbaImage;
  /** Draw the hat, jacket, sleeve and pants layers. Defaults to `true`. */
  readonly overlay?: boolean;
}

/**
 * Builds the player model under `root`, centred on the origin and facing +z with the character's
 * right on -x. Vanilla model space has y down and the face at -z, so `y` and `z` are negated; the
 * pivots become node positions so limbs rotate around the same points as in the game. The faces
 * are lit by the viewport's lights (front, above and to the left, like the entity-in-UI lighting
 * of `Lighting`).
 */
export function buildPlayerModel(root: Node3D, options: PlayerModelOptions): PlayerParts {
  const { slim, texture, overlay = true } = options;
  const nodes = new Map<keyof PlayerParts, Node3D>();
  for (const part of definitions(slim)) {
    const node = new Node3D();
    const [px, py, pz] = part.pivot;
    node.position = [px, CENTER_Y - py, -pz];
    const [bx, by, bz, w, h, d] = part.box;
    const make = (offs: readonly [number, number], grow: number, alphaTest?: number): void => {
      node.addQuad(
        ...createBoxQuads({
          u: offs[0],
          v: offs[1],
          width: w,
          height: h,
          depth: d,
          // Minimum corner relative to the pivot: y and z are flipped.
          origin: [bx, -(by + h), -(bz + d)],
          inflate: grow,
          texture,
          ...(alphaTest === undefined ? {} : { alphaTest }),
        }),
      );
    };
    make(part.texOffs, 0);
    if (overlay) make(part.overlayTexOffs, part.overlayGrow, 0.5);
    root.add(node);
    nodes.set(part.name, node);
  }
  const get = (name: keyof PlayerParts): Node3D => nodes.get(name) ?? new Node3D();
  return {
    head: get('head'),
    body: get('body'),
    rightArm: get('rightArm'),
    leftArm: get('leftArm'),
    rightLeg: get('rightLeg'),
    leftLeg: get('leftLeg'),
  };
}

function set(node: Node3D, x: number, z: number): void {
  node.rotation[0] = x;
  node.rotation[2] = z;
}

export type PlayerPose = 'standing' | 'idle' | 'walking';

/**
 * Poses the limbs for `time` seconds. `idle` is `AnimationUtils#bobArms` (the arms sway slightly,
 * 20 ticks per second); `walking` swings the arms and legs in opposite phase like
 * `HumanoidModel#setupAnim` with a steady `walkAnimation`.
 */
export function posePlayer(parts: PlayerParts, pose: PlayerPose, time: number): void {
  const ticks = time * 20;
  if (pose === 'standing') {
    set(parts.rightArm, 0, 0);
    set(parts.leftArm, 0, 0);
    set(parts.rightLeg, 0, 0);
    set(parts.leftLeg, 0, 0);
    return;
  }
  if (pose === 'idle') {
    const sway = Math.cos(ticks * 0.09) * 0.05 + 0.05;
    const bob = Math.sin(ticks * 0.067) * 0.05;
    set(parts.rightArm, bob, -sway);
    set(parts.leftArm, -bob, sway);
    set(parts.rightLeg, 0, 0);
    set(parts.leftLeg, 0, 0);
    return;
  }
  const swing = Math.cos(ticks * 0.6662) * 0.7;
  set(parts.rightArm, -swing, 0);
  set(parts.leftArm, swing, 0);
  set(parts.rightLeg, swing * 1.4, 0);
  set(parts.leftLeg, -swing * 1.4, 0);
}

/**
 * Upgrades a 64x32 skin to the 64x64 layout, mirroring the right arm and leg into the left ones
 * (`SkinTextureDownloader#processLegacySkin`). 64x64 skins are returned as they are.
 */
export function toModernSkin(image: RgbaImage): RgbaImage {
  if (image.width !== SIZE || image.height === SIZE) return image;
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  data.set(image.data.subarray(0, SIZE * Math.min(image.height, SIZE) * 4));
  // `doNotchTransparencyHack`: an opaque hat area means the skin has no hat, so clear it.
  let hasTransparency = false;
  for (let y = 0; y < 32 && !hasTransparency; y++) {
    for (let x = 32; x < 64; x++) {
      if ((data[(y * SIZE + x) * 4 + 3] ?? 255) < 128) {
        hasTransparency = true;
        break;
      }
    }
  }
  if (!hasTransparency) {
    for (let y = 0; y < 32; y++) for (let x = 32; x < 64; x++) data[(y * SIZE + x) * 4 + 3] = 0;
  }
  const copy = (
    x: number,
    y: number,
    xOffset: number,
    yOffset: number,
    width: number,
    height: number,
  ): void => {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const from = ((y + dy) * SIZE + x + dx) * 4;
        const to = ((y + yOffset + dy) * SIZE + (x + xOffset + (width - 1 - dx))) * 4;
        data.copyWithin(to, from, from + 4);
      }
    }
  };
  // The `copyRect(x, y, xOffset, yOffset, width, height, mirrorX = true)` calls of the vanilla code.
  copy(4, 16, 16, 32, 4, 4);
  copy(8, 16, 16, 32, 4, 4);
  copy(0, 20, 24, 32, 4, 12);
  copy(4, 20, 16, 32, 4, 12);
  copy(8, 20, 8, 32, 4, 12);
  copy(12, 20, 16, 32, 4, 12);
  copy(44, 16, -8, 32, 4, 4);
  copy(48, 16, -8, 32, 4, 4);
  copy(40, 20, 0, 32, 4, 12);
  copy(44, 20, -8, 32, 4, 12);
  copy(48, 20, -16, 32, 4, 12);
  copy(52, 20, -8, 32, 4, 12);
  return { width: SIZE, height: SIZE, data };
}
