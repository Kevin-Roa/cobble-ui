/**
 * Resolves what an item looks like in a GUI slot from the game's own data: the item definition
 * (`items/<name>.json`) points at a model (`models/**.json`) whose parents, elements, textures and
 * `display.gui` transform describe the picture (`ItemModelResolver`, `BlockModel`, `ItemTransform`).
 * Everything here is pure; files are read through a {@link JsonSource}.
 */

/** Reads a parsed JSON file by its path in the client jar: `undefined` while loading, `null` if missing. */
export type JsonSource = (path: string) => unknown;

export type Vec3 = readonly [number, number, number];

export interface ModelFace {
  readonly uv?: readonly [number, number, number, number];
  readonly texture: string;
  readonly rotation?: number;
  readonly tintindex?: number;
}

export interface ModelElement {
  readonly from: Vec3;
  readonly to: Vec3;
  readonly rotation?: {
    readonly origin: Vec3;
    readonly axis: 'x' | 'y' | 'z';
    readonly angle: number;
  };
  /** `false` turns off the directional shading of the element's faces (`BlockElement#shade`). */
  readonly shade?: boolean;
  readonly faces: Readonly<Partial<Record<FaceName, ModelFace>>>;
}

export type FaceName = 'down' | 'up' | 'north' | 'south' | 'west' | 'east';

export interface GuiTransform {
  readonly rotation: Vec3;
  readonly translation: Vec3;
  readonly scale: Vec3;
}

/** A model with its parents merged in. */
export interface ResolvedModel {
  /** Flat `layerN` textures of an `item/generated` model, as texture ids (`item/stick`). */
  readonly layers: readonly string[] | undefined;
  readonly elements: readonly ModelElement[];
  /** Texture variables (`#all`) already resolved to texture ids, or missing when unresolvable. */
  readonly textures: Readonly<Record<string, string>>;
  readonly gui: GuiTransform | undefined;
  /** `side` lights the model like a block, `front` leaves it flat. */
  readonly light: 'side' | 'front';
}

/** One model of an item plus the colours its `tintindex` values pick. */
export interface ItemPart {
  readonly model: ResolvedModel;
  /** RGB colours (`0xRRGGBB`) by tint index; `undefined` entries are untinted. */
  readonly tints: readonly (number | undefined)[];
}

const GRASS = 0x91bd59;
const FOLIAGE = 0x77ab2f;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripNamespace(id: string): string {
  return id.startsWith('minecraft:') ? id.slice('minecraft:'.length) : id;
}

function isVec3(value: unknown): value is Vec3 {
  return Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === 'number');
}

function parseTints(value: unknown): readonly (number | undefined)[] {
  if (!Array.isArray(value)) return [];
  return value.map((tint: unknown): number | undefined => {
    if (!isRecord(tint)) return undefined;
    const type = stripNamespace(String(tint['type']));
    if (type === 'grass') return GRASS;
    if (type === 'foliage') return FOLIAGE;
    const raw = type === 'constant' ? tint['value'] : tint['default'];
    return typeof raw === 'number' ? raw & 0xffffff : undefined;
  });
}

interface RawModel {
  readonly parent?: string;
  readonly textures: Record<string, string>;
  readonly elements?: readonly ModelElement[];
  readonly gui?: GuiTransform;
  readonly light?: 'side' | 'front';
}

function parseModel(json: unknown): RawModel | undefined {
  if (!isRecord(json)) return undefined;
  const textures: Record<string, string> = {};
  const rawTextures = json['textures'];
  if (isRecord(rawTextures)) {
    for (const [key, value] of Object.entries(rawTextures)) {
      if (typeof value === 'string') textures[key] = value;
    }
  }
  const display = json['display'];
  const guiJson = isRecord(display) ? display['gui'] : undefined;
  let gui: GuiTransform | undefined;
  if (isRecord(guiJson)) {
    const rotation = guiJson['rotation'];
    const translation = guiJson['translation'];
    const scale = guiJson['scale'];
    gui = {
      rotation: isVec3(rotation) ? rotation : [0, 0, 0],
      translation: isVec3(translation) ? translation : [0, 0, 0],
      scale: isVec3(scale) ? scale : [1, 1, 1],
    };
  }
  const light = json['gui_light'];
  return {
    ...(typeof json['parent'] === 'string' ? { parent: json['parent'] } : {}),
    textures,
    ...(Array.isArray(json['elements']) ? { elements: json['elements'] as ModelElement[] } : {}),
    ...(gui === undefined ? {} : { gui }),
    ...(light === 'side' || light === 'front' ? { light } : {}),
  };
}

