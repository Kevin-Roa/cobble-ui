import {
  Button,
  CycleButton,
  Screen,
  ScreenLayout,
  Slider,
  Text,
  ToggleButton,
  useGuiScale,
} from 'cobble-ui';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { useSettings } from '../settings.tsx';

const SCALES = ['auto', 1, 2, 3, 4, 5, 6] as const;

/** An options screen that configures the site's CobbleProvider, built with the library. */
export function Settings(): JSX.Element {
  const { settings, update, reset } = useSettings();
  const { guiScale } = useGuiScale();
  return (
    <Screen className="site-screen">
      <ScreenLayout
        title="Settings"
        footerHeight={45}
        footer={
          <div className="site-footer">
            <div className="site-row">
              <Button width={150} onClick={reset}>
                Reset
              </Button>
              <Button as={Link} to="/" width={150}>
                Done
              </Button>
            </div>
            <Disclaimer />
          </div>
        }
        contentLayout="top"
      >
        <div className="site-options">
          <CycleButton
            label="GUI Scale"
            values={SCALES}
            value={settings.guiScale}
            onValueChange={(scale) => update({ guiScale: scale })}
            formatValue={(value) =>
              value === 'auto' ? `Auto (${String(guiScale)})` : String(value)
            }
          />
          <ToggleButton
            label="Sounds"
            checked={settings.sound}
            onCheckedChange={(sound) => update({ sound })}
          />
          <Slider
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onValueChange={(volume) => update({ volume: volume / 100 })}
            formatLabel={(value) =>
              value === 0 ? 'Master Volume: OFF' : `Master Volume: ${String(value)}%`
            }
          />
          <Slider
            label="Menu Background Blur"
            min={0}
            max={10}
            value={settings.menuBlur}
            onValueChange={(menuBlur) => update({ menuBlur })}
          />
          <Slider
            min={1}
            max={100}
            value={Math.round(settings.panoramaSpeed * 100)}
            onValueChange={(speed) => update({ panoramaSpeed: speed / 100 })}
            formatLabel={(value) => `Panorama Scroll Speed: ${(value / 100).toFixed(2)}`}
          />
        </div>
        <Text as="p" color="gray" className="site-options-note">
          These options are stored in your browser and drive this site&apos;s CobbleProvider.
        </Text>
      </ScreenLayout>
    </Screen>
  );
}
