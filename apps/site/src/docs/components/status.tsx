import {
  Air,
  Armor,
  AttackIndicator,
  Hearts,
  Hunger,
  SpectatorMenu,
  VehicleHearts,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function HeartsPage(): JSX.Element {
  const [health, setHealth] = useState(15);
  return (
    <ComponentDoc
      intro={
        <>
          The health bar: a row of 9×9 hearts 8 units apart, measured in half hearts. Past 10 hearts
          the bar wraps onto further rows <em>above</em> the first, spaced{' '}
          <Code>max(10 - (rows - 2), 3)</Code> apart so they overlap more as the bar grows, like the
          game. Absorption adds golden hearts after the health.
        </>
      }
      demo={
        <div className="site-stack">
          <Hearts value={health} />
          <Hearts value={health} absorption={6} variant="poisoned" />
          <Hearts value={health} hardcore variant="frozen" />
          <Hearts value={health} variant="withered" />
          <Hearts value={health} max={60} absorption={8} />
          <input
            type="range"
            min={0}
            max={20}
            value={health}
            aria-label="Health"
            onChange={(event) => setHealth(Number(event.target.value))}
          />
        </div>
      }
      code="<Hearts value={15} absorption={4} variant='poisoned' />"
      rows={[
        { name: 'value', type: 'number', description: 'Health in half hearts (20 is a full bar).' },
        {
          name: 'max',
          type: 'number',
          defaultValue: '20',
          description: 'Maximum health in half hearts.',
        },
        {
          name: 'absorption',
          type: 'number',
          defaultValue: '0',
          description: 'Absorption in half hearts.',
        },
        {
          name: 'variant',
          type: "'normal' | 'poisoned' | 'withered' | 'frozen'",
          defaultValue: "'normal'",
          description: 'Tint.',
        },
        {
          name: 'hardcore',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Hardcore sprites.',
        },
        AS,
      ]}
    />
  );
}

export function HungerPage(): JSX.Element {
  const [food, setFood] = useState(13);
  return (
    <ComponentDoc
      intro={
        <>
          The food bar: ten drumsticks filled from the right, measured in half drumsticks. The{' '}
          <Code>hunger</Code> prop switches to the green hunger-effect sprites.
        </>
      }
      demo={
        <div className="site-stack">
          <Hunger value={food} />
          <Hunger value={food} hunger />
          <input
            type="range"
            min={0}
            max={20}
            value={food}
            aria-label="Food"
            onChange={(event) => setFood(Number(event.target.value))}
          />
        </div>
      }
      code="<Hunger value={13} hunger />"
      rows={[
        {
          name: 'value',
          type: 'number',
          description: 'Food level in half drumsticks (20 is full).',
        },
        {
          name: 'hunger',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Hunger-effect sprites.',
        },
        AS,
      ]}
    />
  );
}

export function ArmorPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The armor bar: ten chestplates filled from the left, measured in armor points. It is only
          drawn by the game while armor is worn; render it conditionally.
        </>
      }
      demo={
        <div className="site-stack">
          <Armor value={20} />
          <Armor value={13} />
          <Armor value={0} />
        </div>
      }
      code="<Armor value={13} />"
      rows={[
        { name: 'value', type: 'number', description: 'Armor points (20 is a full bar).' },
        AS,
      ]}
    />
  );
}

export function AirPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The air bubbles shown under water: filled from the right, with the bubble that is about to
          run out drawn popping. Air is measured in ticks.
        </>
      }
      demo={
        <div className="site-stack">
          <Air value={300} />
          <Air value={140} />
          <Air value={20} />
          <Air value={2} />
        </div>
      }
      code="<Air value={140} />"
      rows={[
        { name: 'value', type: 'number', description: 'Remaining air in ticks.' },
        { name: 'max', type: 'number', defaultValue: '300', description: 'Maximum air in ticks.' },
        AS,
      ]}
    />
  );
}

export function SpectatorMenuPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The hotbar frame with a 16×16 <Code>spectator/*</Code> icon in each slot you fill: close,
          scroll left and right, teleport to player and teleport to team. Which icon goes where is
          up to you; the game&apos;s own slot assignment is not reproduced. It accepts every{' '}
          <Code>Hotbar</Code> prop except <Code>slots</Code>.
        </>
      }
      demo={
        <SpectatorMenu
          icons={[
            'scroll_left',
            'teleport_to_player',
            'teleport_to_team',
            undefined,
            undefined,
            undefined,
            'scroll_right',
            undefined,
            'close',
          ]}
        />
      }
      code="<SpectatorMenu icons={['teleport_to_player', undefined, 'close']} />"
      rows={[
        {
          name: 'icons',
          type: '(SpectatorIcon | undefined)[]',
          description: 'The icon for each of the 9 slots.',
        },
        {
          name: 'selected / defaultSelected',
          type: 'number',
          description: 'Controlled or initial slot.',
        },
        {
          name: 'onSelectedChange',
          type: '(selected: number) => void',
          description: 'Called when the selection changes.',
        },
        AS,
      ]}
    />
  );
}

export function VehicleHeartsPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The health of the mount being ridden, shown above the food bar: hearts filled from the
          right, wrapping onto further rows above like <Code>Hearts</Code>.
        </>
      }
      demo={
        <div className="site-stack">
          <VehicleHearts value={14} max={20} />
          <VehicleHearts value={7} max={14} />
        </div>
      }
      code="<VehicleHearts value={14} max={20} />"
      rows={[
        { name: 'value', type: 'number', description: 'Mount health in half hearts.' },
        { name: 'max', type: 'number', description: 'Maximum health in half hearts.' },
        AS,
      ]}
    />
  );
}

export function AttackIndicatorPage(): JSX.Element {
  const [strength, setStrength] = useState(0.5);
  return (
    <ComponentDoc
      intro={
        <>
          The attack cooldown meter shown beside the hotbar when the attack indicator is set to
          &quot;hotbar&quot;: 18×18, filling upwards. The fill rule (
          <Code>(int)(strength * 19)</Code>) is an approximation of the game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <AttackIndicator strength={strength} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={strength}
            aria-label="Attack strength"
            onChange={(event) => setStrength(Number(event.target.value))}
          />
        </div>
      }
      code="<AttackIndicator strength={cooldownProgress} />"
      rows={[
        { name: 'strength', type: 'number', description: 'Charge of the next attack, 0 to 1.' },
        AS,
      ]}
    />
  );
}
