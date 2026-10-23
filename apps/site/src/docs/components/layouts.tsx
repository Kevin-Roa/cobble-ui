import {
  Button,
  Checkbox,
  CycleButton,
  FrameLayout,
  GridLayout,
  GridLayoutCell,
  LinearLayout,
  OptionsList,
  OptionsListHeader,
  OptionsListRow,
  Slider,
  Text,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

const ALIGN = "'start' | 'center' | 'end'";

export function LinearLayoutPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          Stacks children in a column or a row with a fixed gap, like the game&apos;s{' '}
          <Code>LinearLayout</Code>. Every menu in the game is built from these, so it is the
          quickest way to lay out a screen. <Code>align</Code> places children across the axis.
        </>
      }
      demo={
        <div className="site-stack">
          <LinearLayout
            spacing={4}
            align="center"
            style={{ width: 'calc(210 * var(--cobble-px))' }}
          >
            <Button width={200}>Singleplayer</Button>
            <Button width={200}>Multiplayer</Button>
            <Button width={120}>Centred, narrower</Button>
          </LinearLayout>
          <LinearLayout orientation="horizontal" spacing={4}>
            <Button width={98}>Options...</Button>
            <Button width={98}>Quit Game</Button>
          </LinearLayout>
        </div>
      }
      code={`<LinearLayout spacing={4} align="center">
  <Button width={200}>Singleplayer</Button>
  <Button width={200}>Multiplayer</Button>
</LinearLayout>`}
      rows={[
        {
          name: 'orientation',
          type: "'vertical' | 'horizontal'",
          defaultValue: "'vertical'",
          description: 'Column or row.',
        },
        {
          name: 'spacing',
          type: 'number',
          defaultValue: '0',
          description: 'Gap between children, in GUI units.',
        },
        {
          name: 'align',
          type: ALIGN,
          defaultValue: "'start'",
          description: 'Placement across the axis.',
        },
        AS,
      ]}
    />
  );
}

export function GridLayoutPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A grid whose columns are as wide as their widest cell and whose rows are as tall as their
          tallest, like <Code>GridLayout</Code>. Wrap a child in <Code>GridLayoutCell</Code> to span
          columns or rows, or to align it differently.
        </>
      }
      demo={
        <GridLayout columns={2} spacing={4}>
          <Button width={98}>Skin</Button>
          <Button width={98}>Cape</Button>
          <GridLayoutCell colSpan={2} alignX="center">
            <Button width={200}>Done</Button>
          </GridLayoutCell>
        </GridLayout>
      }
      code={`<GridLayout columns={2} spacing={4}>
  <Button width={98}>Skin</Button>
  <Button width={98}>Cape</Button>
  <GridLayoutCell colSpan={2} alignX="center"><Button width={200}>Done</Button></GridLayoutCell>
</GridLayout>`}
      rows={[
        { name: 'columns', type: 'number', description: 'Number of columns.' },
        {
          name: 'spacing',
          type: 'number',
          defaultValue: '0',
          description: 'Gap in both directions.',
        },
        {
          name: 'columnSpacing / rowSpacing',
          type: 'number',
          description: 'Override one direction.',
        },
        {
          name: 'alignX / alignY',
          type: ALIGN,
          defaultValue: "'start'",
          description: 'Placement of cells.',
        },
        {
          name: 'GridLayoutCell colSpan / rowSpan',
          type: 'number',
          defaultValue: '1',
          description: 'Cells covered.',
        },
        AS,
      ]}
    />
  );
}

export function FrameLayoutPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A frame that places each child, on top of one another, at the start, centre or end of the
          frame, like <Code>FrameLayout</Code>. Handy for centring a column of buttons in the space
          a screen leaves.
        </>
      }
      demo={
        <FrameLayout minWidth={240} minHeight={60} style={{ background: 'rgb(255 255 255 / 8%)' }}>
          <Text color="gray">Centred in the frame</Text>
        </FrameLayout>
      }
      code={`<FrameLayout minWidth={240} minHeight={60} alignX="center" alignY="center">
  <Button width={200}>Done</Button>
</FrameLayout>`}
      rows={[
        { name: 'minWidth / minHeight', type: 'number', description: 'Minimum size in GUI units.' },
        {
          name: 'alignX / alignY',
          type: ALIGN,
          defaultValue: "'center'",
          description: 'Where children sit.',
        },
        AS,
      ]}
    />
  );
}

export function OptionsListPage(): JSX.Element {
  const [fov, setFov] = useState(70);
  const [graphics, setGraphics] = useState<'Fast' | 'Fancy' | 'Fabulous!'>('Fancy');
  const [clouds, setClouds] = useState(true);
  return (
    <ComponentDoc
      intro={
        <>
          The scrolling list of the options screens: the menu list background, header and footer
          separators and rows of one or two widgets centred in a 310-unit column. Use{' '}
          <Code>OptionsListHeader</Code> for headings and <Code>OptionsListRow</Code> for rows;
          widgets are <Code>150</Code> wide for two to a row and <Code>310</Code> for one.
        </>
      }
      demo={
        <div className="site-list-demo">
          <OptionsList aria-label="Video settings">
            <OptionsListHeader>Video Settings</OptionsListHeader>
            <OptionsListRow>
              <Slider
                width={150}
                label="FOV"
                min={30}
                max={110}
                value={fov}
                onValueChange={setFov}
              />
              <CycleButton
                width={150}
                label="Graphics"
                values={['Fast', 'Fancy', 'Fabulous!'] as const}
                value={graphics}
                onValueChange={setGraphics}
              />
            </OptionsListRow>
            <OptionsListRow>
              <Checkbox checked={clouds} onCheckedChange={setClouds}>
                Clouds
              </Checkbox>
            </OptionsListRow>
            <OptionsListHeader>Controls</OptionsListHeader>
            <OptionsListRow>
              <Button width={310}>Key Binds...</Button>
            </OptionsListRow>
            <OptionsListRow>
              <Button width={150}>Mouse Settings...</Button>
              <Button width={150}>Language...</Button>
            </OptionsListRow>
          </OptionsList>
        </div>
      }
      code={`<OptionsList aria-label="Video settings">
  <OptionsListHeader>Video Settings</OptionsListHeader>
  <OptionsListRow>
    <Slider width={150} label="FOV" min={30} max={110} value={fov} onValueChange={setFov} />
    <CycleButton width={150} label="Graphics" … />
  </OptionsListRow>
</OptionsList>`}
      rows={[
        {
          name: 'rowWidth',
          type: 'number',
          defaultValue: '310',
          description: 'Width of each row.',
        },
        {
          name: 'itemHeight',
          type: 'number',
          defaultValue: '25',
          description: 'Height of each row.',
        },
        {
          name: 'separators',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Header and footer lines.',
        },
        AS,
      ]}
    />
  );
}
