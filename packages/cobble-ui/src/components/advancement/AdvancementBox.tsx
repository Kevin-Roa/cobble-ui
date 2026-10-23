import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Height of the advancement box sprites (`advancements/box_*`, `title_box`). */
export const ADVANCEMENT_BOX_HEIGHT = 26;

/** Which box sprite to draw: the lit/dark box of a hovered advancement, or the plain title box. */
export type AdvancementBoxKind = 'obtained' | 'unobtained' | 'title';

export function advancementBoxSprite(kind: AdvancementBoxKind): SpriteId {
  return kind === 'title' ? 'advancements/title_box' : `advancements/box_${kind}`;
}

export interface AdvancementBoxSlotProps {
  readonly sprite?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
}

export interface AdvancementBoxOwnProps {
  /** Content drawn over the box (title and description text). */
  readonly children?: ReactNode;
  readonly kind?: AdvancementBoxKind;
  /** Width in GUI units; the 200×26 sprite is nine-sliced with a 10-unit border. Defaults to 200. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 26. */
  readonly height?: number;
  readonly slotProps?: AdvancementBoxSlotProps;
}

export type AdvancementBoxProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  AdvancementBoxOwnProps
>;

/** The stretchable box behind an advancement's title and description (`advancements/box_*`, `title_box`). */
export function AdvancementBox<E extends ElementType = 'div'>(
  props: AdvancementBoxProps<E>,
): JSX.Element {
  const {
    as,
    children,
    kind = 'title',
    width = 200,
    height = ADVANCEMENT_BOX_HEIGHT,
    slotProps,
    className,
    style,
    ...rest
  } = props as AdvancementBoxProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-advancement-box', className), style: rootStyle },
        rest,
      )}
      data-kind={kind}
    >
      <Sprite
        {...slotProps?.sprite}
        sprite={advancementBoxSprite(kind)}
        width={width}
        height={height}
      />
      {children}
    </Component>
  );
}
