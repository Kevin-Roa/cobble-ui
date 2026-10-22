import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';

export interface SiteSettings {
  readonly guiScale: number | 'auto';
  readonly sound: boolean;
  readonly volume: number;
  readonly menuBlur: number;
  readonly panoramaSpeed: number;
}

const DEFAULTS: SiteSettings = {
  guiScale: 2,
  sound: true,
  volume: 1,
  menuBlur: 5,
  panoramaSpeed: 1,
};
const STORAGE_KEY = 'cobble-ui-site-settings';

function load(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? DEFAULTS : { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SiteSettings>) };
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

export function SettingsProvider({ children }: { readonly children: ReactNode }): JSX.Element {
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

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside <SettingsProvider>');
  return value;
}
