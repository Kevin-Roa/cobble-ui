import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type JSX,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useLatest, usePrefersReducedMotion } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useAssetRevision } from '../../provider/hooks.ts';
import type { RgbaImage } from '../../render/blit.ts';
import { followAngles } from '../../render/model3d/box.ts';
import {
  Node3D,
  createRenderTarget,
  renderScene,
  type Camera3D,
  type Lighting,
  type RenderTarget,
} from '../../render/model3d/engine.ts';
import { cx } from '../shared.ts';

/** The rotation applied to {@link ModelSceneContext.root} each frame, in radians. */
export interface ModelLook {
  /** Yaw from dragging, the arrow keys, `autoRotate` and `initialYaw`. Positive turns the front toward +x. */
  yaw: number;
  /** Pitch from dragging and the arrow keys. Positive looks down. */
  pitch: number;
  /** Roll around the model's front axis (z), from `roll`, Shift+drag, Shift+arrows, the horizontal wheel and `initialRoll`. */
  roll: number;
  /** Body yaw toward the cursor (`followMouse`), `0` when not following. */
  followYaw: number;
  /** Extra head yaw toward the cursor on top of `followYaw` (vanilla turns the head twice as far). */
  followHeadYaw: number;
  /** Pitch toward the cursor, positive looks down. */
  followPitch: number;
}

/** Everything a scene builder gets from {@link ModelViewport}. */
export interface ModelSceneContext {
  /**
   * Add your model here. The viewport rotates this node (yaw/pitch from the user, `autoRotate`
   * and `followMouse`); everything under it turns together around the origin.
   */
  readonly root: Node3D;
  /** The textures requested with the `textures` prop, keyed by texture id. */
  readonly textures: Readonly<Record<string, RgbaImage>>;
  /** The live rotation state, updated before every `onFrame`. */
  readonly look: Readonly<ModelLook>;
  /** Draw another frame (only needed when you change the scene outside `onFrame` and `animated` is off). */
  readonly invalidate: () => void;
}

export interface ModelFrame {
  /** Seconds since the previous frame (`0` for the first). */
  readonly delta: number;
  /** Seconds since the scene was created. */
  readonly time: number;
}

/** Vertical field of view in degrees (default 30), position (default `[0, 0, 5]`) and target (default the origin). */
export type ModelCameraOptions = Camera3D;

