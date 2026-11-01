import {
  createContext,
  useContext,
  useMemo,
  type Context,
  type ElementType,
  type JSX,
  type ReactNode,
} from 'react';
import type { PolymorphicProps } from '../internal/polymorphic.ts';
import { useCobble } from '../provider/context.ts';
import { useAssetRevision } from '../provider/hooks.ts';
import { Text, type TextOwnProps } from '../text/Text.tsx';
import {
  DEFAULT_LANGUAGE_PATH,
  parseLanguage,
  translate,
  type TranslationArg,
  type TranslationTable,
} from './format.ts';

const TranslationContext: Context<TranslationTable | null> = createContext<TranslationTable | null>(
  null,
);

export interface TranslationProviderProps {
  /**
   * Translations that take precedence over the game's `en_us` strings (and over those of a parent
   * provider). Use this for your own keys or another language: other languages live in the asset
   * index, which has no CORS headers, so they cannot be fetched by the browser; supply them here.
   */
  readonly translations: TranslationTable;
  readonly children?: ReactNode;
}

/** Adds or replaces translation keys for everything rendered inside it. */
export function TranslationProvider(props: TranslationProviderProps): JSX.Element {
  const parent = useContext(TranslationContext);
  const { translations } = props;
  const merged = useMemo(() => ({ ...parent, ...translations }), [parent, translations]);
  return <TranslationContext value={merged}>{props.children}</TranslationContext>;
}

export interface Translator {
  /** Whether the game's language file has finished loading. */
  readonly ready: boolean;
  /** Translates `key`, substituting `%s` / `%1$s` with `args`. Returns the key when missing. */
  readonly t: (key: string, ...args: readonly TranslationArg[]) => string;
  /** Whether a translation exists for `key`. */
  readonly has: (key: string) => boolean;
  /** Like `t`, with a template to use when the key is missing. */
  readonly tOr: (key: string, fallback: string, ...args: readonly TranslationArg[]) => string;
}

/**
 * Translates with the game's `en_us` language file, downloaded at runtime with the other assets
 * (`assets/minecraft/lang/en_us.json`), layered under any {@link TranslationProvider}.
 */
export function useTranslation(): Translator {
  const { store } = useCobble();
  const overrides = useContext(TranslationContext);
  // Subscribes to the store: the language file may finish loading after the first render.
  useAssetRevision();
  const raw = store.getJson(DEFAULT_LANGUAGE_PATH);
  const base = useMemo(() => (raw ? parseLanguage(raw) : undefined), [raw]);
  return useMemo(() => {
    const table: TranslationTable = { ...base, ...overrides };
    return {
      ready: raw !== undefined,
      t: (key, ...args) => translate(table, key, args),
      has: (key) => key in table,
      tOr: (key, fallback, ...args) => translate(table, key, args, fallback),
    };
  }, [base, overrides, raw]);
}

export interface TranslateOwnProps extends Omit<TextOwnProps, 'children'> {
  /** The translation key, like `TranslatableContents#key`. (`key` is reserved by React.) */
  readonly translate: string;
  /** Values for `%s` / `%1$s`. */
  readonly args?: readonly TranslationArg[];
  /** Template used when the key is missing, like `TranslatableContents#fallback`. */
  readonly fallback?: string;
}

export type TranslateProps<E extends ElementType = 'span'> = PolymorphicProps<E, TranslateOwnProps>;

/** A {@link Text} whose content is a translated string. */
export function Translate<E extends ElementType = 'span'>(props: TranslateProps<E>): JSX.Element {
  const { translate: key, args, fallback, ...rest } = props;
  const { t, tOr } = useTranslation();
  const text =
    fallback === undefined ? t(key, ...(args ?? [])) : tOr(key, fallback, ...(args ?? []));
  return <Text {...(rest as object)}>{text}</Text>;
}
