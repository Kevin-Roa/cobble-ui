import {
  Button,
  FormattedText,
  Panorama,
  Screen,
  ScreenLayout,
  ScrollArea,
  SelectionList,
  SelectionListItem,
  Separator,
  SplashText,
  Sprite,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TooltipPanel,
} from 'cobble-ui';
import type { JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function TabsPage(): JSX.Element {
  return (
    <>
      <P>
        The tab bar from the world creation screen. Tabs share the bar like <Code>MenuTabBar</Code>{' '}
        (at most 400 units minus margins); the selected tab is drawn over the menu background.
        Ctrl+Tab and Ctrl+1…9 switch tabs.
      </P>
      <Demo height={80}>
        <Tabs defaultValue="game" className="site-tabs-demo">
          <TabList>
            <Tab value="game">Game</Tab>
            <Tab value="world">World</Tab>
            <Tab value="more">More</Tab>
          </TabList>
          <TabPanel value="game" className="site-tab-panel">
            <Text>Game mode, difficulty and cheats live here.</Text>
          </TabPanel>
          <TabPanel value="world" className="site-tab-panel">
            <Text>World type and seed.</Text>
          </TabPanel>
          <TabPanel value="more" className="site-tab-panel">
            <Text>Game rules and data packs.</Text>
          </TabPanel>
        </Tabs>
      </Demo>
      <CodeBlock
        code={`
<Tabs defaultValue="game">
  <TabList>
    <Tab value="game">Game</Tab>
    <Tab value="world">World</Tab>
  </TabList>
  <TabPanel value="game">…</TabPanel>
  <TabPanel value="world">…</TabPanel>
</Tabs>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'Tabs: value / defaultValue / onValueChange',
            type: 'Value',
            description: 'Selected tab (Base UI).',
          },
          {
            name: 'Tabs: sound',
            type: 'UiSoundEvent | false',
            defaultValue: '"ui.button.click"',
            description: 'Played on change.',
          },
          {
            name: 'TabList: width',
            type: 'number',
            description: 'Bar width; defaults to the measured width.',
          },
          {
            name: 'Tab: value / disabled',
            type: 'Value / boolean',
            description: 'Tab identity and state.',
          },
          AS,
        ]}
      />
    </>
  );
}

const WORLDS = [
  { id: 'survival', name: 'Survival Island', info: 'Survival Mode, Version: 26.3' },
  { id: 'creative', name: 'Creative Build', info: 'Creative Mode, Cheats, Version: 26.3' },
  { id: 'hardcore', name: '§cHardcore§r Attempt #4', info: 'Hardcore Mode, Version: 26.2' },
  { id: 'superflat', name: 'Redstone Lab', info: 'Creative Mode, Version: 26.1.2' },
  { id: 'amplified', name: 'Amplified Mountains', info: 'Survival Mode, Version: 26.3' },
];

export function SelectionListPage(): JSX.Element {
  return (
    <>
      <P>
        A scrolling list of selectable rows, like the world and server lists: rows are centred, the
        selected row gets a white outline (grey when the list is not focused), and the list has the
        menu list background with separators. Arrow keys move the selection; Enter or double-click
        activates.
      </P>
      <Demo height={140}>
        <div className="site-list-demo">
          <SelectionList aria-label="Worlds" defaultValue="survival" rowWidth={220}>
            {WORLDS.map((world) => (
              <SelectionListItem key={world.id} value={world.id}>
                <div className="site-world-entry">
                  <FormattedText value={world.name} />
                  <Text color="gray">{world.id}</Text>
                  <Text color="gray">{world.info}</Text>
                </div>
              </SelectionListItem>
            ))}
          </SelectionList>
        </div>
      </Demo>
      <CodeBlock
        code={`
<SelectionList aria-label="Worlds" value={selected} onValueChange={setSelected} onItemActivate={play}>
  {worlds.map((world) => (
    <SelectionListItem key={world.id} value={world.id}>{world.name}</SelectionListItem>
  ))}
</SelectionList>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'value / defaultValue / onValueChange',
            type: 'string',
            description: 'Selected item.',
          },
          {
            name: 'onItemActivate',
            type: '(value) => void',
            description: 'Enter or double-click.',
          },
          {
            name: 'itemHeight',
            type: 'number',
            defaultValue: '36',
            description: 'Row height in GUI units.',
          },
          {
            name: 'rowWidth',
            type: 'number',
            defaultValue: '220',
            description: 'Row width in GUI units.',
          },
          {
            name: 'separators',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Header/footer separators.',
          },
          {
            name: 'Item children',
            type: 'ReactNode | ({ selected, hovered }) => ReactNode',
            description: 'Row content.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function ScrollAreaPage(): JSX.Element {
  return (
    <>
      <P>
        A vertically scrolling area with the game&apos;s scrollbar: a 6-unit track, a scroller at
        least 32 units tall, and mouse-wheel steps of <Code>scrollRate</Code> units. Native touch
        and keyboard scrolling still work.
      </P>
      <Demo height={100}>
        <ScrollArea className="site-scroll-demo">
          {Array.from({ length: 20 }, (_, i) => (
            <Text as="p" key={i} className="site-p">
              Line {i + 1}: scrolling works with the wheel, the scroller and the keyboard.
            </Text>
          ))}
        </ScrollArea>
      </Demo>
      <CodeBlock code={`<ScrollArea scrollRate={10} style={{ height: 200 }}>…</ScrollArea>`} />
    </>
  );
}

export function ScreenPage(): JSX.Element {
  return (
    <>
      <P>
        <Code>Screen</Code> draws a full screen background: the panorama blurred under the menu
        background (default), just the panorama (title screen), or the dark in-game gradient.{' '}
        <Code>ScreenLayout</Code> adds the 33-unit header and footer of{' '}
        <Code>HeaderAndFooterLayout</Code>. This whole site is built from them.
      </P>
      <Demo height={160}>
        <div className="site-screen-demo">
          <Screen>
            <ScreenLayout title="Select World" footer={<Button width={150}>Done</Button>}>
              <SelectionList aria-label="Example worlds" itemHeight={20}>
                <SelectionListItem value="a">
                  <Text>Example world</Text>
                </SelectionListItem>
              </SelectionList>
            </ScreenLayout>
          </Screen>
        </div>
      </Demo>
      <CodeBlock
        code={`
<Screen background="menu">
  <ScreenLayout title="Select World" footer={<Button>Done</Button>}>
    <SelectionList>…</SelectionList>
  </ScreenLayout>
</Screen>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'Screen: background',
            type: '"menu" | "panorama" | "transparent" | "none"',
            defaultValue: '"menu"',
            description: 'What to draw behind the content.',
          },
          {
            name: 'ScreenLayout: title / header / footer',
            type: 'ReactNode',
            description: 'Header and footer content.',
          },
          {
            name: 'ScreenLayout: headerHeight / footerHeight',
            type: 'number',
            defaultValue: '33',
            description: 'In GUI units.',
          },
          {
            name: 'ScreenLayout: contentLayout',
            type: '"fill" | "top"',
            defaultValue: '"fill"',
            description: 'Stretch, or place 30 units below the header.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function PanoramaPage(): JSX.Element {
  return (
    <>
      <P>
        The rotating title-screen panorama, built as a CSS 3D cube from the six 26.3 panorama
        images: an 85° vertical field of view, pitched 10°, turning 2° per second at speed 1.{' '}
        <Code>SplashText</Code> adds the pulsing yellow splash.
      </P>
      <Demo height={140}>
        <div className="site-screen-demo">
          <Panorama className="site-fill" />
          <SplashText>Pixel perfect!</SplashText>
        </div>
      </Demo>
      <CodeBlock code={`<Panorama speed={1} />\n<SplashText>Pixel perfect!</SplashText>`} />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'speed',
            type: 'number',
            description: "Rotation speed multiplier; defaults to the provider's panoramaSpeed.",
          },
          { name: 'paused', type: 'boolean', defaultValue: 'false', description: 'Stop rotating.' },
          {
            name: 'respectReducedMotion',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Hold still when the system asks to reduce motion.',
          },
          {
            name: 'overlay',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Draw the panorama overlay on top.',
          },
          {
            name: 'base',
            type: 'string',
            description: 'Base name of the six images in the asset index.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function TextPage(): JSX.Element {
  return (
    <>
      <P>
        <Code>Text</Code> draws text like the game: one GUI unit per font texel, 9-unit lines and a
        1-unit drop shadow in 25% of the text colour. <Code>FormattedText</Code> renders{' '}
        <Code>§</Code> formatting codes or JSON text components.
      </P>
      <Demo>
        <div className="site-stack">
          <Text>Plain white text with a shadow</Text>
          <Text color="gold" bold>
            Gold and bold
          </Text>
          <Text color="aqua" italic underlined>
            Aqua, italic, underlined
          </Text>
          <Text color="red" strikethrough>
            Struck through
          </Text>
          <FormattedText value="§aGreen §lbold §r§9blue §kobfuscated" />
          <FormattedText
            value={{
              text: 'JSON ',
              color: 'light_purple',
              extra: [{ text: 'components', bold: true }],
            }}
          />
        </div>
      </Demo>
      <CodeBlock
        code={`
<Text color="gold" bold>Gold and bold</Text>
<FormattedText value="§aGreen §lbold §r§9blue" />
<FormattedText value={{ text: 'JSON ', color: 'light_purple', extra: [{ text: 'components', bold: true }] }} />`}
      />
    </>
  );
}

export function SpritePage(): JSX.Element {
  return (
    <>
      <P>
        <Code>Sprite</Code> draws any GUI sprite at an exact size using its nine-slice, tile or
        stretch metadata.
        <Code>TooltipPanel</Code> draws a tooltip box without the hover behaviour, for item-style
        tooltips.
      </P>
      <Demo height={80}>
        <div className="site-row">
          <div
            className="site-sprite-box"
            style={{ width: 'calc(60 * var(--cobble-px))', height: 'calc(40 * var(--cobble-px))' }}
          >
            <Sprite sprite="widget/button" width={60} height={40} />
          </div>
          <div
            className="site-sprite-box"
            style={{ width: 'calc(15 * var(--cobble-px))', height: 'calc(15 * var(--cobble-px))' }}
          >
            <Sprite sprite="icon/accessibility" width={15} height={15} />
          </div>
          <TooltipPanel spaceAfterFirstLine>
            <div>
              <FormattedText value="§bDiamond Sword" />
            </div>
            <div>
              <FormattedText value="§9+7 Attack Damage" />
            </div>
          </TooltipPanel>
        </div>
      </Demo>
      <CodeBlock code={`<Sprite sprite="widget/button" width={60} height={40} />`} />
    </>
  );
}

export function SeparatorPage(): JSX.Element {
  return (
    <>
      <P>
        The 2-unit line between a screen&apos;s header or footer and its content, tiled every 32
        units. <Code>SelectionList</Code> draws these itself; use <Code>Separator</Code> in your own
        layouts. Set <Code>inWorld</Code> for the translucent variants used over a world.
      </P>
      <Demo>
        <div className="site-stack" style={{ width: 'calc(200 * var(--cobble-px))' }}>
          <Separator kind="header" />
          <Separator kind="footer" />
          <Separator kind="header" inWorld />
          <Separator kind="footer" inWorld />
        </div>
      </Demo>
      <CodeBlock code="<Separator kind='footer' />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'kind',
            type: "'header' | 'footer'",
            defaultValue: "'header'",
            description: 'Which separator texture.',
          },
          {
            name: 'inWorld',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Use the in-world variants.',
          },
        ]}
      />
    </>
  );
}
