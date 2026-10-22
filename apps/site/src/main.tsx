import 'cobble-ui/styles.css';
import './site.css';
import { CobbleProvider, minecraftTtf } from 'cobble-ui';
import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AssetLoader } from './components/AssetLoader.tsx';
import { router } from './router.tsx';
import { SettingsProvider, useSettings } from './settings.tsx';

const font = minecraftTtf('/fonts');

function App(): JSX.Element {
  const { settings } = useSettings();
  return (
    <CobbleProvider
      font={font}
      guiScale={settings.guiScale}
      sound={{ enabled: settings.sound, master: settings.volume }}
      menuBlur={settings.menuBlur}
      panoramaSpeed={settings.panoramaSpeed}
    >
      <RouterProvider router={router} />
      <AssetLoader />
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
