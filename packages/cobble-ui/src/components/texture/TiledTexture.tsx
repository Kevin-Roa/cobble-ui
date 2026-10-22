import type { JSX } from 'react';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useTextureUrl } from '../../provider/hooks.ts';
import { cx } from '../shared.ts';

export interface TiledTextureProps extends SlotProps<'div'> {
  /** Texture id, e.g. `gui/menu_background`. */
  readonly texture: string;
  /** Size of one repetition of the texture, in GUI units (`blit`'s texture width). */
  readonly tileWidth: number;
  /** Height of one repetition, in GUI units. */
  readonly tileHeight: number;
  /** Texture offset (`blit`'s `u`), in GUI units. */
  readonly offsetX?: number;
  /** Texture offset (`blit`'s `v`), in GUI units. */
  readonly offsetY?: number;
}

/**
 * Fills its box with a texture repeated every `tileWidth × tileHeight` GUI
 * units (nearest-neighbour), like `GuiGraphics#blit` with a texture size.
 */
export function TiledTexture(props: TiledTextureProps): JSX.Element {
  const {
    texture,
    tileWidth,
    tileHeight,
    offsetX = 0,
    offsetY = 0,
    className,
    style,
    ...rest
  } = props;
  const url = useTextureUrl(texture);
  const textureStyle: CssVariables = {
    '--cobble-tile-width': tileWidth,
    '--cobble-tile-height': tileHeight,
    '--cobble-tile-x': -offsetX,
    '--cobble-tile-y': -offsetY,
    backgroundImage: url === undefined ? undefined : `url("${url}")`,
    ...style,
  };
  return (
    <div
      aria-hidden
      {...rest}
      className={cx('cobble-tiled-texture', className)}
      data-texture={texture}
      style={textureStyle}
    />
  );
}
