import { mergeProps } from '@base-ui/react/merge-props';
import type { JSX, ReactNode } from 'react';
import type { AssetLoadProgress } from '../../assets/types.ts';
import type { SlotProps } from '../../internal/polymorphic.ts';
import { useAssets } from '../../provider/hooks.ts';
import { Text } from '../../text/Text.tsx';
import { Button } from '../button/Button.tsx';
import { cx } from '../shared.ts';
import { ProgressBar } from './ProgressBar.tsx';

/** Default wording for each phase of loading the game assets. */
export const ASSET_PHASE_LABELS: Readonly<Record<AssetLoadProgress['phase'], string>> = {
  cache: 'Reading cached game assets',
  manifest: 'Looking up the game version',
  download: 'Downloading the game client from Mojang',
  verify: 'Verifying download',
  extract: 'Extracting GUI textures',
};

/** Fraction of the current phase that is done, or `undefined` when its size is unknown. */
export function assetProgressFraction(progress: AssetLoadProgress | undefined): number | undefined {
  if (progress === undefined || progress.total <= 0) return undefined;
  return Math.min(Math.max(progress.loaded / progress.total, 0), 1);
}

/** `12.3` for a byte count, as shown in the download line. */
export function formatMegabytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

export interface AssetLoadingOverlaySlotProps {
  readonly bar?: Omit<SlotProps<'div'>, 'children'>;
}

export interface AssetLoadingOverlayProps extends Omit<SlotProps<'div'>, 'children'> {
  /** `panel` is a box at the bottom of the screen; `screen` covers it with a dark background. */
  readonly variant?: 'panel' | 'screen';
  /** Replaces the phase wording. */
  readonly phaseLabels?: Partial<Record<AssetLoadProgress['phase'], string>>;
  /** Shown under the progress bar while the game client is downloading. */
  readonly note?: ReactNode;
  /** Width of the progress bar in GUI units. Defaults to 200. */
  readonly barWidth?: number;
  readonly slotProps?: AssetLoadingOverlaySlotProps;
}

/**
 * Shows what the provider is doing while it fetches the game assets: the phase, megabytes
 * downloaded and a progress bar, or the error with a retry button. It renders nothing once the
 * assets are ready. The first visit downloads the official client (about 41 MB); later visits
 * read the cache.
 */
export function AssetLoadingOverlay(props: AssetLoadingOverlayProps): JSX.Element | null {
  const {
    variant = 'panel',
    phaseLabels,
    note,
    barWidth = 200,
    slotProps,
    className,
    ...rest
  } = props;
  const { status, progress, error, reload } = useAssets();
  if (status === 'ready') return null;

  const labels = { ...ASSET_PHASE_LABELS, ...phaseLabels };
  const root = mergeProps<'div'>(
    { className: cx('cobble-asset-overlay', className) },
    rest as SlotProps<'div'>,
  );

  if (status === 'error') {
    return (
      <div {...root} role="alert" data-variant={variant} data-status="error">
        <Text color="red">Could not load the game assets.</Text>
        <Text color="gray">{error instanceof Error ? error.message : String(error)}</Text>
        <Button width={100} onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  const fraction = assetProgressFraction(progress);
  return (
    <div {...root} role="status" aria-live="polite" data-variant={variant} data-status={status}>
      <Text>{progress ? labels[progress.phase] : 'Starting'}…</Text>
      {progress?.phase === 'download' && progress.total > 0 ? (
        <Text color="gray">
          {formatMegabytes(progress.loaded)} / {formatMegabytes(progress.total)} MB
          {note === undefined ? null : <> {note}</>}
        </Text>
      ) : null}
      <ProgressBar
        {...slotProps?.bar}
        width={barWidth}
        label="Loading game assets"
        {...(fraction === undefined ? {} : { progress: fraction })}
      />
    </div>
  );
}
