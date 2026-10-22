import {
  Button,
  Checkbox,
  FriendsButton,
  ResponseButton,
  CrossButton,
  CycleButton,
  FormattedText,
  IconButton,
  LockButton,
  NotificationBadge,
  PageButton,
  RecipeBookButton,
  Slider,
  TextArea,
  TextField,
  ToggleButton,
  Tooltip,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

const COMMON_SLOT = {
  name: 'slotProps',
  type: 'object',
  description: 'Props for the inner parts.',
};
const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function ButtonPage(): JSX.Element {
  const [clicks, setClicks] = useState(0);
  return (
    <>
      <P>
        The vanilla button: a nine-sliced <Code>widget/button</Code> sprite that highlights when
        hovered or focused, a centred white label that scrolls when it does not fit, and the click
        sound on press.
      </P>
      <Demo>
        <div className="site-stack">
          <Button width={200} onClick={() => setClicks((c) => c + 1)}>
            Clicked {clicks} times
          </Button>
          <div className="site-row">
            <Button width={98}>Options...</Button>
            <Button width={98} disabled>
              Disabled
            </Button>
          </div>
          <Button width={120}>A label that is far too long to fit in this button</Button>
          <Button width={150} icon={{ sprite: 'icon/language' }}>
            With an icon
          </Button>
        </div>
      </Demo>
      <CodeBlock
        code={`
<Button width={200} onClick={play}>Singleplayer</Button>
<Button width={98} disabled>Disabled</Button>
<Button icon={{ sprite: 'icon/language' }}>With an icon</Button>
<Button as={Link} to="/options">Options...</Button>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'width',
            type: 'number',
            defaultValue: '150',
            description: 'Width in GUI units.',
          },
          {
            name: 'height',
            type: 'number',
            defaultValue: '20',
            description: 'Height in GUI units.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Grey label, no interaction.',
          },
          {
            name: 'icon',
            type: 'ButtonIcon',
            description: 'Sprite drawn after the label, or centred without children.',
          },
          { name: 'sprites', type: 'WidgetSprites', description: 'Replace the button sprites.' },
          {
            name: 'sound',
            type: 'UiSoundEvent | false',
            defaultValue: '"ui.button.click"',
            description: 'Sound played on press.',
          },
          { name: 'highlighted', type: 'boolean', description: 'Force the highlighted look.' },
          AS,
          { ...COMMON_SLOT, type: '{ background, label, icon }' },
        ]}
      />
    </>
  );
}

export function IconButtonPage(): JSX.Element {
  return (
    <>
      <P>
        A square button with a centred icon, like the language and accessibility buttons on the
        title screen.
      </P>
      <Demo>
        <div className="site-row">
          <IconButton icon="icon/language" label="Language" />
          <IconButton icon="icon/accessibility" label="Accessibility" />
          <IconButton icon="icon/search" label="Search" disabled />
        </div>
      </Demo>
      <CodeBlock code={`<IconButton icon="icon/language" label="Language" />`} />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'icon', type: 'string | WidgetSprites', description: 'Icon sprite id.' },
          { name: 'label', type: 'string', description: 'Accessible name.' },
          {
            name: 'iconWidth / iconHeight',
            type: 'number',
            description: "Defaults to the sprite's size.",
          },
          {
            name: 'width / height',
            type: 'number',
            defaultValue: '20',
            description: 'Size in GUI units.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function CheckboxPage(): JSX.Element {
  return (
    <>
      <P>
        A 17×17 box (the 20×20 sprite, stretched like the game) with a label of up to two lines. As
        in vanilla, the box is highlighted only while focused, not on hover.
      </P>
      <Demo>
        <div className="site-stack">
          <Checkbox defaultChecked>Show Cheats</Checkbox>
          <Checkbox>Generate Structures</Checkbox>
          <Checkbox disabled>Bonus Chest</Checkbox>
          <Checkbox maxWidth={150}>
            A longer label that wraps onto a second line and is then cut off
          </Checkbox>
        </div>
      </Demo>
      <CodeBlock
        code={`<Checkbox defaultChecked onCheckedChange={(checked) => …}>Show Cheats</Checkbox>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'checked / defaultChecked',
            type: 'boolean',
            description: 'Controlled or initial state.',
          },
          {
            name: 'onCheckedChange',
            type: '(checked, details) => void',
            description: 'Called when toggled.',
          },
          {
            name: 'maxWidth',
            type: 'number',
            description: 'Wrap width of the label in GUI units.',
          },
          {
            name: 'disabled / readOnly / required / name / value',
            type: '…',
            description: 'Form behaviour (Base UI).',
          },
          AS,
          { ...COMMON_SLOT, type: '{ box, sprite, label }' },
        ]}
      />
    </>
  );
}

