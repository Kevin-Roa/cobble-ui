import type { JSX } from 'react';
import { ItemIcon } from '../sprite/TextureIcons.tsx';
import { useCobble } from '../../provider/context.ts';
import { useAssetRevision } from '../../provider/hooks.ts';
import { resolveItem } from '../../render/item-model.ts';
import { bakeParts, modelTextures } from '../../render/model3d/model.ts';
import { Node3D } from '../../render/model3d/engine.ts';
import type { CssVariables } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import {
  ModelViewport,
  type ModelSceneContext,
  type ModelViewportProps,
} from './ModelViewport.tsx';

export interface BlockModelProps extends Omit<
  ModelViewportProps,
  'aria-label' | 'onSceneReady' | 'textures' | 'fallback'
> {
  /** The item or block id: `stone`, `grass_block`, `furnace`, … (`assets/minecraft/items/<name>.json`). */
  readonly name: string;
  /** Accessible name. Defaults to the id. */
  readonly 'aria-label'?: string;
}

const DEFAULT_SIZE = 64;

/**
 * Any item or block model from the game files as real 3D geometry, drawn by the library's own software renderer: the elements of
 * `models/**.json` with their per-face uv and rotation, element rotation, tint indexes and the
 * vanilla face shading (`Direction#getShade`: down 0.5, up 1.0, north/south 0.8, east/west 0.6),
 * textured from the client. Item definitions resolve as in {@link ItemIcon}
 * (`ItemModelResolver`); `item/generated` sprites are drawn as flat double-sided quads. Unlike the
 * slot icon the `display.gui` transform is not applied, so the model can be turned freely: drag or
 * use the arrow keys with `rotatable`, or turn it toward the cursor with `followMouse`.
 *
 * While the files load, and when a model has nothing to draw, the 2D
 * {@link ItemIcon} is shown instead.
 */
export function BlockModel(props: BlockModelProps): JSX.Element {
  const {
    name,
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    rotatable = true,
    initialYaw = -15,
    initialPitch = 15,
    camera,
    className,
    style,
    followMouse,
    autoRotate,
    animated,
    pitchLimit,
    onFrame,
    ...rest
  } = props;
  const label = props['aria-label'] ?? name.replaceAll('_', ' ');
  const { store } = useCobble();
  useAssetRevision();
  const parts = resolveItem(name, (path) => store.getJson(path));
  const icon = <ItemIcon name={name} size={Math.min(width, height)} />;
  if (!parts) {
    // Still loading or no model: the same box the viewport would take, holding the flat icon.
    const rootStyle: CssVariables = {
      '--cobble-width': width,
      '--cobble-height': height,
      ...style,
    };
    return (
      <div
        {...rest}
        role="img"
        aria-label={label}
        className={cx('cobble-model3d-viewport', className)}
        data-status={parts === undefined ? 'loading' : 'unsupported'}
        style={rootStyle}
      >
        <div className="cobble-model3d-fallback">{icon}</div>
      </div>
    );
  }
  const textures = modelTextures(parts);
  const build = (context: ModelSceneContext): void => {
    const { root, textures: loaded } = context;
    const node = new Node3D();
    node.addQuad(
      ...bakeParts(parts, {
        texture: (id) => loaded[id] ?? store.getTexture(id),
      }),
    );
    root.add(node);
  };
  return (
    <ModelViewport
      {...rest}
      {...(followMouse === undefined ? {} : { followMouse })}
      {...(autoRotate === undefined ? {} : { autoRotate })}
      {...(animated === undefined ? {} : { animated })}
      {...(pitchLimit === undefined ? {} : { pitchLimit })}
      {...(onFrame ? { onFrame } : {})}
      key={`${name}\n${textures.join('\n')}`}
      aria-label={label}
      width={width}
      height={height}
      rotatable={rotatable}
      initialYaw={initialYaw}
      initialPitch={initialPitch}
      camera={camera ?? { position: [0, 0, 4.2] }}
      className={cx('cobble-block-model', className)}
      {...(style ? { style } : {})}
      textures={textures}
      onSceneReady={build}
      fallback={icon}
    />
  );
}
