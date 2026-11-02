import {
  ConfirmScreen,
  KeybindButton,
  KeybindRow,
  OptionsListHeader,
  OptionsListRow,
  OptionsScreen,
  PauseScreen,
  Slider,
  TitleScreen,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const FRAME = { height: 'calc(240 * var(--cobble-px))', width: '100%' } as const;

export function PauseScreenPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The pause menu (<Code>PauseScreen</Code>): a two-column grid of 98-wide buttons with
          full-width &quot;Back to Game&quot; and &quot;Save and Quit&quot;. It only calls the
          handlers you pass.
        </>
      }
      demo={
        <div style={FRAME}>
          <PauseScreen />
        </div>
      }
      code={`<PauseScreen onBackToGame={resume} onOptions={openOptions} onSaveAndQuit={quit} onClose={resume} />`}
      rows={[
        { name: 'title', type: 'ReactNode', defaultValue: "'Game Menu'", description: 'Header.' },
        {
          name: 'on*',
          type: '() => void',
          description:
            'onBackToGame, onAdvancements, onStatistics, onFeedback, onReportBugs, onOptions, onOpenToLan, onSaveAndQuit.',
        },
        { name: 'lanDisabled', type: 'boolean', description: 'Disable "Open to LAN".' },
        { name: 'quitLabel', type: 'ReactNode', description: 'Label of the quit button.' },
        { name: 'onClose', type: '() => void', description: 'Called on Escape.' },
      ]}
    />
  );
}

export function TitleScreenPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The title screen over the rotating panorama. No logo is bundled: pass your own through{' '}
          <Code>logo</Code>, and a <Code>SplashText</Code> through <Code>splash</Code>.
        </>
      }
      demo={
        <div style={FRAME}>
          <TitleScreen
            logo={<strong style={{ color: 'white' }}>Your Logo</strong>}
            versionText="My App 1.0"
            copyrightText="Your copyright"
            realmsLabel="Online Play"
          />
        </div>
      }
      code={`<TitleScreen logo={<img src={logo} alt="My game" />} splash={<SplashText>Hello!</SplashText>} onSingleplayer={play} />`}
      rows={[
        {
          name: 'logo',
          type: 'ReactNode',
          description: 'Your own logo, centred above the buttons.',
        },
        { name: 'splash', type: 'ReactNode', description: 'Usually a SplashText.' },
        { name: 'versionText', type: 'ReactNode', description: 'Bottom-left text.' },
        { name: 'copyrightText', type: 'ReactNode', description: 'Bottom-right text.' },
        {
          name: 'onSingleplayer / onMultiplayer / onRealms / onOptions / onQuit',
          type: '() => void',
          description: 'Button handlers. The third button shows with onRealms or realmsLabel.',
        },
      ]}
    />
  );
}

export function OptionsScreenPage(): JSX.Element {
  const [fov, setFov] = useState(70);
  return (
    <ComponentDoc
      intro={
        <>
          An options sub screen: title header, an <Code>OptionsList</Code> and a Done button. Fill
          it with <Code>OptionsListHeader</Code> and <Code>OptionsListRow</Code>.
        </>
      }
      demo={
        <div style={FRAME}>
          <OptionsScreen title="Video Settings" onDone={() => undefined}>
            <OptionsListHeader>Display</OptionsListHeader>
            <OptionsListRow>
              <Slider
                width={310}
                label="FOV"
                min={30}
                max={110}
                value={fov}
                onValueChange={setFov}
              />
            </OptionsListRow>
          </OptionsScreen>
        </div>
      }
      code={`<OptionsScreen title="Video Settings" onDone={back}>
  <OptionsListRow>…</OptionsListRow>
</OptionsScreen>`}
      rows={[
        { name: 'title', type: 'ReactNode', description: 'Header title.' },
        { name: 'onDone', type: '() => void', description: 'Done button and Escape.' },
        {
          name: 'doneLabel',
          type: 'ReactNode',
          defaultValue: "'Done'",
          description: 'Footer label.',
        },
        { name: 'footer', type: 'ReactNode', description: 'Replaces the Done button.' },
        { name: 'listLabel', type: 'string', description: 'Accessible name of the list.' },
        { name: 'listProps', type: 'OptionsListProps', description: 'Passed to the OptionsList.' },
      ]}
    />
  );
}

export function KeybindButtonPage(): JSX.Element {
  const [listening, setListening] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          The key buttons of the controls screen. <Code>KeybindButton</Code> is the 75-wide key
          button (yellow <Code>&gt; key &lt;</Code> while listening, red <Code>[ key ]</Code> on
          conflict); <Code>KeybindRow</Code> adds the action name and Reset. Capturing the key is up
          to you.
        </>
      }
      demo={
        <div className="site-stack">
          <KeybindRow
            name="Jump"
            keyLabel="Space"
            isDefault
            listening={listening}
            onChange={() => setListening(!listening)}
          />
          <KeybindRow name="Sneak" keyLabel="Left Shift" conflict />
          <KeybindButton keyLabel="W" aria-label="Forward" />
        </div>
      }
      code={`<KeybindRow name="Jump" keyLabel="Space" listening={listening} onChange={start} onReset={reset} />`}
      rows={[
        { name: 'keyLabel', type: 'ReactNode', description: 'Name of the bound key.' },
        { name: 'listening', type: 'boolean', description: 'Waiting for a key.' },
        { name: 'conflict', type: 'boolean', description: 'Key is bound twice.' },
        { name: 'name', type: 'ReactNode', description: 'KeybindRow: action name.' },
        { name: 'isDefault', type: 'boolean', description: 'KeybindRow: disables Reset.' },
        { name: 'onChange / onReset', type: '() => void', description: 'KeybindRow handlers.' },
      ]}
    />
  );
}

export function ConfirmScreenPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A full-screen yes/no question (<Code>ConfirmScreen</Code>). To ask over another screen use{' '}
          <Code>Dialog</Code>.
        </>
      }
      demo={
        <div style={FRAME}>
          <ConfirmScreen title="Delete world?" message="This cannot be undone." />
        </div>
      }
      code={`<ConfirmScreen title="Delete world?" message="This cannot be undone." onConfirm={del} onCancel={back} />`}
      rows={[
        { name: 'title', type: 'ReactNode', description: 'Heading.' },
        { name: 'message', type: 'ReactNode', description: 'Text under the heading.' },
        { name: 'yesLabel / noLabel', type: 'ReactNode', description: 'Button labels.' },
        {
          name: 'onConfirm / onCancel',
          type: '() => void',
          description: 'onCancel also fires on Escape.',
        },
      ]}
    />
  );
}
