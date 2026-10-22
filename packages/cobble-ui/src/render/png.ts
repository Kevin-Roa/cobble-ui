import { unzlibSync } from 'fflate';
import type { RgbaImage } from './blit.ts';

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    (((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/**
 * Decodes a (non-interlaced) PNG into exact, non-premultiplied RGBA.
 *
 * Browsers' image decoders premultiply alpha, which slightly alters
 * semi-transparent texels such as the tooltip background. Decoding ourselves
 * keeps every texel byte-identical to the file in the game jar.
 */
export function decodePng(bytes: Uint8Array): RgbaImage {
  for (let i = 0; i < SIGNATURE.length; i++) {
    if (bytes[i] !== SIGNATURE[i]) throw new Error('Not a PNG file');
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Uint8Array | undefined;
  let transparency: Uint8Array | undefined;
  const idat: Uint8Array[] = [];

  let offset = 8;
  while (offset < bytes.length) {
    const length = readU32(bytes, offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = readU32(data, 0);
      height = readU32(data, 4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
      interlace = data[12] ?? 0;
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      transparency = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (interlace !== 0) throw new Error('Interlaced PNGs are not supported');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (channels === undefined) throw new Error(`Unsupported PNG color type ${colorType}`);

  let compressedLength = 0;
  for (const chunk of idat) compressedLength += chunk.length;
  const compressed = new Uint8Array(compressedLength);
  let position = 0;
  for (const chunk of idat) {
    compressed.set(chunk, position);
    position += chunk.length;
  }
  const raw = unzlibSync(compressed);

  const bitsPerPixel = channels * bitDepth;
  const bytesPerPixel = Math.max(1, bitsPerPixel >> 3);
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const pixels = new Uint8Array(stride * height);
  let previous = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart] ?? 0;
    const line = raw.subarray(rowStart + 1, rowStart + 1 + stride);
    const current = pixels.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const value = line[x] ?? 0;
      const left = x >= bytesPerPixel ? (current[x - bytesPerPixel] ?? 0) : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= bytesPerPixel ? (previous[x - bytesPerPixel] ?? 0) : 0;
      switch (filter) {
        case 0:
          current[x] = value;
          break;
        case 1:
          current[x] = value + left;
          break;
        case 2:
          current[x] = value + up;
          break;
        case 3:
          current[x] = value + ((left + up) >> 1);
          break;
        case 4:
          current[x] = value + paeth(left, up, upLeft);
          break;
        default:
          throw new Error(`Invalid PNG filter type ${filter}`);
      }
    }
    previous = current;
  }

  const out = new Uint8ClampedArray(width * height * 4);
  const maxValue = (1 << bitDepth) - 1;
  const sample = (row: number, index: number): number => {
    const base = row * stride;
    if (bitDepth === 8) return pixels[base + index] ?? 0;
    if (bitDepth === 16) return pixels[base + index * 2] ?? 0;
    const bit = index * bitDepth;
    const byte = pixels[base + (bit >> 3)] ?? 0;
    return (byte >> (8 - bitDepth - (bit & 7))) & maxValue;
  };
  const scale = (value: number): number =>
    bitDepth >= 8 ? value : Math.round((value * 255) / maxValue);
  const rawSample = (row: number, index: number): number => {
    if (bitDepth === 16) {
      const base = row * stride + index * 2;
      return ((pixels[base] ?? 0) << 8) | (pixels[base + 1] ?? 0);
    }
    return sample(row, index);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const i = x * channels;
      switch (colorType) {
        case 0: {
          const g = scale(sample(y, i));
          const key = transparency ? readU16(transparency, 0) : -1;
          out[o] = g;
          out[o + 1] = g;
          out[o + 2] = g;
          out[o + 3] = rawSample(y, i) === key ? 0 : 255;
          break;
        }
        case 2: {
          const r = rawSample(y, i);
          const g = rawSample(y, i + 1);
          const b = rawSample(y, i + 2);
          out[o] = sample(y, i);
          out[o + 1] = sample(y, i + 1);
          out[o + 2] = sample(y, i + 2);
          const keyed =
            transparency !== undefined &&
            r === readU16(transparency, 0) &&
            g === readU16(transparency, 2) &&
            b === readU16(transparency, 4);
          out[o + 3] = keyed ? 0 : 255;
          break;
        }
        case 3: {
          const index = sample(y, i);
          out[o] = palette?.[index * 3] ?? 0;
          out[o + 1] = palette?.[index * 3 + 1] ?? 0;
          out[o + 2] = palette?.[index * 3 + 2] ?? 0;
          out[o + 3] = transparency?.[index] ?? 255;
          break;
        }
        case 4: {
          const g = scale(sample(y, i));
          out[o] = g;
          out[o + 1] = g;
          out[o + 2] = g;
          out[o + 3] = scale(sample(y, i + 1));
          break;
        }
        case 6:
          out[o] = sample(y, i);
          out[o + 1] = sample(y, i + 1);
          out[o + 2] = sample(y, i + 2);
          out[o + 3] = sample(y, i + 3);
          break;
      }
    }
  }

  return { width, height, data: out };
}

function readU16(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}
