import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { useLatest } from '../../internal/hooks.ts';
import { useSound } from '../../provider/hooks.ts';
import { Toast, type ToastVariant } from './Toast.tsx';

/** How long a toast takes to slide in or out (`Toast.SLIDE_ANIMATION_DURATION_MS`). */
export const TOAST_SLIDE_MS = 600;
/** `SystemToast.DEFAULT_DISPLAY_TIME`: how long a toast stays before sliding out. */
export const TOAST_DEFAULT_DURATION_MS = 5000;
/** `ToastManager.MAX_VISIBLE`: more than this wait in the queue. */
export const TOAST_MAX_VISIBLE = 5;

export interface ToastOptions {
  readonly title: ReactNode;
  /** Message lines under the title. */
  readonly messages?: readonly ReactNode[];
  readonly variant?: ToastVariant;
  /** Width in GUI units. Defaults to 160. */
  readonly width?: number;
  /** Milliseconds to stay on screen once slid in; `Infinity` keeps it until dismissed. Defaults to 5000. */
  readonly duration?: number;
  /** Play the toast sounds. Defaults to `true`. */
  readonly sound?: boolean;
}

export interface ToastController {
  /** Queues a toast and returns its id. */
  readonly show: (options: ToastOptions) => number;
  /** Slides a toast out (or removes it from the queue if it has not appeared). */
  readonly dismiss: (id: number) => void;
  /** Dismisses every toast. */
  readonly dismissAll: () => void;
}

interface ToastRecord {
  readonly id: number;
  readonly options: ToastOptions;
  readonly closing: boolean;
}

const ToastContext = createContext<ToastController | null>(null);

/** The toast queue's controller. Must be used inside a {@link ToastProvider}. */
export function useToasts(): ToastController {
  const controller = useContext(ToastContext);
  if (!controller) throw new Error('useToasts() must be used inside a <ToastProvider>.');
  return controller;
}

function ToastItem(props: {
  readonly record: ToastRecord;
  readonly onGone: (id: number) => void;
}): JSX.Element {
  const { record, onGone } = props;
  const { options } = record;
  const play = useSound();
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const latest = useLatest({ play, onGone, sound: options.sound !== false });
  const duration = options.duration ?? TOAST_DEFAULT_DURATION_MS;

  // Slide in on the next frame so the transition runs, then slide out after the display time.
  useEffect(() => {
    const enter = setTimeout(() => {
      setEntered(true);
      if (latest.current.sound) latest.current.play('ui.toast.in');
    }, 0);
    if (!Number.isFinite(duration)) return () => clearTimeout(enter);
    const leave = setTimeout(() => setLeaving(true), TOAST_SLIDE_MS + duration);
    return () => {
      clearTimeout(enter);
      clearTimeout(leave);
    };
  }, [duration, latest]);

  const exiting = leaving || record.closing;
  const open = entered && !exiting;
  useEffect(() => {
    if (!exiting) return undefined;
    if (latest.current.sound) latest.current.play('ui.toast.out');
    const done = setTimeout(() => latest.current.onGone(record.id), TOAST_SLIDE_MS);
    return () => clearTimeout(done);
  }, [exiting, latest, record.id]);

  return (
    <Toast
      open={open}
      title={options.title}
      {...(options.messages === undefined ? {} : { messages: options.messages })}
      {...(options.variant === undefined ? {} : { variant: options.variant })}
      {...(options.width === undefined ? {} : { width: options.width })}
    />
  );
}

export interface ToastProviderProps {
  readonly children?: ReactNode;
  /** Toasts shown at once; the rest wait their turn. Defaults to 5. */
  readonly maxVisible?: number;
}

/**
 * Queues and stacks toasts down the right edge of the screen, the way the game does: at most
 * `maxVisible` at once, each sliding in over 600 ms, staying 5 seconds, then sliding out.
 * Call {@link useToasts} below it to show one.
 */
export function ToastProvider(props: ToastProviderProps): JSX.Element {
  const { children, maxVisible = TOAST_MAX_VISIBLE } = props;
  const [records, setRecords] = useState<readonly ToastRecord[]>([]);
  const nextId = useRef(1);

  const show = useCallback((options: ToastOptions): number => {
    const id = nextId.current++;
    setRecords((current) => [...current, { id, options, closing: false }]);
    return id;
  }, []);
  const dismiss = useCallback(
    (id: number): void => {
      setRecords((current) =>
        current.flatMap((r, index) => {
          if (r.id !== id) return [r];
          return index < maxVisible ? [{ ...r, closing: true }] : [];
        }),
      );
    },
    [maxVisible],
  );
  const dismissAll = useCallback((): void => {
    setRecords((current) =>
      current.flatMap((r, index) => (index < maxVisible ? [{ ...r, closing: true }] : [])),
    );
  }, [maxVisible]);
  const remove = useCallback((id: number): void => {
    setRecords((current) => current.filter((r) => r.id !== id));
  }, []);

  const controller = useMemo<ToastController>(
    () => ({ show, dismiss, dismissAll }),
    [show, dismiss, dismissAll],
  );

  const visible = records.slice(0, Math.max(maxVisible, 1));

  return (
    <ToastContext value={controller}>
      {children}
      <div className="cobble-toast-viewport" role="region" aria-label="Notifications">
        {visible.map((record) => (
          <ToastItem key={record.id} record={record} onGone={remove} />
        ))}
      </div>
    </ToastContext>
  );
}
