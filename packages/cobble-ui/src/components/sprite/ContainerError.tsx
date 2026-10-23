import type { JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { Sprite, type SpriteProps } from './Sprite.tsx';

/** Which screen's red "cannot do this" mark to draw (`container/<kind>/error`). */
export type ContainerErrorKind = 'anvil' | 'cartography_table' | 'grindstone' | 'smithing' | 'loom';

interface ErrorSprite {
  readonly sprite: SpriteId;
  readonly width: number;
  readonly height: number;
}

const ERROR_SPRITES: Record<ContainerErrorKind, ErrorSprite> = {
  anvil: { sprite: 'container/anvil/error', width: 28, height: 21 },
  cartography_table: { sprite: 'container/cartography_table/error', width: 28, height: 21 },
  grindstone: { sprite: 'container/grindstone/error', width: 28, height: 21 },
  smithing: { sprite: 'container/smithing/error', width: 28, height: 21 },
  loom: { sprite: 'container/loom/error', width: 26, height: 26 },
};

/** Size of the error mark for a screen. */
export function containerErrorSize(kind: ContainerErrorKind): {
  readonly width: number;
  readonly height: number;
} {
  const { width, height } = ERROR_SPRITES[kind];
  return { width, height };
}

export interface ContainerErrorProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  readonly kind: ContainerErrorKind;
}

/**
 * The red cross shown over the arrow of an anvil, cartography table, grindstone, smithing table
 * or loom when the items in it cannot be combined. 28×21, or 26×26 for the loom.
 */
export function ContainerError(props: ContainerErrorProps): JSX.Element {
  const { kind, ...rest } = props;
  const { sprite, width, height } = ERROR_SPRITES[kind];
  return (
    <Sprite
      role="img"
      aria-hidden={undefined}
      aria-label="Error"
      {...rest}
      sprite={sprite}
      width={width}
      height={height}
      data-flow=""
    />
  );
}