/** Resolves a model id (`item/torch`, `minecraft:block/stone`); `undefined` while any file is loading. */
export function resolveModel(id: string, source: JsonSource): ResolvedModel | undefined | null {
  const chain: RawModel[] = [];
  let generated = false;
  let current: string | undefined = stripNamespace(id);
  for (let depth = 0; current !== undefined && depth < 16; depth++) {
    if (current === 'builtin/generated') {
      generated = true;
      break;
    }
    if (current.startsWith('builtin/')) return null;
    const json = source(`assets/minecraft/models/${current}.json`);
    if (json === undefined) return undefined;
    const model = parseModel(json);
    if (!model) return null;
    chain.push(model);
    current = model.parent === undefined ? undefined : stripNamespace(model.parent);
  }
  // Children override parents.
  const merged: Record<string, string> = {};
  let elements: readonly ModelElement[] | undefined;
  let gui: GuiTransform | undefined;
  let light: 'side' | 'front' | undefined;
  for (const model of chain.toReversed()) {
    Object.assign(merged, model.textures);
    if (model.elements) elements = model.elements;
    if (model.gui) gui = model.gui;
    if (model.light) light = model.light;
  }
  const resolveTexture = (value: string | undefined): string | undefined => {
    let result = value;
    for (let i = 0; i < 8 && result?.startsWith('#'); i++) result = merged[result.slice(1)];
    return result === undefined || result.startsWith('#') ? undefined : stripNamespace(result);
  };
  const textures: Record<string, string> = {};
  for (const key of Object.keys(merged)) {
    const resolved = resolveTexture(merged[key]);
    if (resolved !== undefined) textures[key] = resolved;
  }
  const layers: string[] = [];
  if (generated) {
    for (let i = 0; i < 8; i++) {
      const texture = textures[`layer${String(i)}`];
      if (texture === undefined) break;
      layers.push(texture);
    }
  }
  return {
    layers: generated ? layers : undefined,
    elements: elements ?? [],
    textures,
    gui,
    light: light ?? (generated ? 'front' : 'side'),
  };
}

/** The textures a face uses, as a texture id. */
export function faceTexture(model: ResolvedModel, face: ModelFace): string | undefined {
  const reference = face.texture;
  if (reference.startsWith('#')) return model.textures[reference.slice(1)];
  return stripNamespace(reference);
}

/**
 * Picks the models an item definition shows with no player, world or time context
 * (`ItemModel` types): `model`, the false/fallback branch of `condition`, `select` and
 * `range_dispatch`, every part of a `composite`, and the base model of a `special` one.
 * Returns `undefined` while files load, `null` when nothing can be drawn.
 */
export function resolveItem(
  name: string,
  source: JsonSource,
): readonly ItemPart[] | undefined | null {
  const definition = source(`assets/minecraft/items/${name}.json`);
  if (definition === undefined) return undefined;
  if (!isRecord(definition)) return null;
  const parts: ItemPart[] = [];
  let pending = false;
  const visit = (node: unknown, depth: number): void => {
    if (!isRecord(node) || depth > 12) return;
    switch (stripNamespace(String(node['type']))) {
      case 'model': {
        const model = resolveModel(String(node['model']), source);
        if (model === undefined) pending = true;
        else if (model) parts.push({ model, tints: parseTints(node['tints']) });
        break;
      }
      case 'condition':
        visit(node['on_false'], depth + 1);
        break;
      case 'select':
      case 'range_dispatch': {
        if (node['fallback'] !== undefined) visit(node['fallback'], depth + 1);
        else {
          const first = (node['cases'] ?? node['entries']) as unknown;
          if (Array.isArray(first) && isRecord(first[0])) visit(first[0]['model'], depth + 1);
        }
        break;
      }
      case 'composite':
        if (Array.isArray(node['models']))
          for (const child of node['models']) visit(child, depth + 1);
        break;
      case 'special': {
        const model = resolveModel(String(node['base']), source);
        if (model === undefined) pending = true;
        else if (model) parts.push({ model, tints: [] });
        break;
      }
      default:
        break;
    }
  };
  visit(definition['model'], 0);
  if (pending) return undefined;
  return parts.length === 0 ? null : parts;
}

// ------------------------------------------------------------------------------------ projection

