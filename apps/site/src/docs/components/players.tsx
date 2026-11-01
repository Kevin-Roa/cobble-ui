import {
  Button,
  ChestPanel,
  HotbarWithStats,
  ItemIcon,
  PlayerInventory,
  PlayerRenderer,
  type PlayerOverlayParts,
  type PlayerPose,
  type SlotGridItem,
} from 'cobble-ui';
import { useEffect, useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';
import { useDefaultPlayer } from '../../settings.tsx';
import { DEMO_CATEGORIES, DEMO_RECIPES } from './recipe-book.tsx';

function item(name: string, label: string, count?: number): SlotGridItem {
  return {
    content: <ItemIcon name={name} />,
    label,
    ...(count === undefined ? {} : { count }),
  };
}

const HOTBAR: readonly SlotGridItem[] = [
  item('diamond_sword', 'Diamond Sword'),
  item('diamond_pickaxe', 'Diamond Pickaxe'),
  item('diamond_axe', 'Diamond Axe'),
  item('bread', 'Bread', 12),
  item('torch', 'Torch', 64),
];

const POSES: readonly PlayerPose[] = [
  'standing',
  'idle',
  'walking',
  'crouching',
  'flying',
  'swimming',
];

const LAYERS: readonly (readonly [keyof PlayerOverlayParts, string])[] = [
  ['hat', 'Hat'],
  ['jacket', 'Jacket'],
  ['leftSleeve', 'Left sleeve'],
  ['rightSleeve', 'Right sleeve'],
  ['leftPants', 'Left pants'],
  ['rightPants', 'Right pants'],
];

export function PlayerRendererPage(): JSX.Element {
  const player = useDefaultPlayer();
  const [follow, setFollow] = useState(false);
  const [model, setModel] = useState<'auto' | 'wide' | 'slim'>('auto');
  const [pose, setPose] = useState<PlayerPose>('standing');
  const [cape, setCape] = useState(true);
  const [elytra, setElytra] = useState(false);
  const [nameTag, setNameTag] = useState(true);
  const [layers, setLayers] = useState<Partial<PlayerOverlayParts>>({});
  return (
    <ComponentDoc
      intro={
        <>
          A real 3D player model (<Code>PlayerModel</Code>, drawn by the library&apos;s own software
          renderer): head, body, arms and legs with the 64×64 skin layout, the hat, jacket, sleeve
          and pants layers (all at once or one by one), wide or slim (Alex) arms detected from the
          skin, an optional cape and name tag, and the standing, idle, walking, crouching, flying
          and swimming poses, and an elytra. Drag or use the arrow keys to turn it. Without a{' '}
          <Code>player</Code> it wears the bundled Steve or Alex skin from the client files; with a
          username or UUID the skin (and cape) is looked up through the official Mojang API and
          downloaded by the browser (nothing is bundled). The Mojang API sends no CORS headers, so
          browsers fall back to the CORS-enabled PlayerDB service (or your own proxy via{' '}
          <Code>configureMojangApi</Code>); if the lookup fails the bundled skin is shown.
        </>
      }
      demo={
        <div className="site-row">
          <PlayerRenderer
            height={100}
            {...(model === 'auto' ? {} : { model })}
            followMouse={follow}
            pose={pose}
            autoRotate={pose === 'walking'}
            overlay={layers}
            label="Default skin"
          />
          <PlayerRenderer
            player={player}
            height={100}
            width={90}
            followMouse={follow}
            pose={pose}
            overlay={layers}
            cape={cape}
            elytra={elytra}
            nameTag={nameTag}
            initialYaw={cape ? 160 : 0}
          />
          <div>
            <label>
              <input
                type="checkbox"
                checked={follow}
                onChange={(event) => setFollow(event.target.checked)}
              />{' '}
              Follow mouse
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                checked={cape}
                onChange={(event) => setCape(event.target.checked)}
              />{' '}
              Cape (turned to show it)
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                checked={elytra}
                onChange={(event) => setElytra(event.target.checked)}
              />{' '}
              Elytra
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                checked={nameTag}
                onChange={(event) => setNameTag(event.target.checked)}
              />{' '}
              Name tag
            </label>
            <br />
            <label>
              Arms{' '}
              <select
                value={model}
                onChange={(event) => setModel(event.target.value as 'auto' | 'wide' | 'slim')}
              >
                <option value="auto">auto-detect</option>
                <option value="wide">wide</option>
                <option value="slim">slim</option>
              </select>
            </label>
            <br />
            <label>
              Pose{' '}
              <select value={pose} onChange={(event) => setPose(event.target.value as PlayerPose)}>
                {POSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <br />
            {LAYERS.map(([key, text]) => (
              <label key={key} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={layers[key] ?? true}
                  onChange={(event) => setLayers({ ...layers, [key]: event.target.checked })}
                />{' '}
                {text}
              </label>
            ))}
          </div>
        </div>
      }
      code={`<PlayerRenderer player='${player.replaceAll("'", "\\'")}' height={100} cape nameTag pose="crouching" overlay={{ hat: false }} />`}
      rows={[
        {
          name: 'player',
          type: 'string',
          description:
            'Username or UUID; the skin, arm shape and cape come from the Mojang API. Omit to use the bundled skin.',
        },
        {
          name: 'skin',
          type: 'string',
          defaultValue: "'entity/player/wide/steve'",
          description:
            'Local skin texture id from the client files, used without a player (Alex when model is slim).',
        },
        {
          name: 'model',
          type: "'wide' | 'slim'",
          description:
            'Arm shape: 4 pixels or 3 pixels (Alex). Detected when omitted, from the profile or the skin pixels.',
        },
        {
          name: 'pose',
          type: "'standing' | 'idle' | 'walking' | 'crouching' | 'flying' | 'swimming'",
          defaultValue: "'standing'",
          description:
            'Still, a slight arm sway, a walk cycle, sneaking, elytra gliding or a breaststroke. Flying and swimming lie the player down and shrink it to fit.',
        },
        {
          name: 'overlay',
          type: 'boolean | { hat, jacket, leftSleeve, rightSleeve, leftPants, rightPants }',
          defaultValue: 'true',
          description:
            'Draw the skin layers: all (true), none (false) or choose each one; missing keys are drawn.',
        },
        {
          name: 'cape',
          type: 'boolean | string',
          defaultValue: 'false',
          description:
            "true shows the player's own cape; a string is the URL of a cape image that replaces it (needs CORS).",
        },
        {
          name: 'elytra',
          type: 'boolean',
          defaultValue: 'false',
          description:
            "Wear an elytra instead of the cape: the player's cape texture if shown, else the game's elytra. The wings open in the flying pose.",
        },
        {
          name: 'nameTag',
          type: 'boolean | string',
          defaultValue: 'false',
          description:
            "Show a name above the player: true is the player's name, a string is your text. The renderer grows to fit.",
        },
        {
          name: 'rotatable',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Drag or press the arrow keys to turn the player.',
        },
        {
          name: 'followMouse',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Head and body turn toward the cursor like the inventory screen.',
        },
        {
          name: 'autoRotate',
          type: 'boolean | number',
          defaultValue: 'false',
          description: 'Spin around the vertical axis; a number is degrees per second.',
        },
        {
          name: 'initialYaw',
          type: 'number',
          defaultValue: '0',
          description: 'Starting yaw in degrees.',
        },
        {
          name: 'initialPitch',
          type: 'number',
          defaultValue: '0',
          description: 'Starting pitch in degrees; positive looks down on the player.',
        },
        {
          name: 'initialRoll',
          type: 'number',
          defaultValue: '0',
          description: "Starting roll in degrees around the player's front axis.",
        },
        {
          name: 'height',
          type: 'number',
          defaultValue: '70',
          description: 'Height of the model in GUI units.',
        },
        {
          name: 'width',
          type: 'number',
          description: 'Width of the model in GUI units. 70% of the height by default.',
        },
        { name: 'label', type: 'string', description: 'Accessible name.' },
      ]}
    />
  );
}

export function PlayerInventoryPage(): JSX.Element {
  const player = useDefaultPlayer();
  const [hotbar, setHotbar] = useState<readonly (SlotGridItem | undefined)[]>(HOTBAR);
  return (
    <ComponentDoc
      intro={
        <>
          The survival inventory screen, assembled from <Code>InventorySlot</Code>,{' '}
          <Code>SlotGrid</Code> and <Code>PlayerRenderer</Code>: four armor slots with their
          silhouettes, the player figure, the offhand slot, the 2×2 crafting grid with its result,
          the 27 inventory slots and the hotbar, at the screen&apos;s own coordinates. With{' '}
          <Code>recipeBook</Code> it also has the recipe book button at the game&apos;s position;
          opening the book shifts the screen 77 units to the right, as in the game.
        </>
      }
      demo={
        <div style={{ paddingLeft: 'calc(80 * var(--cobble-px))' }}>
          <PlayerInventory
            recipeBook={{ recipes: DEMO_RECIPES, categories: DEMO_CATEGORIES }}
            player={player}
            armor={{ head: item('diamond_helmet', 'Diamond Helmet') }}
            offhand={item('shield', 'Shield')}
            hotbar={hotbar}
            items={[
              item('cobblestone', 'Cobblestone', 64),
              undefined,
              item('oak_planks', 'Planks', 32),
            ]}
            onSlotClick={(area, index) => {
              if (area === 'hotbar')
                setHotbar(hotbar.map((slot, i) => (i === index ? undefined : slot)));
            }}
          />
        </div>
      }
      code={`<PlayerInventory recipeBook={{ recipes, categories }} player='${player.replaceAll("'", "\\'")}' armor={{ head }} hotbar={hotbar} items={items} />`}
      rows={[
        {
          name: 'player',
          type: 'string | ReactNode',
          description: 'Username/UUID (a 3D figure that follows the cursor), or your own node.',
        },
        {
          name: 'armor',
          type: '{ head, chest, legs, feet }',
          description: 'Equipment slot items.',
        },
        {
          name: 'offhand',
          type: 'SlotGridItem',
          description: 'The offhand item.',
        },
        {
          name: 'crafting',
          type: 'SlotGridItem[]',
          description: 'The four crafting slots.',
        },
        {
          name: 'result',
          type: 'SlotGridItem',
          description: 'The crafted item.',
        },
        {
          name: 'items',
          type: 'SlotGridItem[]',
          description: 'The 27 inventory slots.',
        },
        {
          name: 'hotbar',
          type: 'SlotGridItem[]',
          description: 'The 9 hotbar slots.',
        },
        {
          name: 'recipeBook',
          type: 'boolean | RecipeBookProps',
          description:
            'Adds the recipe book button (at 104, 61) and the book. Takes the RecipeBook props (recipes, categories, open/defaultOpen/onOpenChange, ...); the book starts closed.',
        },
        {
          name: 'onSlotClick',
          type: '(area, index) => void',
          description: 'Called with the area (armor, offhand, crafting, result, main, hotbar).',
        },
        {
          name: 'background',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Draw the screen artwork.',
        },
      ]}
    />
  );
}

export function HotbarWithStatsPage(): JSX.Element {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [air, setAir] = useState(300);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setAir((value) => (value <= 0 ? 300 : value - 5)), 50);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <ComponentDoc
      intro={
        <>
          The survival HUD at the bottom of the screen: <Code>Hotbar</Code>,{' '}
          <Code>ExperienceBar</Code>, <Code>Hearts</Code>, <Code>Hunger</Code>, <Code>Armor</Code>{' '}
          and <Code>Air</Code> placed where the game puts them. Armor is hidden at 0 and air shows
          only while it is below the maximum.
        </>
      }
      demo={
        <div>
          <HotbarWithStats
            health={15}
            food={14}
            armor={12}
            air={air}
            experience={0.4}
            level={7}
            hotbar={{
              slots: HOTBAR.map((slot) => slot.content),
              selected,
              onSelectedChange: setSelected,
            }}
          />
          <Button width={100} onClick={() => setPlaying(!playing)}>
            {playing ? 'Pause air' : 'Play air'}
          </Button>
        </div>
      }
      code="<HotbarWithStats health={15} food={14} armor={12} experience={0.4} level={7} />"
      rows={[
        {
          name: 'health',
          type: 'number',
          defaultValue: '20',
          description: 'Half hearts.',
        },
        {
          name: 'food',
          type: 'number',
          defaultValue: '20',
          description: 'Food level.',
        },
        {
          name: 'armor',
          type: 'number',
          defaultValue: '0',
          description: 'Armor points.',
        },
        {
          name: 'air',
          type: 'number',
          description: 'Air ticks; shown while below maxAir.',
        },
        {
          name: 'experience',
          type: 'number',
          description: 'Progress to the next level, 0 to 1.',
        },
        { name: 'level', type: 'number', description: 'Experience level.' },
        {
          name: 'hotbar',
          type: 'HotbarOwnProps',
          description: 'Props passed to the Hotbar.',
        },
      ]}
    />
  );
}