const DIFFICULTIES = ['Peaceful', 'Easy', 'Normal', 'Hard'] as const;

export function CycleButtonPage(): JSX.Element {
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Normal');
  return (
    <>
      <P>
        A button that steps through values when pressed; hold Shift to go backwards.{' '}
        <Code>ToggleButton</Code> is the ON/OFF variant used throughout the options screens.
      </P>
      <Demo>
        <div className="site-stack">
          <CycleButton
            label="Difficulty"
            values={DIFFICULTIES}
            value={difficulty}
            onValueChange={setDifficulty}
          />
          <ToggleButton label="Subtitles" />
          <ToggleButton label="Hide Lightning Flashes" defaultChecked />
        </div>
      </Demo>
      <CodeBlock
        code={`
<CycleButton label="Difficulty" values={['Peaceful', 'Easy', 'Normal', 'Hard']} value={value} onValueChange={setValue} />
<ToggleButton label="Subtitles" />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'values', type: 'readonly T[]', description: 'Values in order.' },
          { name: 'value / defaultValue', type: 'T', description: 'Controlled or initial value.' },
          { name: 'label', type: 'ReactNode', description: 'Shown as "label: value".' },
          {
            name: 'formatValue',
            type: '(value) => ReactNode',
            defaultValue: 'String',
            description: 'How values are shown.',
          },
          { name: 'checked / onCheckedChange', type: 'boolean', description: 'ToggleButton only.' },
          {
            name: 'onText / offText',
            type: 'ReactNode',
            defaultValue: '"ON" / "OFF"',
            description: 'ToggleButton only.',
          },
        ]}
      />
    </>
  );
}

export function SliderPage(): JSX.Element {
  const [fov, setFov] = useState(70);
  return (
    <>
      <P>
        Behaves like the options sliders: the handle follows the mouse while dragging and snaps to
        the chosen value when released (with a click). After focusing with Tab, the arrow keys
        change the value; Enter toggles that on and off.
      </P>
      <Demo>
        <div className="site-stack">
          <Slider label="FOV" min={30} max={110} value={fov} onValueChange={setFov} />
          <Slider
            defaultValue={100}
            formatLabel={(v) => (v === 0 ? 'Music: OFF' : `Music: ${String(v)}%`)}
          />
          <Slider label="Disabled" defaultValue={25} disabled />
        </div>
      </Demo>
      <CodeBlock
        code={`<Slider label="FOV" min={30} max={110} value={fov} onValueChange={setFov} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'min / max', type: 'number', defaultValue: '0 / 100', description: 'Range.' },
          {
            name: 'step',
            type: 'number',
            defaultValue: '1',
            description: 'Use 0 for a continuous slider.',
          },
          {
            name: 'value / defaultValue',
            type: 'number',
            description: 'Controlled or initial value.',
          },
          {
            name: 'onValueChange / onValueCommitted',
            type: '(value) => void',
            description: 'Change and release callbacks.',
          },
          {
            name: 'label / formatLabel',
            type: 'ReactNode / (value) => ReactNode',
            description: 'Label text.',
          },
          {
            name: 'width / height',
            type: 'number',
            defaultValue: '150 / 20',
            description: 'Size in GUI units.',
          },
          AS,
          { ...COMMON_SLOT, type: '{ track, handle, label, input }' },
        ]}
      />
    </>
  );
}

