import { act, fireEvent, render as renderPlain, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { png, renderWithProvider } from '../../test/utils.tsx';
import {
  Button,
  Checkbox,
  CobbleProvider,
  CycleButton,
  LoomPatternButton,
  SelectionList,
  SelectionListItem,
  Slider,
  StonecutterRecipeButton,
  Tab,
  TabList,
  Tabs,
  TextField,
  ToggleButton,
  memoryAssets,
} from '../index.ts';

const SOUND_FILES = [
  'random/click_stereo',
  'random/click',
  'ui/loom/select_pattern1',
  'ui/loom/select_pattern2',
  'ui/loom/select_pattern3',
  'ui/loom/select_pattern4',
  'ui/loom/select_pattern5',
];
const CLICK = 'https://example.invalid/random/click_stereo.ogg';
const SELECT_RECIPE = 'https://example.invalid/random/click.ogg';

/** Renders with sounds on and records the URL of each sound that plays. */
async function renderWithSounds(ui: ReactElement): Promise<string[]> {
  const played: string[] = [];
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    played.push(this.src);
    return Promise.resolve();
  });
  const objects: Record<string, string> = {};
  for (const name of SOUND_FILES) {
    objects[`minecraft/sounds/${name}.ogg`] = `https://example.invalid/${name}.ogg`;
  }
  const assets = memoryAssets({
    files: {
      'assets/minecraft/textures/gui/sprites/widget/button.png': png(200, 20, () => [
        128, 128, 128, 255,
      ]),
    },
    objects,
  });
  renderPlain(
    <CobbleProvider assets={assets} guiScale={2} sound={{ enabled: true }}>
      {ui}
    </CobbleProvider>,
  );
  await waitFor(() => expect(document.querySelector('.cobble-root')).toBeInTheDocument());
  await act(async () => {
    await Promise.resolve();
  });
  return played;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('widget sounds', () => {
  it('plays the click sound when a checkbox is toggled with the mouse or the keyboard', async () => {
    const played = await renderWithSounds(<Checkbox>Cheats</Checkbox>);
    const box = screen.getByRole('checkbox');
    fireEvent.pointerDown(box, { button: 0 });
    expect(played).toEqual([CLICK]);
    act(() => box.focus());
    await userEvent.keyboard('{Enter}');
    expect(played).toHaveLength(2);
    await userEvent.keyboard(' ');
    expect(played).toHaveLength(3);
  });

  it('toggles a checkbox with Enter like Space', async () => {
    renderWithProvider(<Checkbox>Cheats</Checkbox>);
    const box = screen.getByRole('checkbox');
    act(() => box.focus());
    await userEvent.keyboard('{Enter}');
    expect(box).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard(' ');
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('does not toggle or sound a disabled or read-only checkbox', async () => {
    const played = await renderWithSounds(
      <>
        <Checkbox disabled>Off</Checkbox>
        <Checkbox readOnly>Locked</Checkbox>
      </>,
    );
    for (const box of screen.getAllByRole('checkbox')) {
      fireEvent.pointerDown(box, { button: 0 });
      fireEvent.keyDown(box, { key: 'Enter' });
      expect(box).toHaveAttribute('aria-checked', 'false');
    }
    expect(played).toEqual([]);
  });

  it('does not play a click sound for the right mouse button or a held key', async () => {
    const played = await renderWithSounds(<Button>Go</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { button: 2 });
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    expect(played).toEqual([]);
  });

  it('plays the click sound for cycle and toggle buttons', async () => {
    const played = await renderWithSounds(
      <>
        <CycleButton values={['a', 'b'] as const} label="Mode" />
        <ToggleButton label="Sounds" />
      </>,
    );
    for (const button of screen.getAllByRole('button')) {
      fireEvent.pointerDown(button, { button: 0 });
    }
    expect(played).toEqual([CLICK, CLICK]);
  });

  it('plays the click sound when the tab changes, and not when it stays', async () => {
    const played = await renderWithSounds(
      <Tabs defaultValue="one">
        <TabList>
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(played).toHaveLength(1);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(played).toHaveLength(1);
  });

  it('plays the click sound when a slider handle is released, not while dragging', async () => {
    const played = await renderWithSounds(<Slider label="FOV" min={30} max={110} />);
    const slider = screen.getByRole('slider');
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 10 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 20 });
    expect(played).toEqual([]);
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 20 });
    expect(played).toEqual([CLICK]);
  });

  it('plays the stonecutter and loom selection sounds instead of the click', async () => {
    const played = await renderWithSounds(
      <>
        <StonecutterRecipeButton label="Recipe" />
        <LoomPatternButton label="Pattern" />
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Recipe' }), { button: 0 });
    expect(played).toEqual([SELECT_RECIPE]);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Pattern' }), { button: 0 });
    expect(played).toHaveLength(2);
    expect(played[1]).toMatch(/ui\/loom\/select_pattern[1-5]\.ogg$/);
  });

  it('lets a sound prop override or silence the default', async () => {
    const played = await renderWithSounds(
      <>
        <LoomPatternButton label="Silent" sound={false} />
        <Button sound="ui.stonecutter.select_recipe">Custom</Button>
      </>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Silent' }), { button: 0 });
    expect(played).toEqual([]);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Custom' }), { button: 0 });
    expect(played).toEqual([SELECT_RECIPE]);
  });

  it('is silent for selection lists and text fields, like their vanilla widgets', async () => {
    const played = await renderWithSounds(
      <>
        <SelectionList aria-label="Worlds" defaultValue="a">
          <SelectionListItem value="a">A</SelectionListItem>
          <SelectionListItem value="b">B</SelectionListItem>
        </SelectionList>
        <TextField aria-label="Name" />
      </>,
    );
    await userEvent.click(screen.getByRole('option', { name: 'B' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'x{Enter}');
    expect(played).toEqual([]);
  });
});
