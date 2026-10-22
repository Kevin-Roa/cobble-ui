import { render, type RenderResult } from '@testing-library/react';
import { PNG } from 'pngjs';
import type { ReactElement } from 'react';
import { CobbleProvider, memoryAssets, type AssetSource } from '../src/index.ts';

/** Encodes an RGBA image as PNG bytes. */
export function png(
  width: number,
  height: number,
  pixel: (x: number, y: number) => readonly [number, number, number, number],
): Uint8Array {
  const image = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = (y * width + x) * 4;
      image.data[o] = r;
      image.data[o + 1] = g;
      image.data[o + 2] = b;
      image.data[o + 3] = a;
    }
  }
  return new Uint8Array(PNG.sync.write(image));
}

export function testAssets(): AssetSource {
  return memoryAssets({
    files: {
      'assets/minecraft/textures/gui/sprites/widget/button.png': png(200, 20, () => [
        128, 128, 128, 255,
      ]),
    },
    objects: { 'minecraft/sounds/random/click_stereo.ogg': 'https://example.invalid/click.ogg' },
  });
}

export function renderWithProvider(
  ui: ReactElement,
  options: { sound?: boolean } = {},
): RenderResult {
  return render(
    <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: options.sound ?? false }}>
      {ui}
    </CobbleProvider>,
  );
}
