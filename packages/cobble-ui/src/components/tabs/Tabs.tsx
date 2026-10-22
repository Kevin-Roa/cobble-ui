import { mergeProps } from '@base-ui/react/merge-props';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ElementType,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useElementState, useGuiSize, useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useSound } from '../../provider/hooks.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { ScrollingText } from '../../text/ScrollingText.tsx';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { TiledTexture } from '../texture/TiledTexture.tsx';

/** `MenuTabBar.HEIGHT`. */
export const TAB_HEIGHT = 24;
const MAX_WIDTH = 400;
const MARGIN = 14;

/** `Mth.roundToward`: rounds up to a multiple. */
function roundToward(value: number, multiple: number): number {
  return Math.ceil(value / multiple) * multiple;
}

/** Tab layout of `MenuTabBar#arrangeElements`. */
export function arrangeTabs(barWidth: number, count: number): { tabWidth: number; x: number } {
  const tabsWidth = Math.min(MAX_WIDTH, barWidth) - 2 * MARGIN;
  const tabWidth = count === 0 ? 0 : roundToward(Math.trunc(tabsWidth / count), 2);
  const x = roundToward(Math.trunc((barWidth - tabsWidth) / 2), 2);
  return { tabWidth, x };
}

interface TabContextValue {
  readonly width: number;
}

const TabLayoutContext = createContext<TabContextValue>({ width: 0 });

export interface TabsOwnProps {
  readonly children?: ReactNode;
  readonly value?: BaseTabs.Tab.Value;
  readonly defaultValue?: BaseTabs.Tab.Value;
  readonly onValueChange?: (value: BaseTabs.Tab.Value) => void;
  /** Sound played when the tab changes, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
}

export type TabsProps<E extends ElementType = 'div'> = PolymorphicProps<E, TabsOwnProps>;

/** Ctrl+Tab / Ctrl+Shift+Tab and Ctrl+1…9 tab shortcuts (`TabNavigationBar#keyPressed`). */
function onTabShortcut(event: KeyboardEvent<HTMLElement>): void {
  if (!event.ctrlKey) return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
  );
  if (tabs.length === 0) return;
  const active = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  let index: number | undefined;
  if (event.key === 'Tab') {
    index = (active + (event.shiftKey ? -1 : 1) + tabs.length) % tabs.length;
  } else if (/^[1-9]$/.test(event.key)) {
    index = Math.min(Number(event.key), tabs.length) - 1;
  }
  if (index === undefined) return;
  event.preventDefault();
  tabs[index]?.click();
}

/**
 * A set of tabs (`TabNavigationBar` + `TabManager`). Ctrl+Tab / Ctrl+Shift+Tab
 * cycle tabs and Ctrl+1…9 jump to a tab, like the game.
 */
