export interface SoundVariant {
  readonly name: string;
  readonly volume?: number;
  readonly pitch?: number;
}

/** A vanilla UI sound event. */
export type UiSoundEvent =
  | 'ui.button.click'
  | 'ui.cartography_table.take_result'
  | 'ui.hud.bubble_pop'
  | 'ui.loom.select_pattern'
  | 'ui.loom.take_result'
  | 'ui.stonecutter.select_recipe'
  | 'ui.stonecutter.take_result'
  | 'ui.toast.challenge_complete'
  | 'ui.toast.in'
  | 'ui.toast.out';

/**
 * The user-interface sound events from the 26.3 `sounds.json`. The asset
 * server does not allow `sounds.json` to be read cross-origin, so the
 * event → file mapping is mirrored here (the audio itself is still streamed
 * from Mojang at runtime).
 */
export const UI_SOUND_EVENTS: Readonly<Record<UiSoundEvent, readonly SoundVariant[]>> = {
  'ui.button.click': [{ name: 'random/click_stereo' }],
  'ui.cartography_table.take_result': [
    { name: 'ui/cartography_table/drawmap1' },
    { name: 'ui/cartography_table/drawmap2' },
    { name: 'ui/cartography_table/drawmap3' },
  ],
  'ui.hud.bubble_pop': [{ name: 'ui/hud/hud_bubble' }],
  'ui.loom.select_pattern': [
    { name: 'ui/loom/select_pattern1' },
    { name: 'ui/loom/select_pattern2' },
    { name: 'ui/loom/select_pattern3' },
    { name: 'ui/loom/select_pattern4' },
    { name: 'ui/loom/select_pattern5' },
  ],
  'ui.loom.take_result': [
    { name: 'ui/loom/take_result1', volume: 0.5 },
    { name: 'ui/loom/take_result2', volume: 0.5 },
  ],
  'ui.stonecutter.select_recipe': [{ name: 'random/click' }],
  'ui.stonecutter.take_result': [
    { name: 'ui/stonecutter/cut1' },
    { name: 'ui/stonecutter/cut1', pitch: 0.92 },
    { name: 'ui/stonecutter/cut2' },
    { name: 'ui/stonecutter/cut2', pitch: 0.92 },
  ],
  'ui.toast.challenge_complete': [{ name: 'ui/toast/challenge_complete', volume: 0.6 }],
  'ui.toast.in': [{ name: 'ui/toast/in', volume: 0.4 }],
  'ui.toast.out': [{ name: 'ui/toast/out', volume: 0.4 }],
};

/** Volume `SimpleSoundInstance.forUI` uses when none is given. */
export const UI_SOUND_VOLUME = 0.25;

export interface PlaySoundOptions {
  /** Instance volume. Defaults to `0.25`, like `SimpleSoundInstance.forUI`. */
  readonly volume?: number;
  /** Pitch multiplier (0.5–2). Defaults to `1`. */
  readonly pitch?: number;
}

export interface SoundSettings {
  readonly enabled: boolean;
  /** Master volume, 0–1. */
  readonly master: number;
  /** Volume of the UI sound category, 0–1. */
  readonly ui: number;
}

function pick<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Plays UI sounds using `<audio>` elements pointed at the asset server. */
export class SoundPlayer {
  private readonly resolveUrl: (name: string) => string | undefined;
  private readonly getSettings: () => SoundSettings;

  constructor(resolveUrl: (name: string) => string | undefined, getSettings: () => SoundSettings) {
    this.resolveUrl = resolveUrl;
    this.getSettings = getSettings;
  }

  play(event: UiSoundEvent, options: PlaySoundOptions = {}): void {
    const settings = this.getSettings();
    if (!settings.enabled || typeof Audio === 'undefined') return;
    const variant = pick(UI_SOUND_EVENTS[event]);
    if (!variant) return;
    const url = this.resolveUrl(`minecraft/sounds/${variant.name}.ogg`);
    if (!url) return;

    const volume = clamp(
      (options.volume ?? UI_SOUND_VOLUME) * (variant.volume ?? 1) * settings.ui * settings.master,
      0,
      1,
    );
    if (volume <= 0) return;
    const audio = new Audio(url);
    audio.volume = volume;
    audio.preservesPitch = false;
    audio.playbackRate = clamp((options.pitch ?? 1) * (variant.pitch ?? 1), 0.5, 2);
    audio.play().catch(() => {
      // Autoplay restrictions or unsupported codecs: sounds are best-effort.
    });
  }
}
