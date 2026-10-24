import type { RgbaImage } from '../../render/blit.ts';
import { toModernSkin } from './playerModel.ts';

/**
 * The hosts of the official Mojang API (https://minecraft.wiki/w/Mojang_API). Neither sends CORS
 * headers, so a browser can only reach them directly from a page that is allowed to (an extension,
 * Electron) or through a proxy; point these at one with {@link configureMojangApi}. The skin
 * images on `textures.minecraft.net` do allow cross-origin reads.
 */
export interface MojangApiEndpoints {
  /** Name to UUID: `GET <profiles>/minecraft/profile/lookup/name/<name>`. */
  readonly profiles: string;
  /** Skin and cape: `GET <session>/session/minecraft/profile/<uuid>`. */
  readonly session: string;
}

const OFFICIAL: MojangApiEndpoints = {
  profiles: 'https://api.mojang.com',
  session: 'https://sessionserver.mojang.com',
};

let endpoints = OFFICIAL;
const cache = new Map<string, Promise<ResolvedSkin | null>>();

/** Overrides the Mojang API hosts, for example with a same-origin proxy. Clears the skin cache. */
export function configureMojangApi(next: Partial<MojangApiEndpoints>): void {
  endpoints = { ...OFFICIAL, ...next };
  cache.clear();
}

/** A player's skin as read from the Mojang API. */
export interface ResolvedSkin {
  readonly image: RgbaImage;
  /** The skin has slim (Alex) arms (`metadata.model` is `slim`). */
  readonly slim: boolean;
}

const UUID = /^[0-9a-f]{32}$/i;

interface SessionProfile {
  readonly properties?: readonly { readonly name: string; readonly value: string }[];
}

interface TexturesPayload {
  readonly textures?: {
    readonly SKIN?: { readonly url: string; readonly metadata?: { readonly model?: string } };
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${String(response.status)}`);
  return (await response.json()) as T;
}

function loadImage(url: string): Promise<RgbaImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('no 2d context');
        context.drawImage(image, 0, 0);
        resolve(toModernSkin(context.getImageData(0, 0, canvas.width, canvas.height)));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('could not read the skin'));
      }
    });
    image.addEventListener('error', () => reject(new Error(`could not load ${url}`)));
    image.src = url;
  });
}

async function lookup(player: string): Promise<ResolvedSkin | null> {
  const trimmed = player.trim();
  const dashless = trimmed.replaceAll('-', '');
  let id = UUID.test(dashless) ? dashless : undefined;
  id ??= (
    await getJson<{ readonly id: string }>(
      `${endpoints.profiles}/minecraft/profile/lookup/name/${encodeURIComponent(trimmed)}`,
    )
  ).id;
  const profile = await getJson<SessionProfile>(
    `${endpoints.session}/session/minecraft/profile/${id}`,
  );
  const value = profile.properties?.find((property) => property.name === 'textures')?.value;
  if (value === undefined) return null;
  const skin = (JSON.parse(atob(value)) as TexturesPayload).textures?.SKIN;
  // A player without a custom skin has none; the caller shows the default skin.
  if (!skin) return null;
  const image = await loadImage(skin.url.replace(/^http:/, 'https:'));
  return { image, slim: skin.metadata?.model === 'slim' };
}

/**
 * Looks up a player (username or UUID) through the official Mojang API: name to UUID, then the
 * session server's `textures` property, then the skin PNG on `textures.minecraft.net`. Results are
 * cached per player; the promise rejects when the lookup fails and resolves to `null` when the
 * player has no custom skin.
 */
export function fetchMojangSkin(player: string): Promise<ResolvedSkin | null> {
  const key = player.trim().toLowerCase();
  let promise = cache.get(key);
  if (!promise) {
    promise = lookup(player);
    cache.set(key, promise);
    // A failed lookup (rate limit, offline) may be retried later.
    promise.catch(() => cache.delete(key));
  }
  return promise;
}
