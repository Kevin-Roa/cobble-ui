import type { JSX } from 'react';
import { Navigate, useParams } from 'react-router';
import { DocsScreen } from '../components/DocsScreen.tsx';
import { mdxComponents } from '../components/Prose.tsx';
import { DOC_PAGES } from '../docs/registry.tsx';

export function DocPage(): JSX.Element {
  const { slug } = useParams();
  const page = DOC_PAGES.find((candidate) => candidate.slug === slug);
  if (!page) return <Navigate to="/docs/getting-started" replace />;
  const { Page } = page;
  return (
    <DocsScreen title={page.title} slug={page.slug}>
      {page.mdx ? <Page components={mdxComponents} /> : <Page />}
    </DocsScreen>
  );
}
