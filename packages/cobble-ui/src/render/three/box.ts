import type * as Three from 'three';
import type { BufferGeometry, DataTexture } from 'three';
import type { RgbaImage } from '../blit.ts';

/** The `three` module, as loaded lazily by `ThreeViewport`. */
export type ThreeModule = typeof Three;

/** A rectangle on a texture in texels (image space: `y` grows downwards). */
export interface UvRect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export type BoxFace = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom';

/** The six rectangles a box unwraps to, in texels. */
export type BoxUvLayout = Readonly<Record<BoxFace, UvRect>>;

export interface BoxUvOptions {
  /** Texture offset (`texOffs`) in texels. */
  readonly u: number;
  readonly v: number;
  /** Box size in texels/pixels: `width` (x), `height` (y) and `depth` (z). */
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  /** Mirror the texture horizontally (`ModelPart#mirror`), as used by left limbs. */
  readonly mirror?: boolean;
}

/**
 * Unwraps a box the way `CubeListBuilder`/`ModelPart.Cube` does. With `texOffs(u, v)` and size
 * `w x h x d` the net is
 *
 * ```
 *          u     u+d    u+d+w   u+2d+w   u+2d+2w
 *   v            top    bottom
 *  v+d    right  front  left    back
 *  v+d+h
 * ```
 *
 * In `three` space (y up, front facing +z), "right" is the character's right side (the -x face,
 * on the viewer's left when looking at the front) and "left" the +x face. That is the layout of
 * the player skin, e.g. the head at `texOffs(0, 0)` with size `8 x 8 x 8`.
 */
export function boxUvLayout(options: BoxUvOptions): BoxUvLayout {
  const { u, v, width: w, height: h, depth: d, mirror = false } = options;
  const rect = (x: number, y: number, rw: number, rh: number): UvRect =>
    mirror ? { x0: x + rw, y0: y, x1: x, y1: y + rh } : { x0: x, y0: y, x1: x + rw, y1: y + rh };
  const right = rect(u, v + d, d, h);
  const left = rect(u + d + w, v + d, d, h);
  return {
    top: rect(u + d, v, w, d),
    bottom: rect(u + d + w, v, w, d),
    right: mirror ? left : right,
    left: mirror ? right : left,
    front: rect(u + d, v + d, w, h),
    back: rect(u + d + w + d, v + d, w, h),
  };
}

export interface BoxGeometryOptions extends BoxUvOptions {
  /** Minimum corner of the box in `three` space (y up). Defaults to centred on the origin. */
  readonly origin?: readonly [x: number, y: number, z: number];
  /** Grows the box on every side (`CubeDeformation`), in the same units as the size. */
  readonly inflate?: number;
  /** Size of the whole texture in texels (`LayerDefinition.create(..., width, height)`). */
  readonly textureWidth: number;
  readonly textureHeight: number;
  /**
   * Map every face onto the whole texture instead of the box net, like a block model's
   * single-texture cube. `u`/`v` are ignored. Defaults to `false`.
   */
  readonly fullFaces?: boolean;
}

type Vec3 = readonly [number, number, number];
type Corners = readonly [Vec3, Vec3, Vec3, Vec3];

/**
 * Builds a box whose faces sample a texture with the Minecraft box UV layout
 * ({@link boxUvLayout}). Sizes are in model pixels (1/16 of a block); scale the mesh if you
 * want blocks. Textures must be uploaded with `flipY = false` (see {@link createTexture}) so
 * the UVs can be expressed in image space.
 */
