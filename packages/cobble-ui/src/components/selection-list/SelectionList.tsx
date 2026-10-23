import { mergeProps } from '@base-ui/react/merge-props';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ElementType,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useElementState, useGuiSize } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useTextureUrl } from '../../provider/hooks.ts';
import { ScrollArea, type ScrollAreaSlotProps } from '../scroll-area/ScrollArea.tsx';
import { SCROLLBAR_WIDTH } from '../scroll-area/scrolling.ts';
import { cx } from '../shared.ts';
import { TiledTexture } from '../texture/TiledTexture.tsx';

/** `AbstractSelectionList.Entry.CONTENT_PADDING`. */
const CONTENT_PADDING = 2;
/** `AbstractSelectionList#getRowWidth`. */
export const SELECTION_LIST_ROW_WIDTH = 220;

interface SelectionListContextValue {
  readonly selected: string | null;
  readonly select: (value: string) => void;
  readonly activate: (value: string) => void;
  readonly listFocused: boolean;
  readonly itemHeight: number;
  readonly rowWidth: number;
  readonly rowLeft: number;
  readonly idPrefix: string;
}

const SelectionListContext = createContext<SelectionListContextValue | null>(null);

function useSelectionList(): SelectionListContextValue {
  const context = useContext(SelectionListContext);
  if (!context) throw new Error('<SelectionListItem> must be rendered inside a <SelectionList>.');
  return context;
}

export interface SelectionListSlotProps extends ScrollAreaSlotProps {
  readonly topSeparator?: SlotProps<'div'>;
  readonly bottomSeparator?: SlotProps<'div'>;
}

export interface SelectionListOwnProps {
  readonly children?: ReactNode;
  /** Value of the selected item. */
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  readonly onValueChange?: (value: string) => void;
  /** Called when an item is double-clicked or Enter is pressed (e.g. "Play Selected World"). */
  readonly onItemActivate?: (value: string) => void;
  /** Height of each item in GUI units, including padding. Defaults to 36 (the world list). */
  readonly itemHeight?: number;
  /** Width of each row in GUI units. Defaults to 220. */
  readonly rowWidth?: number;
  /** Draw the header/footer separators above and below the list. Defaults to `true`. */
  readonly separators?: boolean;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly slotProps?: SelectionListSlotProps;
}

export type SelectionListProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SelectionListOwnProps
>;

/**
 * A scrolling list of selectable rows (`ObjectSelectionList`), like the
 * world and server lists: centred rows, a white (focused) or grey selection
 * outline, the menu list background and header/footer separators.
 */
export function SelectionList<E extends ElementType = 'div'>(
  props: SelectionListProps<E>,
): JSX.Element {
  const {
    as,
    children,
    value,
    defaultValue = null,
    onValueChange,
    onItemActivate,
    itemHeight = 36,
    rowWidth = SELECTION_LIST_ROW_WIDTH,
    separators = true,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    slotProps,
    className,
    style,
    ...rest
  } = props as SelectionListProps<'div'>;
  const { unit, inWorld } = useCobble();
  const idPrefix = useId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue);
  const selected = value === undefined ? uncontrolled : value;
  const [listFocused, setListFocused] = useState(false);
  const [root, setRoot] = useElementState<HTMLElement>();
  const size = useGuiSize(root, unit);
  const width = size?.width ?? rowWidth;
  const height = size?.height ?? 0;
  const rowLeft = Math.trunc(width / 2) - Math.trunc(rowWidth / 2);
  const background = useTextureUrl(
    inWorld ? 'gui/inworld_menu_list_background' : 'gui/menu_list_background',
  );

  const select = useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolled(next);
      if (next !== selected) onValueChange?.(next);
    },
    [onValueChange, selected, value],
  );
  const activate = useCallback((item: string) => onItemActivate?.(item), [onItemActivate]);

  const context = useMemo<SelectionListContextValue>(
    () => ({ selected, select, activate, listFocused, itemHeight, rowWidth, rowLeft, idPrefix }),
    [selected, select, activate, listFocused, itemHeight, rowWidth, rowLeft, idPrefix],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const viewport = event.currentTarget;
    const options = Array.from(
      viewport.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'),
    );
    if (options.length === 0) return;
    const index = options.findIndex((option) => option.dataset['value'] === selected);
    let next: HTMLElement | undefined;
    if (event.key === 'ArrowDown')
      next = options[index < 0 ? 0 : Math.min(options.length - 1, index + 1)];
    else if (event.key === 'ArrowUp')
      next = options[index < 0 ? options.length - 1 : Math.max(0, index - 1)];
    else if (event.key === 'Home') next = options[0];
    else if (event.key === 'End') next = options.at(-1);
    else if (event.key === 'Enter' && selected !== null) {
      event.preventDefault();
      activate(selected);
      return;
    }
    if (!next) return;
    event.preventDefault();
    const nextValue = next.dataset['value'];
    if (nextValue !== undefined) select(nextValue);
    scrollToEntry(viewport, next, unit);
  };

  const separatorTexture = (kind: 'header' | 'footer'): string =>
    inWorld ? `gui/inworld_${kind}_separator` : `gui/${kind}_separator`;

  const viewportStyle: CssVariables = {
    '--cobble-tile-x': -(width % 32),
    '--cobble-tile-y': -(height % 32),
    backgroundImage: background === undefined ? undefined : `url("${background}")`,
    ...slotProps?.viewport?.style,
  };

  const activeId = selected === null ? undefined : `${idPrefix}-${selected}`;

  return (
    <SelectionListContext value={context}>
      <ScrollArea
        {...rest}
        ref={setRoot}
        {...(as === undefined ? {} : { as })}
        className={cx('cobble-selection-list', className)}
        style={
          { '--cobble-row-width': rowWidth, '--cobble-row-left': rowLeft, ...style } as CssVariables
        }
        scrollRate={itemHeight / 2}
        scrollbarX={rowLeft + rowWidth + SCROLLBAR_WIDTH + 2}
        data-focused={listFocused ? '' : undefined}
        decorations={
          separators ? (
            <>
              <TiledTexture
                {...slotProps?.topSeparator}
                className={cx(
                  'cobble-selection-list-separator',
                  slotProps?.topSeparator?.className,
                )}
                data-position="top"
                texture={separatorTexture('header')}
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
                texture={separatorTexture('footer')}
                tileWidth={32}
                tileHeight={2}
              />
            </>
          ) : null
        }
        slotProps={{
          ...slotProps,
          viewport: {
            role: 'listbox',
            tabIndex: 0,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            'aria-activedescendant': activeId,
            ...slotProps?.viewport,
            className: cx('cobble-selection-list-viewport', slotProps?.viewport?.className),
            style: viewportStyle,
            onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
              onKeyDown(event);
              slotProps?.viewport?.onKeyDown?.(event);
            },
            onFocus: (event) => {
              setListFocused(true);
              slotProps?.viewport?.onFocus?.(event);
            },
            onBlur: (event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setListFocused(false);
              slotProps?.viewport?.onBlur?.(event);
            },
          },
          content: {
            ...slotProps?.content,
            className: cx('cobble-selection-list-content', slotProps?.content?.className),
          },
        }}
      >
        {children}
      </ScrollArea>
    </SelectionListContext>
  );
}

