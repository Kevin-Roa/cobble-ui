import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProvider } from '../../test/utils.tsx';
import {
  Button,
  Checkbox,
  CycleButton,
  SelectionList,
  SelectionListItem,
  Slider,
  Tab,
  TabList,
  Tabs,
  TextField,
} from '../index.ts';

describe('keyboard navigation', () => {
  it('tabs through widgets in document order and skips disabled ones', async () => {
    renderWithProvider(
      <>
        <Button>First</Button>
        <Button disabled>Skipped</Button>
        <Checkbox>Check</Checkbox>
        <Slider label="Volume" defaultValue={50} />
        <CycleButton label="Mode" values={['a', 'b'] as const} />
        <TextField aria-label="Name" />
      </>,
    );
    const order = [
      screen.getByRole('button', { name: 'First' }),
      screen.getByRole('checkbox'),
      screen.getByRole('slider'),
      screen.getByRole('button', { name: /Mode/ }),
      screen.getByRole('textbox', { name: 'Name' }),
    ];
    for (const element of order) {
      await userEvent.tab();
      expect(element).toHaveFocus();
    }
    await userEvent.tab({ shift: true });
    expect(order[3]).toHaveFocus();
  });

  it('marks the focused button, checkbox, slider and tab as highlighted', async () => {
    renderWithProvider(
      <>
        <Button>Play</Button>
        <Checkbox>Check</Checkbox>
        <Slider label="Volume" defaultValue={50} />
        <Tabs defaultValue="one">
          <TabList>
            <Tab value="one">One</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const widgets = [
      screen.getByRole('button', { name: 'Play' }),
      screen.getByRole('checkbox'),
      screen.getByRole('slider'),
      screen.getByRole('tab'),
    ];
    for (const widget of widgets) {
      await userEvent.tab();
      expect(widget).toHaveFocus();
      const marked = widget.closest('[data-focused]') ?? widget;
      expect(marked).toHaveAttribute('data-focused');
    }
    await userEvent.tab();
    for (const widget of widgets) {
      expect(widget.closest('[data-focused]')).toBeNull();
    }
  });

  it('keeps a selection list as one tab stop and moves the selection with the arrows', async () => {
    renderWithProvider(
      <>
        <Button>Before</Button>
        <SelectionList aria-label="Worlds" defaultValue="a">
          <SelectionListItem value="a">A</SelectionListItem>
          <SelectionListItem value="b">B</SelectionListItem>
          <SelectionListItem value="c">C</SelectionListItem>
        </SelectionList>
        <Button>After</Button>
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    const list = screen.getByRole('listbox');
    expect(list).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('option', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('moves between tabs with the arrow keys', async () => {
    renderWithProvider(
      <Tabs defaultValue="one">
        <TabList>
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });
});
