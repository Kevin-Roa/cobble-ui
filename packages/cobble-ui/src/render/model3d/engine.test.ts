import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../blit.ts';
import { createBoxQuads } from './box.ts';
import { Node3D, type Quad, createRenderTarget, renderScene } from './engine.ts';

function solid(r: number, g: number, b: number, a = 255): RgbaImage {
  return { width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, a]) };
}

function pixel(target: ReturnType<typeof createRenderTarget>, x: number, y: number): number[] {
  const i = (y * target.width + x) * 4;
  return [...target.data.subarray(i, i + 4)];
}

function cube(texture: RgbaImage, lit = false): Node3D {
  const root = new Node3D();
  root.addQuad(
    ...createBoxQuads({ u: 0, v: 0, width: 2, height: 2, depth: 2, texture, fullFaces: true, lit }),
  );
  return root;
}

/** A 2 by 2 quad facing +z at depth `z`. */
function flatQuad(texture: RgbaImage, z = 0): Node3D {
  return new Node3D().addQuad({
    corners: [
      [-1, -1, z],
      [1, -1, z],
      [1, 1, z],
      [-1, 1, z],
    ],
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    texture,
  });
}

describe('renderScene', () => {
  it('draws the front of a cube in the middle and leaves the corners clear', () => {
    const target = createRenderTarget(32, 32);
    renderScene(cube(solid(200, 100, 50)), { position: [0, 0, 8] }, target);
    expect(pixel(target, 16, 16)).toEqual([200, 100, 50, 255]);
    expect(pixel(target, 0, 0)[3]).toBe(0);
  });

  it('multiplies by the quad colour and lights faces toward the light', () => {
    const lit = createRenderTarget(32, 32);
    renderScene(cube(solid(200, 200, 200), true), { position: [0, 0, 8] }, lit, {
      ambient: 0.5,
      diffuse: 0.5,
      direction: [0, 0, 1],
    });
    expect(pixel(lit, 16, 16)[0]).toBe(200);
    const dark = createRenderTarget(32, 32);
    renderScene(cube(solid(200, 200, 200), true), { position: [0, 0, 8] }, dark, {
      ambient: 0.5,
      diffuse: 0.5,
      direction: [0, 0, -1],
    });
    expect(pixel(dark, 16, 16)[0]).toBe(100);
  });

  it('culls back faces and honours the depth test', () => {
    const root = new Node3D();
    const back = new Node3D();
    back.position = [0, 0, -2];
    back.addQuad(
      ...createBoxQuads({
        u: 0,
        v: 0,
        width: 2,
        height: 2,
        depth: 2,
        texture: solid(0, 0, 255),
        fullFaces: true,
        lit: false,
      }),
    );
    root.add(back, cube(solid(255, 0, 0)));
    const target = createRenderTarget(32, 32);
    renderScene(root, { position: [0, 0, 8] }, target);
    expect(pixel(target, 16, 16)).toEqual([255, 0, 0, 255]);
  });

  it('turns with the node rotation', () => {
    const root = cube(solid(10, 20, 30));
    const target = createRenderTarget(32, 32);
    // A quarter turn around y shows the left side (+x) toward -z... the cube is symmetric, so it stays put.
    root.rotation = [0, Math.PI / 2, 0];
    renderScene(root, { position: [0, 0, 8] }, target);
    expect(pixel(target, 16, 16)).toEqual([10, 20, 30, 255]);
  });

  it('skips texels below the alpha test', () => {
    const root = new Node3D();
    root.addQuad(
      ...createBoxQuads({
        u: 0,
        v: 0,
        width: 2,
        height: 2,
        depth: 2,
        texture: solid(255, 255, 255, 40),
        fullFaces: true,
        lit: false,
        alphaTest: 0.5,
      }),
    );
    const target = createRenderTarget(16, 16);
    renderScene(root, { position: [0, 0, 8] }, target);
    expect(pixel(target, 8, 8)[3]).toBe(0);
  });

  it('samples textures without filtering', () => {
    const texture: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
    };
    const target = createRenderTarget(64, 64);
    renderScene(cube(texture), { position: [0, 0, 6] }, target);
    expect(pixel(target, 24, 32).slice(0, 3)).toEqual([255, 0, 0]);
    expect(pixel(target, 40, 32).slice(0, 3)).toEqual([0, 255, 0]);
  });

  it('lets the quad added last win at equal depth (coplanar faces)', () => {
    for (const order of [
      [solid(255, 0, 0), solid(0, 0, 255)],
      [solid(0, 0, 255), solid(255, 0, 0)],
    ] as const) {
      const root = new Node3D().add(flatQuad(order[0]), flatQuad(order[1]));
      const target = createRenderTarget(32, 32);
      renderScene(root, { position: [0, 0, 8] }, target);
      expect(pixel(target, 16, 16)).toEqual([...Array.from(order[1].data.subarray(0, 3)), 255]);
    }
  });

  it('keeps a nearer quad in front of a later, farther one', () => {
    const root = new Node3D().add(flatQuad(solid(255, 0, 0), 0.5), flatQuad(solid(0, 0, 255)));
    const target = createRenderTarget(32, 32);
    renderScene(root, { position: [0, 0, 8] }, target);
    expect(pixel(target, 16, 16)).toEqual([255, 0, 0, 255]);
  });
});

