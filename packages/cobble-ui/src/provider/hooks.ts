import type { SpriteId } from '../assets/sprite-id.ts';
import { useCallback, useSyncExternalStore } from 'react';
import type { AssetState } from '../assets/store.ts';
import type { RgbaImage, Sprite } from '../render/blit.ts';
import type { PlaySoundOptions, UiSoundEvent } from '../sound/sounds.ts';
import { useCobble } from './context.ts';

function useStoreRevision(): number {
  const { store } = useCobble();
  return useSyncExternalStore(store.subscribe, store.getRevision, store.getRevision);
}

/** Loading state of the game assets, e.g. to show a progress bar. */
export function useAssets(): AssetState & { readonly reload: () => void } {
  const { store } = useCobble();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const reload = useCallback(() => store.reload(), [store]);
  return { ...state, reload };
}

/** A decoded GUI sprite (`widget/button`, `icon/accessibility`, …), once loaded. */
export function useSprite(id: SpriteId): Sprite | undefined {
  const { store } = useCobble();
  useStoreRevision();
  return store.getSprite(id);
}

/**
 * The natural size of a sprite in GUI units: the size declared by its
 * nine-slice/tile metadata, or the texture size for stretched sprites.
 */
export function useSpriteSize(
  id: SpriteId | undefined,
): { readonly width: number; readonly height: number } | undefined {
  const { store } = useCobble();
  useStoreRevision();
  const sprite = id === undefined ? undefined : store.getSprite(id);
  if (!sprite) return undefined;
  if (sprite.scaling.type === 'stretch')
    return { width: sprite.image.width, height: sprite.image.height };
  return { width: sprite.scaling.width, height: sprite.scaling.height };
}

/** A sprite composed at `width × height` GUI units for the current scale, once loaded. */
export function useComposedSprite(
  id: SpriteId | undefined,
  width: number,
  height: number,
): RgbaImage | undefined {
  const { store, deviceScale } = useCobble();
  useStoreRevision();
  if (id === undefined || width <= 0 || height <= 0) return undefined;
  return store.compose(id, width, height, deviceScale);
}

/** A decoded texture (`gui/menu_background`, …), once loaded. */
export function useTexture(id: string): RgbaImage | undefined {
  const { store } = useCobble();
  useStoreRevision();
  return store.getTexture(id);
}

/** A `blob:` URL for a texture from the client jar, once loaded. */
export function useTextureUrl(id: string): string | undefined {
  const { store } = useCobble();
  useStoreRevision();
  return store.getFileUrl(`assets/minecraft/textures/${id}.png`);
}

/** A URL for an asset index object (e.g. panorama images), once loaded. */
export function useObjectUrl(name: string): string | undefined {
  const { store } = useCobble();
  useStoreRevision();
  return store.getObjectUrl(name);
}

/** Returns a function that plays a UI sound event. */
export function useSound(): (event: UiSoundEvent, options?: PlaySoundOptions) => void {
  const { sound } = useCobble();
  return useCallback((event, options) => sound.play(event, options), [sound]);
}

/** The current GUI scale and the size of one GUI unit. */
export function useGuiScale(): {
  readonly guiScale: number;
  readonly unit: number;
  readonly deviceScale: number;
} {
  const { guiScale, unit, deviceScale } = useCobble();
  return { guiScale, unit, deviceScale };
}
