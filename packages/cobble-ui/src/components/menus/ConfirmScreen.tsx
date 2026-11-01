import { useId, type ElementType, type JSX, type ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Text } from '../../text/Text.tsx';
import { Button } from '../button/Button.tsx';
import { Screen, type ScreenBackground } from '../screen/Screen.tsx';

export interface ConfirmScreenOwnProps {
  /** Title (`ConfirmScreen#title`), centred in white. */
  readonly title: ReactNode;
  /** Message under the title (`ConfirmScreen#message`). */
  readonly message?: ReactNode;
  /** Label of the confirm button. Defaults to "Yes" (`gui.yes`). */
  readonly yesLabel?: ReactNode;
  /** Label of the cancel button. Defaults to "No" (`gui.no`). */
  readonly noLabel?: ReactNode;
  /** `ConfirmScreen#callback(true)`. */
  readonly onConfirm?: () => void;
  /** `ConfirmScreen#callback(false)`; also called on Escape. */
  readonly onCancel?: () => void;
  readonly background?: ScreenBackground;
}

export type ConfirmScreenProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ConfirmScreenOwnProps
>;

/**
 * A full-screen yes/no question (`ConfirmScreen`): a title, a message and two 150-wide buttons
 * 4 units apart. Controlled; for an overlay on top of another screen use `Dialog`.
 */
export function ConfirmScreen<E extends ElementType = 'div'>(
  props: ConfirmScreenProps<E>,
): JSX.Element {
  const {
    title,
    message,
    yesLabel = 'Yes',
    noLabel = 'No',
    onConfirm,
    onCancel,
    background = 'menu',
    ...rest
  } = props as ConfirmScreenProps<'div'>;
  const titleId = useId();
  const messageId = useId();
  return (
    <Screen
      aria-labelledby={titleId}
      {...(message === undefined ? {} : { 'aria-describedby': messageId })}
      {...rest}
      background={background}
      {...(onCancel === undefined ? {} : { onClose: onCancel })}
      data-cobble-menu="confirm"
    >
      <div className="cobble-confirm-screen">
        <Text as="h1" id={titleId} className="cobble-confirm-title" color="white">
          {title}
        </Text>
        {message === undefined ? null : (
          <Text as="p" id={messageId} className="cobble-confirm-message" color="white">
            {message}
          </Text>
        )}
        <div className="cobble-confirm-buttons">
          <Button {...(onConfirm === undefined ? {} : { onClick: onConfirm })}>{yesLabel}</Button>
          <Button {...(onCancel === undefined ? {} : { onClick: onCancel })}>{noLabel}</Button>
        </div>
      </div>
    </Screen>
  );
}
