import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { MuteButton, ReportButton } from '../button/SocialButtons.tsx';
import { cx, placeAt } from '../shared.ts';
import { PlayerHead } from '../sprite/TextureIcons.tsx';

/** Default row width: the player list of `SocialInteractionsPlayerList` is 236 wide. */
export const SOCIAL_ENTRY_WIDTH = 236;
/** `PlayerEntry#ITEM_HEIGHT`-style row height. */
export const SOCIAL_ENTRY_HEIGHT = 36;
/** `PlayerEntry#PADDING`: space around the face and the buttons. */
export const SOCIAL_ENTRY_PADDING = 4;
/** `PlayerEntry#SKIN_SIZE`: the face is drawn 24×24. */
export const SOCIAL_ENTRY_SKIN_SIZE = 24;
/** Size of the chat-toggle and report buttons (`PlayerEntry#CHAT_TOGGLE_ICON_SIZE`). */
export const SOCIAL_ENTRY_BUTTON_SIZE = 20;
/** Left edge of the name: padding, face, padding. */
export const SOCIAL_ENTRY_NAME_X: number =
  SOCIAL_ENTRY_PADDING + SOCIAL_ENTRY_SKIN_SIZE + SOCIAL_ENTRY_PADDING;
/** Fill of a highlighted row (`PlayerEntry#BG_FILL`, ARGB 255/74/74/74). */
export const SOCIAL_ENTRY_HIGHLIGHT_COLOR = '#4a4a4a';

export interface SocialPlayerEntrySlotProps {
  readonly head?: SlotProps<'span'>;
  readonly name?: SlotProps<'span'>;
  readonly status?: SlotProps<'span'>;
}

export interface SocialPlayerEntryOwnProps {
  /** The player's name, drawn in white. */
  readonly name: string;
  /** A line under the name in gray, e.g. `Hidden` or `Blocked`. */
  readonly status?: ReactNode;
  /** The player's face, drawn in a 24×24 area. Defaults to the Steve skin's face. */
  readonly children?: ReactNode;
  readonly muted?: boolean;
  readonly onMutedChange?: (muted: boolean) => void;
  /** Called when the report button is clicked. Omit it to hide the button. */
  readonly onReport?: () => void;
  /** Draws the row in the lighter hovered/selected fill even without the pointer over it. */
  readonly highlighted?: boolean;
  /** Width in GUI units. Defaults to 236. */
  readonly width?: number;
  readonly slotProps?: SocialPlayerEntrySlotProps;
}

export type SocialPlayerEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SocialPlayerEntryOwnProps
>;

/**
 * A player row of the social interactions screen (`PlayerEntry`): a flat dark row that
 * lightens to `#4a4a4a` when hovered, a 24×24 face 4 units in, the white name with an optional
 * gray status line, and the chat-toggle and report buttons (20×20, 4 units apart) at the right,
 * vertically centred. There is no frame: the surrounding `SocialInteractionsPlayerList` panel
 * provides the border and the dark `#333` backdrop.
 */
export function SocialPlayerEntry<E extends ElementType = 'div'>(
  props: SocialPlayerEntryProps<E>,
): JSX.Element {
  const {
    as,
    name,
    status,
    children,
    muted,
    onMutedChange,
    onReport,
    highlighted = false,
    width = SOCIAL_ENTRY_WIDTH,
    slotProps,
    className,
    style,
    ...rest
  } = props as SocialPlayerEntryProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': SOCIAL_ENTRY_HEIGHT,
    ...style,
  };
  const buttonY = (SOCIAL_ENTRY_HEIGHT - SOCIAL_ENTRY_BUTTON_SIZE) / 2;
  // `PlayerEntry#extractContent`: the report button sits at the right padding, the chat
  // toggle one button and one padding further left.
  const reportX = width - SOCIAL_ENTRY_PADDING - SOCIAL_ENTRY_BUTTON_SIZE;
  const muteX =
    onReport === undefined ? reportX : reportX - SOCIAL_ENTRY_PADDING - SOCIAL_ENTRY_BUTTON_SIZE;
  const muteProps: Record<string, unknown> = {};
  if (muted !== undefined) muteProps['muted'] = muted;
  if (onMutedChange !== undefined) muteProps['onMutedChange'] = onMutedChange;
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-social-entry', className),
          style: rootStyle,
          ...(highlighted ? { 'data-highlighted': '' } : {}),
        },
        rest,
      )}
    >
      <span
        {...slotProps?.head}
        className={cx('cobble-social-entry-head', slotProps?.head?.className)}
        style={placeAt(
          SOCIAL_ENTRY_PADDING,
          (SOCIAL_ENTRY_HEIGHT - SOCIAL_ENTRY_SKIN_SIZE) / 2,
          slotProps?.head?.style,
        )}
      >
        {children ?? <PlayerHead flat size={24} player={name} />}
      </span>
      <span
        {...slotProps?.name}
        className={cx('cobble-social-entry-name', 'cobble-text', slotProps?.name?.className)}
        style={placeAt(SOCIAL_ENTRY_NAME_X, status === undefined ? 14 : 8, slotProps?.name?.style)}
        data-shadow=""
      >
        {name}
      </span>
      {status === undefined ? null : (
        <span
          {...slotProps?.status}
          className={cx('cobble-social-entry-status', 'cobble-text', slotProps?.status?.className)}
          style={placeAt(SOCIAL_ENTRY_NAME_X, 20, slotProps?.status?.style)}
          data-shadow=""
        >
          {status}
        </span>
      )}
      <MuteButton
        className="cobble-social-entry-button"
        style={placeAt(muteX, buttonY)}
        {...muteProps}
      />
      {onReport === undefined ? null : (
        <ReportButton
          className="cobble-social-entry-button"
          style={placeAt(reportX, buttonY)}
          onClick={onReport}
        />
      )}
    </Component>
  );
}
