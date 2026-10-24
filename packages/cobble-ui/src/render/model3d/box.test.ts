import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../blit.ts';
import { boxUvLayout, createBoxQuads, followAngles } from './box.ts';

function image(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

describe('boxUvLayout', () => {
  it('unwraps like the player head at texOffs(0, 0)', () => {
    const layout = boxUvLayout({ u: 0, v: 0, width: 8, height: 8, depth: 8 });
    expect(layout.top).toEqual({ x0: 8, y0: 0, x1: 16, y1: 8 });
    expect(layout.bottom).toEqual({ x0: 16, y0: 0, x1: 24, y1: 8 });
    expect(layout.right).toEqual({ x0: 0, y0: 8, x1: 8, y1: 16 });
    expect(layout.front).toEqual({ x0: 8, y0: 8, x1: 16, y1: 16 });
    expect(layout.left).toEqual({ x0: 16, y0: 8, x1: 24, y1: 16 });
    expect(layout.back).toEqual({ x0: 24, y0: 8, x1: 32, y1: 16 });
  });

  it('uses depth for the sides of a limb', () => {
    const layout = boxUvLayout({ u: 40, v: 16, width: 4, height: 12, depth: 4 });
    expect(layout.front).toEqual({ x0: 44, y0: 20, x1: 48, y1: 32 });
    expect(layout.right).toEqual({ x0: 40, y0: 20, x1: 44, y1: 32 });
  });

  it('mirrors by flipping every face and swapping the sides', () => {
    const plain = boxUvLayout({ u: 0, v: 0, width: 4, height: 4, depth: 2 });
    const mirrored = boxUvLayout({ u: 0, v: 0, width: 4, height: 4, depth: 2, mirror: true });
    expect(mirrored.front).toEqual({ ...plain.front, x0: plain.front.x1, x1: plain.front.x0 });
    expect(mirrored.right).toEqual({ ...plain.left, x0: plain.left.x1, x1: plain.left.x0 });
  });
});

describe('createBoxQuads', () => {
  const quads = createBoxQuads({
    u: 0,
    v: 0,
    width: 16,
    height: 16,
    depth: 16,
    texture: image(64, 32),
    origin: [0, 0, 0],
  });

  it('has six lit faces', () => {
    expect(quads).toHaveLength(6);
    expect(quads.every((quad) => quad.lit)).toBe(true);
  });

  it('puts the front face on the +z side with its UVs in image space', () => {
    const front = quads[0];
    // Bottom-left corner (0, 0, 16) samples the bottom-left of the (16,16)-(32,32) rect.
    expect(front?.corners[0]).toEqual([0, 0, 16]);
    expect(front?.uvs[0]).toEqual([16 / 64, 32 / 32]);
    expect(front?.uvs[2]).toEqual([32 / 64, 16 / 32]);
  });

  it('maps every face onto the whole texture with fullFaces', () => {
    const cube = createBoxQuads({
      u: 0,
      v: 0,
      width: 16,
      height: 16,
      depth: 16,
      texture: image(16, 16),
      fullFaces: true,
    });
    for (const quad of cube) {
      expect(quad.uvs[0]).toEqual([0, 1]);
      expect(quad.uvs[2]).toEqual([1, 0]);
    }
  });

  it('grows with inflate', () => {
    const inflated = createBoxQuads({
      u: 0,
      v: 0,
      width: 2,
      height: 2,
      depth: 2,
      texture: image(16, 16),
      inflate: 0.5,
    });
    const xs = inflated.flatMap((quad) => quad.corners.map((corner) => corner[0]));
    expect(Math.max(...xs) - Math.min(...xs)).toBe(3);
  });
});

describe('followAngles', () => {
  it('is neutral at the centre and turns toward the cursor', () => {
    expect(followAngles(0, 0)).toEqual({ bodyYaw: 0, headYaw: 0, pitch: 0 });
    expect(followAngles(40, 0).bodyYaw).toBeCloseTo((Math.PI / 4) * 20 * (Math.PI / 180));
    expect(followAngles(-40, 0).bodyYaw).toBeLessThan(0);
    expect(followAngles(0, 40).pitch).toBeGreaterThan(0);
  });
});
