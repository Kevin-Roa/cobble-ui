import { mergeProps } from '@base-ui/react/merge-props';
import { useEffect, useRef, useState, type ElementType, type JSX } from 'react';
import { useLatest, usePrefersReducedMotion } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { useTranslation } from '../../i18n/Translation.tsx';
import { useTexture } from '../../provider/hooks.ts';
import type { RgbaImage } from '../../render/blit.ts';
import { projectNodePoint, type Camera3D } from '../../render/model3d/engine.ts';
import { cx } from '../shared.ts';
import { ModelViewport, type ModelSceneContext } from '../model3d/ModelViewport.tsx';
import { fetchMojangSkin, loadCapeImage, type ResolvedSkin } from './mojang.ts';
import {
  ALEX_SKIN,
  ELYTRA_TEXTURE,
  blendRig,
  captureRig,
  STEVE_SKIN,
  buildPlayerModel,
  detectSlim,
  isAnimatedPose,
  poseViewOffset,
  posePlayer,
  poseFit,
  resolveOverlay,
  type PlayerModelType,
  type PlayerOverlay,
  type PlayerOverlayParts,
  type PlayerPose,
  type PlayerRig,
} from './playerModel.ts';

export type { PlayerModelType, PlayerOverlay, PlayerOverlayParts, PlayerPose };

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
   * The arm shape (`PlayerModelType`): `wide` is 4 pixels, `slim` (Alex) 3. Detected when left
   * out: from the player's profile (`metadata.model`) or, for a local `skin`, from its pixels.
   */
  readonly model?: PlayerModelType;
  /** Height of the model in GUI units. Defaults to 70, the height of the inventory screen's preview. */
  readonly height?: number;
  /** Width of the model in GUI units. Defaults to 70% of the height. */
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
  /**
   * `standing` is still, `idle` sways the arms slightly, `walking` swings arms and legs,
   * `crouching` is the sneak pose, `flying` is elytra gliding and `swimming` does a breaststroke. The flying
   * and swimming poses lie the player down; the figure is shrunk in poses that would reach past the viewport.
   * Defaults to `standing`.
   */
  readonly pose?: PlayerPose;
  /**
   * Which skin layers to draw: `true` for all, `false` for none, or an object choosing `hat`,
   * `jacket`, `leftSleeve`, `rightSleeve`, `leftPants` and `rightPants` (missing ones are drawn).
   * Defaults to `true`.
   */
  readonly overlay?: PlayerOverlay;
  /**
   * Draw a cape. `true` shows the player's own cape (from the Mojang API, if they have one); a
   * string is the URL of a cape image (64x32 layout, or a legacy 22x17 / HD one) that replaces it
   * and works without a `player`. The server must allow cross-origin reads. Defaults to `false`.
   */
  readonly cape?: boolean | string;
  /**
   * Wear an elytra on the back. It takes the player's cape texture when `cape` shows one, and the
   * game's own elytra texture otherwise; the cape itself is not drawn. In the `flying` pose the
   * wings open. Defaults to `false`.
   */
  readonly elytra?: boolean;
  /**
   * Show a name tag above the player. `true` uses the player's name (with its real capitalisation
   * once looked up); a string shows that text. The renderer grows to fit it. Defaults to `false`.
   */
  readonly nameTag?: boolean | string;
  /** Starting yaw in degrees, positive turns the player toward the viewer's right. Defaults to 0. */
  readonly initialYaw?: number;
  /** Starting pitch in degrees, positive looks down on the player. Defaults to 0. */
  readonly initialPitch?: number;
  /** Starting roll in degrees around the player's front axis. Defaults to 0. */
  readonly initialRoll?: number;
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

