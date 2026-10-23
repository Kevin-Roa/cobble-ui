import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { useElementState, useGuiSize, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/**
 * Nine-sliced sprites that work as a resizable panel behind content. Each is stretched to the
 * panel's size keeping its corners, using the border declared in the game's `.mcmeta`.
 */
export type PanelBackground = Extract<
  SpriteId,
  | 'popup/background'
  | 'social_interactions/background'
  | 'friends/background'
  | 'friends/background_dark'
  | 'friends/toast_background'
  | 'advancements/title_box'
  | 'tooltip/background'
  | 'widget/text_field'
  | 'widget/preedit'
  | 'recipe_book/overlay_recipe'
  | 'container/bundle/slot_background'
  | 'container/inventory/effect_background'
  | 'container/inventory/effect_background_ambient'
>;

/** Every panel background, in no particular order. */
export const PANEL_BACKGROUNDS: readonly PanelBackground[] = [
  'popup/background',
  'social_interactions/background',
  'friends/background',
  'friends/background_dark',
  'friends/toast_background',
  'advancements/title_box',
  'tooltip/background',
  'widget/text_field',
  'widget/preedit',
  'recipe_book/overlay_recipe',
  'container/bundle/slot_background',
  'container/inventory/effect_background',
  'container/inventory/effect_background_ambient',
];

export interface PanelSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
}

export interface PanelOwnProps {
  readonly children?: ReactNode;
  /** The sprite drawn behind the content. Defaults to `popup/background`. */
  readonly background?: PanelBackground;
  /** Fixed width in GUI units. Defaults to the content's width. */
  readonly width?: number;
  /** Fixed height in GUI units. Defaults to the content's height. */
  readonly height?: number;
  readonly slotProps?: PanelSlotProps;
}

export type PanelProps<E extends ElementType = 'div'> = PolymorphicProps<E, PanelOwnProps>;

/**
 * A box with one of the game's nine-sliced backgrounds behind its content. Size it with
 * `width`/`height`, or let the content decide and pad it with CSS: the background follows
 * the measured box.
 */
export function Panel<E extends ElementType = 'div'>(props: PanelProps<E>): JSX.Element {
  const {
    as,
    children,
    background = 'popup/background',
    width,
    height,
    slotProps,
    ref,
    className,
    style,
    ...rest
  } = props as PanelProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [element, setElement] = useElementState<HTMLElement>();
  const mergedRef = useMergedRefs<HTMLElement>(setElement, ref as never);
  const size = useGuiSize(element, unit);
  const rootStyle: CssVariables = { ...style };
  if (width !== undefined) rootStyle['--cobble-width'] = width;
  if (height !== undefined) rootStyle['--cobble-height'] = height;
  return (
    <Component
      {...mergeProps<'div'>({ className: cx('cobble-panel', className), style: rootStyle }, rest)}
      ref={mergedRef}
      data-background={background}
      data-fixed-width={width === undefined ? undefined : ''}
      data-fixed-height={height === undefined ? undefined : ''}
    >
      <Sprite
        {...slotProps?.background}
        sprite={background}
        width={width ?? size?.width ?? 0}
        height={height ?? size?.height ?? 0}
      />
      <div className="cobble-panel-content">{children}</div>
    </Component>
  );
}