function firstQuad(root: Node3D): Quad {
  const quad = root.quads[0];
  if (!quad) throw new Error('no quad');
  return quad;
}

describe('translucent quads', () => {
  const camera = { position: [0, 0, 8] as [number, number, number] };

  it('blends over opaque quads instead of replacing them', () => {
    const root = new Node3D();
    root.addQuad(...flatQuad(solid(255, 0, 0), -1).quads);
    root.addQuad({ ...firstQuad(flatQuad(solid(0, 0, 255, 128))), translucent: true });
    const target = createRenderTarget(16, 16);
    renderScene(root, camera, target);
    const [r, g, b, a] = pixel(target, 8, 8) as [number, number, number, number];
    expect(a).toBe(255);
    expect(g).toBe(0);
    expect(r).toBeGreaterThan(100);
    expect(r).toBeLessThan(160);
    expect(b).toBeGreaterThan(100);
    expect(b).toBeLessThan(160);
  });

  it('draws translucent quads after opaque ones regardless of insertion order', () => {
    const root = new Node3D();
    root.addQuad({ ...firstQuad(flatQuad(solid(0, 0, 255, 128))), translucent: true });
    root.addQuad(...flatQuad(solid(255, 0, 0), -1).quads);
    const target = createRenderTarget(16, 16);
    renderScene(root, camera, target);
    expect(pixel(target, 8, 8)[2]).toBeGreaterThan(100);
  });

  it('sorts back to front and keeps back faces visible', () => {
    const front = { ...firstQuad(flatQuad(solid(0, 255, 0, 128), 1)), translucent: true };
    const back = { ...firstQuad(flatQuad(solid(255, 0, 0, 128), -1)), translucent: true };
    const render = (quads: (typeof front)[]): number[] => {
      const root = new Node3D().addQuad(...quads);
      const target = createRenderTarget(16, 16);
      renderScene(root, camera, target);
      return pixel(target, 8, 8);
    };
    const a = render([front, back]);
    const b = render([back, front]);
    expect(a).toEqual(b);
    // The near (green) quad is blended on top of the far (red) one.
    expect(a[1]).toBeGreaterThan(a[0] as number);
    expect(a[0]).toBeGreaterThan(0);
    expect(a[3]).toBeGreaterThan(128);

    // A translucent quad facing away is still drawn (no culling).
    const away = {
      ...front,
      corners: [front.corners[1], front.corners[0], front.corners[3], front.corners[2]],
    } as typeof front;
    expect(render([away])[3]).toBe(128);
  });
});
