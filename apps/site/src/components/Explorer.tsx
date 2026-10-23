import { Button, Text, TextField } from 'cobble-ui';
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { CodeBlock } from './Prose.tsx';

export interface ExplorerProps {
  /** Every id that can be browsed. */
  readonly ids: readonly string[];
  /** Name of the thing being browsed, for labels: `sprites`, `items`, … */
  readonly noun: string;
  /** What a tile shows for an id. Only rendered once the tile scrolls into view. */
  readonly renderTile: (id: string) => ReactNode;
  /** The selected id drawn larger, plus any facts about it. */
  readonly renderDetail: (id: string) => ReactNode;
  /** The snippet shown for the selected id. */
  readonly snippet: (id: string) => string;
  /** Tile size in GUI units. Defaults to 48. */
  readonly tileSize?: number;
}

/** Renders its children only once it has been near the viewport, so huge lists stay cheap. */
function Lazy({
  children,
  placeholderSize,
}: {
  readonly children: ReactNode;
  readonly placeholderSize: number;
}): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen]);
  return (
    <span
      ref={ref}
      className="site-explorer-lazy"
      style={{ width: `calc(${String(placeholderSize)} * var(--cobble-px))` }}
    >
      {seen ? children : null}
    </span>
  );
}

/** A searchable grid of everything of one kind in the game files, with a detail view. */
export function Explorer(props: ExplorerProps): JSX.Element {
  const { ids, noun, renderTile, renderDetail, snippet, tileSize = 48 } = props;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(300);
  const needle = query.trim().toLowerCase();
  const matches = needle === '' ? ids : ids.filter((id) => id.toLowerCase().includes(needle));
  const shown = matches.slice(0, limit);
  const active = selected !== null && ids.includes(selected) ? selected : null;
  return (
    <div className="site-explorer">
      <div className="site-explorer-bar">
        <TextField
          aria-label={`Search ${noun}`}
          placeholder={`Search ${String(ids.length)} ${noun}…`}
          width={200}
          height={20}
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setLimit(300);
          }}
        />
        <Text color="gray">
          {matches.length === ids.length
            ? `${String(ids.length)} ${noun}`
            : `${String(matches.length)} of ${String(ids.length)} ${noun}`}
        </Text>
      </div>
      {active === null ? null : (
        <div className="site-explorer-detail">
          {renderDetail(active)}
          <CodeBlock code={snippet(active)} />
        </div>
      )}
      <div className="site-explorer-grid" role="listbox" aria-label={`All ${noun}`}>
        {shown.map((id) => (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={id === active}
            title={id}
            className="site-explorer-tile"
            data-selected={id === active ? '' : undefined}
            style={{
              width: `calc(${String(tileSize)} * var(--cobble-px))`,
              height: `calc(${String(tileSize)} * var(--cobble-px))`,
            }}
            onClick={() => setSelected(id)}
          >
            <Lazy placeholderSize={tileSize}>{renderTile(id)}</Lazy>
          </button>
        ))}
      </div>
      {matches.length > shown.length ? (
        <Button width={150} onClick={() => setLimit(limit + 300)}>
          Show more
        </Button>
      ) : null}
      {matches.length === 0 ? <Text color="gray">Nothing matches.</Text> : null}
    </div>
  );
}
