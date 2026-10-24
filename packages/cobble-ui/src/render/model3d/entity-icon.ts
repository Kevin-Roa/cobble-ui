/**
 * Renders a code-drawn `special` item model (a head, the copper golem) into a slot-sized RGBA
 * image with the base model's `display.gui` transform and the GUI item lights. Pure: no canvas.
 */
import type { RgbaImage } from '../blit.ts';
import {
  guiLightShade,
  rotateAxis,
  type GuiTransform,
  type ItemPart,
  type Vec3,
} from '../item-model.ts';
import { bakeParts } from './model.ts';
import { bakeBlockEntity, type BlockEntitySpec } from './block-entity-models.ts';
import { bakeEntity, entityItemSpace, type EntitySpec } from './entity-models.ts';
import { Node3D, createRenderTarget, renderScene, type Quad } from './engine.ts';

const IDENTITY: GuiTransform = { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [1, 1, 1] };
/** Distance of the (almost orthographic) camera; the slot spans exactly one unit at this distance. */
const DISTANCE = 500;
const FOV = (2 * Math.atan(1 / (2 * DISTANCE)) * 180) / Math.PI;

function edge(p: Vec3, q: Vec3): Vec3 {
  return [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
}

/** `ItemTransform#apply`: scale, then rotate about Z, Y, X (`rotationXYZ`), then translate (in 1/16). */
export function guiPoint(point: Vec3, gui: GuiTransform): Vec3 {
  const scaled: Vec3 = [point[0] * gui.scale[0], point[1] * gui.scale[1], point[2] * gui.scale[2]];
  const r = rotateAxis(
    rotateAxis(rotateAxis(scaled, 'z', gui.rotation[2]), 'y', gui.rotation[1]),
    'x',
    gui.rotation[0],
  );
  return [
    r[0] + gui.translation[0] / 16,
    r[1] + gui.translation[1] / 16,
    r[2] + gui.translation[2] / 16,
  ];
}

/**
 * Moves baked quads (viewer space, y up) into slot space with the `display.gui` transform and
 * lights them by their normal after the GUI rotation (`flat` for `gui_light: front`).
 */
export function guiQuads(
  quads: readonly Quad[],
  gui: GuiTransform | undefined,
  flat = false,
): Quad[] {
  const transform = gui ?? IDENTITY;
  const rotationOnly: GuiTransform = { ...IDENTITY, rotation: transform.rotation };
  return quads.map((quad) => {
    const corners = quad.corners.map((corner) =>
      guiPoint(corner, transform),
    ) as unknown as Quad['corners'];
    const [a, b, , d] = quad.corners;
    const u = edge(a, b);
    const v = edge(a, d);
    const normal = guiPoint(
      [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]],
      rotationOnly,
    );
    const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
    const shade = flat
      ? 1
      : guiLightShade([normal[0] / length, normal[1] / length, normal[2] / length]);
    const tint = quad.color ?? [1, 1, 1];
    return { ...quad, corners, color: [shade * tint[0], shade * tint[1], shade * tint[2]] };
  });
}

/** The entity's quads in slot space (1 unit = the 16x16 slot, y up, +z toward the viewer), lit by the GUI lights. */
export function guiEntityQuads(
  spec: EntitySpec,
  texture: RgbaImage,
  gui: GuiTransform | undefined,
): Quad[] {
  // Bake with shade 1, move into the item's pre-display pose, then light by the normal after the
  // GUI rotation.
  const baked = bakeEntity(spec.model, texture, () => 1).map(
    (quad) =>
      ({
        ...quad,
        corners: quad.corners.map((corner) =>
          entityItemSpace(spec.model, corner),
        ) as unknown as Quad['corners'],
      }) satisfies Quad,
  );
  return guiQuads(baked, gui);
}

/**
 * A block-entity model's quads (chest, shulker box, banner, decorated pot, conduit, shield,
 * trident) in slot space. Same space and lighting as {@link guiEntityQuads}; `flat` is
 * `gui_light: front`. Parts whose texture is not loaded yet are skipped.
 */
export function guiBlockEntityQuads(
  spec: BlockEntitySpec,
  texture: (id: string) => RgbaImage | undefined,
  gui: GuiTransform | undefined,
  flat = false,
): Quad[] {
  return guiQuads(
    bakeBlockEntity(spec, texture, () => 1, 'gui'),
    gui,
    flat,
  );
}

/**
 * The quads of an element-model item part (`models/**.json` boxes, with the node's
 * `transformation`) in slot space: baked at full brightness, placed with the part's own
 * `display.gui` transform and lit by the GUI lights. Unlike a painter's algorithm over the
 * projected faces, the depth buffer of {@link renderScene} resolves concave models (shelves,
 * walls) and composites whose halves overlap on screen (beds).
 */
export function guiPartQuads(
  part: ItemPart,
  texture: (id: string) => RgbaImage | undefined,
): Quad[] {
  return guiQuads(
    bakeParts([part], { texture, fit: false, unshaded: true }),
    part.model.gui,
    part.model.light === 'front',
  );
}

/** Draws element-model item parts into a `size` x `size` pixel image (straight alpha). */
export function renderPartsIcon(
  parts: readonly ItemPart[],
  texture: (id: string) => RgbaImage | undefined,
  size: number,
): RgbaImage {
  return renderQuads(
    parts.flatMap((part) => guiPartQuads(part, texture)),
    size,
  );
}

/** Draws the entity into a `size` x `size` pixel image (straight alpha). */
export function renderEntityIcon(
  spec: EntitySpec,
  texture: RgbaImage,
  gui: GuiTransform | undefined,
  size: number,
): RgbaImage {
  return renderQuads(guiEntityQuads(spec, texture, gui), size);
}

/** Draws a block-entity model into a `size` x `size` pixel image (straight alpha). */
export function renderBlockEntityIcon(
  spec: BlockEntitySpec,
  texture: (id: string) => RgbaImage | undefined,
  gui: GuiTransform | undefined,
  size: number,
  flat = false,
): RgbaImage {
  return renderQuads(guiBlockEntityQuads(spec, texture, gui, flat), size);
}

function renderQuads(quads: readonly Quad[], size: number): RgbaImage {
  const root = new Node3D();
  root.addQuad(...quads);
  const target = createRenderTarget(size, size);
  renderScene(root, { position: [0, 0, DISTANCE], fov: FOV }, target);
  return { width: target.width, height: target.height, data: target.data };
}
