import { createContext, useContext, type Context } from 'react';
import type { AssetStore } from '../assets/store.ts';
import type { SoundPlayer, SoundSettings } from '../sound/sounds.ts';

export interface CobbleContextValue {
  readonly store: AssetStore;
  /** The integer GUI scale in effect (after resolving `"auto"`). */
  readonly guiScale: number;
  /** CSS pixels per GUI unit. */
  readonly unit: number;
  /** Device pixels per GUI unit. */
  readonly deviceScale: number;
  readonly inWorld: boolean;
  readonly menuBlur: number;
  readonly panoramaSpeed: number;
  readonly sound: SoundPlayer;
  readonly soundSettings: SoundSettings;
  readonly fontFamily: string;
  readonly portalContainer: HTMLElement | null;
  /** Raw settings, used by nested providers to inherit. */
  readonly settings: CobbleSettings;
}

export interface CobbleSettings {
  readonly guiScale: number | 'auto';
  readonly maxGuiScale: number;
  readonly pixelSnap: boolean;
  readonly inWorld: boolean;
  readonly menuBlur: number;
  readonly panoramaSpeed: number;
  readonly sound: SoundSettings;
  readonly fontFamily: string;
}

export const CobbleContext: Context<CobbleContextValue | null> =
  createContext<CobbleContextValue | null>(null);

/** Returns the nearest {@link CobbleProvider}'s configuration. */
export function useCobble(): CobbleContextValue {
  const value = useContext(CobbleContext);
  if (!value) {
    throw new Error('Cobble UI components must be rendered inside a <CobbleProvider>.');
  }
  return value;
}
