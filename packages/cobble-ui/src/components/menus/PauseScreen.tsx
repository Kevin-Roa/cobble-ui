import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Button } from '../button/Button.tsx';
import { GridLayout, GridLayoutCell } from '../layout/Layouts.tsx';
import { Screen, ScreenLayout } from '../screen/Screen.tsx';

/** `PauseScreen#BUTTON_WIDTH_FULL`. */
export const PAUSE_SCREEN_FULL_WIDTH = 204;
/** `PauseScreen#BUTTON_WIDTH_HALF`. */
export const PAUSE_SCREEN_HALF_WIDTH = 98;

export interface PauseScreenOwnProps {
  /** Header text. Defaults to "Game Menu" (`menu.game`). */
  readonly title?: ReactNode;
  readonly onBackToGame?: () => void;
  readonly onAdvancements?: () => void;
  readonly onStatistics?: () => void;
  readonly onFeedback?: () => void;
  readonly onReportBugs?: () => void;
  readonly onOptions?: () => void;
  readonly onOpenToLan?: () => void;
  /** "Save and Quit to Title" (`menu.returnToMenu`). */
  readonly onSaveAndQuit?: () => void;
  /** Disable the LAN button, e.g. when the world is already open (`PauseScreen#createPauseMenu`). */
  readonly lanDisabled?: boolean;
  /** Label of the quit button. Defaults to "Save and Quit to Title". */
  readonly quitLabel?: ReactNode;
  /** Called on Escape, like `PauseScreen#onClose` (resume the game). */
  readonly onClose?: () => void;
  /** The in-game dark gradient (default) or the menu background. */
  readonly background?: 'transparent' | 'menu';
}

export type PauseScreenProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PauseScreenOwnProps
>;

function half(label: string, onClick: (() => void) | undefined, disabled = false): JSX.Element {
  return (
    <Button
      width={PAUSE_SCREEN_HALF_WIDTH}
      disabled={disabled}
      {...(onClick === undefined ? {} : { onClick })}
    >
      {label}
    </Button>
  );
}

/**
 * The pause menu (`PauseScreen#createPauseMenu`): a 2-column grid with 4 units of spacing; "Back to
 * Game" and "Save and Quit" span both columns (204 wide), the others are 98 wide. Purely
 * presentational: every button just calls the handler you pass.
 */
export function PauseScreen<E extends ElementType = 'div'>(
  props: PauseScreenProps<E>,
): JSX.Element {
  const {
    title = 'Game Menu',
    onBackToGame,
    onAdvancements,
    onStatistics,
    onFeedback,
    onReportBugs,
    onOptions,
    onOpenToLan,
    onSaveAndQuit,
    lanDisabled = false,
    quitLabel = 'Save and Quit to Title',
    onClose,
    background = 'transparent',
    ...rest
  } = props as PauseScreenProps<'div'>;
  return (
    <Screen
      {...rest}
      background={background}
      {...(onClose === undefined ? {} : { onClose })}
      data-cobble-menu="pause"
    >
      <ScreenLayout title={title} contentLayout="top">
        <GridLayout columns={2} gap={4}>
          <GridLayoutCell colSpan={2}>
            <Button
              width={PAUSE_SCREEN_FULL_WIDTH}
              {...(onBackToGame === undefined ? {} : { onClick: onBackToGame })}
            >
              Back to Game
            </Button>
          </GridLayoutCell>
          {half('Advancements', onAdvancements)}
          {half('Statistics', onStatistics)}
          {half('Give Feedback', onFeedback)}
          {half('Report Bugs', onReportBugs)}
          {half('Options...', onOptions)}
          {half('Open to LAN', onOpenToLan, lanDisabled)}
          <GridLayoutCell colSpan={2}>
            <Button
              width={PAUSE_SCREEN_FULL_WIDTH}
              {...(onSaveAndQuit === undefined ? {} : { onClick: onSaveAndQuit })}
            >
              {quitLabel}
            </Button>
          </GridLayoutCell>
        </GridLayout>
      </ScreenLayout>
    </Screen>
  );
}
