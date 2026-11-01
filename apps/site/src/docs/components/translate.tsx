import { Translate, TranslationProvider, useTranslation } from 'cobble-ui';
import type { JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

function Joined(): JSX.Element {
  const { t } = useTranslation();
  return <span>{t('commands.give.success.single', 2, 'Stone', 'Steve')}</span>;
}

export function TranslatePage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          Text from the game&apos;s language file. <Code>en_us.json</Code> is downloaded at runtime
          with the other assets, never bundled. Arguments follow vanilla&apos;s rules:{' '}
          <Code>%s</Code> and <Code>%d</Code> take the next argument, <Code>%1$s</Code> picks one by
          position and <Code>%%</Code> is a percent sign. Missing keys render as the key. Use{' '}
          <Code>useTranslation()</Code> (<Code>t</Code>, <Code>tOr</Code>, <Code>has</Code>,{' '}
          <Code>ready</Code>) to translate strings, for example for <Code>aria-label</Code>.
        </>
      }
      demo={
        <div className="site-stack">
          <Translate translate="menu.singleplayer" />
          <Translate translate="selectWorld.versionJoinButton" fallback="Load Anyway" />
          <Joined />
        </div>
      }
      code={`<Translate translate="commands.give.success.single" args={[2, 'Stone', 'Steve']} />

const { t } = useTranslation();
t('menu.singleplayer');`}
      rows={[
        { name: 'translate', type: 'string', description: 'The translation key.' },
        {
          name: 'args',
          type: '(string | number)[]',
          description: 'Values for `%s` / `%1$s`.',
        },
        {
          name: 'fallback',
          type: 'string',
          description: 'Template used when the key is missing.',
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

export function TranslationProviderPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          Adds or replaces translation keys below it, on top of the game&apos;s <Code>en_us</Code>{' '}
          strings. Other languages live in the asset index, which has no CORS headers, so supply
          them yourself through <Code>translations</Code>. Providers nest; inner keys win.
        </>
      }
      demo={
        <TranslationProvider
          translations={{ 'menu.singleplayer': 'Solo', 'demo.greeting': 'Hello, %s!' }}
        >
          <div className="site-stack">
            <Translate translate="menu.singleplayer" />
            <Translate translate="demo.greeting" args={['Steve']} />
          </div>
        </TranslationProvider>
      }
      code={`<TranslationProvider translations={{ 'menu.singleplayer': 'Solo' }}>
  <Translate translate="menu.singleplayer" />
</TranslationProvider>`}
      rows={[
        {
          name: 'translations',
          type: 'Record<string, string>',
          description: 'Key to template table, like a lang file.',
        },
      ]}
    />
  );
}
