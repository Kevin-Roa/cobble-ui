import {
  Button,
  CycleButton,
  ScreenLayout,
  Screen,
  ScrollArea,
  SelectionList,
  SelectionListGroup,
  SelectionListItem,
  Separator,
  Text,
  TextField,
} from 'cobble-ui';
import { useState, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  COMPONENT_PAGES,
  DOC_CATEGORIES,
  GUIDE_PAGES,
  pageMatches,
  type DocPage,
} from '../docs/registry.tsx';
import { useSettings } from '../settings.tsx';
import { Disclaimer } from './Disclaimer.tsx';

const PLAYGROUND_SCALES = ['auto', 1, 2, 3, 4, 5, 6] as const;

export interface DocsScreenProps {
  readonly title: string;
  readonly slug?: string;
  readonly children?: ReactNode;
}

function NavItem({ page }: { readonly page: DocPage }): JSX.Element {
  return (
    <SelectionListItem value={page.slug} className="site-nav-item">
      {({ selected }) => (
        <Text className="site-nav-label" color={selected ? 'yellow' : 'white'}>
          {page.title}
        </Text>
      )}
    </SelectionListItem>
  );
}

/** The shared docs screen: page list on the left, content on the right. */
export function DocsScreen({ title, slug, children }: DocsScreenProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const { settings, update } = useSettings();

  const guides = GUIDE_PAGES.filter((page) => pageMatches(page, query));
  const components = COMPONENT_PAGES.filter((page) => pageMatches(page, query));
  const first = guides[0] ?? components[0];

  const onSearchKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && first) void navigate(`/docs/${first.slug}`);
    else if (event.key === 'Escape' && query !== '') {
      // Clearing the search uses the key; with nothing to clear, Escape goes back a screen.
      event.preventDefault();
      setQuery('');
    }
  };

  return (
    <Screen className="site-screen" onClose={() => void navigate('/')}>
      <ScreenLayout
        title={title}
        footerHeight={45}
        footer={
          <div className="site-footer">
            <div className="site-row">
              <Button as={Link} to="/" width={150}>
                Back to Title Screen
              </Button>
              <Button as={Link} to="/settings" state={{ from: location.pathname }} width={150}>
                Settings...
              </Button>
            </div>
            <Disclaimer />
          </div>
        }
      >
        <div className="site-docs">
          <div className="site-sidebar">
            <TextField
              className="site-search"
              aria-label="Search pages"
              placeholder="Search…"
              width={144}
              height={20}
              maxLength={40}
              value={query}
              onValueChange={setQuery}
              onKeyDown={onSearchKeyDown}
            />
            <SelectionList
              className="site-nav"
              aria-label="Documentation pages"
              value={slug ?? null}
              onValueChange={(next) => void navigate(`/docs/${next}`)}
              itemHeight={14}
              rowWidth={134}
            >
              {guides.map((page) => (
                <NavItem key={page.slug} page={page} />
              ))}
              {guides.length > 0 && components.length > 0 ? (
                <div className="site-nav-divider">
                  <Separator kind="header" />
                </div>
              ) : null}
              {DOC_CATEGORIES.map((category) => {
                const pages = components.filter((page) => page.category === category);
                if (pages.length === 0) return null;
                return (
                  <SelectionListGroup key={category} label={<Text color="gray">{category}</Text>}>
                    {pages.map((page) => (
                      <NavItem key={page.slug} page={page} />
                    ))}
                  </SelectionListGroup>
                );
              })}
              {first ? null : (
                <Text className="site-nav-empty" color="gray">
                  No pages match.
                </Text>
              )}
            </SelectionList>
          </div>
          <ScrollArea key={slug} className="site-content" scrollRate={18}>
            <article className="site-article">
              <div className="site-row site-playground" role="group" aria-label="Playground">
                <CycleButton
                  width={150}
                  label="Playground GUI Scale"
                  values={PLAYGROUND_SCALES}
                  value={settings.guiScale}
                  onValueChange={(guiScale) => update({ guiScale })}
                  formatValue={(value) => (value === 'auto' ? 'Auto' : String(value))}
                />
                <Text color="gray">
                  Applies to every demo. Unicode font and language are not available yet.
                </Text>
              </div>
              {children}
            </article>
          </ScrollArea>
        </div>
      </ScreenLayout>
    </Screen>
  );
}
