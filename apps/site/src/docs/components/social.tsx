import {
  BundleProgressBar,
  MuteButton,
  RealmStatusIcon,
  ReportButton,
  StatisticsHeaderButton,
  TradeArrow,
  VillagerXpBar,
} from 'cobble-ui';
import type { JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

export function SocialAndTradePage(): JSX.Element {
  return (
    <>
      <P>
        Small pieces of the social interactions and villager trading screens.{' '}
        <Code>MuteButton</Code> is the 20×20 speaker toggle and shows the action it will perform, so
        a muted player has the unmute icon. <Code>ReportButton</Code> is the flag button.{' '}
        <Code>TradeArrow</Code> is the 10×9 arrow between a trade&apos;s inputs and result, and{' '}
        <Code>VillagerXpBar</Code> is the 102×5 level bar with an optional lighter span showing the
        experience the selected trade would grant.
      </P>
      <Demo>
        <div className="site-stack">
          <div className="site-row">
            <MuteButton />
            <MuteButton defaultMuted />
            <ReportButton />
            <ReportButton disabled />
          </div>
          <div className="site-row">
            <TradeArrow />
            <TradeArrow outOfStock />
          </div>
          <VillagerXpBar progress={0.4} gain={0.2} />
        </div>
      </Demo>
      <CodeBlock code="<MuteButton muted={muted} onMutedChange={setMuted} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'muted / defaultMuted',
            type: 'boolean',
            description: 'MuteButton: controlled or initial state.',
          },
          {
            name: 'onMutedChange',
            type: '(muted: boolean) => void',
            description: 'MuteButton: called when toggled.',
          },
          {
            name: 'outOfStock',
            type: 'boolean',
            description: 'TradeArrow: the red crossed-out arrow.',
          },
          {
            name: 'progress',
            type: 'number',
            description: 'VillagerXpBar: progress through the level, 0 to 1.',
          },
          {
            name: 'gain',
            type: 'number',
            description: 'VillagerXpBar: progress the selected trade adds, 0 to 1.',
          },
        ]}
      />
    </>
  );
}

export function AnimatedSpritePage(): JSX.Element {
  return (
    <>
      <P>
        <Code>AnimatedSprite</Code> plays a sprite sheet (frames stacked vertically) the way the
        game plays an <Code>.mcmeta</Code> animation. The renderer does not read animation metadata,
        so pass the frame size and timing yourself; the number of frames comes from the sheet
        height. Times are in game ticks (50 ms). <Code>RealmStatusIcon</Code> is built on it: the
        10×28 status light on a Realm entry, which blinks when it expires soon.
      </P>
      <Demo>
        <div className="site-row">
          <RealmStatusIcon status="open" />
          <RealmStatusIcon status="closed" />
          <RealmStatusIcon status="expired" />
          <RealmStatusIcon status="expires_soon" />
        </div>
      </Demo>
      <CodeBlock
        code={`<AnimatedSprite sprite="icon/trial_available" frameWidth={8} frameHeight={8}
  frames={[{ index: 0, time: 10 }, { index: 1, time: 2 }, { index: 2, time: 2 }]} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'sprite', type: 'string', description: 'Sheet sprite id.' },
          {
            name: 'frameWidth / frameHeight',
            type: 'number',
            description: 'Size of one frame, in GUI units.',
          },
          { name: 'frametime', type: 'number', defaultValue: '1', description: 'Ticks per frame.' },
          {
            name: 'frames',
            type: '{ index, time }[]',
            description: 'Explicit frame order and times.',
          },
          {
            name: 'status',
            type: "'open' | 'closed' | 'expired' | 'expires_soon'",
            description: 'RealmStatusIcon: the light shown.',
          },
        ]}
      />
    </>
  );
}

export function BundleAndStatsPage(): JSX.Element {
  return (
    <>
      <P>
        <Code>BundleProgressBar</Code> is the fill bar in a bundle tooltip: a nine-sliced border
        with a fill inside it, switching to the <Code>full</Code> sprite at 100%. Its default 94×13
        size and 1-unit inset are approximations of the game&apos;s.{' '}
        <Code>StatisticsHeaderButton</Code> is a column header of the item statistics table: the
        18×18 frame with the column&apos;s icon, plus a sort arrow drawn over it.
      </P>
      <Demo>
        <div className="site-stack">
          <BundleProgressBar progress={0.3} />
          <BundleProgressBar progress={1} />
          <div className="site-row">
            <StatisticsHeaderButton column="block_mined" label="Blocks Mined" sort="descending" />
            <StatisticsHeaderButton column="item_broken" label="Items Broken" />
            <StatisticsHeaderButton column="item_crafted" label="Items Crafted" />
            <StatisticsHeaderButton column="item_used" label="Items Used" sort="ascending" />
            <StatisticsHeaderButton column="item_picked_up" label="Items Picked Up" />
            <StatisticsHeaderButton column="item_dropped" label="Items Dropped" />
          </div>
        </div>
      </Demo>
      <CodeBlock code="<StatisticsHeaderButton column='item_used' label='Items Used' sort='ascending' />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'progress', type: 'number', description: 'BundleProgressBar: how full, 0 to 1.' },
          {
            name: 'width / height',
            type: 'number',
            defaultValue: '94 / 13',
            description: 'BundleProgressBar: size in GUI units.',
          },
          {
            name: 'column',
            type: "'block_mined' | 'item_broken' | 'item_crafted' | 'item_dropped' | 'item_picked_up' | 'item_used'",
            description: 'StatisticsHeaderButton: which icon.',
          },
          {
            name: 'sort',
            type: "'ascending' | 'descending'",
            description: 'StatisticsHeaderButton: draws the sort arrow.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'StatisticsHeaderButton: accessible name.',
          },
        ]}
      />
    </>
  );
}
