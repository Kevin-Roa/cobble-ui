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

type PartName = keyof PlayerParts;

/**
 * The skin layers drawn on top of the base model, named after `PlayerModelPart`: `hat` over the
 * head, `jacket` over the body, a sleeve over each arm and a pants leg over each leg. The cape is a
 * separate option.
 */
export interface PlayerOverlayParts {
  readonly hat: boolean;
  readonly jacket: boolean;
  readonly leftSleeve: boolean;
  readonly rightSleeve: boolean;
  readonly leftPants: boolean;
  readonly rightPants: boolean;
}

/** `true` (or nothing) draws every layer, `false` none, an object chooses; missing keys are drawn. */
export type PlayerOverlay = boolean | Partial<PlayerOverlayParts>;

const OVERLAY_OF_PART: Readonly<Record<PartName, keyof PlayerOverlayParts>> = {
  head: 'hat',
  body: 'jacket',
  rightArm: 'rightSleeve',
  leftArm: 'leftSleeve',
  rightLeg: 'rightPants',
  leftLeg: 'leftPants',
};

/** Resolves a {@link PlayerOverlay} into one flag per layer. */
export function resolveOverlay(overlay: PlayerOverlay = true): PlayerOverlayParts {
  const flag = (key: keyof PlayerOverlayParts): boolean =>
    typeof overlay === 'boolean' ? overlay : (overlay[key] ?? true);
  return {
    hat: flag('hat'),
    jacket: flag('jacket'),
    leftSleeve: flag('leftSleeve'),
    rightSleeve: flag('rightSleeve'),
    leftPants: flag('leftPants'),
    rightPants: flag('rightPants'),
  };
}

/** A built player: its limbs, the node that turns them all together and the optional cape. */
export interface PlayerRig {
  readonly parts: PlayerParts;
  /** Parent of every part and the cape. Lies the player down for the flying and swimming poses. */
  readonly figure: Node3D;
  readonly cape: Node3D | undefined;
  /** The elytra, when worn. It replaces the cape. */
  readonly wings: { readonly left: Node3D; readonly right: Node3D } | undefined;
  /** Where each part sits when standing (`PartPose.offset`), restored by every pose. */
  readonly rest: Readonly<Record<PartName, readonly [number, number, number]>>;
}

