import type { JSX } from 'react';
import { cx } from '../shared.ts';
import { TiledTexture, type TiledTextureProps } from './TiledTexture.tsx';

/** Thickness of a screen separator, in GUI units. */
export const SEPARATOR_THICKNESS = 2;

export interface SeparatorProps extends Omit<
  TiledTextureProps,
  'texture' | 'tileWidth' | 'tileHeight'
> {
  /** `header` (below a header) or `footer` (above a footer). */
  readonly kind?: 'header' | 'footer';
  /** The translucent variants used when the screen is drawn over a world (`inworld_*_separator`). */
  readonly inWorld?: boolean;
}

/**
 * The 2-unit line between a screen's header or footer and its content
 * (`Screen.HEADER_SEPARATOR` / `FOOTER_SEPARATOR`), tiled every 32 units.
 * Fills the width of its container.
 */
export function Separator(props: SeparatorProps): JSX.Element {
  const { kind = 'header', inWorld = false, className, ...rest } = props;
  return (
    <TiledTexture
      role="separator"
      aria-hidden={undefined}
      {...rest}
      className={cx('cobble-separator', className)}
      data-kind={kind}
      texture={inWorld ? `gui/inworld_${kind}_separator` : `gui/${kind}_separator`}
      tileWidth={32}
      tileHeight={SEPARATOR_THICKNESS}
    />
  );
}
