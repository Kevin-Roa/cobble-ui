import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProvider } from '../../test/utils.tsx';
import { TranslationProvider } from '../i18n/Translation.tsx';
import { LockButton } from './button/LockButton.tsx';
import { ChatInput } from './chat/ChatInput.tsx';
import { CreativeInventoryPanel } from './creative/CreativeInventoryPanel.tsx';
import { ToggleButton } from './cycle-button/CycleButton.tsx';
import { Hotbar } from './hotbar/Hotbar.tsx';
import { ConfirmScreen } from './menus/ConfirmScreen.tsx';
import { OptionsScreen } from './menus/OptionsScreen.tsx';
import { PauseScreen } from './menus/PauseScreen.tsx';
import { TitleScreen } from './menus/TitleScreen.tsx';
import { ProgressBar } from './progress/ProgressBar.tsx';
import {
  CreateWorldScreen,
  DEFAULT_CREATE_WORLD_VALUES,
} from './world-select/CreateWorldScreen.tsx';
import { worldDisplayName, worldInfoLine } from './world-select/WorldSelectionList.tsx';

const tOr = (key: string, fallback: string, ...args: readonly (string | number)[]): string =>
  key === 'cobble.world_select.unnamed' ? `Mundo ${String(args[0])}` : fallback;

describe('menu and widget defaults are translated', () => {
  it('shows English with no provider', () => {
    renderWithProvider(
      <>
        <TitleScreen />
        <PauseScreen />
        <ConfirmScreen title="Sure?" />
        <OptionsScreen title="Video" />
        <LockButton />
        <ProgressBar />
        <Hotbar />
        <ChatInput onSubmit={() => {}} />
        <ToggleButton label="Thing" />
      </>,
    );
    expect(screen.getByText('Singleplayer')).toBeInTheDocument();
    expect(screen.getByText('Quit Game')).toBeInTheDocument();
    expect(screen.getByText('Game Menu')).toBeInTheDocument();
    expect(screen.getByText('Back to Game')).toBeInTheDocument();
    expect(screen.getByText('Open to LAN')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByLabelText('Lock')).toBeInTheDocument();
    expect(screen.getByLabelText('Progress')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message')).toBeInTheDocument();
    expect(screen.getByText(/OFF/)).toBeInTheDocument();
  });

  it('shows English create-world labels', () => {
    renderWithProvider(
      <CreateWorldScreen values={DEFAULT_CREATE_WORLD_VALUES} onValuesChange={() => {}} />,
    );
    expect(screen.getAllByText('Create New World').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Game' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'More' })).toBeInTheDocument();
    expect(screen.getByText(/Game Mode/)).toBeInTheDocument();
  });

  it('shows English creative tabs', () => {
    renderWithProvider(<CreativeInventoryPanel />);
    expect(screen.getByLabelText('Building Blocks')).toBeInTheDocument();
  });

  it('lets a TranslationProvider override the defaults', () => {
    renderWithProvider(
      <TranslationProvider
        translations={{
          'menu.singleplayer': 'Solo',
          'menu.game': 'Menu del juego',
          'gui.yes': 'Si',
          'cobble.button.lock': 'Bloquear',
          'cobble.hotbar.slot': 'Ranura %s',
          'itemGroup.buildingBlocks': 'Bloques',
        }}
      >
        <TitleScreen />
        <PauseScreen />
        <ConfirmScreen title="Sure?" />
        <LockButton />
        <Hotbar />
        <CreativeInventoryPanel />
      </TranslationProvider>,
    );
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('Menu del juego')).toBeInTheDocument();
    expect(screen.getByText('Si')).toBeInTheDocument();
    expect(screen.getByLabelText('Bloquear')).toBeInTheDocument();
    expect(screen.getByLabelText('Ranura 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Bloques')).toBeInTheDocument();
  });

  it('lets explicit props win over translations', () => {
    renderWithProvider(
      <TranslationProvider
        translations={{ 'gui.yes': 'Si', 'cobble.button.lock': 'Bloquear', 'menu.game': 'X' }}
      >
        <ConfirmScreen title="Sure?" yesLabel="Aye" />
        <LockButton label="Padlock" />
        <ProgressBar label="Loading" />
        <PauseScreen title="Paused" />
      </TranslationProvider>,
    );
    expect(screen.getByText('Aye')).toBeInTheDocument();
    expect(screen.queryByText('Si')).toBeNull();
    expect(screen.getByLabelText('Padlock')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('translates world list lines', () => {
    expect(worldDisplayName({ name: '' }, 0)).toBe('Unnamed World 1');
    expect(worldDisplayName({ name: '' }, 1, tOr)).toBe('Mundo 2');
    expect(worldDisplayName({ name: 'Home' }, 1, tOr)).toBe('Home');
    expect(worldInfoLine({ gameMode: 'survival' })).toBeDefined();
  });
});
