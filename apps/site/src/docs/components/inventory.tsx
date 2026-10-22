import {
  BundleSlot,
  CreativeScroller,
  CreativeTab,
  InventorySlot,
  VillagerScroller,
  type EmptySlotIcon,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

const ICONS: readonly EmptySlotIcon[] = [
  'helmet',
  'chestplate',
  'leggings',
  'boots',
  'shield',
  'sword',
  'pickaxe',
  'potion',
];

export function InventorySlotPage(): JSX.Element {
  return (
    <>
      <P>
        One inventory slot: the 18×18 <Code>container/slot</Code> with a 16×16 item area inset by
        one unit. Hovering or focusing draws the highlight frame behind the item and the translucent
        highlight over it. While empty, <Code>emptyIcon</Code> shows the silhouette the game uses in
        equipment slots. Item textures are not GUI assets, so supply your own item content.
      </P>
      <Demo>
        <div className="site-row">
          {ICONS.map((icon) => (
            <InventorySlot key={icon} emptyIcon={icon} aria-label={`Empty ${icon} slot`} />
          ))}
          <InventorySlot aria-label="Item">
            <span className="cobble-text" data-shadow="">
              64
            </span>
          </InventorySlot>
        </div>
      </Demo>
      <CodeBlock code="<InventorySlot emptyIcon='helmet' onClick={pickUp} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'children', type: 'ReactNode', description: 'The item, in the 16×16 area.' },
          {
            name: 'emptyIcon',
            type: 'EmptySlotIcon',
            description: 'Silhouette shown while empty: helmet, boots, shield, potion, …',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: 'No interaction.',
          },
          {
            name: 'slotProps',
            type: 'object',
            description: 'Props for the background and item area.',
          },
          {
            name: 'as',
            type: 'ElementType',
            description: 'Render a different element or component.',
          },
        ]}
      />
      <H2>BundleSlot</H2>
      <P>
        A slot of the bundle contents grid: a 24×24 nine-sliced background with the item inset by 4
        units. It draws a highlight frame behind and in front of the item on hover or focus, or
        whenever <Code>highlighted</Code> is set. The highlight placement is an approximation of the
        game&apos;s.
      </P>
      <Demo>
        <div className="site-row">
          <BundleSlot />
          <BundleSlot highlighted>
            <span className="cobble-text" data-shadow="">
              3
            </span>
          </BundleSlot>
        </div>
      </Demo>
    </>
  );
}

export function CreativePage(): JSX.Element {
  const [value, setValue] = useState(0.3);
  return (
    <>
      <P>
        Pieces of the creative inventory. <Code>CreativeTab</Code> is a 26×32 tab with a distinct
        sprite for each of the 7 columns of the top and bottom rows. <Code>CreativeScroller</Code>{' '}
        is the 12×15 scroll thumb: drag it, or use the arrow keys, Home and End. Its disabled sprite
        is the greyed thumb shown when everything fits. The tab icon offset is an approximation of
        the game&apos;s.
      </P>
      <Demo>
        <div className="site-row">
          {[1, 2, 3, 4, 5, 6, 7].map((column) => (
            <CreativeTab
              key={column}
              label={`Tab ${String(column)}`}
              column={column}
              selected={column === 2}
            />
          ))}
        </div>
        <div className="site-row">
          {[1, 2, 3, 4, 5, 6, 7].map((column) => (
            <CreativeTab
              key={column}
              label={`Bottom tab ${String(column)}`}
              row="bottom"
              column={column}
              selected={column === 5}
            />
          ))}
        </div>
        <div className="site-row">
          <CreativeScroller value={value} onValueChange={setValue} aria-label="Scroll" />
          <CreativeScroller disabled aria-label="Scroll (disabled)" />
          <VillagerScroller />
          <VillagerScroller disabled aria-label="Trades (disabled)" />
        </div>
      </Demo>
      <CodeBlock code="<CreativeScroller value={scroll} onValueChange={setScroll} height={112} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'row', type: "'top' | 'bottom'", description: 'CreativeTab: which row.' },
          { name: 'column', type: 'number', description: 'CreativeTab: 1–7, picks the sprite.' },
          { name: 'selected', type: 'boolean', description: 'CreativeTab: raised variant.' },
          {
            name: 'value / onValueChange',
            type: 'number',
            description: 'CreativeScroller: 0 to 1.',
          },
          {
            name: 'height',
            type: 'number',
            defaultValue: '112',
            description: 'CreativeScroller: track height.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'CreativeScroller: greyed thumb, no input.',
          },
        ]}
      />
    </>
  );
}
