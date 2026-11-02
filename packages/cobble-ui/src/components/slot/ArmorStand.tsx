import { useTranslation } from '../../i18n/Translation.tsx';
import type { JSX } from 'react';
import { createBoxQuads } from '../../render/model3d/box.ts';
import { Node3D, type Lighting } from '../../render/model3d/engine.ts';
import { cx } from '../shared.ts';
import {
  ModelViewport,
  type ModelSceneContext,
  type ModelViewportProps,
} from '../model3d/ModelViewport.tsx';

/** Width and height of an armor stand in model pixels (shoulders and arms span 14, head to base 31). */
export const ARMOR_STAND_WIDTH = 14;
export const ARMOR_STAND_HEIGHT = 31;

/**
 * The viewport is larger than the stand so it can turn and tilt without clipping: this many model
 * pixels wide and tall (the stand is centred horizontally and 2.5 pixels above the bottom edge).
 */
export const ARMOR_STAND_VIEWPORT_WIDTH = 24;
export const ARMOR_STAND_VIEWPORT_HEIGHT = 36;
/** Distance in model pixels from the viewport's top edge to the stand's feet (at rest). */
export const ARMOR_STAND_VIEWPORT_FEET = 33.5;

/** Where the smithing table screen stands its armor stand: the feet's centre (`SmithingScreen`). */
export const SMITHING_ARMOR_STAND_X = 141;
export const SMITHING_ARMOR_STAND_Y = 75;

/** Model height from the feet to the top of the head, in pixels, and half of it (the rotation centre). */
const MODEL_HEIGHT = 31;
const DEGREES = Math.PI / 180;
/** Fixed camera, nearly orthographic; the viewport's GUI size scales with `scale` instead. */
const CAMERA_FOV = 20;
const CAMERA_DISTANCE =
  ARMOR_STAND_VIEWPORT_HEIGHT / 16 / (2 * Math.tan((CAMERA_FOV / 2) * DEGREES));

type Vec3 = readonly [x: number, y: number, z: number];

interface StandPart {
  /** `texOffs(u, v)`. */
  readonly u: number;
  readonly v: number;
  /** `addBox(x, y, z, w, h, d)` in model space (y points down, the front faces -z). */
  readonly box: readonly [x: number, y: number, z: number, w: number, h: number, d: number];
  /** `PartPose.offset` in model space. */
  readonly pivot: Vec3;
  /** Default pose rotation in degrees (`ArmorStand#DEFAULT_*_POSE`), model space. */
  readonly rotation?: Vec3;
  readonly mirror?: boolean;
  readonly kind?: 'arm' | 'base';
}

/**
 * The cubes of `ArmorStandModel#createBodyLayer` (a 64 x 64 texture, 24 model pixels from the
 * pivot plane to the ground), with the default pose of `ArmorStand` (arms and legs splayed a few degrees).
 */
const PARTS: readonly StandPart[] = [
  { u: 0, v: 0, box: [-1, -7, -1, 2, 7, 2], pivot: [0, 0, 0] }, // head
  { u: 0, v: 26, box: [-6, 0, -1.5, 12, 3, 3], pivot: [0, 0, 0] }, // shoulder sticks
  {
    u: 24,
    v: 0,
    box: [-2, -2, -1, 2, 12, 2],
    pivot: [-5, 2, 0],
    rotation: [-15, 0, 10],
    kind: 'arm',
  }, // right arm
  {
    u: 32,
    v: 16,
    box: [0, -2, -1, 2, 12, 2],
    pivot: [5, 2, 0],
    rotation: [-10, 0, -10],
    mirror: true,
    kind: 'arm',
  }, // left arm
  { u: 16, v: 0, box: [-3, 3, -1, 2, 7, 2], pivot: [0, 0, 0] }, // right body stick
  { u: 48, v: 16, box: [1, 3, -1, 2, 7, 2], pivot: [0, 0, 0] }, // left body stick
  { u: 0, v: 48, box: [-4, 10, -1, 8, 2, 2], pivot: [0, 0, 0] }, // hip stick
  {
    u: 8,
    v: 0,
    box: [-1, 0, -1, 2, 11, 2],
    pivot: [-1.9, 12, 0],
    rotation: [1, 0, 1],
  }, // right leg
  {
    u: 40,
    v: 16,
    box: [-1, 0, -1, 2, 11, 2],
    pivot: [1.9, 12, 0],
    rotation: [-1, 0, -1],
    mirror: true,
  }, // left leg
  {
    u: 0,
    v: 32,
    box: [-6, 11, -6, 12, 1, 12],
    pivot: [0, 12, 0],
    kind: 'base',
  }, // base plate
];

