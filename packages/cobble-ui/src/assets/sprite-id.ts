import type { SpriteId } from './sprite-ids.ts';

export type { SpriteId } from './sprite-ids.ts';

/**
 * Treats `id` as a sprite id. Use it for sprites that are not part of the game's own GUI
 * sprites, such as ones supplied by a custom `AssetSource` or a resource pack. The id is not
 * checked.
 */
export function asSpriteId(id: string): SpriteId {
  return id as SpriteId;
}
