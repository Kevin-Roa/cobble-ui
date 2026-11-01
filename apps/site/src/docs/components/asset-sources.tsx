import {
  Button,
  CobbleProvider,
  Text,
  mojangAssets,
  type AssetBundle,
  type AssetSource,
} from 'cobble-ui';
import { unzipSync, zipSync } from 'fflate';
import { useMemo, useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, H3, P } from '../../components/Prose.tsx';

const BUTTON_PATH = 'assets/minecraft/textures/gui/sprites/widget/button.png';

let nextPack = 0;

/** An AssetSource that lays the textures of a resource pack (a zip) over `base`. */
function resourcePackAssets(base: AssetSource, zip: Uint8Array): AssetSource {
  const files = unzipSync(zip, {
    filter: (file) => file.name.startsWith('assets/minecraft/textures/'),
  });
  return {
    key: `pack:${String(++nextPack)}:${base.key}`,
    async load(options) {
      const inner: AssetBundle = await base.load(options);
      return {
        version: inner.version,
        file: (path) => {
          const bytes = files[path];
          return bytes
            ? new Blob([new Uint8Array(bytes)], { type: 'image/png' })
            : inner.file(path);
        },
        objectUrl: (name) => inner.objectUrl(name),
      };
    },
  };
}

/** Builds a one-file pack whose `button.png` is a flat red 200x20 image. */
async function samplePack(): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 20;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No 2D canvas available');
  context.fillStyle = '#a02020';
  context.fillRect(0, 0, 200, 20);
  context.fillStyle = '#e06060';
  context.fillRect(0, 0, 200, 2);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the sample texture');
  return zipSync({ [BUTTON_PATH]: new Uint8Array(await blob.arrayBuffer()) });
}

const MEMORY_CODE = `import { memoryAssets } from 'cobble-ui';

const assets = memoryAssets({
  version: 'test',
  files: { 'assets/minecraft/textures/gui/sprites/widget/button.png': pngBytes },
  objects: { 'minecraft/sounds/random/click_stereo.ogg': 'blob:...' },
});`;

const PACK_CODE = `import { unzipSync } from 'fflate';
import { mojangAssets, type AssetSource } from 'cobble-ui';

// Lays a resource pack's textures over another source.
function resourcePackAssets(base: AssetSource, zip: Uint8Array): AssetSource {
  const files = unzipSync(zip, { filter: (f) => f.name.startsWith('assets/minecraft/textures/') });
  return {
    key: \`pack:\${zip.length}\`, // unique per pack so decoded sprites are not shared
    async load(options) {
      const inner = await base.load(options);
      return {
        version: inner.version,
        file: (path) => {
          const bytes = files[path];
          return bytes ? new Blob([bytes], { type: 'image/png' }) : inner.file(path);
        },
        objectUrl: (name) => inner.objectUrl(name),
      };
    },
  };
}

const zip = new Uint8Array(await file.arrayBuffer());
<CobbleProvider assets={resourcePackAssets(mojangAssets(), zip)}>…</CobbleProvider>`;

function PackDemo(): JSX.Element {
  const [pack, setPack] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assets = useMemo(() => (pack ? resourcePackAssets(mojangAssets(), pack) : null), [pack]);
  const load = async (data: Promise<Uint8Array>): Promise<void> => {
    try {
      setError(null);
      setPack(await data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  return (
    <div className="site-stack">
      <div className="site-row">
        <Button width={150} onClick={() => void load(samplePack())}>
          Use sample pack
        </Button>
        <Button width={150} disabled={pack === null} onClick={() => setPack(null)}>
          Clear pack
        </Button>
        <label>
          <Text as="span">Your pack (.zip): </Text>
          <input
            type="file"
            accept=".zip,application/zip"
            aria-label="Resource pack zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void load(file.arrayBuffer().then((buffer) => new Uint8Array(buffer)));
            }}
          />
        </label>
      </div>
      {error === null ? null : <Text color="red">{error}</Text>}
      {assets ? (
        <CobbleProvider assets={assets}>
          <Button width={200}>Button from the pack</Button>
        </CobbleProvider>
      ) : (
        <Button width={200}>Vanilla button</Button>
      )}
    </div>
  );
}

export function CustomAssetSourcesPage(): JSX.Element {
  return (
    <>
      <P>
        Cobble UI never bundles game files. An <Code>AssetSource</Code> produces them at runtime,
        and you can supply your own source to <Code>CobbleProvider</Code> through its{' '}
        <Code>assets</Code> prop.
      </P>
      <H2>The interfaces</H2>
      <P>
        An <Code>AssetSource</Code> has a unique <Code>key</Code> (providers with the same key share
        one decoded store) and a <Code>load(options)</Code> method that resolves an{' '}
        <Code>AssetBundle</Code>. A bundle returns client files by jar path with{' '}
        <Code>file(path)</Code> (a Blob, or undefined), asset index objects such as sounds with{' '}
        <Code>objectUrl(name)</Code>, and optionally lists its <Code>paths()</Code>. Object URLs are
        only used through img and audio elements, so they need no CORS headers.
      </P>
      <H2>memoryAssets</H2>
      <P>
        <Code>memoryAssets</Code> builds a source from files you already hold in memory. It is meant
        for tests and server rendering.
      </P>
      <CodeBlock code={MEMORY_CODE} />
      <H2>Loading a resource pack</H2>
      <P>
        A resource pack is a zip with the same <Code>assets/</Code> layout as the client jar, so a
        custom source can unzip it and fall back to another source for everything the pack does not
        replace. Pick a pack below, or use the generated sample, which replaces only the button
        texture. The files stay in your browser.
      </P>
      <Demo>
        <PackDemo />
      </Demo>
      <H3>Source</H3>
      <CodeBlock code={PACK_CODE} />
      <P>Only use resource packs you have the right to use.</P>
    </>
  );
}
