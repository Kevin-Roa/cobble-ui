import { useId, useState, type JSX, type ReactNode } from 'react';
import { Text } from '../../text/Text.tsx';
import { Button } from '../button/Button.tsx';
import { CycleButton, ToggleButton } from '../cycle-button/CycleButton.tsx';
import { LinearLayout } from '../layout/Layouts.tsx';
import { ScreenLayout } from '../screen/Screen.tsx';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/Tabs.tsx';
import { TextField } from '../text-field/TextField.tsx';

/** Tabs of the screen (`CreateWorldScreen.GameTab`, `WorldTab`, `MoreTab`). */
export type CreateWorldTab = 'game' | 'world' | 'more';

/** `WorldCreationUiState.SelectedGameMode`. */
export type CreateWorldGameMode = 'survival' | 'hardcore' | 'creative';
export type CreateWorldDifficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
/** `WorldCreationUiState.WorldTypeEntry` presets. */
export type CreateWorldType = 'default' | 'flat' | 'large_biomes' | 'amplified' | 'single_biome';

/** The form's state (`WorldCreationUiState`). */
export interface CreateWorldValues {
  readonly name: string;
  readonly gameMode: CreateWorldGameMode;
  readonly difficulty: CreateWorldDifficulty;
  readonly allowCommands: boolean;
  readonly worldType: CreateWorldType;
  readonly generateStructures: boolean;
  readonly bonusChest: boolean;
  readonly seed: string;
}

/** The values the game starts with: survival, normal difficulty, no cheats, a new default world. */
export const DEFAULT_CREATE_WORLD_VALUES: CreateWorldValues = {
  name: 'New World',
  gameMode: 'survival',
  difficulty: 'normal',
  allowCommands: false,
  worldType: 'default',
  generateStructures: true,
  bonusChest: false,
  seed: '',
};

export const CREATE_WORLD_GAME_MODES: readonly CreateWorldGameMode[] = [
  'survival',
  'hardcore',
  'creative',
];
export const CREATE_WORLD_DIFFICULTIES: readonly CreateWorldDifficulty[] = [
  'peaceful',
  'easy',
  'normal',
  'hard',
];
export const CREATE_WORLD_TYPES: readonly CreateWorldType[] = [
  'default',
  'flat',
  'large_biomes',
  'amplified',
  'single_biome',
];

const GAME_MODE_LABELS: Readonly<Record<CreateWorldGameMode, string>> = {
  survival: 'Survival',
  hardcore: 'Hardcore',
  creative: 'Creative',
};
const DIFFICULTY_LABELS: Readonly<Record<CreateWorldDifficulty, string>> = {
  peaceful: 'Peaceful',
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};
const WORLD_TYPE_LABELS: Readonly<Record<CreateWorldType, string>> = {
  default: 'Default',
  flat: 'Superflat',
  large_biomes: 'Large Biomes',
  amplified: 'Amplified',
  single_biome: 'Single Biome',
};

/**
 * Applies a change to the form and keeps the rules of `WorldCreationUiState`: a hardcore world is
 * always on hard difficulty (`setDifficulty` is ignored) and cannot allow commands
 * (`setAllowCommands`), so choosing hardcore forces both.
 */
export function updateCreateWorldValues(
  values: CreateWorldValues,
  change: Partial<CreateWorldValues>,
): CreateWorldValues {
  const next = { ...values, ...change };
  return next.gameMode === 'hardcore'
    ? { ...next, difficulty: 'hard', allowCommands: false }
    : next;
}

/** Whether the "Create New World" button is active: the name must not be blank (`CreateWorldScreen#onCreate`). */
export function canCreateWorld(values: Pick<CreateWorldValues, 'name'>): boolean {
  return values.name.trim() !== '';
}

const CONTENT_WIDTH = 210;
const SPACING = 4;

export interface CreateWorldScreenOwnProps {
  /** The current form values. */
  readonly values: CreateWorldValues;
  /** Called with the next values (already normalized by {@link updateCreateWorldValues}). */
  readonly onValuesChange: (values: CreateWorldValues) => void;
  /** Selected tab. Uncontrolled (starting on `"game"`) when omitted. */
  readonly tab?: CreateWorldTab;
  readonly onTabChange?: (tab: CreateWorldTab) => void;
  /** "Create New World" pressed. */
  readonly onCreate?: () => void;
  /** "Cancel" pressed. */
  readonly onCancel?: () => void;
  /** "Game Rules", "Experiments" and "Data Packs" on the More tab. */
  readonly onOpenGameRules?: () => void;
  readonly onOpenExperiments?: () => void;
  readonly onOpenDataPacks?: () => void;
  /** Screen title. Defaults to `"Create New World"`. */
  readonly title?: ReactNode;
}

/**
 * The create-world form (`CreateWorldScreen`): Game, World and More tabs over a header, with
 * "Create New World" and "Cancel" in the footer. Game has the world name, game mode and difficulty
 * cycle buttons and "Allow Commands"; World has the world type, structures, bonus chest and seed;
 * More opens the game rules, experiments and data packs. Controlled and presentational: it only
 * reports changes and button presses and does no world IO. Render it inside a `Screen`.
 */
