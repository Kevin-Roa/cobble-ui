import {
  CreateWorldScreen,
  DEFAULT_CREATE_WORLD_VALUES,
  WorldSelectionList,
  type CreateWorldValues,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const SAMPLE_WORLDS = [
  {
    id: 'New World',
    name: 'New World',
    gameMode: 'survival',
    version: '26.3',
    lastPlayed: Date.UTC(2026, 9, 22, 9, 41),
  },
  {
    id: 'Creative Build',
    name: 'Creative Build',
    gameMode: 'creative',
    cheats: true,
    version: '26.3',
    lastPlayed: Date.UTC(2026, 8, 1, 18, 5),
  },
  { id: 'World3', name: '', gameMode: 'survival', hardcore: true },
] as const;

export function WorldSelectionListPage(): JSX.Element {
  const [selected, setSelected] = useState<string | null>('New World');
  return (
    <ComponentDoc
      intro={
        <>
          The singleplayer world list: a <Code>SelectionList</Code> of <Code>WorldListEntry</Code>{' '}
          rows. Each shows the icon, the name, the <Code>id (date)</Code> line and the game mode,
          cheats and version. Arrow keys, Home and End move the selection; Enter or double-click
          plays. It is controlled and presentational and never reads saves.
        </>
      }
      demo={
        <div
          style={{ width: 'calc(360 * var(--cobble-px))', height: 'calc(130 * var(--cobble-px))' }}
        >
          <WorldSelectionList
            worlds={SAMPLE_WORLDS}
            value={selected}
            onValueChange={setSelected}
            formatDate={(date) => new Date(date).toISOString().slice(0, 10)}
          />
        </div>
      }
      code="<WorldSelectionList worlds={worlds} value={selected} onValueChange={setSelected} onPlay={play} />"
      rows={[
        {
          name: 'worlds',
          type: 'WorldSummary[]',
          description: 'id, name, lastPlayed, gameMode, hardcore, cheats, version, icon, status.',
        },
        {
          name: 'value / defaultValue / onValueChange',
          type: 'string',
          description: 'Selected id.',
        },
        {
          name: 'onPlay',
          type: '(id: string) => void',
          description: 'Double-click, Enter or the icon arrow.',
        },
        {
          name: 'formatDate',
          type: '(date: number | Date) => string',
          description: 'Formats lastPlayed. Defaults to a short en-US date and time.',
        },
      ]}
    />
  );
}

export function CreateWorldScreenPage(): JSX.Element {
  const [values, setValues] = useState<CreateWorldValues>(DEFAULT_CREATE_WORLD_VALUES);
  return (
    <ComponentDoc
      intro={
        <>
          The create-world form: Game, World and More tabs with a name field, game mode and
          difficulty cycle buttons, toggles and a seed field. Hardcore locks difficulty to hard and
          turns commands off. It is controlled and does no world IO; render it inside a{' '}
          <Code>Screen</Code>.
        </>
      }
      demo={
        <div
          style={{ width: 'calc(400 * var(--cobble-px))', height: 'calc(230 * var(--cobble-px))' }}
        >
          <CreateWorldScreen values={values} onValuesChange={setValues} />
        </div>
      }
      code="<CreateWorldScreen values={values} onValuesChange={setValues} onCreate={create} onCancel={back} />"
      rows={[
        { name: 'values', type: 'CreateWorldValues', description: 'The form state.' },
        {
          name: 'onValuesChange',
          type: '(values: CreateWorldValues) => void',
          description: 'Next state, with the hardcore rules applied.',
        },
        {
          name: 'tab / onTabChange',
          type: "'game' | 'world' | 'more'",
          description: 'Selected tab.',
        },
        { name: 'onCreate / onCancel', type: '() => void', description: 'Footer buttons.' },
        {
          name: 'onOpenGameRules / onOpenExperiments / onOpenDataPacks',
          type: '() => void',
          description: 'Buttons on the More tab.',
        },
      ]}
    />
  );
}
