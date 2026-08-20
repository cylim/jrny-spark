import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadPrefs, savePrefs } from "~/lib/storage";
import {
  DEFAULT_LOCALE,
  translate,
  type Locale,
  type MessageKey,
  type MessageParams,
} from "./messages";

export { DEFAULT_LOCALE, LOCALES, translate } from "./messages";
export type { Locale, MessageKey, MessageParams } from "./messages";

export type Translate = (key: MessageKey, params?: MessageParams) => string;

interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

// English default so server HTML and first client render agree; the saved
// locale applies right after prefs load ("follows it on next render" — #7).
const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    loadPrefs().then((p) => {
      if (p.locale) setLocaleState(p.locale);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void savePrefs({ locale: next });
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
