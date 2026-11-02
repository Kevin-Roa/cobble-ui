import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Button } from '../button/Button.tsx';
import { OptionsList, type OptionsListProps } from '../options-list/OptionsList.tsx';
import { Screen, ScreenLayout, type ScreenBackground } from '../screen/Screen.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

export interface OptionsScreenOwnProps {
  /** Header title (`OptionsSubScreen#title`). */
  readonly title: ReactNode;
  /** Rows for the {@link OptionsList}: `OptionsListHeader` and `OptionsListRow`. */
  readonly children?: ReactNode;
  /** Label of the footer button. Defaults to "Done" (`gui.done`). */
  readonly doneLabel?: ReactNode;
  /** Called by the Done button and by Escape (`OptionsSubScreen#onClose`). */
  readonly onDone?: () => void;
  /** Replaces the Done button entirely. */
  readonly footer?: ReactNode;
  /** Accessible name for the list. Defaults to the title when it is a string. */
  readonly listLabel?: string;
  readonly background?: ScreenBackground;
  readonly listProps?: Omit<OptionsListProps, 'children'>;
}

export type OptionsScreenProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  OptionsScreenOwnProps
>;

/**
 * An options sub screen (`OptionsSubScreen`): title header, a scrolling {@link OptionsList} and a
 * 200-wide Done button in the footer. The list is created for you; pass rows as children.
 */
export function OptionsScreen<E extends ElementType = 'div'>(
  props: OptionsScreenProps<E>,
): JSX.Element {
  const {
    title,
    children,
    doneLabel: doneLabelProp,
    onDone,
    footer,
    listLabel,
    background = 'menu',
    listProps,
    ...rest
  } = props as OptionsScreenProps<'div'>;
  const { tOr } = useTranslation();
  const doneLabel = doneLabelProp ?? tOr('gui.done', 'Done');
  const label = listLabel ?? (typeof title === 'string' ? title : undefined);
  return (
    <Screen
      {...rest}
      background={background}
      {...(onDone === undefined ? {} : { onClose: onDone })}
      data-cobble-menu="options"
    >
      <ScreenLayout
        title={title}
        footer={
          footer ?? (
            <Button width={200} {...(onDone === undefined ? {} : { onClick: onDone })}>
              {doneLabel}
            </Button>
          )
        }
      >
        <OptionsList {...(label === undefined ? {} : { 'aria-label': label })} {...listProps}>
          {children}
        </OptionsList>
      </ScreenLayout>
    </Screen>
  );
}
