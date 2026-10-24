import {
  ItemIcon,
  RecipeBook,
  RecipeBookButton,
  type RecipeBookCategory,
  type RecipeBookRecipe,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const NAMES: readonly (readonly [string, string, string])[] = [
  ['oak_planks', 'Oak Planks', 'building'],
  ['stone_bricks', 'Stone Bricks', 'building'],
  ['crafting_table', 'Crafting Table', 'building'],
  ['furnace', 'Furnace', 'building'],
  ['chest', 'Chest', 'building'],
  ['piston', 'Piston', 'redstone'],
  ['repeater', 'Repeater', 'redstone'],
  ['lever', 'Lever', 'redstone'],
  ['diamond_sword', 'Diamond Sword', 'equipment'],
  ['iron_pickaxe', 'Iron Pickaxe', 'equipment'],
  ['torch', 'Torch', 'misc'],
  ['bucket', 'Bucket', 'misc'],
];

/** The tabs of the demo book. */
export const DEMO_CATEGORIES: readonly RecipeBookCategory[] = [
  { id: 'all', label: 'Search', icon: <ItemIcon name="compass" />, all: true },
  { id: 'building', label: 'Building Blocks', icon: <ItemIcon name="bricks" /> },
  { id: 'redstone', label: 'Redstone', icon: <ItemIcon name="redstone" /> },
  { id: 'equipment', label: 'Equipment', icon: <ItemIcon name="iron_sword" /> },
  { id: 'misc', label: 'Miscellaneous', icon: <ItemIcon name="lava_bucket" /> },
];

/** Enough recipes to need a second page. */
export const DEMO_RECIPES: readonly RecipeBookRecipe[] = Array.from({ length: 30 }, (_, i) => {
  const [item, label, category] = NAMES[i % NAMES.length] ?? ['stone', 'Stone', 'misc'];
  return {
    id: `${item}-${String(i)}`,
    label: i < NAMES.length ? label : `${label} (${String(Math.floor(i / NAMES.length) + 1)})`,
    content: <ItemIcon name={item} />,
    category,
    craftable: i % 4 !== 3,
    many: i % 5 === 0,
  };
});

export function RecipeBookPage(): JSX.Element {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState('none');
  return (
    <ComponentDoc
      intro={
        <>
          The recipe book panel (<Code>RecipeBookComponent</Code> with <Code>RecipeBookPage</Code>
          ): category tabs, the search box, the &quot;show craftable&quot; toggle, a 5×4 page of
          recipe buttons and page arrows, on the game&apos;s <Code>recipe_book</Code> artwork.
          Recipes are plain data (result item, craftable state); nothing is crafted here. Every
          piece of state (<Code>open</Code>, <Code>category</Code>, <Code>search</Code>,{' '}
          <Code>craftableOnly</Code>, <Code>page</Code>) is uncontrolled by default and controlled
          when its prop is given. The origin is the book&apos;s top left; the tabs stick out 30
          units to the left. Use <Code>overlay</Code> for ghost recipes. Inside{' '}
          <Code>PlayerInventory</Code>, pass <Code>recipeBook</Code> instead.
        </>
      }
      demo={
        <div className="site-stack">
          <RecipeBookButton aria-expanded={open} onClick={() => setOpen(!open)} />
          <div style={{ paddingLeft: 'calc(32 * var(--cobble-px))' }}>
            <RecipeBook
              recipes={DEMO_RECIPES}
              categories={DEMO_CATEGORIES}
              open={open}
              onRecipeClick={(recipe) => setLast(recipe.label)}
            />
          </div>
          <span>Last clicked: {last}</span>
        </div>
      }
      code="<RecipeBook categories={categories} recipes={recipes} onRecipeClick={craft} />"
      rows={[
        {
          name: 'recipes',
          type: 'RecipeBookRecipe[]',
          description: 'id, label, content (the result item), category, craftable, many.',
        },
        {
          name: 'categories',
          type: 'RecipeBookCategory[]',
          description: 'Tabs: id, label, icon; `all` lists every recipe.',
        },
        {
          name: 'open / defaultOpen / onOpenChange',
          type: 'boolean',
          description: 'Visibility. A closed book renders nothing.',
        },
        {
          name: 'category / onCategoryChange',
          type: 'string',
          description: 'Selected tab id; defaults to the first.',
        },
        {
          name: 'search / onSearchChange',
          type: 'string',
          description: 'Search box text; matches recipe labels.',
        },
        {
          name: 'craftableOnly / onCraftableOnlyChange',
          type: 'boolean',
          description: 'The filter toggle. Craftable recipes always sort first.',
        },
        {
          name: 'page / onPageChange',
          type: 'number',
          description: 'Zero-based page of 20 recipes.',
        },
        {
          name: 'furnace',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Furnace-style filter artwork.',
        },
        {
          name: 'onRecipeClick',
          type: '(recipe) => void',
          description: 'A recipe button was activated.',
        },
        {
          name: 'overlay',
          type: 'ReactNode',
          description: 'Pointer-transparent layer in book coordinates, for ghost recipes.',
        },
        {
          name: 'background',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Draw the book artwork.',
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
