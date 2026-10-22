import { Text } from 'cobble-ui';
import type { JSX } from 'react';

export const DISCLAIMER =
  'NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.';

/** The disclaimer required by the Minecraft usage guidelines, shown on every page. */
export function Disclaimer({ className }: { readonly className?: string }): JSX.Element {
  return (
    <Text
      as="p"
      color="gray"
      className={className === undefined ? 'site-disclaimer' : `site-disclaimer ${className}`}
    >
      {DISCLAIMER}
    </Text>
  );
}
