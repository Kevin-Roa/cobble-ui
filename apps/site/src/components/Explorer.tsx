import { ScrollArea, Text, TextField, useCobble } from 'cobble-ui';
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { CodeBlock } from './Prose.tsx';

/** Gap between tiles and padding around the grid, in GUI units. */
const GRID_GAP = 2;
const GRID_PADDING = 3;
/** Width of the scroll area's scrollbar (`AbstractScrollArea#scrollbarWidth`), in GUI units. */
const SCROLLBAR_WIDTH = 6;
/** Rows rendered beyond the visible ones, so fast scrolling does not show blanks. */
const OVERSCAN_ROWS = 2;

export interface ExplorerProps {
  /** Every id that can be browsed, in display order. */
  readonly ids: readonly string[];
  /** Name of the thing being browsed, for labels: `sprites`, `items`, … */
  readonly noun: string;
  /** What a tile shows for an id. Only rendered for tiles near the viewport. */
  readonly renderTile: (id: string) => ReactNode;
  /** The selected id drawn larger, plus any facts about it. */
  readonly renderDetail: (id: string) => ReactNode;
  /** The snippet shown for the selected id. */
  readonly snippet: (id: string) => string;
  /** Tile size in GUI units. Defaults to 48. */
  readonly tileSize?: number;
}

/**
 * A searchable, virtualized grid of everything of one kind in the game files, with a detail view.
 * Only the rows near the scroll position exist in the DOM, so thousands of tiles cost the same as
 * a screenful.
 */
export function Explorer(props: ExplorerProps): JSX.Element {
  const { ids, noun, renderTile, renderDetail, snippet, tileSize = 48 } = props;
  const { unit } = useCobble();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const matches = needle === '' ? ids : ids.filter((id) => id.toLowerCase().includes(needle));
  const active = selected !== null && ids.includes(selected) ? selected : null;

  const viewport = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return undefined;
    const measure = (): void =>
      setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const gap = GRID_GAP * unit;
  const padding = GRID_PADDING * unit;
  const cell = tileSize * unit;
  const stride = cell + gap;
  // The scrollbar overlays the right edge, so keep the tiles clear of it.
  const columns = Math.max(
    Math.floor((box.width - 2 * padding - SCROLLBAR_WIDTH * unit + gap) / stride),
    1,
  );
  const rowCount = Math.ceil(matches.length / columns);
  const first = Math.max(Math.floor((scrollTop - padding) / stride) - OVERSCAN_ROWS, 0);
  const last = Math.min(
    Math.ceil((scrollTop + box.height - padding) / stride) + OVERSCAN_ROWS,
    rowCount,
  );
  const shown = matches.slice(first * columns, last * columns);

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
            setScrollTop(0);
            if (viewport.current) viewport.current.scrollTop = 0;
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
      <ScrollArea
        className="site-explorer-grid"
        slotProps={{
          viewport: {
            ref: viewport,
            role: 'listbox',
            'aria-label': `All ${noun}`,
            onScroll: (event) => setScrollTop(event.currentTarget.scrollTop),
          },
        }}
      >
        <div
          className="site-explorer-sizer"
          style={{ height: Math.max(rowCount * stride - gap, 0) + 2 * padding }}
        >
          <div
            className="site-explorer-window"
            style={{
              top: padding + first * stride,
              left: padding,
              gridTemplateColumns: `repeat(${String(columns)}, ${String(cell)}px)`,
              gap,
            }}
          >
            {shown.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={id === active}
                title={id}
                className="site-explorer-tile"
                data-selected={id === active ? '' : undefined}
                style={{ width: cell, height: cell }}
                onClick={() => setSelected(id)}
              >
                {renderTile(id)}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
      {matches.length === 0 ? <Text color="gray">Nothing matches.</Text> : null}
    </div>
  );
}
