import {
  Button,
  ScreenLayout,
  Screen,
  ScrollArea,
  SelectionList,
  SelectionListItem,
  Text,
} from 'cobble-ui';
import type { JSX, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { DOC_PAGES } from '../docs/registry.tsx';
import { Disclaimer } from './Disclaimer.tsx';

export interface DocsScreenProps {
  readonly title: string;
  readonly slug?: string;
  readonly children?: ReactNode;
}

/** The shared docs screen: page list on the left, content on the right. */
export function DocsScreen({ title, slug, children }: DocsScreenProps): JSX.Element {
  const navigate = useNavigate();
  return (
    <Screen className="site-screen">
      <ScreenLayout
        title={title}
        footerHeight={45}
        footer={
          <div className="site-footer">
            <div className="site-row">
              <Button as={Link} to="/" width={150}>
                Back to Title Screen
              </Button>
              <Button as={Link} to="/settings" width={150}>
                Settings...
              </Button>
            </div>
            <Disclaimer />
          </div>
        }
      >
        <div className="site-docs">
          <SelectionList
            className="site-nav"
            aria-label="Documentation pages"
            value={slug ?? null}
            onValueChange={(next) => void navigate(`/docs/${next}`)}
            itemHeight={14}
            rowWidth={120}
          >
            {DOC_PAGES.map((page) => (
              <SelectionListItem key={page.slug} value={page.slug} className="site-nav-item">
                {({ selected }) => <Text color={selected ? 'yellow' : 'white'}>{page.title}</Text>}
              </SelectionListItem>
            ))}
          </SelectionList>
          <ScrollArea className="site-content" scrollRate={18}>
            <article className="site-article">{children}</article>
          </ScrollArea>
        </div>
      </ScreenLayout>
    </Screen>
  );
}
