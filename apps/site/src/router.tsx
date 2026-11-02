import { createBrowserRouter, Navigate } from 'react-router';
import { DocPage } from './pages/DocPage.tsx';
import { Home } from './pages/Home.tsx';
import { Language } from './pages/Language.tsx';
import { Settings } from './pages/Settings.tsx';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/docs', element: <Navigate to="/docs/getting-started" replace /> },
    { path: '/docs/:slug', element: <DocPage /> },
    { path: '/settings', element: <Settings /> },
    { path: '/language', element: <Language /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename },
);
