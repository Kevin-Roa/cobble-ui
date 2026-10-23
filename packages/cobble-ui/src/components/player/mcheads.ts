/** Base URL of the mc-heads.net API, which renders player skins from a username or UUID. */
export const MCHEADS_URL = 'https://mc-heads.net';

/** The renders mc-heads.net offers that Cobble UI uses. */
export type McHeadsRender = 'avatar' | 'head' | 'body' | 'player' | 'skin';

/**
 * The URL of a mc-heads.net render of `player` (a username or a UUID). Skins are downloaded by the
 * browser through `<img>`, never bundled. `size` is in device pixels (the API clamps it).
 */
export function mcHeadsUrl(render: McHeadsRender, player: string, size?: number): string {
  const base = `${MCHEADS_URL}/${render}/${encodeURIComponent(player.trim())}`;
  return size === undefined ? base : `${base}/${String(Math.max(Math.round(size), 1))}`;
}