export function TextFieldPage(): JSX.Element {
  const [name, setName] = useState('New World');
  return (
    <>
      <P>
        An exact <Code>EditBox</Code>: whole characters only, its own scrolling, the blinking{' '}
        <Code>_</Code> or
        <Code>|</Code> cursor and the blue selection. A transparent native input handles typing, IME
        and screen readers.
      </P>
      <Demo>
        <div className="site-stack">
          <TextField aria-label="World name" value={name} onValueChange={setName} />
          <TextField aria-label="Search" placeholder="Search..." width={150} />
          <TextField aria-label="Seed" defaultValue="Read only" readOnly width={150} />
        </div>
      </Demo>
      <CodeBlock
        code={`<TextField aria-label="World name" value={name} onValueChange={setName} maxLength={32} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'value / defaultValue',
            type: 'string',
            description: 'Controlled or initial text.',
          },
          {
            name: 'onValueChange',
            type: '(value) => void',
            description: 'Called on every change.',
          },
          {
            name: 'placeholder',
            type: 'ReactNode',
            description: 'Hint shown while empty and unfocused.',
          },
          { name: 'suggestion', type: 'string', description: 'Grey completion after the cursor.' },
          { name: 'maxLength', type: 'number', defaultValue: '32', description: 'Maximum length.' },
          {
            name: 'bordered / centered',
            type: 'boolean',
            defaultValue: 'true / false',
            description: 'Box and alignment.',
          },
          {
            name: 'readOnly / disabled',
            type: 'boolean',
            description: 'Darker text / no interaction.',
          },
          AS,
          { ...COMMON_SLOT, type: '{ background, input, display }' },
        ]}
      />
    </>
  );
}

export function TooltipPage(): JSX.Element {
  return (
    <>
      <P>
        Widget tooltips follow the mouse like the game&apos;s <Code>MenuTooltipPositioner</Code>, or
        sit below the widget when it is focused with the keyboard. Text wraps at 170 units.
      </P>
      <Demo height={80}>
        <div className="site-row">
          <Tooltip content="Lets you play with friends over your local network.">
            <Button width={150}>Hover me</Button>
          </Tooltip>
          <Tooltip content={<FormattedText value="§eFormatted§r text, §cin colour§r." />}>
            <Button width={98}>Me too</Button>
          </Tooltip>
        </div>
      </Demo>
      <CodeBlock
        code={`
<Tooltip content="Lets you play with friends over your local network.">
  <Button>Open to LAN</Button>
</Tooltip>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'content', type: 'ReactNode', description: 'Tooltip text.' },
          {
            name: 'children',
            type: 'ReactElement',
            description: 'The trigger; must accept a ref.',
          },
          {
            name: 'delay',
            type: 'number',
            defaultValue: '0',
            description: 'Milliseconds before showing.',
          },
          {
            name: 'maxWidth',
            type: 'number',
            defaultValue: '170',
            description: 'Wrap width in GUI units.',
          },
          {
            name: 'tooltipStyle',
            type: 'string',
            description: 'Use tooltip/<style>_background and _frame.',
          },
          { ...COMMON_SLOT, type: '{ popup, background, frame, content }' },
        ]}
      />
    </>
  );
}

export function TextAreaPage(): JSX.Element {
  return (
    <>
      <P>
        A multi-line text box styled like <Code>MultiLineEditBox</Code>: the text field background,
        4 units of padding, 9-unit lines wrapped to the box, and vertical scrolling. Unlike{' '}
        <Code>TextField</Code>, the text is a native <Code>&lt;textarea&gt;</Code>, so the caret and
        selection are the browser&apos;s (recolored), not the game&apos;s blinking underscore.
      </P>
      <Demo>
        <div className="site-stack">
          <TextArea aria-label="Notes" width={200} height={60} placeholder="Notes…" />
          <TextArea
            aria-label="Bio"
            width={200}
            height={40}
            maxLength={50}
            defaultValue="A short bio that wraps onto several lines."
          />
        </div>
      </Demo>
      <CodeBlock code="<TextArea width={200} height={60} maxLength={256} onValueChange={setText} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'value / defaultValue',
            type: 'string',
            description: 'Controlled or initial text.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            description: 'Called on every change.',
          },
          { name: 'placeholder', type: 'string', description: 'Dark gray hint while empty.' },
          {
            name: 'maxLength',
            type: 'number',
            description: 'Limit; shows a length/limit counter under the box.',
          },
          {
            name: 'width / height',
            type: 'number',
            defaultValue: '200 / 60',
            description: 'Size in GUI units.',
          },
          { name: 'disabled / readOnly', type: 'boolean', description: 'Darker text, no editing.' },
          COMMON_SLOT,
          AS,
        ]}
      />
    </>
  );
}

