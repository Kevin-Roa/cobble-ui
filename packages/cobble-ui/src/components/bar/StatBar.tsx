import type { SpriteId } from '../../assets/sprite-id.ts';
import type { JSX } from 'react';
import type { CssVariables } from '../../internal/polymorphic.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Width of the boss bar and experience bar sprites. */
export const STAT_BAR_WIDTH = 182;
/** Height of the boss bar and experience bar sprites. */
export const STAT_BAR_HEIGHT = 5;

/**
 * Filled width of a 182-wide bar: `Mth.lerpDiscrete(progress, 0, 182)`, which is
 * `(int)(progress * 183)` capped to the sprite (`BossHealthOverlay`, `Gui#extractExperienceBar`).
 */
export function statBarFill(progress: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.min(STAT_BAR_WIDTH, Math.floor(clamped * (STAT_BAR_WIDTH + 1)));
}

export interface StatBarLayers {
  /** Sprites drawn in full, bottom to top. */
  readonly background: readonly SpriteId[];
  /** Sprites drawn clipped to the filled width, bottom to top. */
  readonly progress: readonly SpriteId[];
}

/** Internal: stacked full-size background sprites plus progress sprites clipped to the fill. */
export function StatBarSprites(props: {
  readonly layers: StatBarLayers;
  readonly fill: number;
}): JSX.Element {
  const { layers, fill } = props;
  const clipStyle: CssVariables = { '--cobble-clip-width': fill };
  return (
    <>
      {layers.background.map((sprite) => (
        <Sprite key={sprite} sprite={sprite} width={STAT_BAR_WIDTH} height={STAT_BAR_HEIGHT} />
      ))}
      {fill > 0 ? (
        <span className="cobble-stat-bar-clip" style={clipStyle}>
          {layers.progress.map((sprite) => (
            <Sprite key={sprite} sprite={sprite} width={STAT_BAR_WIDTH} height={STAT_BAR_HEIGHT} />
          ))}
        </span>
      ) : null}
    </>
  );
}