export interface ProjectedFace {
  readonly texture: string;
  /** Screen position of the face's top-left, top-right and bottom-left corners, in 16-unit slot space. */
  readonly origin: readonly [number, number];
  readonly u: readonly [number, number];
  readonly v: readonly [number, number];
  /** Texture coordinates (16-unit UV space) of the face's top-left, top-right and bottom-left corners. */
  readonly uvTl: readonly [number, number];
  readonly uvTr: readonly [number, number];
  readonly uvBl: readonly [number, number];
  readonly depth: number;
  /** 0..1 brightness from the GUI lights. */
  readonly shade: number;
  readonly tint: number | undefined;
}

const DEG = Math.PI / 180;

export function rotateAxis(point: Vec3, axis: 'x' | 'y' | 'z', angle: number): Vec3 {
  const c = Math.cos(angle * DEG);
  const s = Math.sin(angle * DEG);
  const [x, y, z] = point;
  if (axis === 'x') return [x, y * c - z * s, y * s + z * c];
  if (axis === 'y') return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

/** `Quaternionf#rotationXYZ`: the matrix is Rx·Ry·Rz, so a point turns about Z first, then Y, then X. */
function rotateXyz(point: Vec3, rotation: Vec3): Vec3 {
  return rotateAxis(
    rotateAxis(rotateAxis(point, 'z', rotation[2]), 'y', rotation[1]),
    'x',
    rotation[0],
  );
}

export interface FaceFrame {
  /** Face origin (top-left of the texture) in element-box terms: picks from/to per axis. */
  readonly origin: readonly [0 | 1, 0 | 1, 0 | 1];
  readonly u: readonly [number, number, number];
  readonly v: readonly [number, number, number];
  readonly normal: Vec3;
}

/** Corner `[x, y, z]` selectors (0 = from, 1 = to) and axes of each face, seen from outside. */
export const FACE_FRAMES: Readonly<Record<FaceName, FaceFrame>> = {
  north: { origin: [1, 1, 0], u: [-1, 0, 0], v: [0, -1, 0], normal: [0, 0, -1] },
  south: { origin: [0, 1, 1], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1] },
  west: { origin: [0, 1, 0], u: [0, 0, 1], v: [0, -1, 0], normal: [-1, 0, 0] },
  east: { origin: [1, 1, 1], u: [0, 0, -1], v: [0, -1, 0], normal: [1, 0, 0] },
  up: { origin: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], normal: [0, 1, 0] },
  down: { origin: [0, 0, 1], u: [1, 0, 0], v: [0, 0, -1], normal: [0, -1, 0] },
};

const LIGHT_A: Vec3 = normalize([0.2, 1, -0.7]);
const LIGHT_B: Vec3 = normalize([-0.2, 1, 0.7]);

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Rotates a face's uv corners the way `face.rotation` (0, 90, 180, 270) does. */
export function rotateUv(
  uv: readonly [number, number, number, number],
  rotation: number,
): { readonly tl: [number, number]; readonly tr: [number, number]; readonly bl: [number, number] } {
  const [u1, v1, u2, v2] = uv;
  const tl: [number, number] = [u1, v1];
  const tr: [number, number] = [u2, v1];
  const bl: [number, number] = [u1, v2];
  const br: [number, number] = [u2, v2];
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { tl: bl, tr: tl, bl: br };
    case 180:
      return { tl: br, tr: bl, bl: tr };
    case 270:
      return { tl: tr, tr: br, bl: tl };
    default:
      return { tl, tr, bl };
  }
}

function toSlot(p: Vec3): readonly [number, number] {
  return [8 + p[0] * 16, 8 - p[1] * 16];
}

/**
 * Projects a model's faces into the 16×16 slot with its `display.gui` transform (orthographic, camera
 * along +Z), dropping back faces and sorting the rest far to near. Each face of a box stays a
 * parallelogram, so it can be drawn with one affine texture transform.
 */
