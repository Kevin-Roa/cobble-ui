/**
 * Turns the models {@link resolveItem} resolves into textured quads for the software renderer.
 * Pure, so it can be tested without a canvas. A block is 1 unit wide and centred on the origin
 * (model space divided by 16).
 */
import {
  FACE_FRAMES,
  defaultUv,
  faceTexture,
  rotateAxis,
  rotateElementNormal,
  rotateUv,
  type FaceName,
  type ItemPart,
  type Vec3,
} from '../item-model.ts';
import { bakeBlockEntity, blockEntityTextures } from './block-entity-models.ts';
import { bakeEntity } from './entity-models.ts';
import type { RgbaImage } from '../blit.ts';
import type { Quad } from './engine.ts';

/**
 * The vanilla block shading of a face normal (`Direction#getShade` blended by the normal's
 * components, as `ModelBlockRenderer` does for rotated elements): down 0.5, up 1.0, north/south
 * 0.8, east/west 0.6.
 */
export function faceShade(normal: Vec3): number {
  const [x, y, z] = normal;
  const length = Math.hypot(x, y, z) || 1;
  const nx = x / length;
  const ny = y / length;
  const nz = z / length;
  return nx * nx * 0.6 + (ny > 0 ? 1 : 0.5) * ny * ny + nz * nz * 0.8;
}

export interface BakeOptions {
  /** A decoded texture (animated sheets are taller than wide: only the first frame shows). */
  readonly texture: (id: string) => RgbaImage | undefined;
  /**
   * Keep composite parts (beds) where their `transformation` puts them, with no recentring or
   * shrinking. Slot icons need this: the item's `display.gui` transform is authored for the whole
   * composite about the block centre. Defaults to `true` (fit the composite to the viewer).
   */
  readonly fit?: boolean;
  /** Bake every face at full brightness, for callers that light by normal themselves (the GUI lights). */
  readonly unshaded?: boolean;
}

const LAYER_STEP = 0.002;
/** Models made of translated parts (beds) are recentred and shrunk to at most this size, so they fit the view. */
const COMPOSITE_FIT = 1.5;

/** The distinct textures a set of parts draws. */
export function modelTextures(parts: readonly ItemPart[]): string[] {
  const ids = new Set<string>();
  for (const { model, entity, blockEntity } of parts) {
    if (entity) ids.add(entity.texture);
    if (blockEntity) for (const id of blockEntityTextures(blockEntity)) ids.add(id);
    if (model.layers) {
      for (const id of model.layers) ids.add(id);
      continue;
    }
    for (const element of model.elements) {
      for (const face of Object.values(element.faces)) {
        const id = face ? faceTexture(model, face) : undefined;
        if (id !== undefined) ids.add(id);
      }
    }
  }
  return [...ids];
}

function colorOf(shade: number, tint: number | undefined): [number, number, number] {
  const r = tint === undefined ? 1 : ((tint >> 16) & 255) / 255;
  const g = tint === undefined ? 1 : ((tint >> 8) & 255) / 255;
  const b = tint === undefined ? 1 : (tint & 255) / 255;
  return [shade * r, shade * g, shade * b];
}

const partialAlpha = new WeakMap<RgbaImage, boolean>();

/**
 * Whether a texture has semi-transparent texels (alpha strictly between 0 and 255). Block textures
 * of the translucent render layer (stained glass, ice, slime) do; cutout ones (leaves, panes)
 * only have fully clear or fully opaque texels. Stands in for the block's `RenderType`, which the
 * item model JSON does not carry.
 */
export function hasPartialAlpha(image: RgbaImage): boolean {
  let cached = partialAlpha.get(image);
  if (cached === undefined) {
    cached = false;
    for (let i = 3; i < image.data.length; i += 4) {
      const alpha = image.data[i] as number;
      if (alpha > 0 && alpha < 255) {
        cached = true;
        break;
      }
    }
    partialAlpha.set(image, cached);
  }
  return cached;
}

