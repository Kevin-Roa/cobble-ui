import { useEffect, useState, type JSX } from 'react';
import type { SlotProps } from '../internal/polymorphic.ts';

/** `LoadingDotsText#get`: a dot that bounces across three positions every 300 ms. */
export function loadingDotsText(millis: number): string {
  switch (Math.floor(millis / 300) % 4) {
    case 0:
      return 'O o o';
    case 2:
      return 'o o O';
    default:
      return 'o O o';
  }
}

export type LoadingDotsProps = Omit<SlotProps<'span'>, 'children'>;

/** The animated `O o o` shown while connecting (`LoadingDotsText`). Gray, like the game. */
export function LoadingDots(props: LoadingDotsProps): JSX.Element {
  const { className, ...rest } = props;
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((value) => value + 1), 300);
    return () => clearInterval(interval);
  }, []);
  return (
    <span
      aria-hidden
      {...rest}
      className={
        className === undefined
          ? 'cobble-text cobble-loading-dots'
          : `cobble-text cobble-loading-dots ${className}`
      }
      data-shadow=""
    >
      {loadingDotsText(step * 300)}
    </span>
  );
}
