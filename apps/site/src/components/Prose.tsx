import { FormattedText, Text, TooltipPanel } from 'cobble-ui';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps, JSX, ReactNode } from 'react';

/** Element props without the HTML `color` attribute, which `Text` uses for text colors. */
type Props<E extends 'a' | 'li' | 'strong' | 'em'> = Omit<ComponentProps<E>, 'color'>;

export function H2({ children }: { readonly children?: ReactNode }): JSX.Element {
  return (
    <Text as="h2" color="yellow" className="site-h2">
      {children}
    </Text>
  );
}

export function H3({ children }: { readonly children?: ReactNode }): JSX.Element {
  return (
    <Text as="h3" color="gold" className="site-h3">
      {children}
    </Text>
  );
}

export function P({ children }: { readonly children?: ReactNode }): JSX.Element {
  return (
    <Text as="p" className="site-p">
      {children}
    </Text>
  );
}

export function Code({ children }: { readonly children?: ReactNode }): JSX.Element {
  return <code className="site-code">{children}</code>;
}

export function CodeBlock({ code }: { readonly code: string }): JSX.Element {
  return (
    <pre className="site-code-block">
      <code>{code.trim()}</code>
    </pre>
  );
}

/** A framed area that shows live components. */
export function Demo({
  children,
  height,
}: {
  readonly children?: ReactNode;
  readonly height?: number;
}): JSX.Element {
  return (
    <div
      className="site-demo"
      style={
        height === undefined
          ? undefined
          : { minHeight: `calc(${String(height)} * var(--cobble-px))` }
      }
    >
      {children}
    </div>
  );
}

export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description: string;
}

export function PropsTable({ rows }: { readonly rows: readonly PropRow[] }): JSX.Element {
  return (
    <table className="site-props">
      <thead>
        <tr>
          <th>
            <Text color="gray">Prop</Text>
          </th>
          <th>
            <Text color="gray">Type</Text>
          </th>
          <th>
            <Text color="gray">Default</Text>
          </th>
          <th>
            <Text color="gray">Description</Text>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>
              <Text color="aqua">{row.name}</Text>
            </td>
            <td>
              <code className="site-code">{row.type}</code>
            </td>
            <td>
              <Text color="gray">{row.defaultValue ?? '–'}</Text>
            </td>
            <td>
              <Text className="site-wrap">{row.description}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A tooltip-styled callout. */
export function Callout({ children }: { readonly children?: ReactNode }): JSX.Element {
  return (
    <TooltipPanel className="site-callout" maxWidth={300}>
      {children}
    </TooltipPanel>
  );
}

function Anchor(props: Props<'a'>): JSX.Element {
  return <Text as="a" color="aqua" underlined {...props} />;
}

/** Element mapping for MDX pages so prose renders with the library's text. */
export const mdxComponents: MDXComponents = {
  h1: H2,
  h2: H2,
  h3: H3,
  p: P,
  a: Anchor,
  ul: (props: ComponentProps<'ul'>) => <ul className="site-list" {...props} />,
  li: (props: Props<'li'>) => <Text as="li" className="site-p" {...props} />,
  strong: (props: Props<'strong'>) => <Text as="strong" bold {...props} />,
  em: (props: Props<'em'>) => <Text as="em" italic {...props} />,
  pre: (props: ComponentProps<'pre'>) => <pre className="site-code-block" {...props} />,
  code: (props: ComponentProps<'code'>) => <code className="site-code" {...props} />,
  FormattedText,
};
