import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import { useElementState, useGuiSize } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useTextureUrl } from '../../provider/hooks.ts';
import { ScrollArea, type ScrollAreaSlotProps } from '../scroll-area/ScrollArea.tsx';
import { SCROLLBAR_WIDTH } from '../scroll-area/scrolling.ts';
import { cx } from '../shared.ts';
import { TiledTexture } from '../texture/TiledTexture.tsx';

/** `OptionsList#getRowWidth`: two 150-unit widgets with a 10-unit gap. */
export const OPTIONS_LIST_ROW_WIDTH = 310;
/** Width of a half-width widget in a row. */
export const OPTIONS_LIST_SMALL_WIDTH = 150;
/** Gap between the two widgets of a row. */
export const OPTIONS_LIST_GAP = 10;
/** Height of one row: a 20-unit widget plus 5 units of spacing. */
export const OPTIONS_LIST_ITEM_HEIGHT = 25;

export interface OptionsListSlotProps extends ScrollAreaSlotProps {
  readonly topSeparator?: SlotProps<'div'>;
  readonly bottomSeparator?: SlotProps<'div'>;
}

export interface OptionsListOwnProps {
  readonly children?: ReactNode;
  /** Width of each row in GUI units. Defaults to 310. */
  readonly rowWidth?: number;
  /** Height of each row in GUI units. Defaults to 25. */
  readonly itemHeight?: number;
  /** Draw the header/footer separators above and below the list. Defaults to `true`. */
  readonly separators?: boolean;
  readonly slotProps?: OptionsListSlotProps;
}

export type OptionsListProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  OptionsListOwnProps
>;

/**
 * The scrolling list of the options screens (`OptionsList`): the menu list background, the
 * header and footer separators and rows of one or two widgets, centred in a 310-unit column.
 * Fill it with {@link OptionsListRow}s and {@link OptionsListHeader}s.
 */
export function OptionsList<E extends ElementType = 'div'>(
  props: OptionsListProps<E>,
): JSX.Element {
  const {
    as,
    children,
    rowWidth = OPTIONS_LIST_ROW_WIDTH,
    itemHeight = OPTIONS_LIST_ITEM_HEIGHT,
    separators = true,
    slotProps,
    className,
    style,
    ...rest
  } = props as OptionsListProps<'div'>;
  const { unit, inWorld } = useCobble();
  const [root, setRoot] = useElementState<HTMLElement>();
  const size = useGuiSize(root, unit);
  const width = size?.width ?? rowWidth;
  const height = size?.height ?? 0;
  const rowLeft = Math.trunc(width / 2) - Math.trunc(rowWidth / 2);
  const background = useTextureUrl(
    inWorld ? 'gui/inworld_menu_list_background' : 'gui/menu_list_background',
  );
  const separator = (kind: 'header' | 'footer'): string =>
    inWorld ? `gui/inworld_${kind}_separator` : `gui/${kind}_separator`;
  const viewportStyle: CssVariables = {
    '--cobble-tile-x': -(width % 32),
    '--cobble-tile-y': -(height % 32),
    backgroundImage: background === undefined ? undefined : `url("${background}")`,
    ...slotProps?.viewport?.style,
  };
  return (
    <ScrollArea
      {...rest}
      ref={setRoot}
      {...(as === undefined ? {} : { as })}
      className={cx('cobble-options-list', className)}
      style={
        {
          '--cobble-row-width': rowWidth,
          '--cobble-row-left': rowLeft,
          '--cobble-item-height': itemHeight,
          ...style,
        } as CssVariables
      }
      scrollRate={itemHeight / 2}
      scrollbarX={rowLeft + rowWidth + SCROLLBAR_WIDTH + 2}
      decorations={
        separators ? (
          <>
            <TiledTexture
              {...slotProps?.topSeparator}
              className={cx('cobble-selection-list-separator', slotProps?.topSeparator?.className)}
              data-position="top"
              texture={separator('header')}
              tileWidth={32}
              tileHeight={2}
            />
            <TiledTexture
              {...slotProps?.bottomSeparator}
              className={cx(
                'cobble-selection-list-separator',
                slotProps?.bottomSeparator?.className,
              )}
              data-position="bottom"
              texture={separator('footer')}
              tileWidth={32}
              tileHeight={2}
            />
          </>
        ) : null
      }
      slotProps={{
        ...slotProps,
        viewport: {
          ...slotProps?.viewport,
          className: cx('cobble-selection-list-viewport', slotProps?.viewport?.className),
          style: viewportStyle,
        },
        content: {
          ...slotProps?.content,
          className: cx('cobble-selection-list-content', slotProps?.content?.className),
        },
      }}
    >
      {children}
    </ScrollArea>
  );
}

export interface OptionsListRowOwnProps {
  /** One widget (give it `width={310}`) or two (`width={150}` each). */
  readonly children?: ReactNode;
}

export type OptionsListRowProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  OptionsListRowOwnProps
>;

/** A row of an {@link OptionsList}: one or two widgets side by side with a 10-unit gap. */
export function OptionsListRow<E extends ElementType = 'div'>(
  props: OptionsListRowProps<E>,
): JSX.Element {
  const { as, children, className, ...rest } = props as OptionsListRowProps<'div'>;
  const Component: ElementType = as ?? 'div';
  return (
    <Component {...mergeProps<'div'>({ className: cx('cobble-options-row', className) }, rest)}>
      {children}
    </Component>
  );
}

export interface OptionsListHeaderOwnProps {
  readonly children?: ReactNode;
}

export type OptionsListHeaderProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  OptionsListHeaderOwnProps
>;

/** A centred white heading between groups of options (`OptionsList#addHeader`). */
export function OptionsListHeader<E extends ElementType = 'div'>(
  props: OptionsListHeaderProps<E>,
): JSX.Element {
  const { as, children, className, ...rest } = props as OptionsListHeaderProps<'div'>;
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-options-header', 'cobble-text', className) },
        rest,
      )}
      role="heading"
      aria-level={2}
      data-shadow=""
    >
      {children}
    </Component>
  );
}
