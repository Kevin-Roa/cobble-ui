import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { MuteButton } from '../button/SocialButtons.tsx';
import { ReportButton } from '../button/SocialButtons.tsx';
import { cx, placeAt } from '../shared.ts';
import { PlayerHead } from '../sprite/TextureIcons.tsx';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of the `social_interactions/background` sprite. */
export const SOCIAL_ENTRY_WIDTH = 236;
export const SOCIAL_ENTRY_HEIGHT = 34;
/** Gap between the sprite's border and the row's content. */
export const SOCIAL_ENTRY_CONTENT_INSET = 2;
/** Left edge of the name: the face (24 wide) and a 4 gap after the content's 4 inset. */
export const SOCIAL_ENTRY_NAME_X: number = SOCIAL_ENTRY_CONTENT_INSET + 4 + 24 + 4;

export interface SocialPlayerEntrySlotProps {
  readonly head?: SlotProps<'span'>;
  readonly name?: SlotProps<'span'>;
  readonly status?: SlotProps<'span'>;
}

export interface SocialPlayerEntryOwnProps {
  /** The player's name, drawn in white. */
  readonly name: ReactNode;
  /** A line under the name in gray, e.g. `Hidden` or `Blocked`. */
  readonly status?: ReactNode;
  /** The player's face, drawn in a 24×24 area. Defaults to the Steve skin's face. */
  readonly children?: ReactNode;
  readonly muted?: boolean;
  readonly onMutedChange?: (muted: boolean) => void;
  /** Called when the report button is clicked. Omit it to hide the button. */
  readonly onReport?: () => void;
  /** Width in GUI units. Defaults to 236. */
  readonly width?: number;
  readonly slotProps?: SocialPlayerEntrySlotProps;
}

export type SocialPlayerEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SocialPlayerEntryOwnProps
>;

/**
 * A player row of the social interactions screen: the 236×34 nine-sliced background, a 24×24
 * face, the name with an optional gray status line, and the mute and report buttons at the
 * right. The inner offsets are approximations of the game's.
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
  // The row's content area is inset 2 units from the sprite's border (`getContentX`/`getContentRight`),
  // with 4 more between it and the face and the buttons.
  const reportX = width - SOCIAL_ENTRY_CONTENT_INSET - 4 - 20;
  const muteX = onReport === undefined ? reportX : reportX - 24;
  const muteProps: Record<string, unknown> = {};
  if (muted !== undefined) muteProps['muted'] = muted;
  if (onMutedChange !== undefined) muteProps['onMutedChange'] = onMutedChange;
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-social-entry', className), style: rootStyle },
        rest,
      )}
    >
      <Sprite sprite="social_interactions/background" width={width} height={SOCIAL_ENTRY_HEIGHT} />
      <span
        {...slotProps?.head}
        className={cx('cobble-social-entry-head', slotProps?.head?.className)}
        style={placeAt(SOCIAL_ENTRY_CONTENT_INSET + 4, 5, slotProps?.head?.style)}
      >
        {children ?? <PlayerHead size={24} />}
      </span>
      <span
        {...slotProps?.name}
        className={cx('cobble-social-entry-name', 'cobble-text', slotProps?.name?.className)}
        style={placeAt(SOCIAL_ENTRY_NAME_X, status === undefined ? 12 : 8, slotProps?.name?.style)}
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
      <MuteButton className="cobble-social-entry-button" style={placeAt(muteX, 7)} {...muteProps} />
      {onReport === undefined ? null : (
        <ReportButton
          className="cobble-social-entry-button"
          style={placeAt(reportX, 7)}
          onClick={onReport}
        />
      )}
    </Component>
  );
}
