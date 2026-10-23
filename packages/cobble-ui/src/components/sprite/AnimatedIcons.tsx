import type { JSX } from 'react';
import {
  AnimatedSprite,
  type AnimatedSpriteProps,
  type AnimationFrame,
} from './AnimatedSprite.tsx';

type IconProps = Omit<
  AnimatedSpriteProps,
  'sprite' | 'frameWidth' | 'frameHeight' | 'frametime' | 'frames'
>;

/** Size of one frame of `icon/music_notes`. */
export const MUSIC_NOTES_SIZE = 16;

/** The bobbing notes beside the "now playing" toast (`icon/music_notes`, 16×16, 2 ticks a frame). */
export function MusicNotes(props: IconProps): JSX.Element {
  return (
    <AnimatedSprite
      {...props}
      sprite="icon/music_notes"
      frameWidth={MUSIC_NOTES_SIZE}
      frameHeight={MUSIC_NOTES_SIZE}
      frametime={2}
    />
  );
}

/** Size of one frame of `icon/trial_available`. */
export const TRIAL_ICON_SIZE = 8;

/** `.mcmeta` timing of `icon/trial_available`: a long rest, then a quick shine. */
const TRIAL_FRAMES: readonly AnimationFrame[] = [
  { index: 0, time: 10 },
  { index: 1, time: 2 },
  { index: 2, time: 2 },
  { index: 3, time: 2 },
  { index: 4, time: 2 },
  { index: 5, time: 2 },
];

/** The sparkling marker for an available trial realm (`icon/trial_available`, 8×8). */
export function TrialAvailableIcon(props: IconProps): JSX.Element {
  return (
    <AnimatedSprite
      {...props}
      sprite="icon/trial_available"
      frameWidth={TRIAL_ICON_SIZE}
      frameHeight={TRIAL_ICON_SIZE}
      frames={TRIAL_FRAMES}
    />
  );
}
