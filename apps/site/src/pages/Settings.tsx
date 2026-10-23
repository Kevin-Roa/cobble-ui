import {
  Button,
  CycleButton,
  LinearLayout,
  OptionsList,
  OptionsListHeader,
  OptionsListRow,
  Screen,
  ScreenLayout,
  Slider,
  Text,
  ToggleButton,
  useGuiScale,
  useToasts,
} from 'cobble-ui';
import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { useSettings } from '../settings.tsx';

const SCALES = ['auto', 1, 2, 3, 4, 5, 6] as const;

/** An options screen that configures the site's CobbleProvider, built with the library. */
export function Settings(): JSX.Element {
  const { settings, update, reset } = useSettings();
  const { guiScale } = useGuiScale();
  const toasts = useToasts();
  const navigate = useNavigate();
  return (
    <Screen className="site-screen" onClose={() => void navigate('/')}>
      <ScreenLayout
        title="Settings"
        footerHeight={45}
        footer={
          <LinearLayout align="center" spacing={4}>
            <LinearLayout orientation="horizontal" spacing={10}>
              <Button
                width={150}
                onClick={() => {
                  reset();
                  toasts.show({ title: 'Settings reset', messages: ['Back to the defaults'] });
                }}
              >
                Reset
              </Button>
              <Button as={Link} to="/" width={150}>
                Done
              </Button>
            </LinearLayout>
            <Disclaimer />
          </LinearLayout>
        }
      >
        <OptionsList aria-label="Settings">
          <OptionsListHeader>Interface</OptionsListHeader>
          <OptionsListRow>
            <CycleButton
              width={150}
              label="GUI Scale"
              values={SCALES}
              value={settings.guiScale}
              onValueChange={(scale) => update({ guiScale: scale })}
              formatValue={(value) =>
                value === 'auto' ? `Auto (${String(guiScale)})` : String(value)
              }
            />
            <Slider
              width={150}
              label="Menu Background Blur"
              min={0}
              max={10}
              value={settings.menuBlur}
              onValueChange={(menuBlur) => update({ menuBlur })}
            />
          </OptionsListRow>
          <OptionsListRow>
            <Slider
              width={310}
              min={1}
              max={100}
              value={Math.round(settings.panoramaSpeed * 100)}
              onValueChange={(speed) => update({ panoramaSpeed: speed / 100 })}
              formatLabel={(value) => `Panorama Scroll Speed: ${(value / 100).toFixed(2)}`}
            />
          </OptionsListRow>
          <OptionsListHeader>Sound</OptionsListHeader>
          <OptionsListRow>
            <ToggleButton
              width={150}
              label="Sounds"
              checked={settings.sound}
              onCheckedChange={(sound) => update({ sound })}
            />
            <Slider
              width={150}
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onValueChange={(volume) => update({ volume: volume / 100 })}
              formatLabel={(value) =>
                value === 0 ? 'Master Volume: OFF' : `Master Volume: ${String(value)}%`
              }
            />
          </OptionsListRow>
          <Text as="p" color="gray" className="site-options-note">
            These options are stored in your browser and drive this site&apos;s CobbleProvider.
          </Text>
        </OptionsList>
      </ScreenLayout>
    </Screen>
  );
}
