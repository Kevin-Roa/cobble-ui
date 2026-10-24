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
}

const LAYER_STEP = 0.002;

/** The distinct textures a set of parts draws. */
export function modelTextures(parts: readonly ItemPart[]): string[] {
  const ids = new Set<string>();
  for (const { model } of parts) {
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

/**
 * Builds the faces of every part: element boxes with their per-face uv, `rotation`, element
 * rotation, tint and `shade`, and the flat `layerN` sprites of `item/generated` models (drawn as
 * double-sided quads). Faces are not culled (`cullface` only matters next to other blocks).
 */
export function bakeParts(parts: readonly ItemPart[], options: BakeOptions): Quad[] {
  const out: Quad[] = [];
  const quad = (
    id: string,
    corners: Quad['corners'],
    uvs: readonly (readonly [number, number])[],
    color: readonly [number, number, number],
  ): void => {
    const texture = options.texture(id);
    if (!texture) return;
    out.push({
      corners,
      uvs: uvs as unknown as Quad['uvs'],
      texture,
      color,
      alphaTest: 0.1,
      doubleSided: true,
    });
  };
  for (const { model, tints } of parts) {
    if (model.layers) {
      model.layers.forEach((texture, index) => {
        const z = index * LAYER_STEP;
        quad(
          texture,
          [
            [-0.5, 0.5, z],
            [0.5, 0.5, z],
            [0.5, -0.5, z],
            [-0.5, -0.5, z],
          ],
          layerUvs(texture, options),
          colorOf(1, tints[index]),
        );
      });
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
          model.light === 'front' || element.shade === false
            ? 1
            : faceShade(rotateElementNormal(frame.normal, element.rotation));
        quad(
          texture,
          [place(tl), place(tr), place(br), place(bl)],
          [toUv(uv.tl), toUv(uv.tr), toUv(brUv), toUv(uv.bl)],
          colorOf(shade, face.tintindex === undefined ? undefined : tints[face.tintindex]),
        );
      }
    }
  }
  return out;
}

function layerUvs(texture: string, options: BakeOptions): [number, number][] {
  const size = options.texture(texture);
  const v = size && size.height > 0 ? size.width / size.height : 1;
  return [
    [0, 0],
    [1, 0],
    [1, v],
    [0, v],
  ];
}