export function Tabs<E extends ElementType = 'div'>(props: TabsProps<E>): JSX.Element {
  const {
    as,
    children,
    value,
    defaultValue,
    onValueChange,
    sound = 'ui.button.click',
    className,
    ...rest
  } = props as TabsProps<'div'>;
  const play = useSound();
  const [uncontrolled, setUncontrolled] = useState<BaseTabs.Tab.Value>(defaultValue ?? null);
  const current = value === undefined ? uncontrolled : value;

  const change = (next: BaseTabs.Tab.Value): void => {
    if (next === current) return;
    if (sound !== false) play(sound);
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const rootProps: Record<string, unknown> = {
    value: current,
    onValueChange: (next: BaseTabs.Tab.Value) => change(next),
  };

  return (
    <BaseTabs.Root
      {...mergeProps<'div'>(
        { className: cx('cobble-tabs', className), onKeyDown: onTabShortcut },
        rest,
      )}
      {...(rootProps as BaseTabs.Root.Props)}
      render={
        as === undefined
          ? undefined
          : (renderProps) => {
              const Component: ElementType = as;
              return <Component {...renderProps} />;
            }
      }
    >
      {children}
    </BaseTabs.Root>
  );
}

export interface TabListSlotProps {
  /** Separator left of the first tab. */
  readonly startSeparator?: SlotProps<'div'>;
  /** Separator right of the last tab. */
  readonly endSeparator?: SlotProps<'div'>;
  /** The element the tabs are laid out in. */
  readonly tabs?: SlotProps<'div'>;
}

export interface TabListOwnProps {
  readonly children?: ReactNode;
  /** Width of the bar in GUI units; defaults to the element's measured width. */
  readonly width?: number;
  readonly slotProps?: TabListSlotProps;
}

export type TabListProps<E extends ElementType = 'div'> = PolymorphicProps<E, TabListOwnProps>;

/** The 24-unit-tall tab bar (`MenuTabBar`). Spans the full width it is given, like the screen. */
export function TabList<E extends ElementType = 'div'>(props: TabListProps<E>): JSX.Element {
  const { as, children, width, slotProps, className, style, ...rest } =
    props as TabListProps<'div'>;
  const { unit, inWorld } = useCobble();
  const [element, setElement] = useElementState<HTMLElement>();
  const measured = useGuiSize(element, unit);
  const barWidth = width ?? measured?.width ?? 0;
  const tabs = Children.toArray(children).filter(isValidElement);
  const { tabWidth, x } = arrangeTabs(barWidth, tabs.length);
  const end = x + tabWidth * tabs.length;
  const layout = useMemo(() => ({ width: tabWidth }), [tabWidth]);
  const separator = inWorld ? 'gui/inworld_header_separator' : 'gui/header_separator';

  const listStyle: CssVariables = { ...style };
  if (width !== undefined) listStyle['--cobble-tab-list-width'] = `${String(width * unit)}px`;

  return (
    <BaseTabs.List
      {...mergeProps<'div'>(
        { className: cx('cobble-tab-list', className), style: listStyle },
        rest,
      )}
      ref={setElement}
      render={
        as === undefined
          ? undefined
          : (renderProps) => {
              const Component: ElementType = as;
              return <Component {...renderProps} />;
            }
      }
    >
      <TiledTexture
        {...slotProps?.startSeparator}
        className={cx('cobble-tab-list-separator', slotProps?.startSeparator?.className)}
        texture={separator}
        tileWidth={32}
        tileHeight={2}
        style={
          { '--cobble-x': 0, '--cobble-w': x, ...slotProps?.startSeparator?.style } as CssVariables
        }
      />
      <TiledTexture
        {...slotProps?.endSeparator}
        className={cx('cobble-tab-list-separator', slotProps?.endSeparator?.className)}
        texture={separator}
        tileWidth={32}
        tileHeight={2}
        offsetX={end}
        style={
          {
            '--cobble-x': end,
            '--cobble-w': Math.max(0, barWidth - end),
            ...slotProps?.endSeparator?.style,
          } as CssVariables
        }
      />
      <div
        {...slotProps?.tabs}
        className={cx('cobble-tab-list-tabs', slotProps?.tabs?.className)}
        style={{ '--cobble-x': x, ...slotProps?.tabs?.style } as CssVariables}
      >
        <TabLayoutContext value={layout}>{tabs}</TabLayoutContext>
      </div>
    </BaseTabs.List>
  );
}

export interface TabSlotProps {
  readonly background?: SpriteSlotProps;
  /** Menu background drawn inside the selected tab. */
  readonly fill?: SlotProps<'div'>;
  readonly label?: SlotProps<'span'>;
  /** Line under the selected tab's label. */
  readonly underline?: SlotProps<'span'>;
}

export interface TabOwnProps {
  readonly value: BaseTabs.Tab.Value;
  readonly children?: ReactNode;
  readonly disabled?: boolean;
  readonly slotProps?: TabSlotProps;
}

export type TabProps<E extends ElementType = 'button'> = PolymorphicProps<E, TabOwnProps>;

/** A tab (`MenuTabBar.MenuTabButton`). */
export function Tab<E extends ElementType = 'button'>(props: TabProps<E>): JSX.Element {
  const {
    as,
    value,
    children,
    disabled = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as TabProps<'button'>;
  const { width } = useContext(TabLayoutContext);
  const [interaction, handlers] = useInteraction(false);
  const [lineWidth, setLineWidth] = useState(0);
  const highlighted = interaction.hovered || interaction.focused;

  return (
    <BaseTabs.Tab
      {...mergeProps<'button'>(
        {
          className: cx('cobble-tab', className),
          style: {
            '--cobble-width': width,
            '--cobble-height': TAB_HEIGHT,
            ...style,
          } as CssVariables,
          ...handlers,
        },
        rest,
      )}
      value={value}
      disabled={disabled}
      data-hovered={interaction.hovered ? '' : undefined}
      data-focused={interaction.focused ? '' : undefined}
      data-highlighted={highlighted ? '' : undefined}
      nativeButton={as === undefined || as === 'button'}
      render={(renderProps, state) => {
        const Component: ElementType = as ?? 'button';
        const selected = state.active;
        const sprite = selected
          ? highlighted
            ? 'widget/tab_selected_highlighted'
            : 'widget/tab_selected'
          : highlighted
            ? 'widget/tab_highlighted'
            : 'widget/tab';
        const underlineWidth = Math.min(lineWidth, width - 4);
        return (
          <Component {...renderProps} data-selected={selected ? '' : undefined}>
            <Sprite
              {...slotProps?.background}
              className={cx('cobble-tab-background', slotProps?.background?.className)}
              sprite={sprite}
              width={width}
              height={TAB_HEIGHT}
            />
            {selected ? (
              <TiledTexture
                {...slotProps?.fill}
                className={cx('cobble-tab-fill', slotProps?.fill?.className)}
                texture="gui/menu_background"
                tileWidth={32}
                tileHeight={32}
                style={{ '--cobble-w': width - 4, ...slotProps?.fill?.style } as CssVariables}
              />
            ) : null}
            {selected ? (
              <span
                {...slotProps?.underline}
                className={cx('cobble-tab-underline', slotProps?.underline?.className)}
                style={
                  {
                    '--cobble-x': Math.trunc((width - underlineWidth) / 2),
                    '--cobble-w': underlineWidth,
                    ...slotProps?.underline?.style,
                  } as CssVariables
                }
              />
            ) : null}
            <ScrollingText
              {...slotProps?.label}
              className={cx('cobble-tab-label', 'cobble-text', slotProps?.label?.className)}
              data-shadow=""
              left={1}
              right={width - 1}
              top={selected ? 0 : 3}
              bottom={TAB_HEIGHT}
              onLineWidthChange={setLineWidth}
            >
              {children}
            </ScrollingText>
          </Component>
        );
      }}
    />
  );
}

export interface TabPanelOwnProps {
  readonly value: BaseTabs.Tab.Value;
  readonly children?: ReactNode;
  /** Keep the panel mounted while hidden. */
  readonly keepMounted?: boolean;
}

export type TabPanelProps<E extends ElementType = 'div'> = PolymorphicProps<E, TabPanelOwnProps>;

/** The content shown for a tab. */
export function TabPanel<E extends ElementType = 'div'>(props: TabPanelProps<E>): JSX.Element {
  const { as, value, children, keepMounted, className, ...rest } = props as TabPanelProps<'div'>;
  return (
    <BaseTabs.Panel
      {...mergeProps<'div'>({ className: cx('cobble-tab-panel', className) }, rest)}
      value={value}
      {...(keepMounted === undefined ? {} : { keepMounted })}
      render={
        as === undefined
          ? undefined
          : (renderProps) => {
              const Component: ElementType = as;
              return <Component {...renderProps} />;
            }
      }
    >
      {children}
    </BaseTabs.Panel>
  );
}
