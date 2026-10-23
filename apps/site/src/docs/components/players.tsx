import {
  Button,
  ChestPanel,
  HotbarWithStats,
  ItemIcon,
  PlayerInventory,
  PlayerRenderer,
  type SlotGridItem,
} from "cobble-ui";
import { useEffect, useState, type JSX } from "react";
import { Code, ComponentDoc } from "../../components/Prose.tsx";
import { useDefaultPlayer } from "../../settings.tsx";

function item(name: string, label: string, count?: number): SlotGridItem {
  return {
    content: <ItemIcon name={name} />,
    label,
    ...(count === undefined ? {} : { count }),
  };
}

const HOTBAR: readonly SlotGridItem[] = [
  item("diamond_sword", "Diamond Sword"),
  item("diamond_pickaxe", "Diamond Pickaxe"),
  item("diamond_axe", "Diamond Axe"),
  item("bread", "Bread", 12),
  item("torch", "Torch", 64),
];

export function PlayerRendererPage(): JSX.Element {
  const player = useDefaultPlayer();
  return (
    <ComponentDoc
      intro={
        <>
          A preview of a player&apos;s skin, like the figure in the inventory
          screen. Pass a username or UUID; the image comes from the mc-heads.net
          API and is downloaded by the browser, so nothing is bundled and it
          needs a network connection.
        </>
      }
      demo={
        <div className="site-row">
          <PlayerRenderer player={player} />
          <PlayerRenderer player="jeb_" view="player" height={100} />
          <PlayerRenderer player="Dinnerbone" view="head" height={50} />
        </div>
      }
      code={`<PlayerRenderer player='${player.replaceAll("'", "\\'")}' view='body' height={70} />`}
      rows={[
        { name: "player", type: "string", description: "Username or UUID." },
        {
          name: "view",
          type: "'body' | 'player' | 'head' | 'skin'",
          defaultValue: "'body'",
          description: "Which mc-heads.net render to show.",
        },
        {
          name: "height",
          type: "number",
          defaultValue: "70",
          description: "Height in GUI units.",
        },
        {
          name: "width",
          type: "number",
          description: "Width in GUI units. Half the height for the figures.",
        },
        { name: "label", type: "string", description: "Accessible name." },
      ]}
    />
  );
}

export function PlayerInventoryPage(): JSX.Element {
  const player = useDefaultPlayer();
  const [hotbar, setHotbar] =
    useState<readonly (SlotGridItem | undefined)[]>(HOTBAR);
  return (
    <ComponentDoc
      intro={
        <>
          The survival inventory screen, assembled from{" "}
          <Code>InventorySlot</Code>, <Code>SlotGrid</Code> and{" "}
          <Code>PlayerRenderer</Code>: four armor slots with their silhouettes,
          the player figure, the offhand slot, the 2×2 crafting grid with its
          result, the 27 inventory slots and the hotbar, at the screen&apos;s
          own coordinates.
        </>
      }
      demo={
        <PlayerInventory
          player={player}
          armor={{ head: item("diamond_helmet", "Diamond Helmet") }}
          offhand={item("shield", "Shield")}
          hotbar={hotbar}
          items={[
            item("cobblestone", "Cobblestone", 64),
            undefined,
            item("oak_planks", "Planks", 32),
          ]}
          onSlotClick={(area, index) => {
            if (area === "hotbar")
              setHotbar(
                hotbar.map((slot, i) => (i === index ? undefined : slot)),
              );
          }}
        />
      }
      code={`<PlayerInventory player='${player.replaceAll("'", "\\'")}' armor={{ head }} hotbar={hotbar} items={items} />`}
      rows={[
        {
          name: "player",
          type: "string | ReactNode",
          description: "Username/UUID, or your own figure.",
        },
        {
          name: "armor",
          type: "{ head, chest, legs, feet }",
          description: "Equipment slot items.",
        },
        {
          name: "offhand",
          type: "SlotGridItem",
          description: "The offhand item.",
        },
        {
          name: "crafting",
          type: "SlotGridItem[]",
          description: "The four crafting slots.",
        },
        {
          name: "result",
          type: "SlotGridItem",
          description: "The crafted item.",
        },
        {
          name: "items",
          type: "SlotGridItem[]",
          description: "The 27 inventory slots.",
        },
        {
          name: "hotbar",
          type: "SlotGridItem[]",
          description: "The 9 hotbar slots.",
        },
        {
          name: "onSlotClick",
          type: "(area, index) => void",
          description:
            "Called with the area (armor, offhand, crafting, result, main, hotbar).",
        },
        {
          name: "background",
          type: "boolean",
          defaultValue: "true",
          description: "Draw the screen artwork.",
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
    const id = setInterval(
      () => setAir((value) => (value <= 0 ? 300 : value - 5)),
      50,
    );
    return () => clearInterval(id);
  }, [playing]);
  return (
    <ComponentDoc
      intro={
        <>
          The survival HUD at the bottom of the screen: <Code>Hotbar</Code>,{" "}
          <Code>ExperienceBar</Code>, <Code>Hearts</Code>, <Code>Hunger</Code>,{" "}
          <Code>Armor</Code> and <Code>Air</Code> placed where the game puts
          them. Armor is hidden at 0 and air shows only while it is below the
          maximum.
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
            {playing ? "Pause air" : "Play air"}
          </Button>
        </div>
      }
      code="<HotbarWithStats health={15} food={14} armor={12} experience={0.4} level={7} />"
      rows={[
        {
          name: "health",
          type: "number",
          defaultValue: "20",
          description: "Half hearts.",
        },
        {
          name: "food",
          type: "number",
          defaultValue: "20",
          description: "Food level.",
        },
        {
          name: "armor",
          type: "number",
          defaultValue: "0",
          description: "Armor points.",
        },
        {
          name: "air",
          type: "number",
          description: "Air ticks; shown while below maxAir.",
        },
        {
          name: "experience",
          type: "number",
          description: "Progress to the next level, 0 to 1.",
        },
        { name: "level", type: "number", description: "Experience level." },
        {
          name: "hotbar",
          type: "HotbarOwnProps",
          description: "Props passed to the Hotbar.",
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
          A generic container screen: a title, one to six rows of nine slots
          and, unless <Code>showInventory</Code> is false, the player&apos;s
          inventory below. Three rows is a chest; six is a double chest.
        </>
      }
      demo={
        <div className="site-row">
          <ChestPanel
            title="Chest"
            items={[
              item("diamond", "Diamond", 3),
              item("iron_ingot", "Iron Ingot", 24),
            ]}
          />
          <ChestPanel rows={3} title="Ender Chest" showInventory={false} />
        </div>
      }
      code="<ChestPanel rows={3} title='Chest' items={items} />"
      rows={[
        {
          name: "rows",
          type: "number",
          defaultValue: "3",
          description: "Rows of container slots, 1 to 6.",
        },
        {
          name: "title",
          type: "ReactNode",
          description: "Title above the container.",
        },
        {
          name: "items",
          type: "SlotGridItem[]",
          description: "Container slots.",
        },
        {
          name: "showInventory",
          type: "boolean",
          defaultValue: "true",
          description: "Show the player inventory and hotbar.",
        },
        {
          name: "inventory",
          type: "SlotGridItem[]",
          description: "The 27 inventory slots.",
        },
        {
          name: "hotbar",
          type: "SlotGridItem[]",
          description: "The 9 hotbar slots.",
        },
        {
          name: "onSlotClick",
          type: "(area, index) => void",
          description: "chest, main or hotbar.",
        },
      ]}
    />
  );
}