/**
 * Builds the faces of every part: element boxes with their per-face uv, `rotation`, element
 * rotation, tint and `shade`, and the flat `layerN` sprites of `item/generated` models (drawn as
 * double-sided quads). Element faces are back-face culled like the game's block layers, so
 * coincident back-to-back faces of neighbouring elements (shelves, walls) never fight; `cullface`
 * only matters next to other blocks and is ignored. An item part's `transformation` (the head and
 * foot halves of a bed) is applied about the block corner; a model with such parts is then centred
 * and fitted so the whole composite is visible.
 */
export function bakeParts(parts: readonly ItemPart[], options: BakeOptions): Quad[] {
  const out: Quad[] = [];
  let doubleSided = false;
  const quad = (
    id: string,
    corners: Quad['corners'],
    uvs: readonly (readonly [number, number])[],
    color: readonly [number, number, number],
    twoSided: boolean,
  ): void => {
    const texture = options.texture(id);
    if (!texture) return;
    out.push({
      corners,
      uvs: uvs as unknown as Quad['uvs'],
      texture,
      color,
      alphaTest: 0.1,
      doubleSided: twoSided || doubleSided,
      // Element faces with semi-transparent texels use the translucent layer: blended, sorted,
      // and visible from behind. Flat item sprites stay in the cutout path.
      ...(!twoSided && hasPartialAlpha(texture) ? { translucent: true } : {}),
    });
  };
  let transformed = false;
  for (const { model, tints, transformation, entity, blockEntity } of parts) {
    if (blockEntity) {
      // Code-drawn block entity (chest, banner, ...): flat for `gui_light: front`, else block shading.
      out.push(
        ...bakeBlockEntity(
          blockEntity,
          options.texture,
          model.light === 'front' || options.unshaded ? () => 1 : faceShade,
        ),
      );
      continue;
    }
    if (entity) {
      // Code-drawn special model (head, copper golem): block shading, no `display` transform.
      // The dragon head and the 1.5 block tall golem reach past the block, so the viewport centres
      // and fits them like a composite instead of letting the turning model leave the frame.
      const texture = options.texture(entity.texture);
      if (texture) {
        out.push(...bakeEntity(entity.model, texture, faceShade));
        transformed = true;
      }
      continue;
    }
    // A mirroring transformation flips the winding, so cull nothing then.
    doubleSided = false;
    let move: ((point: Vec3) => Vec3) | undefined;
    if (transformation && transformation.length === 12) {
      transformed = true;
      const m = transformation as readonly number[] as Matrix;
      const det =
        m[0] * (m[5] * m[10] - m[6] * m[9]) -
        m[1] * (m[4] * m[10] - m[6] * m[8]) +
        m[2] * (m[4] * m[9] - m[5] * m[8]);
      doubleSided = det < 0;
      // Block space has its origin at a corner; baked coordinates are centred on the block.
      move = ([x, y, z]) => {
        const px = x + 0.5;
        const py = y + 0.5;
        const pz = z + 0.5;
        return [
          m[0] * px + m[1] * py + m[2] * pz + m[3] - 0.5,
          m[4] * px + m[5] * py + m[6] * pz + m[7] - 0.5,
          m[8] * px + m[9] * py + m[10] * pz + m[11] - 0.5,
        ];
      };
    }
    const start = out.length;
    const finish = (): void => {
      if (!move) return;
      for (let i = start; i < out.length; i++) {
        const q = out[i] as Quad;
        const [a, b, c, d] = q.corners;
        out[i] = { ...q, corners: [move(a), move(b), move(c), move(d)] };
      }
    };
    if (model.layers) {
      model.layers.forEach((texture, index) => {
        const z = index * LAYER_STEP;
        quad(
          texture,
          [
            [-0.5, -0.5, z],
            [0.5, -0.5, z],
            [0.5, 0.5, z],
            [-0.5, 0.5, z],
          ],
          layerUvs(texture, options),
          colorOf(1, tints[index]),
          true,
        );
      });
      finish();
      continue;
    }
    for (const element of model.elements) {
      const [fx, fy, fz] = element.from;
      const [tx, ty, tz] = element.to;
      const size: Vec3 = [tx - fx, ty - fy, tz - fz];
      const place = (point: Vec3): Vec3 => {
        let result = point;
        const rotation = element.rotation;
        if (rotation) {
          const o = rotation.origin;
          const turned = rotateAxis(
            [point[0] - o[0], point[1] - o[1], point[2] - o[2]],
            rotation.axis,
            rotation.angle,
          );
          result = [turned[0] + o[0], turned[1] + o[1], turned[2] + o[2]];
        }
        return [(result[0] - 8) / 16, (result[1] - 8) / 16, (result[2] - 8) / 16];
      };
      for (const name of Object.keys(element.faces) as FaceName[]) {
        const face = element.faces[name];
        if (!face) continue;
        const texture = faceTexture(model, face);
        if (texture === undefined) continue;
        const frame = FACE_FRAMES[name];
        const corner = (sel: readonly [number, number, number]): Vec3 => [
          sel[0] === 0 ? fx : tx,
          sel[1] === 0 ? fy : ty,
          sel[2] === 0 ? fz : tz,
        ];
        const o = corner(frame.origin);
        const along = (axis: readonly [number, number, number]): Vec3 => [
          axis[0] * Math.abs(axis[0]) * size[0],
          axis[1] * Math.abs(axis[1]) * size[1],
          axis[2] * Math.abs(axis[2]) * size[2],
        ];
        const u = along(frame.u);
        const v = along(frame.v);
        const tl = o;
        const tr: Vec3 = [o[0] + u[0], o[1] + u[1], o[2] + u[2]];
        const bl: Vec3 = [o[0] + v[0], o[1] + v[1], o[2] + v[2]];
        const br: Vec3 = [tr[0] + v[0], tr[1] + v[1], tr[2] + v[2]];
        const uv = rotateUv(face.uv ?? defaultUv(name, element), face.rotation ?? 0);
        const brUv: [number, number] = [
          uv.tr[0] + uv.bl[0] - uv.tl[0],
          uv.tr[1] + uv.bl[1] - uv.tl[1],
        ];
        const size2 = options.texture(texture);
        const vScale = size2 && size2.height > 0 ? size2.width / size2.height : 1;
        const toUv = (point: readonly [number, number]): [number, number] => [
          point[0] / 16,
          (point[1] / 16) * vScale,
        ];
        const shade =
          model.light === 'front' || element.shade === false || options.unshaded
            ? 1
            : faceShade(rotateElementNormal(frame.normal, element.rotation));
        quad(
          texture,
          // Counter-clockwise as seen from the front (the engine's convention), so culling works.
          [place(bl), place(br), place(tr), place(tl)],
          [toUv(uv.bl), toUv(brUv), toUv(uv.tr), toUv(uv.tl)],
          colorOf(shade, face.tintindex === undefined ? undefined : tints[face.tintindex]),
          false,
        );
      }
    }
    finish();
  }
  return transformed && options.fit !== false ? fitComposite(out) : out;
}

type Matrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Centres the quads on their bounding box and scales them down to {@link COMPOSITE_FIT} if larger. */
function fitComposite(quads: Quad[]): Quad[] {
  if (quads.length === 0) return quads;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const { corners } of quads) {
    for (const corner of corners) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis] as number, corner[axis] as number);
        max[axis] = Math.max(max[axis] as number, corner[axis] as number);
      }
    }
  }
  const extent = Math.max(
    (max[0] as number) - (min[0] as number),
    (max[1] as number) - (min[1] as number),
    (max[2] as number) - (min[2] as number),
  );
  const factor = extent > COMPOSITE_FIT ? COMPOSITE_FIT / extent : 1;
  const center = [0, 1, 2].map((axis) => ((min[axis] as number) + (max[axis] as number)) / 2);
  const fit = (p: Vec3): Vec3 => [
    (p[0] - (center[0] as number)) * factor,
    (p[1] - (center[1] as number)) * factor,
    (p[2] - (center[2] as number)) * factor,
  ];
  return quads.map((q) => {
    const [a, b, c, d] = q.corners;
    return { ...q, corners: [fit(a), fit(b), fit(c), fit(d)] };
  });
}

function layerUvs(texture: string, options: BakeOptions): [number, number][] {
  const size = options.texture(texture);
  const v = size && size.height > 0 ? size.width / size.height : 1;
  return [
    [0, v],
    [1, v],
    [1, 0],
    [0, 0],
  ];
}
