import { Button, IconButton, Screen, SplashText, Text, Tooltip } from 'cobble-ui';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { DISCLAIMER } from '../components/Disclaimer.tsx';

/** A title screen built with the library (laid out like `TitleScreen`, without any Mojang branding). */
export function Home(): JSX.Element {
  return (
    <Screen background="panorama" className="site-screen">
      <div className="site-title">
        <Text as="h1" className="site-logo" bold>
          COBBLE UI
        </Text>
      </div>
      <SplashText>A React component library based on Minecraft Java!</SplashText>
      <nav className="site-title-menu" aria-label="Main menu">
        <Button as={Link} to="/docs/getting-started" width={200}>
          Getting Started
        </Button>
        <Button as={Link} to="/docs/button" width={200}>
          Components
        </Button>
        <Button as={Link} to="/docs/assets" width={200}>
          Assets &amp; Legal
        </Button>
        <div className="site-title-row">
          <Tooltip content="Only English is available for now.">
            <IconButton icon="icon/language" label="Language" disabled className="site-side-left" />
          </Tooltip>
          <Button as={Link} to="/settings" width={98}>
            Settings...
          </Button>
          <Button as={Link} to="/docs/styling" width={98}>
            Styling...
          </Button>
          <IconButton
            as={Link}
            to="/settings"
            icon="icon/accessibility"
            label="Accessibility settings"
            className="site-side-right"
          />
        </div>
      </nav>
      <Text className="site-corner site-corner-left">
        Cobble UI 0.1.0 (Java Edition 26.3 style)
      </Text>
      <Text className="site-corner site-corner-right">{DISCLAIMER}</Text>
    </Screen>
  );
}
