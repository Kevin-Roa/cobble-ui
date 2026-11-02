import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Text } from '../../text/Text.tsx';
import { Button } from '../button/Button.tsx';
import { Screen } from '../screen/Screen.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Width of the title screen's main buttons (`TitleScreen#createNormalMenuOptions`). */
export const TITLE_SCREEN_BUTTON_WIDTH = 200;
/** Width of the Options/Quit pair: two buttons and a 4-unit gap fill 200 units. */
export const TITLE_SCREEN_HALF_WIDTH = 98;

export interface TitleScreenOwnProps {
  /**
   * The logo, drawn centred above the buttons (`LogoRenderer`). Empty on purpose: pass your own
   * image or text. No logo or branding is bundled.
   */
  readonly logo?: ReactNode;
  /** Splash text, e.g. a `SplashText`, rendered over the screen. */
  readonly splash?: ReactNode;
  /** Small text at the bottom left (`TitleScreen#version`), e.g. your app version. */
  readonly versionText?: ReactNode;
  /** Small text at the bottom right (`TitleScreen#copyright`). */
  readonly copyrightText?: ReactNode;
  readonly onSingleplayer?: () => void;
  readonly onMultiplayer?: () => void;
  /** Third full-width button. Hidden unless `onRealms` or `realmsLabel` is given. */
  readonly onRealms?: () => void;
  readonly realmsLabel?: ReactNode;
  readonly onOptions?: () => void;
  readonly onQuit?: () => void;
  readonly onClose?: () => void;
}

export type TitleScreenProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  TitleScreenOwnProps
>;

function full(label: ReactNode, onClick: (() => void) | undefined): JSX.Element {
  return (
    <Button width={TITLE_SCREEN_BUTTON_WIDTH} {...(onClick === undefined ? {} : { onClick })}>
      {label}
    </Button>
  );
}

/**
 * The title screen (`TitleScreen`): the panorama, a logo slot, the Singleplayer / Multiplayer /
 * extra buttons and the Options + Quit pair. Controlled and presentational; contains no logos.
 */
export function TitleScreen<E extends ElementType = 'div'>(
  props: TitleScreenProps<E>,
): JSX.Element {
  const {
    logo,
    splash,
    versionText,
    copyrightText,
    onSingleplayer,
    onMultiplayer,
    onRealms,
    realmsLabel,
    onOptions,
    onQuit,
    onClose,
    ...rest
  } = props as TitleScreenProps<'div'>;
  const { tOr } = useTranslation();
  return (
    <Screen
      {...rest}
      background="panorama"
      {...(onClose === undefined ? {} : { onClose })}
      data-cobble-menu="title"
    >
      <div className="cobble-title-screen">
        <div className="cobble-title-screen-logo">{logo}</div>
        <div className="cobble-title-screen-buttons">
          {full(tOr('menu.singleplayer', 'Singleplayer'), onSingleplayer)}
          {full(tOr('menu.multiplayer', 'Multiplayer'), onMultiplayer)}
          {onRealms !== undefined || realmsLabel !== undefined
            ? full(realmsLabel ?? tOr('cobble.title.realms', 'Realms'), onRealms)
            : null}
          <div className="cobble-title-screen-pair">
            <Button
              width={TITLE_SCREEN_HALF_WIDTH}
              {...(onOptions === undefined ? {} : { onClick: onOptions })}
            >
              {tOr('menu.options', 'Options...')}
            </Button>
            <Button
              width={TITLE_SCREEN_HALF_WIDTH}
              {...(onQuit === undefined ? {} : { onClick: onQuit })}
            >
              {tOr('menu.quit', 'Quit Game')}
            </Button>
          </div>
        </div>
        {splash}
        {versionText === undefined ? null : (
          <Text className="cobble-title-screen-version" color="white">
            {versionText}
          </Text>
        )}
        {copyrightText === undefined ? null : (
          <Text className="cobble-title-screen-copyright" color="white">
            {copyrightText}
          </Text>
        )}
      </div>
    </Screen>
  );
}
