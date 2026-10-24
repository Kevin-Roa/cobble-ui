import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { mojangAssets } from '../assets/mojang.ts';
import { AssetStore } from '../assets/store.ts';
import type { AssetSource } from '../assets/types.ts';
import { SoundPlayer, type SoundSettings } from '../sound/sounds.ts';
import { CobbleContext, type CobbleContextValue, type CobbleSettings } from './context.ts';
import { DEFAULT_FONT_FAMILY, fontFaceCss, type FontOptions } from './font.ts';
import { calculateAutoGuiScale, resolveScale } from './scale.ts';

export interface SoundOptions {
  /** Whether UI sounds play. Defaults to `true`. */
  readonly enabled?: boolean;
  /** Master volume, 0–1. Defaults to `1`. */
  readonly master?: number;
  /** UI category volume, 0–1. Defaults to `1`. */
  readonly ui?: number;
}

export interface CobbleProviderProps {
  readonly children?: ReactNode;
  /**
   * Where the game's textures and sounds come from. Defaults to
   * `mojangAssets()`, which downloads them from Mojang at runtime. Nested
   * providers reuse their parent's assets unless this is set.
   */
  readonly assets?: AssetSource;
  /**
   * GUI scale: CSS pixels per GUI unit, or `"auto"` to pick the largest scale
   * that keeps the viewport at least 320×240 units (like the game).
   * Defaults to `"auto"`.
   */
  readonly guiScale?: number | 'auto';
  /** Upper bound for `"auto"`; `0` means no limit. Defaults to `0`. */
  readonly maxGuiScale?: number;
  /**
   * Round the GUI unit so it covers a whole number of device pixels, keeping
   * sprites crisp on fractional device pixel ratios. Defaults to `true`.
   */
  readonly pixelSnap?: boolean;
  /**
   * Font files to register. Pass `minecraftTtf('/fonts')` after running
   * `npx cobble-ui fonts public/fonts`. When omitted, the font family named by
   * `font.family` (or `"Cobble UI"`) is expected to be provided by your own CSS.
   */
  readonly font?: FontOptions;
  /** UI sound settings. */
  readonly sound?: SoundOptions;
  /**
   * Use the textures shown while a world is loaded (translucent menu
   * backgrounds and darker separators). Defaults to `false`.
   */
  readonly inWorld?: boolean;
  /** Menu background blur, 0–10, like the "Menu Background Blur" option. Defaults to `5`. */
  readonly menuBlur?: number;
  /** Panorama scroll speed multiplier, 0.01–1 in the game. Defaults to `1`. */
  readonly panoramaSpeed?: number;
  /**
   * Rasterize item icons ahead of time so `ItemIcon`s appear instantly. `true` preloads every
   * item in the game; a list of item ids (`["diamond_sword", "torch"]`) preloads just those. Work
   * happens in idle slices, in a web worker where the browser supports workers and
   * `OffscreenCanvas` (otherwise only the item files are decoded, on the main thread).
   * Not inherited by nested providers. Defaults to `false`.
   */
  readonly backgroundPreloadItems?: boolean | readonly string[];
}

const stores = new Map<string, AssetStore>();
let defaultSource: AssetSource | undefined;

function storeFor(source: AssetSource): AssetStore {
  let store = stores.get(source.key);
  if (!store) {
    store = new AssetStore(source);
    stores.set(source.key, store);
  }
  return store;
}

