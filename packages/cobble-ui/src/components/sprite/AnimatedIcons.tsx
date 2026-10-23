import type { JSX } from 'react';
import { AnimatedSprite, type AnimatedSpriteProps } from './AnimatedSprite.tsx';

type IconProps = Omit<
  AnimatedSpriteProps,
  'sprite' | 'frameWidth' | 'frameHeight' | 'frametime' | 'frames'
>;

/** Size of one frame of `icon/music_notes`. */
export const MUSIC_NOTES_SIZE = 16;

/** The bobbing notes beside the "now playing" toast (`icon/music_notes`); timing is read from its `.mcmeta`. */
export function MusicNotes(props: IconProps): JSX.Element {
  return <AnimatedSprite {...props} sprite="icon/music_notes" />;
}

/** Size of one frame of `icon/trial_available`. */
export const TRIAL_ICON_SIZE = 8;

/** The sparkling marker for an available trial realm (`icon/trial_available`); timing is read from its `.mcmeta`. */
export function TrialAvailableIcon(props: IconProps): JSX.Element {
  return <AnimatedSprite {...props} sprite="icon/trial_available" />;
}
