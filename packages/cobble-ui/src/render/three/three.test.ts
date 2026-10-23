import * as three from 'three';
import { describe, expect, it } from 'vitest';
import { boxUvLayout, createBoxGeometry, createTexture, followAngles } from './box.ts';

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

describe('createBoxGeometry', () => {
  const geometry = createBoxGeometry(three, {
    u: 0,
    v: 0,
    width: 16,
    height: 16,
    depth: 16,
    textureWidth: 64,
    textureHeight: 32,
    origin: [0, 0, 0],
  });

  it('has 24 vertices and 12 triangles', () => {
    expect(geometry.getAttribute('position').count).toBe(24);
    expect(geometry.getIndex()?.count).toBe(36);
  });

  it('puts the front face on the +z side with its UVs in image space', () => {
    const position = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    // Front face bottom-left corner (0, 0, 16) samples the bottom-left of the (16,16)-(32,32) rect.
    expect([position.getX(0), position.getY(0), position.getZ(0)]).toEqual([0, 0, 16]);
    expect([uv.getX(0), uv.getY(0)]).toEqual([16 / 64, 32 / 32]);
    expect([uv.getX(2), uv.getY(2)]).toEqual([32 / 64, 16 / 32]);
  });

  it('maps every face onto the whole texture with fullFaces', () => {
    const cube = createBoxGeometry(three, {
      u: 0,
      v: 0,
      width: 16,
      height: 16,
      depth: 16,
      textureWidth: 16,
      textureHeight: 16,
      fullFaces: true,
    });
    const uv = cube.getAttribute('uv');
    for (let face = 0; face < 6; face++) {
      expect([uv.getX(face * 4), uv.getY(face * 4)]).toEqual([0, 1]);
      expect([uv.getX(face * 4 + 2), uv.getY(face * 4 + 2)]).toEqual([1, 0]);
    }
  });

  it('grows with inflate', () => {
    const inflated = createBoxGeometry(three, {
      u: 0,
      v: 0,
      width: 2,
      height: 2,
      depth: 2,
      textureWidth: 16,
      textureHeight: 16,
      inflate: 0.5,
    });
    inflated.computeBoundingBox();
    expect(inflated.boundingBox?.getSize(new three.Vector3()).x).toBe(3);
  });
});

describe('createTexture', () => {
  it('samples with nearest filtering and no flip', () => {
    const texture = createTexture(three, {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([1, 2, 3, 4]),
    });
    expect(texture.magFilter).toBe(three.NearestFilter);
    expect(texture.minFilter).toBe(three.NearestFilter);
    expect(texture.flipY).toBe(false);
    expect(texture.generateMipmaps).toBe(false);
    expect(texture.colorSpace).toBe(three.SRGBColorSpace);
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