export interface ModelViewportProps extends Omit<SlotProps<'div'>, 'children' | 'onError'> {
  /** Width in GUI units. Defaults to 64. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 64. */
  readonly height?: number;
  /** Accessible name of the viewport (it is exposed as an image). */
  readonly 'aria-label': string;
  /**
   * Called once when the canvas works and every requested texture has been decoded. Build the scene under `ctx.root`. May return a cleanup function. The latest
   * callback is used; changing it does not rebuild the scene (change `textures` or `key` for that).
   */
  readonly onSceneReady?: (context: ModelSceneContext) => void | (() => void);
  /** Called before every rendered frame, after the rotation was applied. Only use with `animated` for continuous animation. */
  readonly onFrame?: (context: ModelSceneContext, frame: ModelFrame) => void;
  /**
   * Texture ids to load from the asset store (`block/stone`, `entity/player/wide/steve`, ...).
   * The scene is only built once all of them are available. Changing the list rebuilds the scene.
   */
  readonly textures?: readonly string[];
  /** Camera setup. */
  readonly camera?: ModelCameraOptions;
  /** Scene lighting for quads with `lit`. */
  readonly lighting?: Lighting;
  /**
   * Dragging with the pointer or pressing the arrow keys rotates the model; hold Shift to roll it
   * (see `onRollChange`). Defaults to `false`.
   */
  readonly rotatable?: boolean;
  /**
   * The model turns toward the cursor like the inventory player
   * (`InventoryScreen#extractEntityInInventoryFollowsMouse`), relative to the viewport's centre.
   * `true` rotates the whole model (yaw and pitch); `'manual'` only fills in `context.look` so
   * the model can move head and body separately. Defaults to `false`.
   */
  readonly followMouse?: boolean | 'manual';
  /** Spin around the vertical axis. `true` is 30 degrees per second, a number is degrees per second. Ignored under `prefers-reduced-motion`. */
  readonly autoRotate?: boolean | number;
  /** Render every frame while visible, instead of only when something changed. Needed for animation in `onFrame`. */
  readonly animated?: boolean;
  /** Starting yaw, pitch and roll in degrees. */
  readonly initialYaw?: number;
  readonly initialPitch?: number;
  readonly initialRoll?: number;
  /**
   * Controlled roll in degrees, around the model's front axis (it is applied before pitch and yaw,
   * so at the default view it tilts the model like a screen-space roll). While set, interaction
   * only calls `onRollChange` and the model shows exactly this value. Leave it out for an
   * uncontrolled roll that starts at `initialRoll`.
   */
  readonly roll?: number;
  /**
   * Called with the new roll in degrees (wrapped to -180..180) when the user rolls the model:
   * hold Shift while dragging horizontally, press Shift+Left/Right, or scroll horizontally with
   * two fingers (or Shift+wheel). Needs `rotatable`.
   */
  readonly onRollChange?: (roll: number) => void;
  /** Maximum pitch from dragging in degrees. Defaults to 80. */
  readonly pitchLimit?: number;
  /**
   * Rebuilds the scene (`onSceneReady`) when this changes, like changing `textures`, but keeps the
   * rotation the user has given the model (a changed `key` would reset it).
   */
  readonly sceneKey?: string;
  /**
   * Anything that changes what `onFrame` draws without `animated` (a pose, a toggle): when this
   * value changes, one more frame is drawn.
   */
  readonly redrawKey?: unknown;
  /** Shown while loading and when canvas drawing is unavailable. */
  readonly fallback?: ReactNode;
}

const DEGREES = Math.PI / 180;
const DRAG_RADIANS_PER_PIXEL = 0.01;
const KEY_STEP = 0.15;
const WHEEL_RADIANS_PER_PIXEL = 0.005;

/** Wraps radians to -pi..pi. */
function wrapAngle(radians: number): number {
  const turn = Math.PI * 2;
  return radians - turn * Math.round(radians / turn);
}

function noopSubscribe(): () => void {
  return () => undefined;
}

let canvasSupport: boolean | undefined;

/** Whether a 2D canvas can be drawn to (`false` in jsdom and on the server). */
function detectCanvas(): boolean {
  if (typeof document === 'undefined') return false;
  canvasSupport ??= document.createElement('canvas').getContext('2d') !== null;
  return canvasSupport;
}

function useCanvasSupport(): boolean {
  return useSyncExternalStore(noopSubscribe, detectCanvas, () => false);
}

interface Runtime {
  readonly invalidate: () => void;
  readonly resize: () => void;
}

/**
 * A canvas, sized in GUI units and rendered at device resolution, that draws a small 3D scene with
 * the library's own software renderer (`render/model3d/engine.ts`): no WebGL and no dependencies.
 * It only draws when something changed (unless `animated`), pauses while off-screen or when the
 * tab is hidden and frees everything on unmount. While loading, or when the browser cannot draw
 * (no 2D canvas), the `fallback` is shown and nothing throws.
 *
 * Textures are taken from the asset store, so the scene waits for the client files. Use
 * `createBoxQuads` to build Minecraft-style boxes.
 */
