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
import type { Group, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import { useLatest, usePrefersReducedMotion } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useAssetRevision } from '../../provider/hooks.ts';
import { createTexture, followAngles, type ThreeModule } from '../../render/three/box.ts';
import { cx } from '../shared.ts';

/** The rotation applied to {@link ThreeSceneContext.root} each frame, in radians. */
export interface ThreeLook {
  /** Yaw from dragging, the arrow keys, `autoRotate` and `initialYaw`. Positive turns the front toward +x. */
  yaw: number;
  /** Pitch from dragging and the arrow keys. Positive looks down. */
  pitch: number;
  /** Body yaw toward the cursor (`followMouse`), `0` when not following. */
  followYaw: number;
  /** Extra head yaw toward the cursor on top of `followYaw` (vanilla turns the head twice as far). */
  followHeadYaw: number;
  /** Pitch toward the cursor, positive looks down. */
  followPitch: number;
}

/** Everything a scene builder gets from {@link ThreeViewport}. */
export interface ThreeSceneContext {
  /** The lazily loaded `three` module. */
  readonly three: ThreeModule;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  /** Perspective camera, positioned from the `camera` prop. */
  readonly camera: PerspectiveCamera;
  /**
   * Add your model here. The viewport rotates this group (yaw/pitch from the user, `autoRotate`
   * and `followMouse`); everything under it turns together around the origin.
   */
  readonly root: Group;
  /** The textures requested with the `textures` prop, keyed by texture id (nearest filtered, sRGB). Disposed for you. */
  readonly textures: Readonly<Record<string, Texture>>;
  /** The live rotation state, updated before every `onFrame`. */
  readonly look: Readonly<ThreeLook>;
  /** Draw another frame (only needed when you change the scene outside `onFrame` and `animated` is off). */
  readonly invalidate: () => void;
}

export interface ThreeFrame {
  /** Seconds since the previous frame (`0` for the first). */
  readonly delta: number;
  /** Seconds since the scene was created. */
  readonly time: number;
}

export interface ThreeCameraOptions {
  /** Vertical field of view in degrees. Defaults to 30. */
  readonly fov?: number;
  /** Camera position. Defaults to `[0, 0, 5]`, looking at the origin. */
  readonly position?: readonly [x: number, y: number, z: number];
  /** Point the camera looks at. Defaults to the origin. */
  readonly target?: readonly [x: number, y: number, z: number];
}

export interface ThreeViewportProps extends Omit<SlotProps<'div'>, 'children' | 'onError'> {
  /** Width in GUI units. Defaults to 64. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 64. */
  readonly height?: number;
  /** Accessible name of the viewport (it is exposed as an image). */
  readonly 'aria-label': string;
  /**
   * Called once when `three` is loaded, WebGL works and every requested texture has been
   * decoded. Build the scene under `ctx.root`. May return a cleanup function. The latest
   * callback is used; changing it does not rebuild the scene (change `textures` or `key` for that).
   */
  readonly onSceneReady?: (context: ThreeSceneContext) => void | (() => void);
  /** Called before every rendered frame, after the rotation was applied. Only use with `animated` for continuous animation. */
  readonly onFrame?: (context: ThreeSceneContext, frame: ThreeFrame) => void;
  /**
   * Texture ids to load from the asset store (`block/stone`, `entity/player/wide/steve`, ...).
   * The scene is only built once all of them are available. Changing the list rebuilds the scene.
   */
  readonly textures?: readonly string[];
  /** Camera setup. */
  readonly camera?: ThreeCameraOptions;
  /** Dragging with the pointer or pressing the arrow keys rotates the model. Defaults to `false`. */
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
  /** Starting yaw and pitch in degrees. */
  readonly initialYaw?: number;
  readonly initialPitch?: number;
  /** Maximum pitch from dragging in degrees. Defaults to 80. */
  readonly pitchLimit?: number;
  /** Shown while loading and when WebGL is unavailable. */
  readonly fallback?: ReactNode;
}

const DEGREES = Math.PI / 180;
const DRAG_RADIANS_PER_PIXEL = 0.01;
const KEY_STEP = 0.15;

function onContextLost(event: Event): void {
  event.preventDefault();
}

function noopSubscribe(): () => void {
  return () => undefined;
}

function detectWebGl(): boolean {
  return (
    typeof document !== 'undefined' &&
    (typeof WebGL2RenderingContext !== 'undefined' || typeof WebGLRenderingContext !== 'undefined')
  );
}

/** Whether the browser exposes WebGL at all (`false` in jsdom and on the server). */
function useWebGlSupport(): boolean {
  return useSyncExternalStore(noopSubscribe, detectWebGl, () => false);
}

interface Runtime {
  readonly invalidate: () => void;
  readonly resize: () => void;
}

/** Frees the GPU resources of everything under `object`. */
function disposeObject(object: Scene | Group): void {
  object.traverse((child) => {
    const mesh = child as {
      geometry?: { dispose?: () => void };
      material?: { dispose?: () => void } | { dispose?: () => void }[];
    };
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) material?.dispose?.();
  });
}

/**
 * A WebGL canvas, sized in GUI units and rendered at device resolution, hosting a `three`
 * scene. `three` is loaded lazily (it is an optional peer dependency) so it costs nothing until
 * a viewport is mounted. The renderer pauses while off-screen or when the tab is hidden, only
 * draws when something changed (unless `animated`) and disposes everything on unmount. Without
 * WebGL (or while loading) the `fallback` is shown and nothing throws.
 *
 * Textures are taken from the asset store, so the scene waits for the client files. Use
 * `createBoxGeometry` and `createTexture` to build Minecraft-style boxes.
 */
