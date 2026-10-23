import { mergeProps } from '@base-ui/react/merge-props';
import { useRef, useState, type ElementType, type JSX } from 'react';
import {
  useAnimationFrame,
  usePrefersReducedMotion,
  useElementState,
  useIsomorphicLayoutEffect,
} from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useObjectUrl } from '../../provider/hooks.ts';
import { cx } from '../shared.ts';

/** `CubeMap.PROJECTION_FOV` (vertical). */
const FOV = 85;
/** `GuiRenderer#render` passes a fixed pitch of 10°. */
const PITCH = 10;
/** Degrees per tick at speed 1 (`Panorama#extractRenderState`). */
const DEGREES_PER_TICK = 0.1;
const TICKS_PER_SECOND = 20;

const BASE = 'minecraft/textures/gui/title/background/panorama';

/** Faces of the cube and their CSS placement (front = `_0`, then clockwise, up = `_4`, down = `_5`). */
const FACES = [
  { index: 0, name: 'front', transform: 'translateZ(calc(-1 * var(--cobble-panorama-depth)))' },
  {
    index: 1,
    name: 'right',
    transform: 'rotateY(-90deg) translateZ(calc(-1 * var(--cobble-panorama-depth)))',
  },
  {
    index: 2,
    name: 'back',
    transform: 'rotateY(180deg) translateZ(calc(-1 * var(--cobble-panorama-depth)))',
  },
  {
    index: 3,
    name: 'left',
    transform: 'rotateY(90deg) translateZ(calc(-1 * var(--cobble-panorama-depth)))',
  },
  {
    index: 4,
    name: 'up',
    transform: 'rotateX(-90deg) translateZ(calc(-1 * var(--cobble-panorama-depth)))',
  },
  {
    index: 5,
    name: 'down',
    transform: 'rotateX(90deg) translateZ(calc(-1 * var(--cobble-panorama-depth)))',
  },
] as const;

/**
 * Spin is shared by every panorama on the page, like the game's single
 * `Panorama` instance, so it keeps turning smoothly between screens.
 */
let sharedSpin = 0;
let lastTime: number | undefined;

/** Longest frame gap that still advances the spin (avoids jumps after pauses or hidden tabs). */
const MAX_FRAME_GAP_MS = 250;

function advance(time: number, speed: number): number {
  if (lastTime !== undefined && time > lastTime && time - lastTime <= MAX_FRAME_GAP_MS) {
    const ticks = ((time - lastTime) / 1000) * TICKS_PER_SECOND;
    sharedSpin = (sharedSpin + ticks * speed * DEGREES_PER_TICK) % 360;
  }
  lastTime = time;
  return sharedSpin;
}

export interface PanoramaSlotProps {
  /** The element the six faces are placed in. */
  readonly cube?: SlotProps<'div'>;
  /** `panorama_overlay.png`, stretched over the panorama. */
  readonly overlay?: SlotProps<'img'>;
}

export interface PanoramaOwnProps {
  /**
   * Base name of the six images in the asset index. Defaults to the vanilla
   * title screen panorama.
   */
  readonly base?: string;
  /** Rotation speed multiplier. Defaults to the provider's `panoramaSpeed`. */
  readonly speed?: number;
  /** Stop rotating (`Panorama#holdSpin`). */
  readonly paused?: boolean;
  /** Hold still when the system asks to reduce motion. Defaults to `true`. */
  readonly respectReducedMotion?: boolean;
  /** Draw `panorama_overlay.png` on top. Defaults to `true`. */
  readonly overlay?: boolean;
  readonly slotProps?: PanoramaSlotProps;
}

export type PanoramaProps<E extends ElementType = 'div'> = PolymorphicProps<E, PanoramaOwnProps>;

/**
 * The rotating title-screen panorama: a cube map viewed with an 85° vertical
 * field of view, pitched 10°, turning 2° per second. Fills its container.
 */
export function Panorama<E extends ElementType = 'div'>(props: PanoramaProps<E>): JSX.Element {
  const {
    as,
    base = BASE,
    speed,
    paused = false,
    respectReducedMotion = true,
    overlay = true,
    slotProps,
    className,
    style,
    ...rest
  } = props as PanoramaProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { panoramaSpeed } = useCobble();
  const effectiveSpeed = speed ?? panoramaSpeed;
  const reducedMotion = usePrefersReducedMotion();
  const still = paused || (respectReducedMotion && reducedMotion);
  const urls = [
    useObjectUrl(`${base}_0.png`),
    useObjectUrl(`${base}_1.png`),
    useObjectUrl(`${base}_2.png`),
    useObjectUrl(`${base}_3.png`),
    useObjectUrl(`${base}_4.png`),
    useObjectUrl(`${base}_5.png`),
  ];
  const overlayUrl = useObjectUrl(`${BASE}_overlay.png`);
  const [root, setRoot] = useElementState<HTMLElement>();
  const cube = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    if (!root) return undefined;
    const update = (): void => {
      setDepth(root.clientHeight / 2 / Math.tan(((FOV / 2) * Math.PI) / 180));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [root]);

  const apply = (spin: number): void => {
    if (cube.current) {
      cube.current.style.transform = `translateZ(var(--cobble-panorama-depth)) rotateX(${String(-PITCH)}deg) rotateY(${String(spin)}deg)`;
    }
  };
  useIsomorphicLayoutEffect(() => apply(sharedSpin));
  useAnimationFrame(!still, (time) => apply(advance(time, effectiveSpeed)));

  const rootStyle: CssVariables = {
    '--cobble-panorama-depth': `${String(depth)}px`,
    ...style,
  };

  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-panorama', className), style: rootStyle },
        rest,
      )}
      ref={setRoot}
      aria-hidden
      data-loaded={urls.every((url) => url !== undefined) ? '' : undefined}
    >
      <div
        {...slotProps?.cube}
        ref={cube}
        className={cx('cobble-panorama-cube', slotProps?.cube?.className)}
      >
        {FACES.map((face) => {
          const url = urls[face.index];
          return url === undefined ? null : (
            <img
              key={face.name}
              className="cobble-panorama-face"
              data-face={face.name}
              src={url}
              alt=""
              draggable={false}
              style={{ transform: face.transform }}
            />
          );
        })}
      </div>
      {overlay && overlayUrl !== undefined ? (
        <img
          {...slotProps?.overlay}
          className={cx('cobble-panorama-overlay', slotProps?.overlay?.className)}
          src={overlayUrl}
          alt=""
          draggable={false}
        />
      ) : null}
    </Component>
  );
}