interface PartDefinition {
  readonly name: PartName;
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

/** Where the cape hangs from: the top of the back of the body, a hair behind the jacket layer. */
const CAPE_PIVOT: readonly [number, number, number] = [0, CENTER_Y, -2.3];
/** The cape's resting tilt in radians (the bottom swings back a little, like `CapeLayer`). */
const CAPE_TILT = 0.2;

/** The elytra texture in the client files (`ElytraModel`, 64x32). */
export const ELYTRA_TEXTURE = 'entity/equipment/wings/elytra';

/** Distance of a wing's hinge from the spine (the shoulder), and its folded tilt (`ElytraModel`: 15 degrees). */
const WING_HINGE = 5;
const WING_TILT = Math.PI / 12;
/** Folded wings lean back further than the vanilla 15 degrees so swinging arms and legs clear them. */
const WING_PITCH = 0.2;
/**
 * Each wing is turned slightly toward the spine (its inner edge toward the body), so the two meet
 * in the middle with each on top in its own half rather than one lying over the other.
 */
/** Depth of the wing hinges in the lying poses (-2 standing: 2 pixels behind the body). */
const WING_LYING_Z = -1.2;
const WING_YAW = 0.12;

export interface PlayerModelOptions {
  readonly slim: boolean;
  readonly texture: RgbaImage;
  /** Which skin layers to draw. Defaults to all. */
  readonly overlay?: PlayerOverlay | undefined;
  /** A cape texture in the 64x32 layout (see {@link normalizeCape}). No cape without it. */
  readonly cape?: RgbaImage | undefined;
  /**
   * An elytra texture (the cape of the player, or {@link ELYTRA_TEXTURE}). Worn on the back; the
   * cape is not drawn with it, as in the game.
   */
  readonly elytra?: RgbaImage | undefined;
}

/**
 * Builds the player model under `root`, centred on the origin and facing +z with the character's
 * right on -x. Vanilla model space has y down and the face at -z, so `y` and `z` are negated; the
 * pivots become node positions so limbs rotate around the same points as in the game. The faces
 * are lit by the viewport's lights (front, above and to the left, like the entity-in-UI lighting
 * of `Lighting`). The cape is the 10x16x1 box of `PlayerCapeModel`.
 */
export function buildPlayerModel(root: Node3D, options: PlayerModelOptions): PlayerRig {
  const { slim, texture, elytra } = options;
  const cape = elytra ? undefined : options.cape;
  const layers = resolveOverlay(options.overlay);
  const figure = new Node3D();
  const nodes = new Map<PartName, Node3D>();
  const rest = {} as Record<PartName, readonly [number, number, number]>;
  for (const part of definitions(slim)) {
    const node = new Node3D();
    const [px, py, pz] = part.pivot;
    rest[part.name] = [px, CENTER_Y - py, -pz];
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
    if (layers[OVERLAY_OF_PART[part.name]]) make(part.overlayTexOffs, part.overlayGrow, 0.5);
    figure.add(node);
    nodes.set(part.name, node);
  }
  let capeNode: Node3D | undefined;
  if (cape) {
    capeNode = new Node3D();
    capeNode.position = [...CAPE_PIVOT];
    // The box's front is the outside of the cape; turn it to face away from the player.
    capeNode.rotation = [CAPE_TILT, Math.PI, 0];
    capeNode.addQuad(
      ...createBoxQuads({
        u: 0,
        v: 0,
        width: 10,
        height: 16,
        depth: 1,
        origin: [-5, -16, 0],
        texture: cape,
        alphaTest: 0.5,
      }),
    );
    figure.add(capeNode);
  }
  let wings: PlayerRig['wings'];
  if (elytra) {
    // Two 10x20x2 wings (`ElytraModel`), hinged at the spine and flaring outward at the bottom.
    const wing = (side: 1 | -1): Node3D => {
      const node = new Node3D();
      node.position = [side * WING_HINGE, CENTER_Y, -2];
      // The game draws the elytra without culling (`armorCutoutNoCull`): both sides show.
      node.addQuad(
        ...createBoxQuads({
          u: 22,
          v: 0,
          width: 10,
          height: 20,
          depth: 2,
          mirror: side === -1,
          // Each wing reaches from its shoulder in toward the spine and flares out at the bottom.
          origin: [side === 1 ? -10 : 0, -20, -2],
          inflate: 1,
          texture: elytra,
          alphaTest: 0.5,
        }).map((quad) => ({ ...quad, doubleSided: true })),
      );
      figure.add(node);
      return node;
    };
    wings = { left: wing(1), right: wing(-1) };
    wings.left.rotation = [WING_PITCH, WING_YAW, WING_TILT];
    wings.right.rotation = [WING_PITCH, -WING_YAW, -WING_TILT];
  }
  root.add(figure);
  const get = (name: PartName): Node3D => nodes.get(name) ?? new Node3D();
  return {
    figure,
    cape: capeNode,
    wings,
    rest,
    parts: {
      head: get('head'),
      body: get('body'),
      rightArm: get('rightArm'),
      leftArm: get('leftArm'),
      rightLeg: get('rightLeg'),
      leftLeg: get('leftLeg'),
    },
  };
}

/**
 * Builds just the head (the `head` cube and the `hat` layer grown by 0.5) under `root`, centred on
 * the origin and facing +z, with the same texture offsets as {@link buildPlayerModel}.
 */
export function buildPlayerHead(
  root: Node3D,
  options: { readonly texture: RgbaImage; readonly overlay?: PlayerOverlay },
): void {
  const { texture } = options;
  const hat = resolveOverlay(options.overlay).hat;
  const node = new Node3D();
  const make = (u: number, inflate: number, alphaTest?: number): void => {
    node.addQuad(
      ...createBoxQuads({
        u,
        v: 0,
        width: 8,
        height: 8,
        depth: 8,
        origin: [-4, -4, -4],
        inflate,
        texture,
        ...(alphaTest === undefined ? {} : { alphaTest }),
      }),
    );
  };
  make(0, 0);
  if (hat) make(32, 0.5, 0.5);
  root.add(node);
}

/** In the lying poses the wings sit closer to the back than when standing. */
function tuckWings(wings: { readonly left: Node3D; readonly right: Node3D }): void {
  wings.left.position[2] = WING_LYING_Z;
  wings.right.position[2] = WING_LYING_Z;
}

const smooth = (u: number): number => u * u * (3 - 2 * u);

function set(node: Node3D, x: number, z: number): void {
  node.rotation[0] = x;
  node.rotation[2] = z;
}

export type PlayerPose = 'standing' | 'idle' | 'walking' | 'crouching' | 'flying' | 'swimming';

/** Poses that lie the player down; they are wider than tall, so the viewport must fit them. */
export function isHorizontalPose(pose: PlayerPose): boolean {
  return pose === 'flying' || pose === 'swimming';
}

/**
 * How far the view is turned for a pose, in radians: the lying poses are looked at from above and
 * a little from the side, so the back, the cape and the open wings show instead of an edge.
 */
export function poseViewOffset(pose: PlayerPose): {
  readonly pitch: number;
  readonly yaw: number;
} {
  return isHorizontalPose(pose) ? { pitch: 0.7, yaw: 0 } : { pitch: 0, yaw: 0 };
}

/**
 * Scale that keeps a pose inside a viewport at every rotation. The model is turned around its
 * centre, so what matters is how far it reaches from the centre sideways (`horizontal`, as it
 * yaws) and up/down (`vertical`, as it pitches), including the cape or wings and the perspective
 * growth of the parts that come toward the camera.
 *
 * @param viewWidth Width of the view at the model's distance, in model units.
 * @param viewHeight Height of the view at the model's distance, in model units.
 */
export function poseFit(
  pose: PlayerPose,
  worn: { readonly wings: boolean },
  viewWidth: number,
  viewHeight: number,
): number {
  const wings = worn.wings;
  let horizontal: number;
  let vertical: number;
  switch (pose) {
    case 'standing':
    case 'idle':
      horizontal = wings ? 14 : 9.5;
      vertical = 14;
      break;
    case 'walking':
      horizontal = wings ? 14 : 12;
      vertical = 14;
      break;
    case 'crouching':
      horizontal = wings ? 21 : 11;
      vertical = 14;
      break;
    case 'flying':
      horizontal = wings ? 20 : 14;
      vertical = 14;
      break;
    case 'swimming':
      horizontal = 14;
      vertical = 14;
      break;
  }
  // Parts near the camera look bigger; the lying poses reach furthest toward it.
  const perspective = isHorizontalPose(pose) ? 1.3 : 1.12;
  const fit = Math.min(
    (0.94 * viewWidth) / (2 * horizontal * perspective),
    (0.94 * viewHeight) / (2 * vertical * perspective),
  );
  return Math.min(1, fit);
}

/** Poses that change over time and so need a frame loop. */
export function isAnimatedPose(pose: PlayerPose): boolean {
  return pose === 'idle' || pose === 'walking' || pose === 'flying' || pose === 'swimming';
}

/**
 * Poses the player for `time` seconds, starting from the resting pose every time.
 *
 * - `idle` is `AnimationUtils#bobArms` (the arms sway slightly, 20 ticks per second).
 * - `walking` swings the arms and legs in opposite phase like `HumanoidModel#setupAnim` with a
 *   steady `walkAnimation`.
 * - `crouching` is the `HumanoidModel` crouch: the body leans 0.5 radians, the head, arms and legs
 *   move to the crouching pivots and the arms hang 0.4 forward.
 * - `flying` is elytra gliding: the player lies face down and the head tilts up 45 degrees
 *   (`HumanoidModel#setupAnim` with `isFallFlying`).
 * - `swimming` lies the player down like `flying` and does a breaststroke: the arms sweep out and back and the legs frog-kick.
 *
 * @param fit Scale of the whole figure, from {@link poseFit}, so it stays inside the viewport.
 */
export function posePlayer(rig: PlayerRig, pose: PlayerPose, time: number, fit = 1): void {
  const { parts, figure, cape, wings, rest } = rig;
  const ticks = time * 20;
  for (const name of Object.keys(parts) as PartName[]) {
    const node = parts[name];
    node.position = [...rest[name]];
    node.rotation = [0, 0, 0];
  }
  figure.rotation = [0, 0, 0];
  figure.rotationOrder = 'ZYX';
  figure.scale = fit;
  if (cape) {
    cape.position = [...CAPE_PIVOT];
    cape.rotation = [CAPE_TILT, Math.PI, 0];
  }

  if (wings) {
    wings.left.position = [WING_HINGE, CENTER_Y, -2];
    wings.right.position = [-WING_HINGE, CENTER_Y, -2];
    wings.left.rotation = [WING_PITCH, WING_YAW, WING_TILT];
    wings.right.rotation = [WING_PITCH, -WING_YAW, -WING_TILT];
  }

  switch (pose) {
    case 'standing':
      return;
    case 'idle': {
      const sway = Math.cos(ticks * 0.09) * 0.05 + 0.05;
      const bob = Math.sin(ticks * 0.067) * 0.05;
      set(parts.rightArm, bob, -sway);
      set(parts.leftArm, -bob, sway);
      // The cape and wings drift with the body.
      if (cape) cape.rotation[0] = CAPE_TILT + 0.06 * (1 + Math.sin(ticks * 0.09));
      if (wings) {
        wings.left.rotation[2] += sway * 0.6;
        wings.right.rotation[2] -= sway * 0.6;
      }
      return;
    }
    case 'walking': {
      const swing = Math.cos(ticks * 0.42) * 0.5;
      set(parts.rightArm, -swing, 0);
      set(parts.leftArm, swing, 0);
      set(parts.rightLeg, swing * 1.4, 0);
      set(parts.leftLeg, -swing * 1.4, 0);
      if (cape) cape.rotation[0] = CAPE_TILT + 0.1 + Math.abs(swing) * 0.1;
      if (wings) {
        for (const wing of [wings.left, wings.right])
          wing.rotation[0] = WING_PITCH + 0.15 + Math.abs(swing) * 0.06;
        wings.left.rotation[2] += Math.abs(swing) * 0.03;
        wings.right.rotation[2] -= Math.abs(swing) * 0.03;
      }
      return;
    }
    case 'crouching': {
      parts.body.rotation[0] = 0.5;
      parts.body.position[1] = CENTER_Y - 3.2;
      parts.head.position[1] = CENTER_Y - 4.2;
      for (const arm of [parts.rightArm, parts.leftArm]) {
        arm.rotation[0] = 0.4;
        arm.position[1] = CENTER_Y - 5.2;
      }
      for (const leg of [parts.rightLeg, parts.leftLeg]) {
        leg.position[1] = CENTER_Y - 12.2;
        leg.position[2] = -4;
      }
      if (cape) {
        cape.position[1] = CENTER_Y - 3.2;
        cape.rotation[0] = CAPE_TILT + 0.45;
      }
      if (wings) {
        for (const wing of [wings.left, wings.right]) {
          wing.position[1] = CENTER_Y - 3.2;
        }
        wings.left.rotation = [0.6981317, WING_YAW + 0.3, 0.65];
        wings.right.rotation = [0.6981317, -WING_YAW - 0.3, -0.65];
      }
      return;
    }
    case 'flying': {
      // Lean forward over the way the player faces: face down, head leading.
      figure.rotation = [Math.PI / 2, 0, 0];
      parts.head.rotation[0] = -Math.PI / 4;
      const flutter = Math.sin(ticks * 0.1);
      // The limbs trail and sway a little in the airflow.
      const sway = Math.sin(ticks * 0.14) * 0.07;
      set(parts.rightArm, sway, -0.05);
      set(parts.leftArm, -sway, 0.05);
      set(parts.rightLeg, -sway * 1.2, 0);
      set(parts.leftLeg, sway * 1.2, 0);
      if (cape) cape.rotation[0] = CAPE_TILT + 0.2 + flutter * 0.012;
      if (wings) {
        tuckWings(wings);
        wings.left.rotation = [
          0.1,
          WING_YAW + 0.2 + flutter * 0.01,
          Math.PI / 2.2 + flutter * 0.01,
        ];
        wings.right.rotation = [
          0.1,
          -WING_YAW - 0.2 - flutter * 0.01,
          -Math.PI / 2.2 - flutter * 0.01,
        ];
      }
      return;
    }
    case 'swimming': {
      figure.rotation = [Math.PI / 2 - 0.2, 0, 0];
      parts.head.rotation[0] = -Math.PI / 4;
      // Breaststroke: the arms reach forward together, sweep out and back, then come in under the
      // chest and shoot forward again, with a gentle frog kick of the legs.
      const phase = (ticks * 0.13) % (Math.PI * 2);
      let armX: number;
      let armOut: number;
      if (phase < Math.PI) {
        const u = phase / Math.PI;
        armX = -2.9 + 1.5 * smooth(u);
        armOut = 0.15 + 1.0 * Math.sin(Math.PI * u);
      } else {
        const u = (phase - Math.PI) / Math.PI;
        armX = -1.4 - 1.5 * smooth(u);
        armOut = 0.15 + 0.1 * Math.sin(Math.PI * u);
      }
      set(parts.rightArm, armX, -armOut);
      set(parts.leftArm, armX, armOut);
      // A flutter kick the whole time: the legs swing up and down in opposite phase.
      const kick = Math.sin(ticks * 0.55) * 0.5;
      set(parts.rightLeg, kick, 0);
      set(parts.leftLeg, -kick, 0);
      const drift = Math.sin(phase);
      if (cape) cape.rotation[0] = CAPE_TILT + 0.25 + drift * 0.08;
      if (wings) {
        tuckWings(wings);
        wings.left.rotation[0] = 0.2;
        wings.right.rotation[0] = 0.2;
        wings.left.rotation[2] += 0.1 + drift * 0.04;
        wings.right.rotation[2] -= 0.1 + drift * 0.04;
      }
      return;
    }
  }
}

/**
 * Whether a 64x64 skin has slim (Alex) arms: the column wide arms use for their fourth pixel is
 * fully transparent on both arms. Skins in the legacy 64x32 layout are always wide.
 */
export function detectSlim(image: RgbaImage): boolean {
  if (image.width !== SIZE || image.height !== SIZE) return false;
  const clear = (x: number, y: number, width: number, height: number): boolean => {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if ((image.data[((y + dy) * SIZE + x + dx) * 4 + 3] ?? 255) !== 0) return false;
      }
    }
    return true;
  };
  return clear(50, 16, 2, 4) && clear(54, 20, 2, 12) && clear(42, 48, 2, 4) && clear(46, 52, 2, 12);
}