export function projectModel(
  model: ResolvedModel,
  tints: readonly (number | undefined)[],
): readonly ProjectedFace[] {
  const gui = model.gui ?? { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [1, 1, 1] };
  const toScreen = (point: Vec3): Vec3 => {
    const local: Vec3 = [(point[0] - 8) / 16, (point[1] - 8) / 16, (point[2] - 8) / 16];
    const scaled: Vec3 = [
      local[0] * gui.scale[0],
      local[1] * gui.scale[1],
      local[2] * gui.scale[2],
    ];
    const rotated = rotateXyz(scaled, gui.rotation);
    return [
      rotated[0] + gui.translation[0] / 16,
      rotated[1] + gui.translation[1] / 16,
      rotated[2] + gui.translation[2] / 16,
    ];
  };

  const faces: ProjectedFace[] = [];
  for (const element of model.elements) {
    const place = (point: Vec3): Vec3 => {
      let result = point;
      const rotation = element.rotation;
      if (rotation) {
        const origin = rotation.origin;
        const relative: Vec3 = [point[0] - origin[0], point[1] - origin[1], point[2] - origin[2]];
        const turned = rotateAxis(relative, rotation.axis, rotation.angle);
        result = [turned[0] + origin[0], turned[1] + origin[1], turned[2] + origin[2]];
      }
      return toScreen(result);
    };
    for (const name of Object.keys(element.faces) as FaceName[]) {
      const face = element.faces[name];
      if (!face) continue;
      const texture = faceTexture(model, face);
      if (texture === undefined) continue;
      const frame = FACE_FRAMES[name];
      const [fx, fy, fz] = element.from;
      const [tx, ty, tz] = element.to;
      const corner = (sel: readonly [number, number, number]): Vec3 => [
        sel[0] === 0 ? fx : tx,
        sel[1] === 0 ? fy : ty,
        sel[2] === 0 ? fz : tz,
      ];
      const size: Vec3 = [tx - fx, ty - fy, tz - fz];
      const o = corner(frame.origin);
      const extent = (axis: readonly [number, number, number]): Vec3 => [
        o[0] + axis[0] * Math.abs(axis[0]) * size[0],
        o[1] + axis[1] * Math.abs(axis[1]) * size[1],
        o[2] + axis[2] * Math.abs(axis[2]) * size[2],
      ];
      const p0 = place(o);
      const pu = place(extent(frame.u));
      const pv = place(extent(frame.v));
      const normal = rotateXyz(
        scaleNormal(rotateElementNormal(frame.normal, element.rotation), gui.scale),
        gui.rotation,
      );
      if (normal[2] <= 1e-6) continue;
      const ux = (pu[0] - p0[0]) * 16;
      const uy = -(pu[1] - p0[1]) * 16;
      const vx = (pv[0] - p0[0]) * 16;
      const vy = -(pv[1] - p0[1]) * 16;
      // A face seen edge-on (or from behind, for generated models) has no area.
      if (Math.abs(ux * vy - uy * vx) < 1e-4) continue;
      const slot0 = toSlot(p0);
      const uvDefault = defaultUv(name, element);
      const uv = rotateUv(face.uv ?? uvDefault, face.rotation ?? 0);
      const shade =
        model.light === 'front'
          ? 1
          : Math.min(
              1,
              0.4 + 0.6 * (Math.max(0, dot(normal, LIGHT_A)) + Math.max(0, dot(normal, LIGHT_B))),
            );
      faces.push({
        texture,
        origin: slot0,
        u: [ux, uy],
        v: [vx, vy],
        uvTl: uv.tl,
        uvTr: uv.tr,
        uvBl: uv.bl,
        depth: (p0[2] + pu[2] + pv[2] + (pu[2] + pv[2] - p0[2])) / 4,
        shade,
        tint: face.tintindex === undefined ? undefined : tints[face.tintindex],
      });
    }
  }
  return faces.toSorted((a, b) => a.depth - b.depth);
}

function scaleNormal(normal: Vec3, scale: Vec3): Vec3 {
  // Normals transform with the inverse scale; mirrored scales (negative) flip them.
  return normalize([
    normal[0] / (scale[0] || 1),
    normal[1] / (scale[1] || 1),
    normal[2] / (scale[2] || 1),
  ]);
}

export function rotateElementNormal(normal: Vec3, rotation: ModelElement['rotation']): Vec3 {
  return rotation ? rotateAxis(normal, rotation.axis, rotation.angle) : normal;
}

/** The uv a face gets when the model gives none (`BlockElementFace`/`FaceBakery#defaultFaceUV`). */
export function defaultUv(
  face: FaceName,
  element: ModelElement,
): readonly [number, number, number, number] {
  const [fx, fy, fz] = element.from;
  const [tx, ty, tz] = element.to;
  switch (face) {
    case 'down':
      return [fx, 16 - tz, tx, 16 - fz];
    case 'up':
      return [fx, fz, tx, tz];
    case 'north':
      return [16 - tx, 16 - ty, 16 - fx, 16 - fy];
    case 'south':
      return [fx, 16 - ty, tx, 16 - fy];
    case 'west':
      return [fz, 16 - ty, tz, 16 - fy];
    case 'east':
      return [16 - tz, 16 - ty, 16 - fz, 16 - fy];
  }
}
