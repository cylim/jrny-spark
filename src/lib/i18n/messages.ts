import { en } from "./en";
import { ko } from "./ko";
import { zhHant } from "./zh-hant";

// The message layer (PRD §6.10): every UI string flows through `translate`,
// English is the required fallback — a missing translation renders English,
// never a blank. React plumbing lives in ./index.tsx; this module stays pure
// so the engine-side tests can cover it without a DOM.

export type Locale = "en" | "ko" | "zh-Hant";
export type MessageKey = keyof typeof en;

export const DEFAULT_LOCALE: Locale = "en";

/** Picker labels stay in their own language — standard for language menus. */
export const LOCALES: Array<{ id: Locale; label: string }> = [
  { id: "en", label: "English" },
  { id: "ko", label: "한국어" },
  { id: "zh-Hant", label: "繁體中文" },
];

const CATALOGS: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  ko,
  "zh-Hant": zhHant,
};

export type MessageParams = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams
): string {
  const message = CATALOGS[locale][key] ?? en[key];
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
