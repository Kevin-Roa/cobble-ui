import type { RgbaImage } from '../blit.ts';

/**
 * A tiny software 3D renderer for textured quads, used by the model viewers (player, armor stand,
 * blocks). It draws into an RGBA buffer on the CPU: perspective projection, a depth buffer,
 * perspective-correct nearest-neighbour texture sampling (like the game's unfiltered textures) and
 * flat per-quad lighting. No WebGL and no dependencies. Coordinates are right-handed with y up and
 * the camera looking down -z; rotations follow the same convention as the common Euler rotations
 * (positive x turns y toward z).
 */

export type Vec3 = readonly [x: number, y: number, z: number];
type Corners = readonly [Vec3, Vec3, Vec3, Vec3];
type Uvs = readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
];

/** The order Euler angles are applied in, written as the matrix product (`XYZ` is `Rx * Ry * Rz`). */
export type RotationOrder = 'XYZ' | 'YXZ' | 'ZYX';

/** A textured, flat-shaded rectangle. Corners go counter-clockwise as seen from the front. */
export interface Quad {
  readonly corners: Corners;
  /** Normalised texture coordinates per corner (`v` grows downward, like an image). */
  readonly uvs: Uvs;
  readonly texture: RgbaImage;
  /**
   * A fixed brightness multiplier, per colour channel (face shade times tint). Defaults to white.
   */
  readonly color?: Vec3;
  /** Apply the scene lights using the face's normal. Defaults to `false`. */
  readonly lit?: boolean;
  /** Texels with an alpha below this (0 to 1) are not drawn. Without it the texture is opaque. */
  readonly alphaTest?: number;
  /** Draw the back as well. Defaults to `false` (back faces are culled). */
  readonly doubleSided?: boolean;
  /**
   * Vanilla's translucent layer (stained glass, ice, ...): drawn after every opaque quad, back to
   * front, alpha-blended over what is behind, depth-tested but not written, and never culled, so
   * back faces show through the front ones.
   */
  readonly translucent?: boolean;
}

/** A transform node: moves, rotates and uniformly scales everything under it. */
export class Node3D {
  position: [number, number, number] = [0, 0, 0];
  rotation: [number, number, number] = [0, 0, 0];
  rotationOrder: RotationOrder = 'XYZ';
  scale = 1;
  readonly children: Node3D[] = [];
  readonly quads: Quad[] = [];

  add(...nodes: Node3D[]): this {
    this.children.push(...nodes);
    return this;
  }

  addQuad(...quads: Quad[]): this {
    this.quads.push(...quads);
    return this;
  }
}

export interface Camera3D {
  /** Vertical field of view in degrees. Defaults to 30. */
  readonly fov?: number;
  /** Defaults to `[0, 0, 5]`. */
  readonly position?: Vec3;
  /** Defaults to the origin. */
  readonly target?: Vec3;
}

export interface Lighting {
  /** Brightness of unlit-from-the-light faces. Defaults to 0.55. */
  readonly ambient?: number;
  /** Direction the light comes from (toward the light). Defaults to the front, above and left. */
  readonly direction?: Vec3;
  /** Extra brightness of faces facing the light. Defaults to 0.45. */
  readonly diffuse?: number;
}

/** The pixels a scene is drawn into. */
export interface RenderTarget {
  readonly width: number;
  readonly height: number;
  /** `width * height * 4` bytes, cleared by {@link renderScene}. */
  readonly data: Uint8ClampedArray;
  /** `width * height` entries; scratch space for the depth buffer. */
  readonly depth: Float32Array;
}

export function createRenderTarget(width: number, height: number): RenderTarget {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
    depth: new Float32Array(w * h),
  };
}

type Matrix = readonly [
  m00: number,
  m01: number,
  m02: number,
  tx: number,
  m10: number,
  m11: number,
  m12: number,
  ty: number,
  m20: number,
  m21: number,
  m22: number,
  tz: number,
];

const IDENTITY: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function multiply(a: Matrix, b: Matrix): Matrix {
  const row = (r: number): [number, number, number, number] => {
    const i = r * 4;
    return [
      (a[i] as number) * b[0] + (a[i + 1] as number) * b[4] + (a[i + 2] as number) * b[8],
      (a[i] as number) * b[1] + (a[i + 1] as number) * b[5] + (a[i + 2] as number) * b[9],
      (a[i] as number) * b[2] + (a[i + 1] as number) * b[6] + (a[i + 2] as number) * b[10],
      (a[i] as number) * b[3] +
        (a[i + 1] as number) * b[7] +
        (a[i + 2] as number) * b[11] +
        (a[i + 3] as number),
    ];
  };
  return [...row(0), ...row(1), ...row(2)];
}

function rotationMatrix(axis: 'X' | 'Y' | 'Z', angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  switch (axis) {
    case 'X':
      return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0];
    case 'Y':
      return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0];
    case 'Z':
      return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0];
  }
}

