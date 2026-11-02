import 'cobble-ui/styles.css';
import './site.css';
import {
  AssetLoadingOverlay,
  CobbleProvider,
  ToastProvider,
  configureMojangApi,
  minecraftTtf,
} from 'cobble-ui';
import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { LanguageProvider } from './language.tsx';
import { router } from './router.tsx';
import { SettingsProvider, useSettings } from './settings.tsx';

const font = minecraftTtf(`${import.meta.env.BASE_URL}fonts`);
// The Mojang API has no CORS headers; the dev server proxies it (see vite.config.ts).
if (import.meta.env.DEV)
  configureMojangApi({ profiles: '/mojang-api', session: '/mojang-session' });

function App(): JSX.Element {
  const { settings } = useSettings();
  return (
    <CobbleProvider
      font={font}
      guiScale={settings.guiScale}
      sound={{ enabled: settings.sound, master: settings.volume }}
      menuBlur={settings.menuBlur}
      panoramaSpeed={settings.panoramaSpeed}
      inWorld={settings.inWorld}
      backgroundPreloadItems
    >
      <ToastProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </ToastProvider>
      <AssetLoadingOverlay note="(first visit only)" />
    </CobbleProvider>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
