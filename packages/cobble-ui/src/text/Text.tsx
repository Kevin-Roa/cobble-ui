import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../internal/polymorphic.ts';
import {
  flattenTextComponent,
  resolveTextColor,
  shadowColorFor,
  type TextColor,
  type TextComponent,
  type TextStyle,
} from './formatting.ts';
import { ObfuscatedText } from './obfuscated.tsx';

export interface TextOwnProps {
  /** Text color: a named color (`"gold"`) or `#rrggbb`. Inherited when omitted. */
  readonly color?: TextColor;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underlined?: boolean;
  readonly strikethrough?: boolean;
  /** Randomly cycles glyphs every frame, like `§k`. Only applies to string children. */
  readonly obfuscated?: boolean;
  /** Draw the drop shadow. Defaults to `true`. */
  readonly shadow?: boolean;
  /** Explicit shadow color (`#rrggbb` or `#rrggbbaa`). Defaults to 25% of the text color. */
  readonly shadowColor?: string;
  readonly children?: ReactNode;
}

export type TextProps<E extends ElementType = 'span'> = PolymorphicProps<E, TextOwnProps>;

/**
 * Text drawn the way the game draws it: one GUI unit per font texel, a
 * 9-unit line height and a 1-unit drop shadow in 25% of the text color.
 */
export function Text<E extends ElementType = 'span'>(props: TextProps<E>): JSX.Element {
  const {
    as,
    color,
    bold,
    italic,
    underlined,
    strikethrough,
    obfuscated,
    shadow = true,
    shadowColor,
    className,
    style,
    children,
    ...rest
  } = props as TextProps<'span'>;
  const Component: ElementType = as ?? 'span';
  const resolved = resolveTextColor(color);
  const textStyle: CssVariables = { ...style };
  if (resolved !== undefined) {
    textStyle['--cobble-text-color'] = resolved;
    if (shadowColor === undefined)
      textStyle['--cobble-text-shadow-color'] = shadowColorFor(resolved);
  }
  if (shadowColor !== undefined) textStyle['--cobble-text-shadow-color'] = shadowColor;

  const content =
    obfuscated && typeof children === 'string' ? (
      <ObfuscatedText text={children} bold={bold === true} />
    ) : (
      children
    );

  return (
    <Component
      {...rest}
      className={className === undefined ? 'cobble-text' : `cobble-text ${String(className)}`}
      data-bold={bold ? '' : undefined}
      data-italic={italic ? '' : undefined}
      data-underlined={underlined ? '' : undefined}
      data-strikethrough={strikethrough ? '' : undefined}
      data-obfuscated={obfuscated ? '' : undefined}
      data-shadow={shadow ? '' : undefined}
      style={textStyle}
    >
      {strikethrough && underlined ? (
        <span className="cobble-text-strike">{content}</span>
      ) : (
        content
      )}
    </Component>
  );
}

function runProps(style: TextStyle): TextOwnProps {
  const props: Record<string, unknown> = {};
  if (style.color !== undefined) props['color'] = style.color;
  if (style.shadowColor !== undefined) props['shadowColor'] = style.shadowColor;
  if (style.bold) props['bold'] = true;
  if (style.italic) props['italic'] = true;
  if (style.underlined) props['underlined'] = true;
  if (style.strikethrough) props['strikethrough'] = true;
  if (style.obfuscated) props['obfuscated'] = true;
  return props as TextOwnProps;
}

export interface FormattedTextOwnProps extends Omit<TextOwnProps, 'children'> {
  /** A string with `§` formatting codes, or a JSON text component. */
  readonly value: TextComponent;
}

export type FormattedTextProps<E extends ElementType = 'span'> = PolymorphicProps<
  E,
  FormattedTextOwnProps
>;

/**
 * Renders a string with `§` formatting codes (`"§6Gold §lbold"`) or a JSON
 * text component (`{ text: 'Hi', color: 'gold', extra: [...] }`).
 */
export function FormattedText<E extends ElementType = 'span'>(
  props: FormattedTextProps<E>,
): JSX.Element {
  const { value, ...rest } = props as FormattedTextProps<'span'>;
  const runs = flattenTextComponent(value);
  const shadow = rest.shadow ?? true;
  return (
    <Text {...rest}>
      {runs.map((run, index) => (
        // Runs have no stable identity; their order is the identity.
        // oxlint-disable-next-line react/no-array-index-key
        <Text key={index} shadow={shadow} {...runProps(run.style)}>
          {run.text}
        </Text>
      ))}
    </Text>
  );
}