/**
 * Brings a cape texture to the 64x32 layout the cape box expects: the legacy 22x17 capes are
 * padded, larger ones (128x64, ...) are sampled down, anything else is rejected (`undefined`).
 */
export function normalizeCape(image: RgbaImage): RgbaImage | undefined {
  const { width, height } = image;
  if (width === 64 && height === 32) return image;
  const data = new Uint8ClampedArray(64 * 32 * 4);
  if (width === 22 && height === 17) {
    for (let y = 0; y < height; y++) {
      data.set(image.data.subarray(y * width * 4, (y + 1) * width * 4), y * 64 * 4);
    }
    return { width: 64, height: 32, data };
  }
  if (width % 64 !== 0 || height * 2 !== width) return undefined;
  const k = width / 64;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      const from = (y * k * width + x * k) * 4;
      data.set(image.data.subarray(from, from + 4), (y * 64 + x) * 4);
    }
  }
  return { width: 64, height: 32, data };
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

/** Every node a pose moves: the six parts, the figure, the cape and the wings. */
function movingNodes(rig: PlayerRig): Node3D[] {
  const { parts, figure, cape, wings } = rig;
  return [
    ...Object.values(parts),
    figure,
    ...(cape ? [cape] : []),
    ...(wings ? [wings.left, wings.right] : []),
  ];
}

/** The current position, rotation and scale of every moving node, for {@link blendRig}. */
export function captureRig(rig: PlayerRig): number[] {
  return movingNodes(rig).flatMap((node) => [...node.position, ...node.rotation, node.scale]);
}

/**
 * Moves every node a fraction `t` (0 to 1) of the way from a {@link captureRig} snapshot to where it
 * is now, so a change of pose eases in. Does nothing when the snapshot is of another rig.
 */
export function blendRig(rig: PlayerRig, from: readonly number[], t: number): void {
  const nodes = movingNodes(rig);
  if (from.length !== nodes.length * 7) return;
  const mix = (a: number | undefined, b: number): number => (a ?? b) + (b - (a ?? b)) * t;
  nodes.forEach((node, i) => {
    const o = i * 7;
    node.position = [
      mix(from[o], node.position[0]),
      mix(from[o + 1], node.position[1]),
      mix(from[o + 2], node.position[2]),
    ];
    node.rotation = [
      mix(from[o + 3], node.rotation[0]),
      mix(from[o + 4], node.rotation[1]),
      mix(from[o + 5], node.rotation[2]),
    ];
    node.scale = mix(from[o + 6], node.scale);
  });
}
