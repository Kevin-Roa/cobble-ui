import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProvider } from '../../test/utils.tsx';
import { TranslationProvider } from '../i18n/Translation.tsx';
import { ChestPanel } from './player/ChestPanel.tsx';
import { PlayerInventory } from './player/PlayerInventory.tsx';
import {
  AnvilPanel,
  BrewingStandPanel,
  FurnacePanel,
  StonecutterPanel,
} from './slot/StationPanels.tsx';
import { DispenserPanel, HopperPanel, VillagerTradePanel } from './slot/TradingPanels.tsx';

describe('station, trading and player panel defaults are translated', () => {
  it('shows English with no provider', () => {
    renderWithProvider(
      <>
        <AnvilPanel />
        <BrewingStandPanel />
        <FurnacePanel station="smoker" />
        <StonecutterPanel />
        <HopperPanel />
        <DispenserPanel />
        <ChestPanel />
      </>,
    );
    for (const text of [
      'Repair & Name',
      'Brewing Stand',
      'Smoker',
      'Stonecutter',
      'Item Hopper',
      'Chest',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Inventory').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Anvil first input')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Blaze powder').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Potion bottle 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Furnace fuel')).toBeInTheDocument();
  });

  it('shows English for trading and inventory panels', () => {
    renderWithProvider(
      <>
        <VillagerTradePanel />
        <PlayerInventory />
      </>,
    );
    expect(screen.getByText('Villager')).toBeInTheDocument();
    expect(screen.getByLabelText('First payment')).toBeInTheDocument();
    expect(screen.getByText('Crafting')).toBeInTheDocument();
    expect(screen.getByLabelText('Helmet')).toBeInTheDocument();
    expect(screen.getByLabelText('Crafting slot 3')).toBeInTheDocument();
  });

  it('lets a TranslationProvider override keys', () => {
    renderWithProvider(
      <TranslationProvider
        translations={{
          'container.hopper': 'Trichter',
          'cobble.anvil.first_input': 'Amboss links',
          'container.chest': 'Truhe',
          'cobble.inventory.crafting_slot': 'Feld %s',
        }}
      >
        <HopperPanel />
        <AnvilPanel />
        <ChestPanel />
        <PlayerInventory />
      </TranslationProvider>,
    );
    expect(screen.getByText('Trichter')).toBeInTheDocument();
    expect(screen.getByLabelText('Amboss links')).toBeInTheDocument();
    expect(screen.getByText('Truhe')).toBeInTheDocument();
    expect(screen.getByLabelText('Feld 1')).toBeInTheDocument();
  });

  it('prefers explicit props over translated defaults', () => {
    renderWithProvider(
      <TranslationProvider translations={{ 'container.hopper': 'Trichter' }}>
        <HopperPanel title="Mine" inventoryTitle="Bag" />
        <ChestPanel title="Loot" />
      </TranslationProvider>,
    );
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('Bag')).toBeInTheDocument();
    expect(screen.getByText('Loot')).toBeInTheDocument();
    expect(screen.queryByText('Trichter')).toBeNull();
  });
});