export function CreateWorldScreen(props: CreateWorldScreenOwnProps): JSX.Element {
  const {
    values,
    onValuesChange,
    tab,
    onTabChange,
    onCreate,
    onCancel,
    onOpenGameRules,
    onOpenExperiments,
    onOpenDataPacks,
    title = 'Create New World',
  } = props;
  const [uncontrolledTab, setUncontrolledTab] = useState<CreateWorldTab>('game');
  const currentTab = tab ?? uncontrolledTab;
  const nameLabelId = useId();
  const seedLabelId = useId();
  const hardcore = values.gameMode === 'hardcore';
  const change = (next: Partial<CreateWorldValues>): void =>
    onValuesChange(updateCreateWorldValues(values, next));

  return (
    <Tabs
      value={currentTab}
      onValueChange={(next) => {
        const nextTab = next as CreateWorldTab;
        if (tab === undefined) setUncontrolledTab(nextTab);
        onTabChange?.(nextTab);
      }}
    >
      <ScreenLayout
        title={title}
        contentLayout="top"
        header={
          <TabList>
            <Tab value="game">Game</Tab>
            <Tab value="world">World</Tab>
            <Tab value="more">More</Tab>
          </TabList>
        }
        footer={
          <LinearLayout orientation="horizontal" spacing={8}>
            <Button
              width={150}
              disabled={!canCreateWorld(values)}
              {...(onCreate === undefined ? {} : { onClick: onCreate })}
            >
              Create New World
            </Button>
            <Button width={150} {...(onCancel === undefined ? {} : { onClick: onCancel })}>
              Cancel
            </Button>
          </LinearLayout>
        }
      >
        <TabPanel value="game">
          <LinearLayout
            spacing={SPACING}
            style={{ width: `calc(${CONTENT_WIDTH} * var(--cobble-px))` }}
          >
            <Text id={nameLabelId} color="gray">
              Enter a World Name
            </Text>
            <TextField
              width={CONTENT_WIDTH}
              maxLength={128}
              aria-labelledby={nameLabelId}
              value={values.name}
              onValueChange={(name) => change({ name })}
            />
            <CycleButton<CreateWorldGameMode>
              width={CONTENT_WIDTH}
              label="Game Mode"
              values={CREATE_WORLD_GAME_MODES}
              value={values.gameMode}
              formatValue={(mode) => GAME_MODE_LABELS[mode]}
              onValueChange={(gameMode) => change({ gameMode })}
            />
            <CycleButton<CreateWorldDifficulty>
              width={CONTENT_WIDTH}
              label="Difficulty"
              disabled={hardcore}
              values={CREATE_WORLD_DIFFICULTIES}
              value={values.difficulty}
              formatValue={(difficulty) => DIFFICULTY_LABELS[difficulty]}
              onValueChange={(difficulty) => change({ difficulty })}
            />
            <ToggleButton
              width={CONTENT_WIDTH}
              label="Allow Commands"
              disabled={hardcore}
              checked={values.allowCommands}
              onCheckedChange={(allowCommands) => change({ allowCommands })}
            />
          </LinearLayout>
        </TabPanel>
        <TabPanel value="world">
          <LinearLayout
            spacing={SPACING}
            style={{ width: `calc(${CONTENT_WIDTH} * var(--cobble-px))` }}
          >
            <CycleButton<CreateWorldType>
              width={CONTENT_WIDTH}
              label="World Type"
              values={CREATE_WORLD_TYPES}
              value={values.worldType}
              formatValue={(worldType) => WORLD_TYPE_LABELS[worldType]}
              onValueChange={(worldType) => change({ worldType })}
            />
            <ToggleButton
              width={CONTENT_WIDTH}
              label="Generate Structures"
              checked={values.generateStructures}
              onCheckedChange={(generateStructures) => change({ generateStructures })}
            />
            <ToggleButton
              width={CONTENT_WIDTH}
              label="Bonus Chest"
              checked={values.bonusChest}
              onCheckedChange={(bonusChest) => change({ bonusChest })}
            />
            <Text id={seedLabelId} color="gray">
              Seed for the World Generator
            </Text>
            <TextField
              width={CONTENT_WIDTH}
              maxLength={128}
              placeholder="Leave blank for a random seed"
              aria-labelledby={seedLabelId}
              value={values.seed}
              onValueChange={(seed) => change({ seed })}
            />
          </LinearLayout>
        </TabPanel>
        <TabPanel value="more">
          <LinearLayout
            spacing={SPACING}
            style={{ width: `calc(${CONTENT_WIDTH} * var(--cobble-px))` }}
          >
            <Button
              width={CONTENT_WIDTH}
              {...(onOpenGameRules === undefined ? {} : { onClick: onOpenGameRules })}
            >
              Game Rules
            </Button>
            <Button
              width={CONTENT_WIDTH}
              {...(onOpenExperiments === undefined ? {} : { onClick: onOpenExperiments })}
            >
              Experiments
            </Button>
            <Button
              width={CONTENT_WIDTH}
              {...(onOpenDataPacks === undefined ? {} : { onClick: onOpenDataPacks })}
            >
              Data Packs
            </Button>
          </LinearLayout>
        </TabPanel>
      </ScreenLayout>
    </Tabs>
  );
}
