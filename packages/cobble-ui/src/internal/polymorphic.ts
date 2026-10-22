import type { ComponentPropsWithRef, CSSProperties, ElementType } from 'react';

/**
 * Props of a component that renders `E` (overridable with `as`), combined
 * with the component's own props `P`. Own props win over element props.
 */
export type PolymorphicProps<E extends ElementType, P extends object = object> = P & {
  /** The element or component to render instead of the default one. */
  readonly as?: E;
} & Omit<ComponentPropsWithRef<E>, keyof P | 'as'>;

/** Props accepted by an inner element ("slot") of a component through `slotProps`. */
export type SlotProps<E extends ElementType> = ComponentPropsWithRef<E> & {
  readonly [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** Custom CSS properties, for setting `--cobble-*` variables in `style`. */
export type CssVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;
