import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProvider } from '../../test/utils.tsx';
import { TranslationProvider } from '../i18n/Translation.tsx';
import { CraftingGrid } from './slot/CraftingGrid.tsx';
import {
  CrafterPanel,
  CraftingTablePanel,
  LoomPanel,
  SmithingTablePanel,
} from './slot/CraftingPanels.tsx';
import { EnchantingTablePanel } from './slot/EnchantingTablePanel.tsx';
import { PlayerInventoryGrid, SlotGrid } from './slot/SlotGrid.tsx';

describe('slot defaults are translated', () => {
  it('shows English with no provider', () => {
    renderWithProvider(<LoomPanel />);
    expect(screen.getByText('Loom')).toBeInTheDocument();
    expect(screen.getByLabelText('Banner')).toBeInTheDocument();
    expect(screen.getByLabelText('Loom result')).toBeInTheDocument();
  });

  it('shows English for crafting panels and grids', () => {
    renderWithProvider(
      <>
        <CraftingTablePanel />
        <CrafterPanel />
        <PlayerInventoryGrid />
      </>,
    );
    expect(screen.getByText('Crafting')).toBeInTheDocument();
    expect(screen.getByText('Crafter')).toBeInTheDocument();
    expect(screen.getByLabelText('Crafting slot 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Crafter slot 9')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Hotbar').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Inventory').length).toBeGreaterThan(0);
  });

  it('shows English for the enchanting table', () => {
    renderWithProvider(<EnchantingTablePanel />);
    expect(screen.getByText('Enchant')).toBeInTheDocument();
    expect(screen.getByLabelText('Lapis Lazuli')).toBeInTheDocument();
    expect(screen.getByLabelText('Enchantment option 2')).toBeInTheDocument();
  });

  it('lets a TranslationProvider override keys', () => {
    renderWithProvider(
      <TranslationProvider
        translations={{
          'container.upgrade': 'Mejora',
          'cobble.slot.numbered': 'Casilla %s',
          'cobble.smithing.base': 'Base',
        }}
      >
        <SmithingTablePanel />
        <SlotGrid columns={2} rows={1} />
      </TranslationProvider>,
    );
    expect(screen.getByText('Mejora')).toBeInTheDocument();
    expect(screen.getByLabelText('Base')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Casilla 2').length).toBeGreaterThan(0);
  });

  it('prefers explicit props', () => {
    renderWithProvider(
      <TranslationProvider translations={{ 'container.loom': 'Telar' }}>
        <LoomPanel title="Mine" />
        <CraftingGrid ingredients={[{ content: null, label: 'Stick' }]} />
      </TranslationProvider>,
    );
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.queryByText('Telar')).toBeNull();
    expect(screen.getByLabelText('Stick')).toBeInTheDocument();
  });
});
