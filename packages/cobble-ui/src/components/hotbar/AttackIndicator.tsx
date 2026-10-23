import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of the attack indicator sprites. */
export const ATTACK_INDICATOR_SIZE = 18;

/**
 * Height of the filled part for an attack `strength` in `[0, 1]`: `(int)(strength * 19)`,
 * capped to the sprite. Rising from the bottom edge.
 */
export function attackIndicatorFill(strength: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(strength) ? strength : 0, 0), 1);
  return Math.min(ATTACK_INDICATOR_SIZE, Math.floor(clamped * (ATTACK_INDICATOR_SIZE + 1)));
}

export interface AttackIndicatorOwnProps {
  /** Charge of the next attack, 0 to 1. */
  readonly strength: number;
}

export type AttackIndicatorProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  AttackIndicatorOwnProps
>;

/**
 * The attack cooldown meter shown beside the hotbar when the attack indicator is set to
 * "hotbar" (`hud/hotbar_attack_indicator_*`, 18×18). The fill rule is an approximation of
 * the game's.
 */
export function AttackIndicator<E extends ElementType = 'div'>(
  props: AttackIndicatorProps<E>,
): JSX.Element {
  const { as, strength, className, style, ...rest } = props as AttackIndicatorProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = attackIndicatorFill(strength);
  const rootStyle: CssVariables = {
    '--cobble-width': ATTACK_INDICATOR_SIZE,
    '--cobble-height': ATTACK_INDICATOR_SIZE,
    '--cobble-clip-height': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-attack-indicator', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': 'Attack strength',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(strength, 0), 1) * 100),
        },
        rest,
      )}
    >
      <Sprite
        sprite="hud/hotbar_attack_indicator_background"
        width={ATTACK_INDICATOR_SIZE}
        height={ATTACK_INDICATOR_SIZE}
      />
      {fill > 0 ? (
        <span className="cobble-bottom-clip">
          <Sprite
            sprite="hud/hotbar_attack_indicator_progress"
            width={ATTACK_INDICATOR_SIZE}
            height={ATTACK_INDICATOR_SIZE}
            style={placeAt(0, fill - ATTACK_INDICATOR_SIZE)}
          />
        </span>
      ) : null}
    </Component>
  );
}