/** `AbstractSelectionList#scrollToEntry`: keep 2 units between the entry and the edges. */
function scrollToEntry(viewport: HTMLElement, entry: HTMLElement, unit: number): void {
  const viewportRect = viewport.getBoundingClientRect();
  const entryRect = entry.getBoundingClientRect();
  const topDelta = (entryRect.top - viewportRect.top) / unit - CONTENT_PADDING;
  if (topDelta < 0) viewport.scrollTop += topDelta * unit;
  const bottomDelta = (viewportRect.bottom - entryRect.bottom) / unit - CONTENT_PADDING;
  if (bottomDelta < 0) viewport.scrollTop -= bottomDelta * unit;
}

export interface SelectionListItemState {
  readonly selected: boolean;
  readonly hovered: boolean;
}

export interface SelectionListItemOwnProps {
  readonly value: string;
  /** Item content, or a function of the item's state. */
  readonly children?: ReactNode | ((state: SelectionListItemState) => ReactNode);
  /** Height override in GUI units. */
  readonly height?: number;
  readonly disabled?: boolean;
  /** Slot for the 2-unit-padded content box (`Entry#getContentX/Y`). */
  readonly slotProps?: { readonly content?: SlotProps<'div'> };
}

export type SelectionListItemProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SelectionListItemOwnProps
>;

/** A row of a {@link SelectionList}. */
export function SelectionListItem<E extends ElementType = 'div'>(
  props: SelectionListItemProps<E>,
): JSX.Element {
  const {
    as,
    value,
    children,
    height,
    disabled = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as SelectionListItemProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const list = useSelectionList();
  const [hovered, setHovered] = useState(false);
  const selected = list.selected === value;
  const state: SelectionListItemState = { selected, hovered };

  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-selection-list-item', className),
          style: { '--cobble-height': height ?? list.itemHeight, ...style } as CssVariables,
          onPointerEnter: () => setHovered(true),
          onPointerLeave: () => setHovered(false),
          onClick: () => {
            if (!disabled) list.select(value);
          },
          onDoubleClick: () => {
            if (!disabled) list.activate(value);
          },
        },
        rest,
      )}
      id={`${list.idPrefix}-${value}`}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-value={value}
      data-selected={selected ? '' : undefined}
      data-hovered={hovered ? '' : undefined}
      data-list-focused={list.listFocused ? '' : undefined}
    >
      <div
        {...slotProps?.content}
        className={cx('cobble-selection-list-item-content', slotProps?.content?.className)}
      >
        {typeof children === 'function' ? children(state) : children}
      </div>
    </Component>
  );
}

export interface SelectionListGroupOwnProps {
  /** The heading shown above the group's rows. Not selectable. */
  readonly label: ReactNode;
  /** The group's `SelectionListItem`s. */
  readonly children?: ReactNode;
  /** Height of the heading row in GUI units. Defaults to the list's item height. */
  readonly headingHeight?: number;
  readonly slotProps?: { readonly heading?: SlotProps<'div'> };
}

export type SelectionListGroupProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SelectionListGroupOwnProps
>;

/**
 * A labelled run of rows in a {@link SelectionList}. The heading is a plain row that cannot be
 * selected or reached with the arrow keys, like the category entries in the game's option lists.
 */
export function SelectionListGroup<E extends ElementType = 'div'>(
  props: SelectionListGroupProps<E>,
): JSX.Element {
  const { as, label, children, headingHeight, slotProps, className, ...rest } =
    props as SelectionListGroupProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const list = useSelectionList();
  const headingId = useId();
  return (
    <Component
      {...mergeProps<'div'>({ className: cx('cobble-selection-list-group', className) }, rest)}
      role="group"
      aria-labelledby={headingId}
    >
      <div
        {...slotProps?.heading}
        id={headingId}
        className={cx('cobble-selection-list-heading', slotProps?.heading?.className)}
        style={
          {
            '--cobble-height': headingHeight ?? list.itemHeight,
            ...slotProps?.heading?.style,
          } as CssVariables
        }
      >
        {label}
      </div>
      {children}
    </Component>
  );
}