export function ThreeViewport(props: ThreeViewportProps): JSX.Element {
  const {
    width = 64,
    height = 64,
    textures: textureIds,
    camera: cameraProp,
    onSceneReady,
    onFrame,
    rotatable = false,
    followMouse = false,
    autoRotate = false,
    animated = false,
    initialYaw = 0,
    initialPitch = 0,
    pitchLimit = 80,
    fallback,
    className,
    style,
    ...rest
  } = props;
  const { store, unit, deviceScale } = useCobble();
  // Re-render when the store changes so textures that finished decoding are picked up.
  useAssetRevision();
  const supported = useWebGlSupport();
  const reducedMotion = usePrefersReducedMotion();
  const [result, setResult] = useState<{ key: string; value: 'ready' | 'failed' } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const viewRef = useRef({
    look: {
      yaw: initialYaw * DEGREES,
      pitch: initialPitch * DEGREES,
      followYaw: 0,
      followHeadYaw: 0,
      followPitch: 0,
    } as ThreeLook,
    mouse: null as { x: number; y: number } | null,
    drag: null as { id: number; x: number; y: number } | null,
  });
  const latest = useLatest({
    onSceneReady,
    onFrame,
    camera: cameraProp,
    followMouse,
    autoRotate: reducedMotion ? false : autoRotate,
    animated,
    pitchLimit: pitchLimit * DEGREES,
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

    const setup = (three: ThreeModule): (() => void) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'cobble-three-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      const renderer = new three.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      host.append(canvas);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      const scene = new three.Scene();
      const camera = new three.PerspectiveCamera(30, 1, 0.1, 2000);
      const root = new three.Group();
      scene.add(root);

      const textures: Record<string, Texture> = {};
      for (const id of ids) {
        const image = store.getTexture(id);
        if (image) textures[id] = createTexture(three, image);
      }
      const { camera: cameraOptions } = latest.current;
      camera.fov = cameraOptions?.fov ?? 30;
      const [camX, camY, camZ] = cameraOptions?.position ?? [0, 0, 5];
      camera.position.set(camX, camY, camZ);
      const [tx, ty, tz] = cameraOptions?.target ?? [0, 0, 0];
      camera.lookAt(tx, ty, tz);

      const view = viewRef.current;
      let frame = 0;
      let visible = document.visibilityState !== 'hidden';
      let last: number | undefined;
      let elapsed = 0;
      let sceneCleanup: void | (() => void);

      const context: ThreeSceneContext = {
        three,
        renderer,
        scene,
        camera,
        root,
        textures,
        look: view.look,
        invalidate: () => runtime.invalidate(),
      };

      const applySize = (): void => {
        const { width: w, height: h, deviceScale: scale } = latest.current;
        const pixelWidth = Math.max(1, Math.round(w * scale));
        const pixelHeight = Math.max(1, Math.round(h * scale));
        renderer.setSize(pixelWidth, pixelHeight, false);
        camera.aspect = pixelWidth / pixelHeight;
        camera.updateProjectionMatrix();
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
        root.rotation.order = 'YXZ';
        root.rotation.y = view.look.yaw + (follow ? view.look.followYaw : 0);
        root.rotation.x = view.look.pitch + (follow ? view.look.followPitch : 0);

        settings.onFrame?.(context, { delta, time: elapsed });
        renderer.render(scene, camera);
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

      // Contexts can be lost (GPU reset, too many contexts); drawing resumes when restored.
      const onRestored = (): void => runtime.invalidate();
      canvas.addEventListener('webglcontextrestored', onRestored);
      canvas.addEventListener('webglcontextlost', onContextLost);

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
        canvas.removeEventListener('webglcontextrestored', onRestored);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        if (typeof sceneCleanup === 'function') sceneCleanup();
        disposeObject(scene);
        scene.clear();
        for (const texture of Object.values(textures)) texture.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
        if (runtimeRef.current === runtime) runtimeRef.current = null;
      };

      try {
        sceneCleanup = latest.current.onSceneReady?.(context);
      } catch (error) {
        // Do not leak the renderer when the scene code throws.
        cleanup();
        throw error;
      }
      schedule();
      return cleanup;
    };

    import('three').then(
      (three) => {
        if (disposed) return;
        try {
          teardown = setup(three);
          setResult({ key: textureKey, value: 'ready' });
        } catch (error) {
          console.warn('[cobble-ui] Could not start the WebGL renderer', error);
          setResult({ key: textureKey, value: 'failed' });
        }
      },
      (error: unknown) => {
        if (disposed) return;
        console.warn('[cobble-ui] Could not load three.js', error);
        setResult({ key: textureKey, value: 'failed' });
      },
    );

    return () => {
      disposed = true;
      teardown?.();
    };
    // The scene is rebuilt only when what it is made of changes; everything else flows through `latest`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [active, textureKey, store, latest]);

  // Sizes and mode changes redraw the existing scene.
  useEffect(() => {
    runtimeRef.current?.resize();
  }, [width, height, deviceScale]);
  useEffect(() => {
    runtimeRef.current?.invalidate();
  }, [followMouse, autoRotate, animated, reducedMotion]);

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

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!rotatable || event.button !== 0) return;
    viewRef.current.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = viewRef.current.drag;
    if (!drag || drag.id !== event.pointerId) return;
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
        move(-KEY_STEP, 0);
        break;
      case 'ArrowRight':
        move(KEY_STEP, 0);
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
      className={cx('cobble-three-viewport', className)}
      data-rotatable={rotatable ? '' : undefined}
      data-status={supported ? status : 'unsupported'}
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
      <div ref={hostRef} className="cobble-three-host" />
      {status === 'ready' && supported ? null : (
        <div className="cobble-three-fallback">{fallback}</div>
      )}
    </div>
  );
}
