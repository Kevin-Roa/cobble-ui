import {
  AnimatedSprite,
  EFFECT_IDS,
  EffectIcon,
  ICON_NAMES,
  Icon,
  ItemIcon,
  Sprite,
  Text,
  ToggleButton,
  asSpriteId,
  iconInfo,
  useAssetPaths,
  useAssetRevision,
  useCobble,
  useSprite,
  useSpriteSize,
  type EffectId,
  type IconName,
} from 'cobble-ui';
import { useMemo, useState, type JSX } from 'react';
import { Explorer } from '../../components/Explorer.tsx';
import { Code, H2, P } from '../../components/Prose.tsx';
import { sortItemIds } from './item-order.ts';

const SPRITES = 'assets/minecraft/textures/gui/sprites/';

function spriteIds(paths: readonly string[], suffix: string): readonly string[] {
  return paths.map((path) => path.slice(SPRITES.length, path.length - suffix.length));
}

/** Every GUI sprite in the game files. */
function useSpriteIds(): readonly string[] {
  return spriteIds(useAssetPaths(SPRITES, '.png'), '.png');
}

/** The sprites whose `.mcmeta` declares an `animation`. */
function useAnimatedSpriteIds(): readonly string[] {
  const { store } = useCobble();
  useAssetRevision();
  const candidates = spriteIds(useAssetPaths(SPRITES, '.png.mcmeta'), '.png.mcmeta');
  // Reading a sprite starts loading it; the list fills in as the sheets decode.
  return candidates.filter((id) => store.getSprite(id)?.animation !== undefined);
}

function SpriteTile({ id }: { readonly id: string }): JSX.Element | null {
  const size = useSpriteSize(asSpriteId(id));
  if (!size) return null;
  return (
    <span className="site-explorer-sprite">
      <Sprite sprite={asSpriteId(id)} width={size.width} height={size.height} data-flow="" />
    </span>
  );
}

function SpriteDetail({ id }: { readonly id: string }): JSX.Element | null {
  const sprite = useSprite(asSpriteId(id));
  const size = useSpriteSize(asSpriteId(id));
  if (!sprite || !size) return null;
  const { scaling, animation } = sprite;
  const facts = [
    `${String(size.width)}×${String(size.height)}`,
    scaling.type === 'nine_slice'
      ? `nine-slice, border ${JSON.stringify(scaling.border)}`
      : scaling.type === 'tile'
        ? 'tiled'
        : 'stretched',
    animation === undefined
      ? undefined
      : `animated: ${String(animation.frameWidth)}×${String(animation.frameHeight)} frames`,
  ].filter((fact) => fact !== undefined);
  return (
    <div className="site-explorer-preview">
      <Text color="yellow">{id}</Text>
      <Text color="gray">{facts.join(' · ')}</Text>
      <div className="site-explorer-stage">
        <span
          className="site-explorer-sprite"
          style={{
            width: `calc(${String(size.width)} * var(--cobble-px))`,
            height: `calc(${String(size.height)} * var(--cobble-px))`,
          }}
        >
          <Sprite sprite={asSpriteId(id)} width={size.width} height={size.height} />
        </span>
      </div>
    </div>
  );
}

/** Browse every GUI sprite in the game files. */
export function SpriteExplorer(): JSX.Element {
  const ids = useSpriteIds();
  return (
    <>
      <H2>Explorer</H2>
      <P>
        Every sprite in the game&apos;s GUI atlas, drawn from the files you downloaded. Click one to
        see its size and scaling and copy its id.
      </P>
      <Explorer
        ids={ids}
        noun="sprites"
        renderTile={(id) => <SpriteTile id={id} />}
        renderDetail={(id) => <SpriteDetail id={id} />}
        snippet={(id) => `<Sprite sprite="${id}" width={…} height={…} />`}
      />
    </>
  );
}

