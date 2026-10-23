import { InventorySlot, ItemIcon, type EmptySlotIcon } from 'cobble-ui';
import type { JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

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
    <ComponentDoc
      intro={
        <>
          One inventory slot: the 18×18 <Code>container/slot</Code> with a 16×16 item area inset by
          one unit. Hovering or focusing draws the highlight frame behind the item and the
          translucent highlight over it. While empty, <Code>emptyIcon</Code> shows the silhouette
          the game uses in equipment slots. <Code>count</Code> draws the stack size in the corner.
          Item textures are not GUI assets, so supply your own item content.
        </>
      }
      demo={
        <div className="site-row">
          {ICONS.map((icon) => (
            <InventorySlot key={icon} emptyIcon={icon} aria-label={`Empty ${icon} slot`} />
          ))}
          <InventorySlot aria-label="Item" count={64}>
            <ItemIcon name="diamond" />
          </InventorySlot>
        </div>
      }
      code="<InventorySlot emptyIcon='helmet' onClick={pickUp} />"
      rows={[
        { name: 'children', type: 'ReactNode', description: 'The item, in the 16×16 area.' },
        {
          name: 'count',
          type: 'number',
          description: 'Stack size, drawn bottom-right when above 1.',
        },
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
  );
}