export function LockButtonPage(): JSX.Element {
  return (
    <>
      <P>
        The padlock toggle beside the difficulty button: a 20×20 button that swaps between the
        locked and unlocked sprites, with the usual highlighted and disabled states.
      </P>
      <Demo>
        <div className="site-row">
          <LockButton />
          <LockButton defaultLocked />
          <LockButton disabled />
          <LockButton disabled defaultLocked />
        </div>
      </Demo>
      <CodeBlock code="<LockButton locked={locked} onLockedChange={setLocked} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'locked / defaultLocked',
            type: 'boolean',
            description: 'Controlled or initial state.',
          },
          {
            name: 'onLockedChange',
            type: '(locked: boolean) => void',
            description: 'Called when toggled.',
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: "'Lock'",
            description: 'Accessible name.',
          },
          COMMON_SLOT,
          AS,
        ]}
      />
    </>
  );
}

export function RecipeBookButtonPage(): JSX.Element {
  return (
    <>
      <P>
        The recipe book toggle on crafting screens: a 20×18 button using the{' '}
        <Code>recipe_book/button</Code> sprites, highlighted on hover or focus.
      </P>
      <Demo>
        <RecipeBookButton />
      </Demo>
      <CodeBlock code="<RecipeBookButton onClick={toggleRecipeBook} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'string',
            defaultValue: "'Recipe Book'",
            description: 'Accessible name.',
          },
          {
            name: 'width / height',
            type: 'number',
            defaultValue: '20 / 18',
            description: 'Size in GUI units.',
          },
          COMMON_SLOT,
          AS,
        ]}
      />
    </>
  );
}

export function SpriteButtonsPage(): JSX.Element {
  return (
    <>
      <P>
        Small buttons that are just a sprite: <Code>CrossButton</Code> (the 14×14 close cross),{' '}
        <Code>PageButton</Code> (the 23×13 book page turner) and <Code>RecipeBookButton</Code>{' '}
        (20×18). All highlight on hover or focus and play the click sound. A{' '}
        <Code>NotificationBadge</Code> (8×8) shows a count from 1 to 5, or a plus sign above that.
      </P>
      <Demo>
        <div className="site-row">
          <CrossButton />
          <PageButton direction="backward" />
          <PageButton direction="forward" />
          <RecipeBookButton />
          <NotificationBadge count={1} />
          <NotificationBadge count={4} />
          <NotificationBadge count={9} />
        </div>
      </Demo>
      <CodeBlock code="<PageButton direction='forward' onClick={nextPage} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'direction',
            type: "'forward' | 'backward'",
            description: 'PageButton: which way it turns.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'Accessible name; has a sensible default.',
          },
          {
            name: 'count',
            type: 'number',
            description: 'NotificationBadge: renders nothing at 0.',
          },
          COMMON_SLOT,
          AS,
        ]}
      />
      <H2>Friends and invites</H2>
      <P>
        <Code>ResponseButton</Code> is the 18×18 check or cross that accepts or rejects a request;{' '}
        <Code>context</Code> picks the friends list or pending-invite artwork.{' '}
        <Code>FriendsButton</Code> is a regular <Code>Button</Code> drawn with the friends
        screen&apos;s own flatter sprites.
      </P>
      <Demo>
        <div className="site-stack">
          <div className="site-row">
            <ResponseButton kind="accept" />
            <ResponseButton kind="reject" />
            <ResponseButton kind="accept" context="invite" />
            <ResponseButton kind="reject" context="invite" />
          </div>
          <div className="site-row">
            <FriendsButton width={120}>Add Friend</FriendsButton>
            <FriendsButton width={120} disabled>
              Unavailable
            </FriendsButton>
          </div>
        </div>
      </Demo>
    </>
  );
}
