import {
  Button,
  LinearLayout,
  Screen,
  ScreenLayout,
  SelectionList,
  SelectionListItem,
  Text,
  useTranslation,
} from 'cobble-ui';
import type { JSX } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { LANGUAGES } from '../languages.ts';
import { useSettings } from '../settings.tsx';

/** The language screen (`LanguageSelectScreen`): pick the language the library's labels use. */
export function Language(): JSX.Element {
  const { settings, update } = useSettings();
  const { tOr } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const back = (): void =>
    void navigate((location.state as { readonly from?: string } | null)?.from ?? '/');
  return (
    <Screen className="site-screen" onClose={back}>
      <ScreenLayout
        title={tOr('options.language', 'Language...')}
        footerHeight={55}
        footer={
          <LinearLayout align="center" spacing={4}>
            <Text color="gray">
              Translations are downloaded from a public mirror of the game assets when selected.
            </Text>
            <Button width={200} onClick={back}>
              {tOr('gui.done', 'Done')}
            </Button>
            <Disclaimer />
          </LinearLayout>
        }
      >
        <SelectionList
          aria-label="Languages"
          value={settings.language}
          onValueChange={(language) => update({ language })}
          itemHeight={18}
          rowWidth={310}
        >
          {LANGUAGES.map((language) => (
            <SelectionListItem key={language.code} value={language.code}>
              {language.name}
            </SelectionListItem>
          ))}
        </SelectionList>
      </ScreenLayout>
    </Screen>
  );
}