export function ChestPanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A generic container screen: a title, one to six rows of nine slots and, unless{' '}
          <Code>isolate</Code> is set, the player&apos;s inventory below. Three rows is a chest; six
          is a double chest.
        </>
      }
      demo={
        <div className="site-row">
          <ChestPanel
            title="Chest"
            items={[item('diamond', 'Diamond', 3), item('iron_ingot', 'Iron Ingot', 24)]}
            rows={6}
          />
          <ChestPanel rows={3} title="Ender Chest" />
        </div>
      }
      code="<ChestPanel rows={3} title='Chest' items={items} />"
      rows={[
        {
          name: 'rows',
          type: 'number',
          defaultValue: '3',
          description: 'Rows of container slots, 1 to 6.',
        },
        {
          name: 'title',
          type: 'ReactNode',
          description: 'Title above the container.',
        },
        {
          name: 'items',
          type: 'SlotGridItem[]',
          description: 'Container slots.',
        },
        {
          name: 'isolate',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Render only the container, without the player inventory; the bottom border is kept.',
        },
        {
          name: 'inventory',
          type: 'SlotGridItem[]',
          description: 'The 27 inventory slots.',
        },
        {
          name: 'hotbar',
          type: 'SlotGridItem[]',
          description: 'The 9 hotbar slots.',
        },
        {
          name: 'onSlotClick',
          type: '(area, index) => void',
          description: 'chest, main or hotbar.',
        },
      ]}
    />
  );
}