interface ViewportSize {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

const SERVER_VIEWPORT: ViewportSize = { width: 1280, height: 720, dpr: 1 };
let viewport: ViewportSize = SERVER_VIEWPORT;

function readViewport(): ViewportSize {
  const next = {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
  if (
    next.width !== viewport.width ||
    next.height !== viewport.height ||
    next.dpr !== viewport.dpr
  ) {
    viewport = next;
  }
  return viewport;
}

function subscribeViewport(onChange: () => void): () => void {
  let media: MediaQueryList | undefined;
  const watchDpr = (): void => {
    media?.removeEventListener('change', handleDpr);
    if (typeof window.matchMedia !== 'function') return;
    media = window.matchMedia(`(resolution: ${String(window.devicePixelRatio || 1)}dppx)`);
    media.addEventListener('change', handleDpr);
  };
  function handleDpr(): void {
    watchDpr();
    onChange();
  }
  watchDpr();
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    media?.removeEventListener('change', handleDpr);
  };
}

function useViewport(): ViewportSize {
  return useSyncExternalStore(subscribeViewport, readViewport, () => SERVER_VIEWPORT);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Configures every Cobble UI component rendered inside it: GUI scale, font,
 * sounds and where game assets are loaded from. Providers can be nested; a
 * nested provider inherits everything it does not override.
 */
export function CobbleProvider(props: CobbleProviderProps): JSX.Element {
  const parent = useContext(CobbleContext);
  const viewportSize = useViewport();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  const store = useMemo(() => {
    if (props.assets) return storeFor(props.assets);
    if (parent) return parent.store;
    defaultSource ??= mojangAssets();
    return storeFor(defaultSource);
  }, [props.assets, parent]);

  useEffect(() => store.retain(), [store]);

  const inherited = parent?.settings;
  const settings: CobbleSettings = {
    guiScale: props.guiScale ?? inherited?.guiScale ?? 'auto',
    maxGuiScale: props.maxGuiScale ?? inherited?.maxGuiScale ?? 0,
    pixelSnap: props.pixelSnap ?? inherited?.pixelSnap ?? true,
    inWorld: props.inWorld ?? inherited?.inWorld ?? false,
    menuBlur: clamp(props.menuBlur ?? inherited?.menuBlur ?? 5, 0, 10),
    panoramaSpeed: props.panoramaSpeed ?? inherited?.panoramaSpeed ?? 1,
    fontFamily: props.font?.family ?? inherited?.fontFamily ?? DEFAULT_FONT_FAMILY,
    sound: {
      enabled: props.sound?.enabled ?? inherited?.sound.enabled ?? true,
      master: clamp(props.sound?.master ?? inherited?.sound.master ?? 1, 0, 1),
      ui: clamp(props.sound?.ui ?? inherited?.sound.ui ?? 1, 0, 1),
    },
  };

  const guiScale =
    settings.guiScale === 'auto'
      ? calculateAutoGuiScale(viewportSize.width, viewportSize.height, settings.maxGuiScale)
      : settings.guiScale;
  const { unit, device } = resolveScale(guiScale, viewportSize.dpr, settings.pixelSnap);

  const soundSettingsRef = useRef<SoundSettings>(settings.sound);
  soundSettingsRef.current = settings.sound;
  const sound = useMemo(
    () =>
      new SoundPlayer(
        (name) => store.getObjectUrl(name),
        () => soundSettingsRef.current,
      ),
    [store],
  );

  const preloadKey =
    props.backgroundPreloadItems === true
      ? 'all'
      : Array.isArray(props.backgroundPreloadItems) && props.backgroundPreloadItems.length > 0
        ? JSON.stringify(props.backgroundPreloadItems)
        : '';
  useEffect(() => {
    if (preloadKey === '') return;
    const names = preloadKey === 'all' ? true : (JSON.parse(preloadKey) as string[]);
    let started: unknown;
    let cancel: (() => void) | undefined;
    const start = (): void => {
      const bundle = store.getState().bundle;
      if (!bundle || bundle === started) return;
      started = bundle;
      cancel?.();
      cancel = store.preloadItems(names, device);
    };
    start();
    const unsubscribe = store.subscribe(start);
    return () => {
      unsubscribe();
      cancel?.();
    };
  }, [store, preloadKey, device]);

  const { enabled, master, ui } = settings.sound;
  const soundSettings = useMemo(() => ({ enabled, master, ui }), [enabled, master, ui]);
  const value = useMemo<CobbleContextValue>(
    () => ({
      store,
      guiScale,
      unit,
      deviceScale: device,
      inWorld: settings.inWorld,
      menuBlur: settings.menuBlur,
      panoramaSpeed: settings.panoramaSpeed,
      sound,
      soundSettings,
      fontFamily: settings.fontFamily,
      portalContainer,
      settings: {
        ...settings,
        sound: soundSettings,
      },
    }),
    // `settings` is rebuilt every render; depend on its fields instead.
    // oxlint-disable-next-line react/exhaustive-deps
    [
      store,
      guiScale,
      unit,
      device,
      sound,
      soundSettings,
      portalContainer,
      settings.guiScale,
      settings.maxGuiScale,
      settings.pixelSnap,
      settings.inWorld,
      settings.menuBlur,
      settings.panoramaSpeed,
      settings.fontFamily,
    ],
  );

  const fontCss = props.font ? fontFaceCss(props.font) : '';
  const style = {
    '--cobble-scale': String(unit),
    '--cobble-font-family': JSON.stringify(settings.fontFamily),
  } as CSSProperties;

  return (
    <CobbleContext value={value}>
      {fontCss ? (
        <style href={`cobble-ui-font-${hashString(fontCss)}`} precedence="cobble-ui">
          {fontCss}
        </style>
      ) : null}
      <div
        className="cobble-root"
        data-in-world={settings.inWorld ? '' : undefined}
        data-gui-scale={guiScale}
        style={style}
      >
        {props.children}
        <div className="cobble-portal" ref={setPortalContainer} />
      </div>
    </CobbleContext>
  );
}

function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}
