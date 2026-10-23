import {
  ContainerError,
  type ContainerErrorKind,
  ItemIcon,
  LoomPatternButton,
  LoomScroller,
  RecipeBookFilterButton,
  RecipeBookPageButton,
  RecipeBookSlot,
  RecipeBookTab,
  StonecutterRecipeButton,
  StonecutterScroller,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function StonecutterRecipeButtonPage(): JSX.Element {
  const [selected, setSelected] = useState(1);
  return (
    <ComponentDoc
      intro={
        <>
          A recipe cell of the stonecutter: <Code>container/stonecutter/recipe</Code>, 16×18, lit
          when hovered or focused and dark when it is the chosen recipe. The result item goes inside
          and scales to fit the cell, with 2 units of padding around it.
        </>
      }
      demo={
        <div className="site-row">
          {[
            ['Stone Stairs', 'stone_stairs'],
            ['Stone Slab', 'stone_slab'],
            ['Stone Bricks', 'stone_bricks'],
            ['Stone Brick Wall', 'stone_brick_wall'],
          ].map(([name, item], index) => (
            <StonecutterRecipeButton
              key={name}
              label={name ?? ''}
              selected={index === selected}
              onClick={() => setSelected(index)}
            >
              <ItemIcon name={item ?? 'stone'} />
            </StonecutterRecipeButton>
          ))}
        </div>
      }
      code="<StonecutterRecipeButton label='Stone Stairs' selected={recipe === i} onClick={pick}><Item /></StonecutterRecipeButton>"
      rows={[
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Recipe'",
          description: 'Accessible name.',
        },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The chosen recipe.',
        },
        { name: 'children', type: 'ReactNode', description: 'The result item.' },
        AS,
      ]}
    />
  );
}

export function LoomPatternButtonPage(): JSX.Element {
  const [selected, setSelected] = useState(0);
  return (
    <ComponentDoc
      intro={
        <>
          A banner pattern cell of the loom: <Code>container/loom/pattern</Code>, 14×14, with
          highlighted and selected states. The pattern preview goes inside and scales to fit the
          cell, with 2 units of padding around it.
        </>
      }
      demo={
        <div className="site-row">
          {['Bordure', 'Bricks', 'Circle', 'Creeper Charge', 'Flower Charge'].map((name, index) => (
            <LoomPatternButton
              key={name}
              label={name}
              selected={index === selected}
              onClick={() => setSelected(index)}
            />
          ))}
        </div>
      }
      code="<LoomPatternButton label='Border' selected={pattern === i} onClick={pick} />"
      rows={[
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Pattern'",
          description: 'Accessible name.',
        },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The chosen pattern.',
        },
        { name: 'children', type: 'ReactNode', description: 'The pattern preview.' },
        AS,
      ]}
    />
  );
}

export function StonecutterScrollerPage(): JSX.Element {
  const [value, setValue] = useState(0.4);
  return (
    <ComponentDoc
      intro={
        <>
          The 12×15 scroll thumb beside the stonecutter&apos;s recipes: a{' '}
          <Code>CreativeScroller</Code> with the stonecutter&apos;s sprites. The default 56-unit
          track (a 15-unit thumb travelling 41) is an approximation of the game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <StonecutterScroller value={value} onValueChange={setValue} />
          <StonecutterScroller disabled aria-label="Recipes (disabled)" />
        </div>
      }
      code="<StonecutterScroller value={scroll} onValueChange={setScroll} />"
      rows={[
        { name: 'value / defaultValue', type: 'number', description: 'Scroll position, 0 to 1.' },
        {
          name: 'onValueChange',
          type: '(value: number) => void',
          description: 'Called while dragging.',
        },
        {
          name: 'height',
          type: 'number',
          defaultValue: '56',
          description: 'Track height in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed thumb, no input.',
        },
        AS,
      ]}
    />
  );
}

export function LoomScrollerPage(): JSX.Element {
  const [value, setValue] = useState(0.4);
  return (
    <ComponentDoc
      intro={
        <>
          The 12×15 scroll thumb beside the loom&apos;s patterns, with the loom&apos;s sprites. Same
          controls and the same approximate 56-unit track as the stonecutter&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <LoomScroller value={value} onValueChange={setValue} />
          <LoomScroller disabled aria-label="Patterns (disabled)" />
        </div>
      }
      code="<LoomScroller value={scroll} onValueChange={setScroll} />"
      rows={[
        { name: 'value / defaultValue', type: 'number', description: 'Scroll position, 0 to 1.' },
        {
          name: 'onValueChange',
          type: '(value: number) => void',
          description: 'Called while dragging.',
        },
        {
          name: 'height',
          type: 'number',
          defaultValue: '56',
          description: 'Track height in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed thumb, no input.',
        },
        AS,
      ]}
    />
  );
}

