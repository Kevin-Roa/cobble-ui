import {
  CrossButton,
  FriendsButton,
  MuteButton,
  PageButton,
  PlayerActionButton,
  ReportButton,
  ResponseButton,
  StatisticsHeaderButton,
  WarningButton,
} from 'cobble-ui';
import type { JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const SLOT = { name: 'slotProps', type: 'object', description: 'Props for the inner parts.' };
const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function CrossButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The small red cross that dismisses a panel: <Code>widget/cross_button</Code>, 14×14,
          highlighted on hover or focus, with the click sound.
        </>
      }
      demo={<CrossButton onClick={() => undefined} />}
      code="<CrossButton onClick={close} />"
      rows={[
        { name: 'label', type: 'string', defaultValue: "'Close'", description: 'Accessible name.' },
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '14',
          description: 'Size in GUI units.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}

export function PageButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The green arrow that turns book pages: <Code>widget/page_forward</Code> and{' '}
          <Code>widget/page_backward</Code>, 23×13.
        </>
      }
      demo={
        <div className="site-row">
          <PageButton direction="backward" />
          <PageButton direction="forward" />
        </div>
      }
      code="<PageButton direction='forward' onClick={nextPage} />"
      rows={[
        {
          name: 'direction',
          type: "'forward' | 'backward'",
          description: 'Which way the page turns.',
        },
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Next Page' / 'Previous Page'",
          description: 'Accessible name.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}

export function ResponseButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 18×18 check or cross that accepts or rejects a friend request or realm invite.{' '}
          <Code>context</Code> picks the friends list or pending-invite artwork.
        </>
      }
      demo={
        <div className="site-row">
          <ResponseButton kind="accept" />
          <ResponseButton kind="reject" />
          <ResponseButton kind="accept" context="invite" />
          <ResponseButton kind="reject" context="invite" />
        </div>
      }
      code="<ResponseButton kind='accept' context='invite' onClick={accept} />"
      rows={[
        { name: 'kind', type: "'accept' | 'reject'", description: 'Which response.' },
        {
          name: 'context',
          type: "'friends' | 'invite'",
          defaultValue: "'friends'",
          description: 'Which screen’s artwork to use.',
        },
        { name: 'label', type: 'string', description: 'Accessible name; defaults to the kind.' },
        SLOT,
        AS,
      ]}
    />
  );
}

export function FriendsButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A regular <Code>Button</Code> drawn with the friends screen&apos;s own flatter sprites. It
          accepts every <Code>Button</Code> prop.
        </>
      }
      demo={
        <div className="site-row">
          <FriendsButton width={120}>Add Friend</FriendsButton>
          <FriendsButton width={120} disabled>
            Unavailable
          </FriendsButton>
        </div>
      }
      code="<FriendsButton width={120}>Add Friend</FriendsButton>"
      rows={[
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '150 / 20',
          description: 'Size in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Grey label, no interaction.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}

export function MuteButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 20×20 speaker toggle beside a player in the social interactions screen. It shows the
          action it will perform, so a muted player has the unmute icon.
        </>
      }
      demo={
        <div className="site-row">
          <MuteButton />
          <MuteButton defaultMuted />
        </div>
      }
      code="<MuteButton muted={muted} onMutedChange={setMuted} />"
      rows={[
        {
          name: 'muted / defaultMuted',
          type: 'boolean',
          description: 'Controlled or initial state.',
        },
        {
          name: 'onMutedChange',
          type: '(muted: boolean) => void',
          description: 'Called when toggled.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}

export function ReportButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The flag button that reports a player: <Code>social_interactions/report_button</Code>,
          20×20, with a disabled state.
        </>
      }
      demo={
        <div className="site-row">
          <ReportButton />
          <ReportButton disabled />
        </div>
      }
      code="<ReportButton onClick={report} />"
      rows={[
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Report'",
          description: 'Accessible name.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed, no interaction.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}

export function StatisticsHeaderButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A column header of the item statistics table: the 18×18 <Code>statistics/header</Code>{' '}
          frame with the column&apos;s icon, plus a sort arrow drawn over it. The arrow placement is
          an approximation of the game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <StatisticsHeaderButton column="block_mined" label="Blocks Mined" sort="descending" />
          <StatisticsHeaderButton column="item_broken" label="Items Broken" />
          <StatisticsHeaderButton column="item_crafted" label="Items Crafted" />
          <StatisticsHeaderButton column="item_used" label="Items Used" sort="ascending" />
          <StatisticsHeaderButton column="item_picked_up" label="Items Picked Up" />
          <StatisticsHeaderButton column="item_dropped" label="Items Dropped" />
        </div>
      }
      code="<StatisticsHeaderButton column='item_used' label='Items Used' sort='ascending' />"
      rows={[
        {
          name: 'column',
          type: "'block_mined' | 'item_broken' | 'item_crafted' | 'item_dropped' | 'item_picked_up' | 'item_used'",
          description: 'Which icon.',
        },
        { name: 'sort', type: "'ascending' | 'descending'", description: 'Draws the sort arrow.' },
        { name: 'label', type: 'string', description: 'Accessible name.' },
        AS,
      ]}
    />
  );
}

export function PlayerActionButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The tiny 8×7 icon buttons beside a player in the player list: make or remove an operator,
          or remove the player. Each has a single sprite, so there is no highlighted variant.
        </>
      }
      demo={
        <div className="site-row">
          <PlayerActionButton action="make_operator" />
          <PlayerActionButton action="remove_operator" />
          <PlayerActionButton action="remove_player" />
        </div>
      }
      code="<PlayerActionButton action='remove_player' onClick={kick} />"
      rows={[
        {
          name: 'action',
          type: "'make_operator' | 'remove_operator' | 'remove_player'",
          description: 'Which icon.',
        },
        { name: 'label', type: 'string', description: 'Accessible name; defaults to the action.' },
        SLOT,
        AS,
      ]}
    />
  );
}

export function WarningButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 20×20 warning triangle shown on dialogs: <Code>dialog/warning_button</Code>, with
          highlighted and disabled states.
        </>
      }
      demo={
        <div className="site-row">
          <WarningButton />
          <WarningButton disabled />
        </div>
      }
      code="<WarningButton onClick={showWarning} />"
      rows={[
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Warning'",
          description: 'Accessible name.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed, no interaction.',
        },
        SLOT,
        AS,
      ]}
    />
  );
}