export interface ArmorStandProps extends Omit<
  ModelViewportProps,
  | 'width'
  | 'height'
  | 'textures'
  | 'camera'
  | 'onSceneReady'
  | 'onFrame'
  | 'animated'
  | 'children'
  | 'aria-label'
> {
  /** GUI units per model pixel. Defaults to 1.5, about the smithing table's preview size. */
  readonly scale?: number;
  /** Texture id of the stand. Defaults to the wooden armor stand. */
  readonly texture?: string;
  /** Accessible name. Defaults to "Armor stand". */
  readonly 'aria-label'?: string;
  /** Drag or press the arrow keys to turn the stand. Defaults to `true`. */
  readonly rotatable?: boolean;
  /** Draw the base plate. Defaults to `true` (`ArmorStand#showBasePlate`). */
  readonly showBasePlate?: boolean;
  /** Half size (`ArmorStand#isSmall`). Defaults to `false`. */
  readonly small?: boolean;
  /** Show the arms (`ArmorStand#showArms`). Defaults to `false`, like the spawned entity. */
  readonly showArms?: boolean;
}

interface BuildOptions {
  readonly texture: string;
  readonly showBasePlate: boolean;
  readonly small: boolean;
  readonly showArms: boolean;
}

/** Light from the front, above and to the left, mostly from the front. */
const LIGHTING: Lighting = {
  direction: [-1, 2, 3],
  ambient: 0.5,
  diffuse: 0.5,
};

/** Builds the stand under `context.root`, feet on the origin plane and centred for turning. */
function buildStand(context: ModelSceneContext, options: BuildOptions): void {
  const { root, textures } = context;
  const texture = textures[options.texture];
  if (!texture) return;
  const stand = new Node3D();
  stand.scale = (options.small ? 0.5 : 1) / 16;
  stand.position[1] = (-MODEL_HEIGHT / 2) * ((options.small ? 0.5 : 1) / 16);
  for (const part of PARTS) {
    if (part.kind === 'arm' && !options.showArms) continue;
    if (part.kind === 'base' && !options.showBasePlate) continue;
    const [bx, by, bz, bw, bh, bd] = part.box;
    const node = new Node3D();
    node.addQuad(
      ...createBoxQuads({
        u: part.u,
        v: part.v,
        width: bw,
        height: bh,
        depth: bd,
        texture,
        alphaTest: 0.1,
        // Model space has y down and the front toward -z; here y is up and the front toward +z.
        origin: [bx, -(by + bh), -(bz + bd)],
        ...(part.mirror ? { mirror: true } : {}),
      }),
    );
    const [px, py, pz] = part.pivot;
    node.position = [px, 24 - py, -pz];
    if (part.rotation) {
      const [rx, ry, rz] = part.rotation;
      // Flipping y and z is a half turn around x, which negates the y and z rotations.
      node.rotationOrder = 'ZYX';
      node.rotation = [rx * DEGREES, -ry * DEGREES, -rz * DEGREES];
    }
    stand.add(node);
  }
  root.add(stand);
}

/**
 * The armor stand the smithing table screen shows beside its slots (`SmithingScreen`), built from
 * the cubes of `ArmorStandModel` and drawn by the library's own software renderer through {@link ModelViewport}. It turns
 * when dragged (or with the arrow keys) and, with `followMouse`, toward the cursor like
 * `InventoryScreen#extractEntityInInventoryFollowsMouse`. There is no armor. Where canvas drawing is
 * unavailable the box stays empty.
 */
export function ArmorStand(props: ArmorStandProps): JSX.Element {
  const {
    scale = 1.5,
    texture = 'entity/armorstand/armorstand',
    'aria-label': labelProp,
    rotatable = true,
    showBasePlate = true,
    small = false,
    showArms = false,
    className,
    ...rest
  } = props;
  const { tOr } = useTranslation();
  const label = labelProp ?? tOr('cobble.armor_stand', 'Armor stand');
  const options: BuildOptions = { texture, showBasePlate, small, showArms };
  return (
    <ModelViewport
      {...rest}
      // The scene is built once, so changing what is drawn remounts the viewport.
      key={`${showBasePlate}|${small}|${showArms}`}
      aria-label={label}
      className={cx('cobble-armor-stand', className)}
      width={ARMOR_STAND_VIEWPORT_WIDTH * scale}
      height={ARMOR_STAND_VIEWPORT_HEIGHT * scale}
      textures={[texture]}
      camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE] }}
      rotatable={rotatable}
      lighting={LIGHTING}
      onSceneReady={(context) => buildStand(context, options)}
    />
  );
}
