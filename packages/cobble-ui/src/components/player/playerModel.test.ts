import * as three from 'three';
import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../../render/blit.ts';
import { buildPlayerModel, posePlayer, toModernSkin } from './playerModel.ts';

function build(slim: boolean, overlay = true) {
  const root = new three.Group();
  const texture = new three.Texture();
  return { root, parts: buildPlayerModel(three, root, { slim, texture, overlay }) };
}

function width(group: three.Group): number {
  const box = new three.Box3().setFromObject(group.children[0] as three.Mesh);
  return box.max.x - box.min.x;
}

describe('buildPlayerModel', () => {
  it('has wide arms of 4 pixels and slim arms of 3', () => {
    expect(width(build(false).parts.rightArm)).toBeCloseTo(4);
    expect(width(build(true).parts.rightArm)).toBeCloseTo(3);
    expect(width(build(true).parts.leftArm)).toBeCloseTo(3);
  });

  it('adds an inflated overlay layer to every part, unless disabled', () => {
    const { parts } = build(false);
    for (const group of Object.values(parts)) expect(group.children).toHaveLength(2);
    const overlay = new three.Box3().setFromObject(parts.head.children[1] as three.Mesh);
    expect(overlay.max.x - overlay.min.x).toBeCloseTo(9);
    expect(build(false, false).parts.head.children).toHaveLength(1);
  });

  it('is 32 pixels tall and centred, with the right arm on -x', () => {
    const { root, parts } = build(false);
    root.updateMatrixWorld(true);
    const box = new three.Box3();
    for (const group of Object.values(parts)) box.expandByObject(group.children[0] as three.Mesh);
    expect(box.max.y).toBeCloseTo(16);
    expect(box.min.y).toBeCloseTo(-16);
    expect(parts.rightArm.position.x).toBeLessThan(0);
  });
});

describe('posePlayer', () => {
  it('stands still and swings opposite limbs when walking', () => {
    const { parts } = build(false);
    posePlayer(parts, 'standing', 1);
    expect(parts.rightArm.rotation.x).toBe(0);
    posePlayer(parts, 'walking', 0.1);
    expect(parts.rightArm.rotation.x).toBeCloseTo(-parts.leftArm.rotation.x);
    expect(parts.rightArm.rotation.x).not.toBe(0);
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