export function RecipeBookTabPage(): JSX.Element {
  const [selected, setSelected] = useState(0);
  return (
    <ComponentDoc
      intro={
        <>
          A category tab at the side of the recipe book: <Code>recipe_book/tab</Code>, 35×27, with a
          selected variant. The icon is centred horizontally; its offset is an approximation of the
          game&apos;s. It is a toggle button (<Code>aria-pressed</Code>). To build a real tab list,
          put the tabs in an element with <Code>role=&quot;tablist&quot;</Code> and pass{' '}
          <Code>role=&quot;tab&quot;</Code> and <Code>aria-selected</Code> to each.
        </>
      }
      demo={
        <div className="site-stack">
          {[
            ['Building', 'bricks'],
            ['Redstone', 'redstone'],
            ['Equipment', 'iron_sword'],
            ['Misc', 'lava_bucket'],
          ].map(([name, item], index) => (
            <RecipeBookTab
              key={name}
              label={name ?? ''}
              selected={index === selected}
              onClick={() => setSelected(index)}
            >
              <ItemIcon name={item ?? 'stone'} />
            </RecipeBookTab>
          ))}
        </div>
      }
      code="<RecipeBookTab label='Building' selected={tab === 'building'} onClick={pick}><Icon /></RecipeBookTab>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The open category.',
        },
        { name: 'children', type: 'ReactNode', description: 'The icon.' },
        AS,
      ]}
    />
  );
}

export function RecipeBookFilterButtonPage(): JSX.Element {
  const [craftable, setCraftable] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          The &quot;show craftable only&quot; toggle at the top of the recipe book (26×16), with its
          own highlighted sprite for each state. <Code>furnace</Code> uses the artwork of the
          furnace, smoker and blast furnace books.
        </>
      }
      demo={
        <div className="site-row">
          <RecipeBookFilterButton enabled={craftable} onClick={() => setCraftable(!craftable)} />
          <RecipeBookFilterButton
            furnace
            enabled={craftable}
            onClick={() => setCraftable(!craftable)}
          />
        </div>
      }
      code="<RecipeBookFilterButton enabled={craftableOnly} onClick={toggle} />"
      rows={[
        {
          name: 'enabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Only craftable recipes shown.',
        },
        {
          name: 'furnace',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Furnace book artwork.',
        },
        { name: 'label', type: 'string', description: 'Accessible name.' },
        AS,
      ]}
    />
  );
}

export function RecipeBookPageButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The arrows that turn the recipe book&apos;s pages: <Code>recipe_book/page_forward</Code>{' '}
          and <Code>page_backward</Code>, 12×17, with a highlighted sprite each.
        </>
      }
      demo={
        <div className="site-row">
          <RecipeBookPageButton direction="backward" />
          <RecipeBookPageButton direction="forward" />
        </div>
      }
      code="<RecipeBookPageButton direction='forward' onClick={next} />"
      rows={[
        {
          name: 'direction',
          type: "'forward' | 'backward'",
          description: 'Which way the page turns.',
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name; defaults to the direction.',
        },
        AS,
      ]}
    />
  );
}

export function RecipeBookSlotPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          One result slot of the recipe book: 25×25, with a different background for recipes you can
          craft now and ones you cannot, and for slots that stand for several recipes. The item
          scales to fit, inset by 4.
        </>
      }
      demo={
        <div className="site-row">
          <RecipeBookSlot label="Torch">
            <ItemIcon name="torch" />
          </RecipeBookSlot>
          <RecipeBookSlot label="Planks" many>
            <ItemIcon name="oak_planks" />
          </RecipeBookSlot>
          <RecipeBookSlot label="Barrel" craftable={false}>
            <ItemIcon name="barrel" />
          </RecipeBookSlot>
          <RecipeBookSlot label="Boats" craftable={false} many>
            <ItemIcon name="oak_boat" />
          </RecipeBookSlot>
        </div>
      }
      code="<RecipeBookSlot label='Torch' craftable many><Item /></RecipeBookSlot>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'craftable',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Can be crafted now.',
        },
        {
          name: 'many',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Stands for several recipes.',
        },
        { name: 'children', type: 'ReactNode', description: 'The result item.' },
        AS,
      ]}
    />
  );
}

export function ContainerErrorPage(): JSX.Element {
  const kinds: readonly ContainerErrorKind[] = [
    'anvil',
    'cartography_table',
    'grindstone',
    'smithing',
    'loom',
  ];
  return (
    <ComponentDoc
      intro={
        <>
          The red cross shown over the arrow of an anvil, cartography table, grindstone, smithing
          table or loom when the items in it cannot be combined: 28×21, or 26×26 for the loom.
        </>
      }
      demo={
        <div className="site-row">
          {kinds.map((kind) => (
            <ContainerError key={kind} kind={kind} />
          ))}
        </div>
      }
      code="<ContainerError kind='anvil' />"
      rows={[
        {
          name: 'kind',
          type: "'anvil' | 'cartography_table' | 'grindstone' | 'smithing' | 'loom'",
          description: 'Which screen’s mark.',
        },
      ]}
    />
  );
}
