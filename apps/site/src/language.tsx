import { TranslationProvider, parseLanguage, useToasts, type TranslationTable } from 'cobble-ui';
import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { BASE_LANGUAGE } from './languages.ts';
import { useSettings } from './settings.tsx';

/**
 * Mojang's asset index (where the game keeps its non-English language files) has no CORS headers, so
 * the browser cannot read it. This public jsDelivr mirror of the game assets does. The files are
 * downloaded at runtime when a language is picked and are never bundled with the site.
 */
const MIRROR =
  'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@26.3/assets/minecraft/lang';

const cache = new Map<string, TranslationTable>();
const NO_TRANSLATIONS: TranslationTable = {};

async function loadLanguage(code: string, signal: AbortSignal): Promise<TranslationTable> {
  const cached = cache.get(code);
  if (cached) return cached;
  const response = await fetch(`${MIRROR}/${code}.json`, { signal });
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
  const table = parseLanguage(await response.json());
  cache.set(code, table);
  return table;
}

/**
 * Applies the language chosen in the settings: the game's `en_us` strings stay underneath (as in
 * vanilla), and the selected language's strings are layered on top of them.
 */
export function LanguageProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const { settings, update } = useSettings();
  const toasts = useToasts();
  const code = settings.language;
  const [loaded, setLoaded] = useState<{ code: string; table: TranslationTable } | null>(null);
  useEffect(() => {
    document.documentElement.lang = code.split('_')[0] ?? 'en';
    if (code === BASE_LANGUAGE) return;
    const controller = new AbortController();
    loadLanguage(code, controller.signal).then(
      (table) => setLoaded({ code, table }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        toasts.show({
          title: 'Could not load the language',
          messages: [error instanceof Error ? error.message : 'Network error'],
        });
        update({ language: BASE_LANGUAGE });
      },
    );
    return () => controller.abort();
    // Only the language code should restart the download.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const table = loaded?.code === code ? loaded.table : NO_TRANSLATIONS;
  return <TranslationProvider translations={table}>{children}</TranslationProvider>;
}