export function ModelViewport(props: ModelViewportProps): JSX.Element {
  const {
    width = 64,
    height = 64,
    textures: textureIds,
    camera: cameraProp,
    lighting,
    onSceneReady,
    onFrame,
    rotatable = false,
    followMouse = false,
    autoRotate = false,
    animated = false,
    initialYaw = 0,
    initialPitch = 0,
    initialRoll = 0,
    roll: rollProp,
    onRollChange,
    pitchLimit = 80,
    redrawKey,
    sceneKey = '',
    fallback,
    className,
    style,
    ...rest
  } = props;
  const { store, unit, deviceScale } = useCobble();
  // Re-render when the store changes so textures that finished decoding are picked up.
  useAssetRevision();
  const supported = useCanvasSupport();
  const reducedMotion = usePrefersReducedMotion();
  const [result, setResult] = useState<{ key: string; value: 'ready' | 'failed' } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const viewRef = useRef({
    look: {
      yaw: initialYaw * DEGREES,
      pitch: initialPitch * DEGREES,
      roll: (rollProp ?? initialRoll) * DEGREES,
      followYaw: 0,
      followHeadYaw: 0,
      followPitch: 0,
    } as ModelLook,
    mouse: null as { x: number; y: number } | null,
    drag: null as { id: number; x: number; y: number; roll: boolean } | null,
  });
  const latest = useLatest({
    onSceneReady,
    onFrame,
    camera: cameraProp,
    lighting,
    followMouse,
    autoRotate: reducedMotion ? false : autoRotate,
    animated,
    pitchLimit: pitchLimit * DEGREES,
    roll: rollProp,
    onRollChange,
    width,
    height,
    deviceScale,
    unit,
  });

  const ids = textureIds ?? [];
  const textureKey = ids.join('\n');
  // A result only counts for the texture list it was produced for, so changing the list retries.
  const status = result?.key === textureKey ? result.value : 'loading';
  // Textures decode lazily: reading them here starts the work and `revision` re-renders when done.
  const texturesReady = ids.every((id) => store.getTexture(id) !== undefined);
  const active = supported && texturesReady && status !== 'failed';

  useEffect(() => {
    const host = hostRef.current;
    if (!active || !host) return undefined;
    let disposed = false;
    let teardown: (() => void) | undefined;

    const setup = (): (() => void) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'cobble-model3d-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      const context2d = canvas.getContext('2d');
      if (!context2d) throw new Error('2D canvas is unavailable');
      host.append(canvas);
      const root = new Node3D();
      // Orbit order (`Rx * Ry * Rz`): yaw about the model's vertical axis first, then pitch about the
      // screen's x axis, so dragging always tilts toward the viewer whatever the yaw is. With yaw
      // applied last the pitch would roll the model sideways once it had been turned.
      root.rotationOrder = 'XYZ';

      const textures: Record<string, RgbaImage> = {};
      for (const id of ids) {
        const image = store.getTexture(id);
        if (image) textures[id] = image;
      }

      const view = viewRef.current;
      let frame = 0;
      let visible = document.visibilityState !== 'hidden';
      let last: number | undefined;
      let elapsed = 0;
      let sceneCleanup: void | (() => void);
      let target: RenderTarget = createRenderTarget(1, 1);
      let image: ImageData | undefined;

      const context: ModelSceneContext = {
        root,
        textures,
        look: view.look,
        invalidate: () => runtime.invalidate(),
      };

      const applySize = (): void => {
        const { width: w, height: h, deviceScale: scale } = latest.current;
        const pixelWidth = Math.max(1, Math.round(w * scale));
        const pixelHeight = Math.max(1, Math.round(h * scale));
        if (target.width === pixelWidth && target.height === pixelHeight && image) return;
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        target = createRenderTarget(pixelWidth, pixelHeight);
        image = undefined;
      };

      const tick = (time: number): void => {
        frame = 0;
        if (disposed || !visible) return;
        const settings = latest.current;
        const delta = last === undefined ? 0 : Math.min((time - last) / 1000, 0.25);
        last = time;
        elapsed += delta;
        const speed =
          settings.autoRotate === true
            ? 30
            : settings.autoRotate === false
              ? 0
              : settings.autoRotate;
        if (speed !== 0 && !view.drag) view.look.yaw += speed * DEGREES * delta;

        const mouse = view.mouse;
        if (settings.followMouse && mouse) {
          const angles = followAngles(mouse.x, mouse.y);
          view.look.followYaw = angles.bodyYaw;
          view.look.followHeadYaw = angles.headYaw;
          view.look.followPitch = angles.pitch;
        } else {
          view.look.followYaw = 0;
          view.look.followHeadYaw = 0;
          view.look.followPitch = 0;
        }
        const follow = settings.followMouse === true;
        root.rotation[1] = view.look.yaw + (follow ? view.look.followYaw : 0);
        root.rotation[0] = view.look.pitch + (follow ? view.look.followPitch : 0);
        // Controlled roll always wins over the last interactive value.
        if (settings.roll !== undefined) view.look.roll = settings.roll * DEGREES;
        root.rotation[2] = view.look.roll;

        settings.onFrame?.(context, { delta, time: elapsed });
        renderScene(root, settings.camera ?? {}, target, settings.lighting);
        image ??= new ImageData(target.width, target.height);
        image.data.set(target.data);
        context2d.putImageData(image, 0, 0);
        if (settings.animated || speed !== 0) schedule();
        else last = undefined;
      };
      const schedule = (): void => {
        if (frame === 0 && !disposed && visible) frame = requestAnimationFrame(tick);
      };
      const runtime: Runtime = {
        invalidate: () => {
          schedule();
        },
        resize: () => {
          applySize();
          schedule();
        },
      };
      runtimeRef.current = runtime;
      applySize();

      // Pause while off-screen or in a hidden tab.
      let intersecting = true;
      const updateVisible = (): void => {
        const next = intersecting && document.visibilityState !== 'hidden';
        if (next === visible) return;
        visible = next;
        if (visible) {
          last = undefined;
          schedule();
        } else if (frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
      const observer =
        typeof IntersectionObserver === 'undefined'
          ? undefined
          : new IntersectionObserver((entries) => {
              const entry = entries[entries.length - 1];
              if (entry) intersecting = entry.isIntersecting;
              updateVisible();
            });
      observer?.observe(host);
      document.addEventListener('visibilitychange', updateVisible);

      // `followMouse`: the cursor relative to the viewport's centre, in GUI units.
      const onPointerMove = (event: PointerEvent): void => {
        if (!latest.current.followMouse || event.pointerType === 'touch') return;
        const rect = host.getBoundingClientRect();
        const guiUnit = latest.current.unit;
        view.mouse = {
          x: (event.clientX - (rect.left + rect.width / 2)) / guiUnit,
          y: (event.clientY - (rect.top + rect.height / 2)) / guiUnit,
        };
        runtime.invalidate();
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const cleanup = (): void => {
        disposed = true;
        if (frame !== 0) cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('visibilitychange', updateVisible);
        observer?.disconnect();
        if (typeof sceneCleanup === 'function') sceneCleanup();
        canvas.remove();
        if (runtimeRef.current === runtime) runtimeRef.current = null;
      };

      try {
        sceneCleanup = latest.current.onSceneReady?.(context);
      } catch (error) {
        // Do not leak the canvas when the scene code throws.
        cleanup();
        throw error;
      }
      schedule();
      return cleanup;
    };

    // Set up after the effect returns, so the result can be stored without a synchronous setState.
    void Promise.resolve().then(() => {
      if (disposed) return;
      try {
        teardown = setup();
        setResult({ key: textureKey, value: 'ready' });
      } catch (error) {
        console.warn('[cobble-ui] Could not start the 3D renderer', error);
        setResult({ key: textureKey, value: 'failed' });
      }
    });

    return () => {
      disposed = true;
      teardown?.();
    };
    // The scene is rebuilt only when what it is made of changes; everything else flows through `latest`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [active, textureKey, sceneKey, store, latest]);

  // Sizes and mode changes redraw the existing scene.
  useEffect(() => {
    runtimeRef.current?.resize();
  }, [width, height, deviceScale]);
  useEffect(() => {
    runtimeRef.current?.invalidate();
  }, [followMouse, autoRotate, animated, reducedMotion, redrawKey]);

  const move = useCallback(
    (dyaw: number, dpitch: number): void => {
      const look = viewRef.current.look;
      const limit = latest.current.pitchLimit;
      look.yaw += dyaw;
      look.pitch = Math.max(-limit, Math.min(limit, look.pitch + dpitch));
      runtimeRef.current?.invalidate();
    },
    [latest],
  );

  const rollBy = useCallback(
    (delta: number): void => {
      const look = viewRef.current.look;
      const next = wrapAngle(look.roll + delta);
      // Uncontrolled: the viewport keeps the value. Controlled: the parent decides.
      if (latest.current.roll === undefined) look.roll = next;
      latest.current.onRollChange?.(next / DEGREES);
      runtimeRef.current?.invalidate();
    },
    [latest],
  );

  // A controlled roll redraws when it changes.
  useEffect(() => {
    runtimeRef.current?.invalidate();
  }, [rollProp]);

  // Horizontal two-finger scrolling (or Shift+wheel) rolls the model. A native listener, because
  // React's wheel handlers are passive and could not stop the page from scrolling.
  useEffect(() => {
    const element = hostRef.current?.parentElement;
    if (!rotatable || !element) return undefined;
    const onWheel = (event: WheelEvent): void => {
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!event.shiftKey && !horizontal) return;
      const amount = horizontal ? event.deltaX : event.deltaY;
      event.preventDefault();
      rollBy(amount * WHEEL_RADIANS_PER_PIXEL);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [rotatable, rollBy]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!rotatable || event.button !== 0) return;
    viewRef.current.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      roll: event.shiftKey,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = viewRef.current.drag;
    if (!drag || drag.id !== event.pointerId) return;
    // Shift held when the drag started: horizontal movement rolls instead of turning.
    if (drag.roll) rollBy((event.clientX - drag.x) * DRAG_RADIANS_PER_PIXEL);
    else
      move(
        (event.clientX - drag.x) * DRAG_RADIANS_PER_PIXEL,
        (event.clientY - drag.y) * DRAG_RADIANS_PER_PIXEL,
      );
    drag.x = event.clientX;
    drag.y = event.clientY;
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = viewRef.current.drag;
    if (drag?.id !== event.pointerId) return;
    viewRef.current.drag = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!rotatable) return;
    switch (event.key) {
      case 'ArrowLeft':
        if (event.shiftKey) rollBy(-KEY_STEP);
        else move(-KEY_STEP, 0);
        break;
      case 'ArrowRight':
        if (event.shiftKey) rollBy(KEY_STEP);
        else move(KEY_STEP, 0);
        break;
      case 'ArrowUp':
        move(0, -KEY_STEP);
        break;
      case 'ArrowDown':
        move(0, KEY_STEP);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    // A rotatable viewport is an interactive image: it takes focus and arrow keys, like a slider-less 3D widget.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="img"
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={rotatable ? 0 : undefined}
      aria-roledescription={rotatable ? '3D viewer' : undefined}
      {...rest}
      className={cx('cobble-model3d-viewport', className)}
      data-rotatable={rotatable ? '' : undefined}
      data-status={!supported || status === 'failed' ? 'unsupported' : status}
      style={rootStyle}
      onPointerDown={(event) => {
        rest.onPointerDown?.(event);
        onPointerDown(event);
      }}
      onPointerMove={(event) => {
        rest.onPointerMove?.(event);
        onPointerMove(event);
      }}
      onPointerUp={(event) => {
        rest.onPointerUp?.(event);
        endDrag(event);
      }}
      onPointerCancel={(event) => {
        rest.onPointerCancel?.(event);
        endDrag(event);
      }}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (!event.defaultPrevented) onKeyDown(event);
      }}
    >
      <div ref={hostRef} className="cobble-model3d-host" />
      {status === 'ready' && supported ? null : (
        <div className="cobble-model3d-fallback">{fallback}</div>
      )}
    </div>
  );
}