/** A cape image from its URL: `undefined` while loading, `null` without a usable cape. */
function useCapeImage(url: string | undefined): RgbaImage | null | undefined {
  const [state, setState] = useState<{ url: string; image: RgbaImage | null } | null>(null);
  useEffect(() => {
    if (url === undefined) return undefined;
    let cancelled = false;
    void loadCapeImage(url).then((image) => {
      if (!cancelled) setState({ url, image });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (url === undefined) return null;
  return state?.url === url ? state.image : undefined;
}

/** Vertical size of the visible area at the camera distance, in model units (`fov` 30, distance 70). */
const VISIBLE_HEIGHT = 2 * 70 * Math.tan((15 * Math.PI) / 180);
/** The camera every player view uses. */
const CAMERA_DISTANCE = 70;
const CAMERA: Camera3D = { fov: 30, position: [0, 0, CAMERA_DISTANCE] };
/** Seconds a change of pose takes to ease in. */
const POSE_TRANSITION = 0.3;
/** Gap between the name tag and the model, in GUI units. */
const NAME_TAG_GAP = 2;

/**
 * A 3D player model (`PlayerModel`, drawn by the library's own software renderer) wearing a skin: head, body, arms and legs with
 * the 64x64 skin layout, the hat/jacket/sleeve/pants layers, and wide or slim arms (detected from
 * the skin). It turns when dragged, can follow the cursor and can spin by itself, stands, walks,
 * crouches, glides or swims, and can wear a cape and a name tag. Pass a username or UUID for a
 * real skin (looked up through the Mojang API, nothing is bundled) or use a `skin` from the client
 * files. If the lookup fails the bundled skin is used.
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
    cape = false,
    elytra = false,
    nameTag = false,
    initialYaw = 0,
    initialPitch = 0,
    initialRoll = 0,
    label,
    className,
    style,
    ...rest
  } = props as PlayerRendererProps<'div'>;
  const { tOr } = useTranslation();
  const Component: ElementType = as ?? 'div';
  const name = player?.trim() === '' ? undefined : player?.trim();
  const resolved = useMojangSkin(name);
  const localSkin = skin ?? (model === 'slim' ? ALEX_SKIN : STEVE_SKIN);
  const localTexture = useTexture(localSkin);
  const pixels = resolved?.image;
  const slim =
    model !== undefined
      ? model === 'slim'
      : resolved
        ? resolved.slim
        : localTexture
          ? detectSlim(localTexture)
          : false;
  const capeUrl = typeof cape === 'string' ? cape : cape ? resolved?.capeUrl : undefined;
  const capeState = useCapeImage(capeUrl);
  const capeImage = capeState ?? undefined;
  const elytraTexture = useTexture(elytra ? ELYTRA_TEXTURE : undefined);
  const layers = resolveOverlay(overlay);
  const reducedMotion = usePrefersReducedMotion();
  const rigRef = useRef<PlayerRig | null>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  // The pose being shown, the snapshot it eases in from and when that began (seconds).
  const transition = useRef<{
    pose: PlayerPose;
    from: number[] | null;
    start: number;
    last: number[] | null;
    pitch: number;
    yaw: number;
    clock: number;
  }>({
    pose,
    from: null,
    start: 0,
    last: null,
    pitch: poseViewOffset(pose).pitch,
    yaw: poseViewOffset(pose).yaw,
    clock: 0,
  });
  // Shrink the figure when a pose (lying down, open wings, ...) would reach past the viewport.
  const fit = poseFit(pose, { wings: elytra }, VISIBLE_HEIGHT * (width / height), VISIBLE_HEIGHT);
  const latest = useLatest({ pose, followMouse, reducedMotion, fit });
  const tag =
    typeof nameTag === 'string' ? nameTag : nameTag ? (resolved?.name ?? name) : undefined;
  const accessibleName =
    label ??
    tOr('cobble.player.skin', '%s skin', name ?? tOr('cobble.player.default_name', 'Player'));
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };

  // The name tag follows the head: it sits just above wherever the head is on screen.
  const placeNameTag = (context: ModelSceneContext, rig: PlayerRig): void => {
    const element = tagRef.current;
    if (!element) return;
    const head = projectNodePoint(context.root, rig.parts.head, [0, 4, 0], CAMERA, width, height);
    if (!head) return;
    const above = 5.5 * rig.figure.scale * head.unit + NAME_TAG_GAP;
    element.style.left = `calc(${String(head.x)} * var(--cobble-px))`;
    element.style.top = `calc(${String(head.y - above)} * var(--cobble-px))`;
    // Like the game's name tags, it shrinks and grows with the head's distance from the camera
    // (1 at the camera's distance), and with the figure's own scale: the poses that would not fit
    // the viewport shrink the player, and the tag with it.
    const reference =
      ((1 / Math.tan(((CAMERA.fov ?? 30) * Math.PI) / 360)) * height) / 2 / CAMERA_DISTANCE;
    const factor = Math.min(2, Math.max(0.3, (head.unit / reference) * rig.figure.scale));
    element.style.transformOrigin = '50% 100%';
    element.style.transform = `translate(-50%, -100%) scale(${String(factor)})`;
    element.style.visibility = 'visible';
  };

  const buildScene = (context: ModelSceneContext): (() => void) => {
    const { root, textures } = context;
    const texture = pixels ?? textures[localSkin];
    if (!texture) return () => undefined;
    const view = poseViewOffset(latest.current.pose);
    transition.current = {
      pose: latest.current.pose,
      from: null,
      start: 0,
      last: null,
      pitch: view.pitch,
      yaw: view.yaw,
      clock: 0,
    };
    rigRef.current = buildPlayerModel(root, {
      slim,
      texture,
      overlay: layers,
      cape: capeImage,
      elytra: elytra ? (capeImage ?? textures[ELYTRA_TEXTURE] ?? elytraTexture) : undefined,
    });
    return () => {
      rigRef.current = null;
    };
  };
  const onFrame = (context: ModelSceneContext, frame: { readonly time: number }): void => {
    const rig = rigRef.current;
    if (!rig) return;
    const { look, root } = context;
    const settings = latest.current;
    const active = settings.reducedMotion ? 'standing' : settings.pose;
    posePlayer(rig, active, frame.time, settings.fit);
    // Ease from the pose shown a moment ago into the new one; `invalidate` keeps frames coming
    // until it is done, even for poses that do not animate. It uses the wall clock, since the
    // viewport's own time does not advance while it is idle.
    const state = transition.current;
    const now = performance.now() / 1000;
    if (state.pose !== active) {
      state.from = state.last;
      state.start = now;
      state.pose = active;
    }
    if (state.from) {
      const progress = Math.min(1, (now - state.start) / POSE_TRANSITION);
      if (progress >= 1) state.from = null;
      else {
        const eased = progress * progress * (3 - 2 * progress);
        blendRig(rig, state.from, eased);
        context.invalidate();
      }
    }
    state.last = captureRig(rig);
    // Ease the view toward the pose's angle (and keep frames coming until it gets there).
    const target = poseViewOffset(active);
    const dt = state.clock === 0 ? 0 : Math.min(0.1, now - state.clock);
    state.clock = now;
    const follow = 1 - Math.exp(-dt * 9);
    state.pitch += (target.pitch - state.pitch) * follow;
    state.yaw += (target.yaw - state.yaw) * follow;
    if (Math.abs(target.pitch - state.pitch) + Math.abs(target.yaw - state.yaw) > 0.004) {
      context.invalidate();
    } else {
      state.pitch = target.pitch;
      state.yaw = target.yaw;
    }
    root.rotation[0] += state.pitch;
    root.rotation[1] += state.yaw;
    // Vanilla turns the body by 20 degrees per radian of cursor offset and the head by another 20
    // on top, and only the head pitches (`extractEntityInInventoryFollowsMouse`).
    if (settings.followMouse) {
      root.rotation[1] += look.followYaw;
      rig.parts.head.rotation[1] += look.followHeadYaw;
      rig.parts.head.rotation[0] += look.followPitch;
    }
    placeNameTag(context, rig);
  };

  const layerKey = (Object.keys(layers) as (keyof PlayerOverlayParts)[])
    .map((part) => (layers[part] ? '1' : '0'))
    .join('');
  // Until the player's skin (or cape) has loaded the default skin is shown; the scene is rebuilt
  // when it arrives and the rotation stays.
  const content = (
    <ModelViewport
      // A different model, skin, cape or set of layers is a different scene; the rotation stays.
      sceneKey={`${slim ? 'slim' : 'wide'}:${name ?? localSkin}:${pixels ? 'own' : 'local'}:${layerKey}:${capeImage ? capeUrl : 'nocape'}:${elytra ? 'elytra' : 'bare'}`}
      aria-label={accessibleName}
      width={width}
      height={height}
      rotatable={rotatable}
      followMouse={followMouse ? 'manual' : false}
      autoRotate={autoRotate}
      animated={isAnimatedPose(pose) && !reducedMotion}
      redrawKey={`${pose}:${String(reducedMotion)}:${String(fit)}`}
      initialYaw={initialYaw}
      initialPitch={initialPitch}
      initialRoll={initialRoll}
      camera={CAMERA}
      textures={[...(pixels ? [] : [localSkin]), ...(elytra ? [ELYTRA_TEXTURE] : [])]}
      onSceneReady={buildScene}
      onFrame={onFrame}
    />
  );
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-player-renderer', className),
          style: rootStyle,
          ...(tag === undefined ? {} : { 'data-named': '' }),
        },
        rest,
      )}
    >
      {tag === undefined ? null : (
        // Takes the room the tag needs above and beside the model; the visible one floats.
        <span
          aria-hidden
          className="cobble-player-nametag cobble-text"
          style={{
            visibility: 'hidden',
            marginBottom: `calc(${String(NAME_TAG_GAP)} * var(--cobble-px))`,
          }}
        >
          {tag}
        </span>
      )}
      <div
        className="cobble-player-stage"
        style={{
          width: `calc(${String(width)} * var(--cobble-px))`,
          height: `calc(${String(height)} * var(--cobble-px))`,
        }}
      >
        {content}
        {tag === undefined ? null : (
          <span
            ref={tagRef}
            className="cobble-player-nametag cobble-player-nametag-float cobble-text"
            data-crouching={pose === 'crouching' ? '' : undefined}
            style={{ visibility: 'hidden' }}
          >
            {tag}
          </span>
        )}
      </div>
    </Component>
  );
}
