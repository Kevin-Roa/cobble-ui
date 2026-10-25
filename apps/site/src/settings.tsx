import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from "react";

export interface SiteSettings {
  readonly guiScale: number | "auto";
  readonly sound: boolean;
  readonly volume: number;
  readonly menuBlur: number;
  readonly panoramaSpeed: number;
  readonly inWorld: boolean;
  /** Username or UUID the player docs examples render. */
  readonly defaultPlayer: string;
}

export const FALLBACK_PLAYER = "steve";
export const DEFAULT_PLAYER = "Technoblade";

const DEFAULTS: SiteSettings = {
  guiScale: 2,
  sound: true,
  volume: 1,
  menuBlur: 5,
  panoramaSpeed: 1,
  inWorld: false,
  defaultPlayer: DEFAULT_PLAYER,
};
const STORAGE_KEY = "cobble-ui-site-settings";

function load(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULTS;
    const merged = {
      ...DEFAULTS,
      ...(JSON.parse(raw) as Partial<SiteSettings>),
    };
    return typeof merged.defaultPlayer === "string"
      ? merged
      : { ...merged, defaultPlayer: DEFAULT_PLAYER };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  readonly settings: SiteSettings;
  readonly update: (patch: Partial<SiteSettings>) => void;
  readonly reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  const [settings, setSettings] = useState(load);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (patch) => setSettings((current) => ({ ...current, ...patch })),
      reset: () => setSettings(DEFAULTS),
    }),
    [settings],
  );
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

/** The player the docs examples render; an empty setting falls back to Steve. */
export function useDefaultPlayer(): string {
  const value = useSettings().settings.defaultPlayer;
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : FALLBACK_PLAYER;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