/** Browse every sheet that has `.mcmeta` animation data. */
export function AnimatedSpriteExplorer(): JSX.Element {
  const ids = useAnimatedSpriteIds();
  return (
    <>
      <H2>Explorer</H2>
      <P>
        Every sprite sheet whose metadata declares an animation, playing with its own timing. Pass
        just the id to <Code>AnimatedSprite</Code>.
      </P>
      <Explorer
        ids={ids}
        noun="animated sprites"
        renderTile={(id) => (
          <span className="site-explorer-sprite">
            <AnimatedSprite sprite={asSpriteId(id)} />
          </span>
        )}
        renderDetail={(id) => <SpriteDetail id={id} />}
        snippet={(id) => `<AnimatedSprite sprite="${id}" />`}
      />
    </>
  );
}

/** Browse every named icon. */
export function IconExplorer(): JSX.Element {
  const [highlighted, setHighlighted] = useState(false);
  return (
    <>
      <H2>Explorer</H2>
      <P>
        Every name <Code>Icon</Code> accepts. Click one for its sprite and size.
      </P>
      <ToggleButton
        width={150}
        label="Highlighted"
        checked={highlighted}
        onCheckedChange={setHighlighted}
      />
      <Explorer
        ids={ICON_NAMES}
        noun="icons"
        renderTile={(id) => (
          <span className="site-explorer-sprite">
            <Icon name={id as IconName} highlighted={highlighted} />
          </span>
        )}
        renderDetail={(id) => {
          const info = iconInfo(id as IconName, highlighted);
          return (
            <div className="site-explorer-preview">
              <Text color="yellow">{id}</Text>
              <Text color="gray">
                {info.sprite} · {String(info.width)}×{String(info.height)}
              </Text>
              <div className="site-explorer-stage">
                <Icon name={id as IconName} highlighted={highlighted} />
              </div>
            </div>
          );
        }}
        snippet={(id) => `<Icon name="${id}"${highlighted ? ' highlighted' : ''} />`}
      />
    </>
  );
}

const ITEMS = 'assets/minecraft/items/';

/** Every item the game defines, drawn from its own models. */
export function ItemsPage(): JSX.Element {
  const paths = useAssetPaths(ITEMS, '.json');
  const ids = useMemo(
    () => sortItemIds(paths.map((path) => path.slice(ITEMS.length, path.length - '.json'.length))),
    [paths],
  );
  return (
    <>
      <P>
        Every item in the game, ordered roughly like the creative inventory (by tab, then material),
        drawn by <Code>ItemIcon</Code> from the game&apos;s own item definitions and models: flat
        sprites, isometric blocks with the inventory lighting, and models such as torches, stairs
        and fences. Items the game draws with code (chests, beds, banners, shields, heads) have no
        model to read, so they are blank or approximated.
      </P>
      <Explorer
        ids={ids}
        noun="items"
        tileSize={40}
        renderTile={(id) => <ItemIcon name={id} size={32} />}
        renderDetail={(id) => (
          <div className="site-explorer-preview">
            <Text color="yellow">{id}</Text>
            <div className="site-explorer-stage">
              <ItemIcon name={id} size={64} />
            </div>
          </div>
        )}
        snippet={(id) => `<ItemIcon name="${id}" />`}
      />
    </>
  );
}

/** Browse every mob effect icon. */
export function EffectExplorer(): JSX.Element {
  return (
    <>
      <H2>Explorer</H2>
      <P>
        Every effect <Code>EffectIcon</Code> accepts. The name is typed as <Code>EffectId</Code>, so
        a typo is a compile error. Click one to copy its snippet.
      </P>
      <Explorer
        ids={EFFECT_IDS}
        noun="effects"
        tileSize={32}
        renderTile={(id) => <EffectIcon name={id as EffectId} />}
        renderDetail={(id) => (
          <div className="site-explorer-preview">
            <Text color="yellow">{id}</Text>
            <div className="site-explorer-stage">
              <EffectIcon name={id as EffectId} />
            </div>
          </div>
        )}
        snippet={(id) => `<EffectIcon name="${id}" />`}
      />
    </>
  );
}
