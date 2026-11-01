import {
  Button,
  CycleButton,
  LinearLayout,
  OptionsList,
  OptionsListHeader,
  OptionsListRow,
  Slider,
  Text,
  ToggleButton,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P } from '../../components/Prose.tsx';

const CODE = `function OptionsMenu({ onDone }: { onDone: () => void }) {
  const [fov, setFov] = useState(70);
  const [graphics, setGraphics] = useState<'Fast' | 'Fancy' | 'Fabulous!'>('Fancy');
  const [sounds, setSounds] = useState(true);
  const [volume, setVolume] = useState(100);

  return (
    <LinearLayout align="center" gap={4}>
      <Text as="h3">Options</Text>
      <OptionsList aria-label="Options">
        <OptionsListHeader>Video</OptionsListHeader>
        <OptionsListRow>
          <Slider width={150} label="FOV" min={30} max={110} value={fov} onValueChange={setFov} />
          <CycleButton width={150} label="Graphics" values={['Fast', 'Fancy', 'Fabulous!'] as const}
            value={graphics} onValueChange={setGraphics} />
        </OptionsListRow>
        <OptionsListHeader>Sound</OptionsListHeader>
        <OptionsListRow>
          <ToggleButton width={150} label="Sounds" checked={sounds} onCheckedChange={setSounds} />
          <Slider width={150} min={0} max={100} value={volume} onValueChange={setVolume}
            formatLabel={(v) => \`Master Volume: \${v}%\`} />
        </OptionsListRow>
      </OptionsList>
      <Button width={200} onClick={onDone}>Done</Button>
    </LinearLayout>
  );
}`;

/** The composed options screen: title, scrolling list, footer button. */
function OptionsMenu(): JSX.Element {
  const [fov, setFov] = useState(70);
  const [graphics, setGraphics] = useState<'Fast' | 'Fancy' | 'Fabulous!'>('Fancy');
  const [sounds, setSounds] = useState(true);
  const [volume, setVolume] = useState(100);
  const [done, setDone] = useState(false);
  return (
    <LinearLayout align="center" gap={4}>
      <Text as="h3">Options</Text>
      <div className="site-list-demo">
        <OptionsList aria-label="Options">
          <OptionsListHeader>Video</OptionsListHeader>
          <OptionsListRow>
            <Slider width={150} label="FOV" min={30} max={110} value={fov} onValueChange={setFov} />
            <CycleButton
              width={150}
              label="Graphics"
              values={['Fast', 'Fancy', 'Fabulous!'] as const}
              value={graphics}
              onValueChange={setGraphics}
            />
          </OptionsListRow>
          <OptionsListHeader>Sound</OptionsListHeader>
          <OptionsListRow>
            <ToggleButton width={150} label="Sounds" checked={sounds} onCheckedChange={setSounds} />
            <Slider
              width={150}
              min={0}
              max={100}
              value={volume}
              onValueChange={setVolume}
              formatLabel={(value) => `Master Volume: ${String(value)}%`}
            />
          </OptionsListRow>
        </OptionsList>
      </div>
      <Button width={200} onClick={() => setDone((value) => !value)}>
        {done ? 'Done (clicked)' : 'Done'}
      </Button>
    </LinearLayout>
  );
}

export function OptionsMenuRecipePage(): JSX.Element {
  return (
    <>
      <P>
        A complete options screen composed only from library components: a title, an{' '}
        <Code>OptionsList</Code> of headers and rows holding sliders, cycle buttons and toggles, and
        a footer button, stacked with <Code>LinearLayout</Code>. Wrap it in <Code>Screen</Code> and{' '}
        <Code>ScreenLayout</Code> to make it a full page, as the Settings page of this site does.
      </P>
      <Demo>
        <OptionsMenu />
      </Demo>
      <H2>Source</H2>
      <CodeBlock code={CODE} />
    </>
  );
}