/** The local transform of a node: translate * rotate * scale. */
function localMatrix(node: Node3D): Matrix {
  const [rx, ry, rz] = node.rotation;
  const angles = { X: rx, Y: ry, Z: rz };
  let rotation = IDENTITY;
  for (const axis of node.rotationOrder) {
    rotation = multiply(rotation, rotationMatrix(axis as 'X' | 'Y' | 'Z', angles[axis as 'X']));
  }
  const s = node.scale;
  const [px, py, pz] = node.position;
  return [
    rotation[0] * s,
    rotation[1] * s,
    rotation[2] * s,
    px,
    rotation[4] * s,
    rotation[5] * s,
    rotation[6] * s,
    py,
    rotation[8] * s,
    rotation[9] * s,
    rotation[10] * s,
    pz,
  ];
}

function transform(m: Matrix, p: Vec3): [number, number, number] {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}

function sub(a: Vec3, b: Vec3): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v: Vec3): [number, number, number] {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

const NEAR = 0.05;
/** Relative depth slack (on 1/w) within which a later quad replaces an earlier one. */
const DEPTH_TIE = 1 - 1e-5;
const DEGREES = Math.PI / 180;
const DEFAULT_LIGHT: Vec3 = [-0.3, 0.6, 1];

interface WorldQuad {
  readonly quad: Quad;
  readonly corners: [Vec3, Vec3, Vec3, Vec3];
}

function collect(node: Node3D, parent: Matrix, out: WorldQuad[]): void {
  const matrix = multiply(parent, localMatrix(node));
  for (const quad of node.quads) {
    const [a, b, c, d] = quad.corners;
    out.push({
      quad,
      corners: [
        transform(matrix, a),
        transform(matrix, b),
        transform(matrix, c),
        transform(matrix, d),
      ],
    });
  }
  for (const child of node.children) collect(child, matrix, out);
}

/**
 * Draws a scene. The target is cleared to transparent, then every quad is projected with a
 * perspective camera and rasterised with a depth test. The pixel at `(x, y)` samples the texture at
 * the pixel's centre, with no filtering. Quads at the same depth (coplanar faces) are won by the one
 * added last.
 */
export function renderScene(
  root: Node3D,
  camera: Camera3D,
  target: RenderTarget,
  lighting: Lighting = {},
): void {
  const { width, height, data, depth } = target;
  data.fill(0);
  depth.fill(0);

  const eye: Vec3 = camera.position ?? [0, 0, 5];
  const at: Vec3 = camera.target ?? [0, 0, 0];
  // Camera basis: `forward` into the scene, `right` along screen x, `up` along screen y.
  const forward = normalize(sub(at, eye));
  let right = normalize(cross(forward, [0, 1, 0]));
  if (Math.hypot(right[0], right[1], right[2]) < 1e-6) right = [1, 0, 0];
  const up = cross(right, forward);
  const focal = 1 / Math.tan(((camera.fov ?? 30) * DEGREES) / 2);
  // Pixels per unit of normalised device y; x uses the same scale so pixels stay square.
  const scale = (focal * height) / 2;
  const cx = width / 2;
  const cy = height / 2;

  const ambient = lighting.ambient ?? 0.55;
  const diffuse = lighting.diffuse ?? 0.45;
  const light = normalize(lighting.direction ?? DEFAULT_LIGHT);

  const quads: WorldQuad[] = [];
  collect(root, IDENTITY, quads);

  // Opaque quads first in insertion order, then translucent ones farthest first (a stable sort, so
  // ties keep insertion order).
  const depthOf = (world: WorldQuad): number =>
    dot(
      sub(
        [
          (world.corners[0][0] + world.corners[2][0]) / 2,
          (world.corners[0][1] + world.corners[2][1]) / 2,
          (world.corners[0][2] + world.corners[2][2]) / 2,
        ],
        eye,
      ),
      forward,
    );
  const ordered = [
    ...quads.filter((world) => world.quad.translucent !== true),
    ...quads
      .filter((world) => world.quad.translucent === true)
      .map((world) => ({ world, depth: depthOf(world) }))
      .toSorted((a, b) => b.depth - a.depth)
      .map(({ world }) => world),
  ];

  // Per pixel, the last translucent quad that blended there, so the two triangles of one quad (and
  // their tolerance overlap) never blend the same pixel twice.
  const blended = new Int32Array(width * height).fill(-1);
  let quadIndex = -1;
  for (const { quad, corners } of ordered) {
    quadIndex++;
    const translucent = quad.translucent === true;
    const normal = normalize(cross(sub(corners[1], corners[0]), sub(corners[3], corners[0])));
    const facing = dot(normal, sub(eye, corners[0]));
    if (facing <= 0 && !quad.doubleSided && !translucent) continue;

    let red = quad.color?.[0] ?? 1;
    let green = quad.color?.[1] ?? 1;
    let blue = quad.color?.[2] ?? 1;
    if (quad.lit) {
      const side = facing < 0 ? -1 : 1;
      const brightness = Math.min(1, ambient + diffuse * Math.max(0, dot(normal, light) * side));
      red *= brightness;
      green *= brightness;
      blue *= brightness;
    }

    // Project the corners: screen x/y plus 1/w for perspective-correct interpolation.
    const screen: { x: number; y: number; w: number; u: number; v: number }[] = [];
    let clipped = false;
    for (let i = 0; i < 4; i++) {
      const corner = corners[i] as Vec3;
      const rel = sub(corner, eye);
      const w = dot(rel, forward);
      if (w < NEAR) {
        clipped = true;
        break;
      }
      const uv = quad.uvs[i] as readonly [number, number];
      screen.push({
        x: cx + (dot(rel, right) / w) * scale,
        y: cy - (dot(rel, up) / w) * scale,
        w,
        u: uv[0],
        v: uv[1],
      });
    }
    if (clipped) continue;
    const [p0, p1, p2, p3] = screen as [
      (typeof screen)[number],
      (typeof screen)[number],
      (typeof screen)[number],
      (typeof screen)[number],
    ];
    const texture = quad.texture;
    // Texels the face may sample. The edge tolerance below lets a pixel just outside the triangle
    // extrapolate past the face's own region into a neighbouring face's texels (stray pixels).
    const uvs = quad.uvs as readonly (readonly [number, number])[];
    const minTx = Math.floor(Math.min(...uvs.map((uv) => uv[0])) * texture.width + 1e-3);
    const maxTx = Math.ceil(Math.max(...uvs.map((uv) => uv[0])) * texture.width - 1e-3) - 1;
    const minTy = Math.floor(Math.min(...uvs.map((uv) => uv[1])) * texture.height + 1e-3);
    const maxTy = Math.ceil(Math.max(...uvs.map((uv) => uv[1])) * texture.height - 1e-3) - 1;
    const alphaTest = quad.alphaTest === undefined ? -1 : Math.round(quad.alphaTest * 255);
    const triangle = (a: typeof p0, b: typeof p0, c: typeof p0): void => {
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (area === 0) return;
      const invArea = 1 / area;
      const ia = 1 / a.w;
      const ib = 1 / b.w;
      const ic = 1 / c.w;
      const ua = a.u * ia;
      const ub = b.u * ib;
      const uc = c.u * ic;
      const va = a.v * ia;
      const vb = b.v * ib;
      const vc = c.v * ic;
      // Slight tolerance so neighbouring triangles leave no cracks.
      const epsilon = -1e-4;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const w0 = ((b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)) * invArea;
          const w1 = ((c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)) * invArea;
          const w2 = 1 - w0 - w1;
          if (w0 < epsilon || w1 < epsilon || w2 < epsilon) continue;
          const inverseW = w0 * ia + w1 * ib + w2 * ic;
          const index = y * width + x;
          // Nearer wins; (nearly) equal depth goes to the quad drawn later, like the game's
          // LEQUAL test, so coplanar faces of overlapping elements resolve by element order.
          if (inverseW < (depth[index] as number) * DEPTH_TIE) continue;
          const u = (w0 * ua + w1 * ub + w2 * uc) / inverseW;
          const v = (w0 * va + w1 * vb + w2 * vc) / inverseW;
          const tx = Math.min(maxTx, Math.max(minTx, Math.floor(u * texture.width)));
          const ty = Math.min(maxTy, Math.max(minTy, Math.floor(v * texture.height)));
          const t = (ty * texture.width + tx) * 4;
          const alpha = texture.data[t + 3] as number;
          if (alphaTest >= 0 && alpha < alphaTest) continue;
          const o = index * 4;
          if (translucent) {
            // Source-over on straight alpha; the depth buffer is left alone.
            if (alpha === 0 || blended[index] === quadIndex) continue;
            blended[index] = quadIndex;
            const sa = alpha / 255;
            const da = (data[o + 3] as number) / 255;
            const outA = sa + da * (1 - sa);
            const keep = (da * (1 - sa)) / outA;
            const mix = sa / outA;
            data[o] = (texture.data[t] as number) * red * mix + (data[o] as number) * keep;
            data[o + 1] =
              (texture.data[t + 1] as number) * green * mix + (data[o + 1] as number) * keep;
            data[o + 2] =
              (texture.data[t + 2] as number) * blue * mix + (data[o + 2] as number) * keep;
            data[o + 3] = outA * 255;
            continue;
          }
          depth[index] = inverseW;
          data[o] = (texture.data[t] as number) * red;
          data[o + 1] = (texture.data[t + 1] as number) * green;
          data[o + 2] = (texture.data[t + 2] as number) * blue;
          data[o + 3] = alphaTest >= 0 ? alpha : 255;
        }
      }
    };
    triangle(p0, p1, p2);
    triangle(p0, p2, p3);
  }
}
