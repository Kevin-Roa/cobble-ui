import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { JSX, ReactNode } from 'react';
import { useElementState, useGuiSize } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';
import { LinearLayout } from '../layout/Layouts.tsx';
import { Sprite } from '../sprite/Sprite.tsx';

/** Width of the popup panel, in GUI units. */
export const DIALOG_WIDTH = 250;
/** Padding between the panel edge and its contents, in GUI units. */
export const DIALOG_PADDING = 18;

/** Gap between the action buttons, in GUI units (`ConfirmScreen` places its buttons 4 apart). */
export const DIALOG_ACTION_GAP = 4;

export interface DialogSlotProps {
  /** The dimmed backdrop behind the panel. */
  readonly backdrop?: SlotProps<'div'>;
  /** The panel (Base UI `Dialog.Popup`). */
  readonly popup?: SlotProps<'div'>;
  /** The title text. */
  readonly title?: SlotProps<'h2'>;
  /** The element the children are rendered in. */
  readonly body?: SlotProps<'div'>;
  /** The row the `actions` are rendered in. */
  readonly actions?: SlotProps<'div'>;
}

export interface DialogProps {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Heading, drawn centred in white. */
  readonly title?: ReactNode;
  /** Contents, centred: usually the message. */
  readonly children?: ReactNode;
  /**
   * Buttons, laid out in one centred row that splits the panel width equally, with the gap
   * `ConfirmScreen` leaves between its buttons. They need no `width` of their own.
   */
  readonly actions?: ReactNode;
  /** Panel width in GUI units. Defaults to 250. */
  readonly width?: number;
  /** Closes when the backdrop is clicked. Vanilla popups only close through their buttons. */
  readonly dismissOnBackdrop?: boolean;
  readonly slotProps?: DialogSlotProps;
}

/**
 * A modal popup in the style of a `PopupScreen`: the screen is dimmed with the
 * menu gradient (`#c0101010` to `#d0101010`) and a `popup/background`
 * nine-slice panel is centred over it. Focus is trapped and Escape closes it
 * through Base UI's Dialog. The panel's padding is an approximation.
 */
export function Dialog(props: DialogProps): JSX.Element {
  const {
    open,
    defaultOpen,
    onOpenChange,
    title,
    children,
    actions,
    width = DIALOG_WIDTH,
    dismissOnBackdrop = false,
    slotProps,
  } = props;
  const { unit, portalContainer } = useCobble();
  const [panel, setPanel] = useElementState<HTMLDivElement>();
  const size = useGuiSize(panel, unit);

  const rootProps: Record<string, unknown> = {
    disablePointerDismissal: !dismissOnBackdrop,
  };
  if (open !== undefined) rootProps['open'] = open;
  if (defaultOpen !== undefined) rootProps['defaultOpen'] = defaultOpen;
  if (onOpenChange !== undefined) rootProps['onOpenChange'] = (next: boolean) => onOpenChange(next);

  const popupStyle: CssVariables = { '--cobble-width': width, ...slotProps?.popup?.style };
  return (
    <BaseDialog.Root {...(rootProps as BaseDialog.Root.Props)}>
      <BaseDialog.Portal container={portalContainer}>
        <BaseDialog.Backdrop
          {...slotProps?.backdrop}
          className={cx('cobble-dialog-backdrop', slotProps?.backdrop?.className as string)}
        />
        <BaseDialog.Popup
          {...slotProps?.popup}
          ref={setPanel}
          className={cx('cobble-dialog', slotProps?.popup?.className as string)}
          style={popupStyle}
        >
          <Sprite
            sprite="popup/background"
            width={size?.width ?? width}
            height={size?.height ?? 0}
            className="cobble-dialog-sprite"
          />
          {title === undefined ? null : (
            <BaseDialog.Title
              {...slotProps?.title}
              className={cx('cobble-dialog-title', 'cobble-text', slotProps?.title?.className)}
              data-shadow=""
            >
              {title}
            </BaseDialog.Title>
          )}
          <div
            {...slotProps?.body}
            className={cx('cobble-dialog-body', 'cobble-text', slotProps?.body?.className)}
            data-shadow=""
          >
            {children}
          </div>
          {actions === undefined ? null : (
            <LinearLayout
              orientation="horizontal"
              gap={DIALOG_ACTION_GAP}
              fill
              {...slotProps?.actions}
              className={cx('cobble-dialog-actions', slotProps?.actions?.className)}
            >
              {actions}
            </LinearLayout>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/** Closes the enclosing {@link Dialog} (Base UI `Dialog.Close`). */
export const DialogClose: typeof BaseDialog.Close = BaseDialog.Close;
