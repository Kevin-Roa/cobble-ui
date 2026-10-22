import { Button, Text, useAssets } from 'cobble-ui';
import type { JSX } from 'react';

const PHASES = {
  cache: 'Reading cached game assets',
  manifest: 'Looking up Minecraft 26.3',
  download: 'Downloading the game client from Mojang',
  verify: 'Verifying download',
  extract: 'Extracting GUI textures',
} as const;

function megabytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

/**
 * Shows progress while the provider downloads the game assets. The first
 * visit downloads the official client jar (≈41 MB); later visits use the cache.
 */
export function AssetLoader(): JSX.Element | null {
  const { status, progress, error, reload } = useAssets();
  if (status === 'ready') return null;

  if (status === 'error') {
    return (
      <div className="site-loader" role="alert">
        <Text color="red">Could not load the game assets from Mojang.</Text>
        <Text color="gray">{error instanceof Error ? error.message : String(error)}</Text>
        <Button width={100} onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  const fraction =
    progress?.phase === 'download' && progress.total > 0
      ? progress.loaded / progress.total
      : undefined;
  return (
    <div className="site-loader" role="status" aria-live="polite">
      <Text>{progress ? PHASES[progress.phase] : 'Starting'}…</Text>
      {progress?.phase === 'download' ? (
        <Text color="gray">
          {megabytes(progress.loaded)} / {megabytes(progress.total)} MB (first visit only)
        </Text>
      ) : null}
      <div className="site-loader-bar" aria-hidden>
        <div
          className="site-loader-bar-fill"
          style={{ width: `${String(Math.round((fraction ?? 0) * 100))}%` }}
        />
      </div>
    </div>
  );
}
