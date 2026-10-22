import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { useEffect, useRef, useState, type JSX, type ReactElement, type ReactNode } from 'react';
import { useElementState, useGuiSize } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';
import {
  belowOrAboveTooltipPosition,
  menuTooltipPosition,
  type GuiRect,
  type TooltipPlacement,
} from './positioners.ts';
import { TOOLTIP_INSET, TooltipPanel, type TooltipPanelSlotProps } from './TooltipPanel.tsx';

export interface TooltipSlotProps extends TooltipPanelSlotProps {
  /** The popup element (Base UI `Tooltip.Popup`, rendered as a `TooltipPanel`). */
  readonly popup?: SlotProps<'div'>;
}

export interface TooltipProps {
  /** The element that shows the tooltip when hovered or focused. Must accept a ref. */
  readonly children: ReactElement;
  /** Tooltip text. Wraps at `maxWidth`. */
  readonly content: ReactNode;
  /** Delay before showing, in milliseconds. Defaults to `0`, like widget tooltips. */
  readonly delay?: number;
  /** Wrap width in GUI units. Defaults to 170. */
  readonly maxWidth?: number;
  readonly tooltipStyle?: string;
  readonly disabled?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly slotProps?: TooltipSlotProps;
}

const ORIGIN = {
  getBoundingClientRect: (): DOMRect => new DOMRect(0, 0, 0, 0),
};
const NO_COLLISION_AVOIDANCE = { side: 'none', align: 'none', fallbackAxisSide: 'none' } as const;

function toGuiRect(rect: DOMRect, unit: number): GuiRect {
  return {
    left: Math.floor(rect.left / unit),
    top: Math.floor(rect.top / unit),
    width: Math.round(rect.width / unit),
    height: Math.round(rect.height / unit),
  };
}

/**
 * A widget tooltip (`WidgetTooltipHolder`). While hovered it follows the mouse
 * like `MenuTooltipPositioner`; when focused with the keyboard it sits below
 * (or above) the widget like `BelowOrAboveWidgetTooltipPositioner`.
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  const {
    children,
    content,
    delay = 0,
    maxWidth,
    tooltipStyle,
    disabled,
    open,
    defaultOpen,
    onOpenChange,
    slotProps,
  } = props;
  const { unit, portalContainer } = useCobble();
  const trigger = useRef<HTMLElement | null>(null);
  const mouse = useRef<{ x: number; y: number } | undefined>(undefined);
  const [byKeyboard, setByKeyboard] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const shown = open ?? isOpen;
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const [content_, setContentElement] = useElementState<HTMLDivElement>();
  const textSize = useGuiSize(content_, unit);
  const [placement, setPlacement] = useState<TooltipPlacement | undefined>(undefined);

  useEffect(() => {
    if (!shown) return undefined;
    const place = (): void => {
      const element = trigger.current;
      if (!element || !textSize) return;
      const screenWidth = Math.floor(window.innerWidth / unit);
      const screenHeight = Math.floor(window.innerHeight / unit);
      const widget = toGuiRect(element.getBoundingClientRect(), unit);
      const width = textSize.width;
      const height = textSize.height - 2;
      const point = mouse.current;
      setPlacement(
        byKeyboard || !point
          ? belowOrAboveTooltipPosition(screenWidth, screenHeight, width, height, widget)
          : menuTooltipPosition(screenWidth, screenHeight, point.x, point.y, width, height, widget),
      );
    };
    const onMove = (event: PointerEvent): void => {
      mouse.current = { x: Math.floor(event.clientX / unit), y: Math.floor(event.clientY / unit) };
      place();
    };
    place();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', place, true);
    };
  }, [shown, byKeyboard, textSize, unit]);

  const rootProps: Record<string, unknown> = {
    onOpenChange: (next: boolean, details: BaseTooltip.Root.ChangeEventDetails) => {
      setByKeyboard(next && details.reason === 'trigger-focus');
      if (open === undefined) setIsOpen(next);
      onOpenChange?.(next);
    },
    trackCursorAxis: 'none',
  };
  if (open !== undefined) rootProps['open'] = open;
  if (defaultOpen !== undefined) rootProps['defaultOpen'] = defaultOpen;
  if (disabled !== undefined) rootProps['disabled'] = disabled;

  const visiblePlacement = shown ? placement : undefined;
  const popupStyle: CssVariables = {
    ...slotProps?.popup?.style,
    visibility: visiblePlacement ? undefined : 'hidden',
  };
  if (visiblePlacement) {
    popupStyle['--cobble-x'] = visiblePlacement.x - TOOLTIP_INSET;
    popupStyle['--cobble-y'] = visiblePlacement.y - TOOLTIP_INSET;
  }

  return (
    <BaseTooltip.Root {...(rootProps as BaseTooltip.Root.Props)}>
      <BaseTooltip.Trigger
        delay={delay}
        closeDelay={0}
        render={children}
        ref={(element: HTMLElement | null) => {
          trigger.current = element;
        }}
        onPointerMove={(event) => {
          mouse.current = {
            x: Math.floor(event.clientX / unit),
            y: Math.floor(event.clientY / unit),
          };
        }}
        onPointerEnter={(event) => {
          mouse.current = {
            x: Math.floor(event.clientX / unit),
            y: Math.floor(event.clientY / unit),
          };
          setByKeyboard(false);
        }}
      />
      <BaseTooltip.Portal container={portalContainer}>
        <BaseTooltip.Positioner
          className="cobble-tooltip-positioner"
          anchor={ORIGIN}
          side="bottom"
          align="start"
          sideOffset={0}
          positionMethod="fixed"
          collisionAvoidance={NO_COLLISION_AVOIDANCE}
        >
          <BaseTooltip.Popup
            {...slotProps?.popup}
            ref={setPanel}
            className={cx('cobble-tooltip', slotProps?.popup?.className as string | undefined)}
            style={popupStyle}
            data-placed={panel && visiblePlacement ? '' : undefined}
            render={
              <TooltipPanel
                maxWidth={maxWidth ?? 170}
                {...(tooltipStyle === undefined ? {} : { tooltipStyle })}
                slotProps={{
                  ...slotProps,
                  content: { ...slotProps?.content, ref: setContentElement },
                }}
              />
            }
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
