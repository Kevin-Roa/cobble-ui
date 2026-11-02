import { useState, type ElementType, type JSX, type MouseEvent } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

type SocialButtonOwnProps = Omit<ButtonOwnProps, 'icon' | 'sprites' | 'children'>;

/** Sprites of the mute toggle: `social_interactions/mute_button` while audible, `unmute_button` while muted. */
export function muteButtonSprites(muted: boolean): WidgetSprites {
  const base = muted ? 'social_interactions/unmute_button' : 'social_interactions/mute_button';
  return { enabled: base, enabledFocused: `${base}_highlighted` };
}

/** `social_interactions/report_button` sprites. */
export const REPORT_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'social_interactions/report_button',
  disabled: 'social_interactions/report_button_disabled',
  enabledFocused: 'social_interactions/report_button_highlighted',
};

export interface MuteButtonOwnProps extends SocialButtonOwnProps {
  readonly muted?: boolean;
  readonly defaultMuted?: boolean;
  readonly onMutedChange?: (muted: boolean) => void;
}

export type MuteButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  MuteButtonOwnProps
>;

/**
 * The speaker toggle beside a player in the social interactions screen. It shows the
 * action it will perform: a muted player has the "unmute" icon. 20×20.
 */
export function MuteButton<E extends ElementType = 'button'>(
  props: MuteButtonProps<E>,
): JSX.Element {
  const {
    muted,
    defaultMuted = false,
    onMutedChange,
    width = 20,
    height = 20,
    onClick,
    ...rest
  } = props as MuteButtonProps<'button'>;
  const { tOr } = useTranslation();
  const [uncontrolled, setUncontrolled] = useState(defaultMuted);
  const isMuted = muted ?? uncontrolled;
  return (
    <Button
      aria-label={
        isMuted ? tOr('cobble.social.unmute', 'Unmute') : tOr('cobble.social.mute', 'Mute')
      }
      {...rest}
      width={width}
      height={height}
      sprites={muteButtonSprites(isMuted)}
      aria-pressed={isMuted}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (muted === undefined) setUncontrolled(!isMuted);
        onMutedChange?.(!isMuted);
      }}
    />
  );
}

export interface ReportButtonOwnProps extends SocialButtonOwnProps {
  /** Accessible name. Defaults to `Report`. */
  readonly label?: string;
}

export type ReportButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  ReportButtonOwnProps
>;

/** The flag button that reports a player (`social_interactions/report_button`), 20×20. */
export function ReportButton<E extends ElementType = 'button'>(
  props: ReportButtonProps<E>,
): JSX.Element {
  const {
    label: labelProp,
    width = 20,
    height = 20,
    ...rest
  } = props as ReportButtonProps<'button'>;
  const { tOr } = useTranslation();
  const label = labelProp ?? tOr('cobble.social.report', 'Report');
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={REPORT_BUTTON_SPRITES}
    />
  );
}
