import { mergeProps } from '@base-ui/react/merge-props';
import { useEffect, type ElementType, type JSX, type ReactNode } from 'react';
import { useLatest } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { Text } from '../../text/Text.tsx';
import { cx } from '../shared.ts';
import { TiledTexture, type TiledTextureProps } from '../texture/TiledTexture.tsx';
import { Panorama, type PanoramaProps } from './Panorama.tsx';

/**
 * Standard deviation (device pixels) equivalent to the game's menu blur: three
 * separable box blurs of width `2r + 1` (`post/box_blur.fsh`, run three times).
 */
export function menuBlurSigma(radius: number): number {
  return Math.sqrt(radius * (radius + 1));
}

export type MenuBackgroundProps = Omit<TiledTextureProps, 'texture' | 'tileWidth' | 'tileHeight'>;

/** The tiled menu background (`Screen#extractMenuBackground`). */
export function MenuBackground(props: MenuBackgroundProps): JSX.Element {
  const { inWorld } = useCobble();
  const { className, ...rest } = props;
  return (
    <TiledTexture
      {...rest}
      className={cx('cobble-menu-background', className)}
      texture={inWorld ? 'gui/inworld_menu_background' : 'gui/menu_background'}
      tileWidth={32}
      tileHeight={32}
    />
  );
}

export type ScreenBackground = 'menu' | 'panorama' | 'transparent' | 'none';

export interface ScreenSlotProps {
  readonly panorama?: Partial<PanoramaProps>;
  /** The blur + menu background layer. */
  readonly background?: SlotProps<'div'>;
  /** The element children are rendered in. */
  readonly content?: SlotProps<'div'>;
}

export interface ScreenOwnProps {
  readonly children?: ReactNode;
  /**
   * - `"menu"` (default): the panorama (outside a world), blurred, under the
   *   menu background texture — every screen except the title screen.
   * - `"panorama"`: just the panorama, like the title screen.
   * - `"transparent"`: the dark gradient used by in-game screens.
   * - `"none"`: nothing.
   */
  readonly background?: ScreenBackground;
  /**
   * Called when Escape is pressed, like `Screen#onClose` (go back, or close the menu). Ignored while
   * a dialog is open, so Escape closes the topmost layer first, and when another handler has already
   * used the key.
   */
  readonly onClose?: () => void;
  readonly slotProps?: ScreenSlotProps;
}

export type ScreenProps<E extends ElementType = 'div'> = PolymorphicProps<E, ScreenOwnProps>;

/**
 * A full screen (`net.minecraft.client.gui.screens.Screen`). Fills its
 * container; put it in a full-viewport element for a real "screen".
 */
export function Screen<E extends ElementType = 'div'>(props: ScreenProps<E>): JSX.Element {
  const {
    as,
    children,
    background = 'menu',
    onClose,
    slotProps,
    className,
    style,
    ...rest
  } = props as ScreenProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { inWorld, menuBlur, unit, deviceScale } = useCobble();
  const closeHandler = useLatest(onClose);
  const closable = onClose !== undefined;
  useEffect(() => {
    if (!closable) return undefined;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      event.preventDefault();
      closeHandler.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closable, closeHandler]);
  const showPanorama = (background === 'menu' && !inWorld) || background === 'panorama';
  const dpr = deviceScale / unit;
  const blur = menuBlur >= 1 ? menuBlurSigma(Math.round(menuBlur)) / dpr : 0;

  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-screen', className), style: { ...style } as CssVariables },
        rest,
      )}
      data-background={background}
    >
      {showPanorama ? (
        <Panorama
          {...slotProps?.panorama}
          className={cx('cobble-screen-panorama', slotProps?.panorama?.className)}
        />
      ) : null}
      {background === 'menu' ? (
        <div
          {...slotProps?.background}
          className={cx('cobble-screen-background', slotProps?.background?.className)}
          style={
            {
              '--cobble-blur': `${String(blur)}px`,
              ...slotProps?.background?.style,
            } as CssVariables
          }
        >
          <MenuBackground className="cobble-screen-menu-background" />
        </div>
      ) : null}
      {background === 'transparent' ? (
        <div
          {...slotProps?.background}
          className={cx('cobble-screen-gradient', slotProps?.background?.className)}
        />
      ) : null}
      <div
        {...slotProps?.content}
        className={cx('cobble-screen-content', slotProps?.content?.className)}
      >
        {children}
      </div>
    </Component>
  );
}

/** `HeaderAndFooterLayout.DEFAULT_HEADER_AND_FOOTER_HEIGHT`. */
export const SCREEN_HEADER_HEIGHT = 33;

export interface ScreenLayoutSlotProps {
  readonly header?: SlotProps<'div'>;
  readonly title?: Omit<SlotProps<'h1'>, 'color'>;
  readonly content?: SlotProps<'div'>;
  readonly footer?: SlotProps<'div'>;
}

export interface ScreenLayoutOwnProps {
  /** The screen title, centred in the header (`addTitleHeader`). */
  readonly title?: ReactNode;
  /** Custom header content; replaces `title`. */
  readonly header?: ReactNode;
  /** Footer content, centred. Usually a row of buttons. */
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
  /** Header height in GUI units. Defaults to 33. */
  readonly headerHeight?: number;
  /** Footer height in GUI units. Defaults to 33. */
  readonly footerHeight?: number;
  /**
   * `"fill"` (default) stretches the content between header and footer (for
   * lists); `"top"` places it 30 units below the header, centred horizontally.
   */
  readonly contentLayout?: 'fill' | 'top';
  readonly slotProps?: ScreenLayoutSlotProps;
}

export type ScreenLayoutProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ScreenLayoutOwnProps
>;

/** A header, content and footer layout (`HeaderAndFooterLayout`). */
export function ScreenLayout<E extends ElementType = 'div'>(
  props: ScreenLayoutProps<E>,
): JSX.Element {
  const {
    as,
    title,
    header,
    footer,
    children,
    headerHeight = SCREEN_HEADER_HEIGHT,
    footerHeight = SCREEN_HEADER_HEIGHT,
    contentLayout = 'fill',
    slotProps,
    className,
    style,
    ...rest
  } = props as ScreenLayoutProps<'div'>;
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-screen-layout', className),
          style: {
            '--cobble-header-height': headerHeight,
            '--cobble-footer-height': footerHeight,
            ...style,
          } as CssVariables,
        },
        rest,
      )}
      data-content-layout={contentLayout}
    >
      <div
        {...slotProps?.header}
        className={cx('cobble-screen-layout-header', slotProps?.header?.className)}
      >
        {header ??
          (title === undefined ? null : (
            <Text
              as="h1"
              {...slotProps?.title}
              className={cx('cobble-screen-layout-title', slotProps?.title?.className)}
            >
              {title}
            </Text>
          ))}
      </div>
      <div
        {...slotProps?.content}
        className={cx('cobble-screen-layout-content', slotProps?.content?.className)}
      >
        {children}
      </div>
      <div
        {...slotProps?.footer}
        className={cx('cobble-screen-layout-footer', slotProps?.footer?.className)}
      >
        {footer}
      </div>
    </Component>
  );
}