export function createBoxGeometry(three: ThreeModule, options: BoxGeometryOptions): BufferGeometry {
  const {
    width: w,
    height: h,
    depth: d,
    inflate = 0,
    textureWidth: tw,
    textureHeight: th,
  } = options;
  const [ox, oy, oz] = options.origin ?? [-w / 2, -h / 2, -d / 2];
  const x0 = ox - inflate;
  const y0 = oy - inflate;
  const z0 = oz - inflate;
  const x1 = ox + w + inflate;
  const y1 = oy + h + inflate;
  const z1 = oz + d + inflate;
  const whole: UvRect = { x0: 0, y0: 0, x1: tw, y1: th };
  const layout: BoxUvLayout = options.fullFaces
    ? { front: whole, back: whole, right: whole, left: whole, top: whole, bottom: whole }
    : boxUvLayout(options);

  // Corners are bottom-left, bottom-right, top-right, top-left as seen from outside the box
  // (counter-clockwise), so the same corner order maps onto the rectangle's UVs.
  const faces: readonly (readonly [BoxFace, Vec3, Corners])[] = [
    [
      'front',
      [0, 0, 1],
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
    ],
    [
      'back',
      [0, 0, -1],
      [
        [x1, y0, z0],
        [x0, y0, z0],
        [x0, y1, z0],
        [x1, y1, z0],
      ],
    ],
    [
      'right',
      [-1, 0, 0],
      [
        [x0, y0, z0],
        [x0, y0, z1],
        [x0, y1, z1],
        [x0, y1, z0],
      ],
    ],
    [
      'left',
      [1, 0, 0],
      [
        [x1, y0, z1],
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
      ],
    ],
    [
      'top',
      [0, 1, 0],
      [
        [x0, y1, z1],
        [x1, y1, z1],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
    ],
    [
      'bottom',
      [0, -1, 0],
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
    ],
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const [face, normal, corners] of faces) {
    const rect = layout[face];
    const base = positions.length / 3;
    // Image-space texels matching `corners`: BL, BR, TR, TL.
    const texels = [
      [rect.x0, rect.y1],
      [rect.x1, rect.y1],
      [rect.x1, rect.y0],
      [rect.x0, rect.y0],
    ] as const;
    corners.forEach((corner, i) => {
      positions.push(...corner);
      normals.push(...normal);
      const texel = texels[i];
      if (texel) uvs.push(texel[0] / tw, texel[1] / th);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const geometry = new three.BufferGeometry();
  geometry.setAttribute('position', new three.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new three.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new three.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * Uploads a decoded game texture exactly as the game samples it: nearest filtering, no
 * mipmaps, sRGB colour space and no vertical flip (UVs are in image space, see
 * {@link createBoxGeometry}). `ThreeViewport` disposes the textures it hands out.
 */
export function createTexture(three: ThreeModule, image: RgbaImage): DataTexture {
  const texture = new three.DataTexture(
    new Uint8Array(image.data),
    image.width,
    image.height,
    three.RGBAFormat,
  );
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = three.NearestFilter;
  texture.minFilter = three.NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

const FOLLOW_DISTANCE = 40;
const DEGREES = Math.PI / 180;

export interface FollowAngles {
  /** Yaw of the body in radians; positive turns the front toward +x (the viewer's right). */
  readonly bodyYaw: number;
  /** Extra yaw of the head on top of the body, in radians. */
  readonly headYaw: number;
  /** Pitch in radians; positive looks down. */
  readonly pitch: number;
}

/**
 * How far an entity turns toward the cursor, mirroring
 * `InventoryScreen#extractEntityInInventoryFollowsMouse`: `atan(offset / 40)` per axis, the body
 * turning by 20 degrees per radian, the head by 40 in total (20 on top of the body) and the
 * pitch by 20.
 *
 * @param dx Cursor offset from the entity's centre in GUI units, positive to the right.
 * @param dy Cursor offset in GUI units, positive downwards.
 */
export function followAngles(dx: number, dy: number): FollowAngles {
  const x = Math.atan(dx / FOLLOW_DISTANCE);
  const y = Math.atan(dy / FOLLOW_DISTANCE);
  return { bodyYaw: x * 20 * DEGREES, headYaw: x * 20 * DEGREES, pitch: y * 20 * DEGREES };
}
