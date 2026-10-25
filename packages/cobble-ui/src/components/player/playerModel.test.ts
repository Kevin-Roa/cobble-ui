import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../../render/blit.ts';
import { Node3D } from '../../render/model3d/engine.ts';
import {
  buildPlayerModel,
  detectSlim,
  normalizeCape,
  posePlayer,
  toModernSkin,
  type PlayerOverlay,
} from './playerModel.ts';

const SKIN: RgbaImage = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };

function build(slim: boolean, overlay: PlayerOverlay = true, cape?: RgbaImage) {
  const root = new Node3D();
  const rig = buildPlayerModel(root, { slim, texture: SKIN, overlay, cape });
  return { root, rig, parts: rig.parts };
}

/** Extent along x of the first (base) layer of a part. */
function width(node: Node3D, layer = 0): number {
  const xs = node.quads
    .slice(layer * 6, layer * 6 + 6)
    .flatMap((quad) => quad.corners.map((c) => c[0]));
  return Math.max(...xs) - Math.min(...xs);
}

describe('buildPlayerModel', () => {
  it('has wide arms of 4 pixels and slim arms of 3', () => {
    expect(width(build(false).parts.rightArm)).toBeCloseTo(4);
    expect(width(build(true).parts.rightArm)).toBeCloseTo(3);
    expect(width(build(true).parts.leftArm)).toBeCloseTo(3);
  });

  it('adds an inflated overlay layer to every part, unless disabled', () => {
    const { parts } = build(false);
    for (const node of Object.values(parts)) expect(node.quads).toHaveLength(12);
    expect(width(parts.head, 1)).toBeCloseTo(9);
    expect(build(false, false).parts.head.quads).toHaveLength(6);
  });

  it('is 32 pixels tall and centred, with the right arm on -x', () => {
    const { parts } = build(false);
    let min = Infinity;
    let max = -Infinity;
    for (const node of Object.values(parts)) {
      for (const quad of node.quads.slice(0, 6)) {
        for (const corner of quad.corners) {
          min = Math.min(min, corner[1] + node.position[1]);
          max = Math.max(max, corner[1] + node.position[1]);
        }
      }
    }
    expect(max).toBeCloseTo(16);
    expect(min).toBeCloseTo(-16);
    expect(parts.rightArm.position[0]).toBeLessThan(0);
  });
});

describe('posePlayer', () => {
  it('stands still and swings opposite limbs when walking', () => {
    const { rig, parts } = build(false);
    posePlayer(rig, 'standing', 1);
    expect(parts.rightArm.rotation[0]).toBe(0);
    posePlayer(rig, 'walking', 0.1);
    expect(parts.rightArm.rotation[0]).toBeCloseTo(-parts.leftArm.rotation[0]);
    expect(parts.rightArm.rotation[0]).not.toBe(0);
  });
});

describe('overlay, cape and poses', () => {
  it('toggles each overlay layer on its own', () => {
    const { parts } = build(false, { hat: false, leftSleeve: false });
    expect(parts.head.quads).toHaveLength(6);
    expect(parts.leftArm.quads).toHaveLength(6);
    expect(parts.rightArm.quads).toHaveLength(12);
    expect(parts.body.quads).toHaveLength(12);
    expect(build(false, false).parts.body.quads).toHaveLength(6);
  });

  it('adds a cape behind the body only when given a texture', () => {
    expect(build(false).rig.cape).toBeUndefined();
    const cape = build(false, true, {
      width: 64,
      height: 32,
      data: new Uint8ClampedArray(64 * 32 * 4),
    }).rig.cape;
    expect(cape?.quads).toHaveLength(6);
    expect(cape?.position[2]).toBeLessThan(-2);
  });

  it('crouches, lies down to fly and resets between poses', () => {
    const { rig, parts } = build(false);
    posePlayer(rig, 'crouching', 0);
    expect(parts.body.rotation[0]).toBeCloseTo(0.5);
    expect(parts.rightLeg.position[2]).toBeCloseTo(-4);
    posePlayer(rig, 'flying', 0, 0.7);
    expect(rig.figure.rotation[0]).toBeCloseTo(Math.PI / 2);
    expect(rig.figure.scale).toBeCloseTo(0.7);
    expect(parts.body.rotation[0]).toBe(0);
    expect(parts.rightLeg.position[2]).toBeCloseTo(0);
    posePlayer(rig, 'swimming', 0.3);
    expect(parts.rightArm.rotation[0]).not.toBe(0);
    posePlayer(rig, 'standing', 0);
    expect(rig.figure.scale).toBe(1);
    expect(rig.figure.rotation).toEqual([0, 0, 0]);
  });
});

describe('detectSlim and normalizeCape', () => {
  it('finds slim arms by their transparent fourth column', () => {
    const data = new Uint8ClampedArray(64 * 64 * 4).fill(255);
    const wide: RgbaImage = { width: 64, height: 64, data };
    expect(detectSlim(wide)).toBe(false);
    expect(detectSlim(SKIN)).toBe(true);
  });

  it('brings legacy and HD capes to 64x32', () => {
    const legacy = normalizeCape({
      width: 22,
      height: 17,
      data: new Uint8ClampedArray(22 * 17 * 4),
    });
    expect([legacy?.width, legacy?.height]).toEqual([64, 32]);
    const hd = normalizeCape({ width: 128, height: 64, data: new Uint8ClampedArray(128 * 64 * 4) });
    expect([hd?.width, hd?.height]).toEqual([64, 32]);
    expect(
      normalizeCape({ width: 10, height: 10, data: new Uint8ClampedArray(400) }),
    ).toBeUndefined();
  });
});

describe('toModernSkin', () => {
  it('mirrors the right leg into the left leg of a 64x32 skin', () => {
    const data = new Uint8ClampedArray(64 * 32 * 4);
    // Right leg front column x = 4 at row 20 gets a marker.
    data.set([9, 8, 7, 255], (20 * 64 + 4) * 4);
    const modern = toModernSkin({ width: 64, height: 32, data });
    expect(modern.height).toBe(64);
    // The left leg front is at x = 20..24, row 52 (20 + 32), mirrored: 4 -> 20 + 3.
    const at = (52 * 64 + 23) * 4;
    expect([...modern.data.subarray(at, at + 4)]).toEqual([9, 8, 7, 255]);
    const full: RgbaImage = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
    expect(toModernSkin(full)).toBe(full);
  });
});
