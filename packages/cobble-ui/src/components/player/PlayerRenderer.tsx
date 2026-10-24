import { mergeProps } from '@base-ui/react/merge-props';
import { useEffect, useRef, useState, type ElementType, type JSX } from 'react';
import { useLatest, usePrefersReducedMotion } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { ModelViewport, type ModelSceneContext } from '../model3d/ModelViewport.tsx';
import { fetchMojangSkin, type ResolvedSkin } from './mojang.ts';
import {
  ALEX_SKIN,
  STEVE_SKIN,
  buildPlayerModel,
  posePlayer,
  type PlayerModelType,
  type PlayerParts,
  type PlayerPose,
} from './playerModel.ts';

export type { PlayerModelType, PlayerPose } from './playerModel.ts';

export interface PlayerRendererOwnProps {
  /**
   * Username or UUID. The skin is looked up through the official Mojang API (`fetchMojangSkin`)
   * and drawn on the 3D model, with the arm shape from the profile. Without it, or if the lookup
   * fails, the bundled `skin` is used.
   */
  readonly player?: string;
  /**
   * Local skin texture id from the client files, used when no `player` is given. Defaults to
   * Steve, or Alex when `model` is `slim`.
   */
  readonly skin?: string;
  /**
   * The arm shape (`PlayerModelType`): `wide` is 4 pixels, `slim` (Alex) 3. Defaults to the shape
   * of the default skin, so a named player with slim arms needs `model="slim"`.
   */
  readonly model?: PlayerModelType;
  /** Height in GUI units. Defaults to 70, the height of the inventory screen's preview. */
  readonly height?: number;
  /** Width in GUI units. Defaults to 70% of the height. */
  readonly width?: number;
  /** Drag or use the arrow keys to turn the player. Defaults to `true`. */
  readonly rotatable?: boolean;
  /**
   * Head and body turn toward the cursor like the inventory screen
   * (`InventoryScreen#extractEntityInInventoryFollowsMouse`). Defaults to `false`.
   */
  readonly followMouse?: boolean;
  /** Spin around the vertical axis. `true` is 30 degrees per second, a number is degrees per second. */
  readonly autoRotate?: boolean | number;
  /** `standing` is still, `idle` sways the arms slightly, `walking` swings arms and legs. Defaults to `standing`. */
  readonly pose?: PlayerPose;
  /** Draw the hat, jacket, sleeve and pants layers. Defaults to `true`. */
  readonly overlay?: boolean;
  /** Starting yaw in degrees, positive turns the player toward the viewer's right. Defaults to 0. */
  readonly initialYaw?: number;
  /** Accessible name. Defaults to the player's name and "skin". */
  readonly label?: string;
}

export type PlayerRendererProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PlayerRendererOwnProps
>;

type SkinState =
  | { readonly player: string; readonly status: 'ready'; readonly skin: ResolvedSkin | null }
  | { readonly player: string; readonly status: 'failed' };

/**
 * Looks a player up through the Mojang API (`fetchMojangSkin`). The result is `undefined` while
 * loading, and `null` when the skin cannot be used (offline, unknown player, no CORS, no custom
 * skin), in which case callers use the default skin.
 */
export function useMojangSkin(player: string | undefined): ResolvedSkin | null | undefined {
  const [state, setState] = useState<SkinState | null>(null);
  useEffect(() => {
    if (player === undefined) return undefined;
    let cancelled = false;
    fetchMojangSkin(player).then(
      (skin) => {
        if (!cancelled) setState({ player, status: 'ready', skin });
      },
      () => {
        if (!cancelled) setState({ player, status: 'failed' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [player]);
  if (player === undefined) return null;
  if (state?.player !== player) return undefined;
  return state.status === 'ready' ? state.skin : null;
}

/**
 * A 3D player model (`PlayerModel`, drawn by the library's own software renderer) wearing a skin: head, body, arms and legs with
 * the 64x64 skin layout, the hat/jacket/sleeve/pants layers, and wide or slim arms. It turns when
 * dragged, can follow the cursor and can spin by itself. Pass a username or UUID for a real skin
 * (looked up through the Mojang API, nothing is bundled) or use a `skin` from the client files.
 * If the lookup fails the bundled skin is used.
 */
export function PlayerRenderer<E extends ElementType = 'div'>(
  props: PlayerRendererProps<E>,
): JSX.Element {
  const {
    as,
    player,
    skin,
    model,
    height = 70,
    width = Math.round(height * 0.7),
    rotatable = true,
    followMouse = false,
    autoRotate = false,
    pose = 'standing',
    overlay = true,
    initialYaw = 0,
    label,
    className,
    style,
    ...rest
  } = props as PlayerRendererProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const name = player?.trim() === '' ? undefined : player?.trim();
  const resolved = useMojangSkin(name);
  const pixels = resolved?.image;
  const slim =
    (model ??
      (resolved ? (resolved.slim ? 'slim' : 'wide') : skin === ALEX_SKIN ? 'slim' : 'wide')) ===
    'slim';
  const localSkin = skin ?? (slim ? ALEX_SKIN : STEVE_SKIN);
  const reducedMotion = usePrefersReducedMotion();
  const partsRef = useRef<PlayerParts | null>(null);
  const latest = useLatest({ pose, followMouse, overlay, reducedMotion });
  const accessibleName = label ?? `${name ?? 'Player'} skin`;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  const buildScene = (context: ModelSceneContext): (() => void) => {
    const { root, textures } = context;
    const texture = pixels ?? textures[localSkin];
    if (!texture) return () => undefined;
    partsRef.current = buildPlayerModel(root, {
      slim,
      texture,
      overlay: latest.current.overlay,
    });
    return () => {
      partsRef.current = null;
    };
  };
  const onFrame = (context: ModelSceneContext, frame: { readonly time: number }): void => {
    const parts = partsRef.current;
    if (!parts) return;
    const { look, root } = context;
    const settings = latest.current;
    posePlayer(parts, settings.reducedMotion ? 'standing' : settings.pose, frame.time);
    // Vanilla turns the body by 20 degrees per radian of cursor offset and the head by another 20
    // on top, and only the head pitches (`extractEntityInInventoryFollowsMouse`).
    root.rotation[1] += settings.followMouse ? look.followYaw : 0;
    parts.head.rotation[1] = settings.followMouse ? look.followHeadYaw : 0;
    parts.head.rotation[0] = settings.followMouse ? look.followPitch : 0;
  };

  let content: JSX.Element;
  if (resolved === undefined) {
    // The skin is still downloading.
    content = <div role="img" aria-label={accessibleName} className="cobble-player-loading" />;
  } else {
    content = (
      <ModelViewport
        // A different model or skin is a different scene.
        key={`${slim ? 'slim' : 'wide'}:${name ?? localSkin}:${pixels ? 'own' : 'local'}:${overlay ? 'overlay' : 'base'}`}
        aria-label={accessibleName}
        width={width}
        height={height}
        rotatable={rotatable}
        followMouse={followMouse ? 'manual' : false}
        autoRotate={autoRotate}
        animated={pose !== 'standing' && !reducedMotion}
        initialYaw={initialYaw}
        camera={{ fov: 30, position: [0, 0, 70] }}
        textures={pixels ? [] : [localSkin]}
        onSceneReady={buildScene}
        onFrame={onFrame}
      />
    );
  }
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-player-renderer', className),
          style: rootStyle,
        },
        rest,
      )}
    >
      {content}
    </Component>
  );
}
