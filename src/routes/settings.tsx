import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { hasClerk } from "~/env";
import { clearAllLocalData, loadPrefs, savePrefs } from "~/lib/storage";
import {
  canPromptInstall,
  isIos,
  isStandalone,
  onInstallAvailable,
  promptInstall,
} from "~/lib/install";
import { LOCALES, useI18n } from "~/lib/i18n";
import { resetAnalytics, setAnalyticsEnabled, track } from "~/lib/analytics";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { t, locale, setLocale } = useI18n();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [cleared, setCleared] = useState(false);
  // Usage stats default to on; the opt-out is a local pref (§6.9).
  const [usageStats, setUsageStats] = useState(true);
  // Platform detection only after mount — calling isStandalone()/isIos()
  // during render would make server HTML and client hydration disagree.
  const [platform, setPlatform] = useState({ standalone: false, ios: false });

  useEffect(() => {
    loadPrefs().then((p) => {
      setAgeConfirmed(Boolean(p.ageConfirmed));
      setUsageStats(!p.analyticsOptOut);
    });
    setInstallable(canPromptInstall());
    setPlatform({ standalone: isStandalone(), ios: isIos() });
    return onInstallAvailable(() => setInstallable(true));
  }, []);

  const toggleUsageStats = () => {
    const next = !usageStats;
    setUsageStats(next);
    void setAnalyticsEnabled(next);
  };

  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">
        {t("settings.title")}
      </h1>

      <Section title={t("settings.language")}>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (option.id === locale) return;
                setLocale(option.id);
                track({
                  name: "settings_toggle",
                  toggle: "language",
                  state: option.id,
                });
              }}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                locale === option.id
                  ? "bg-ember text-midnight"
                  : "bg-plum-light text-mist hover:text-blush"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.account")}>
        {hasClerk ? (
          <>
            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <UserButton />
                <p className="text-sm text-mist">
                  {t("settings.account.signedIn")}
                </p>
              </div>
            </Show>
            <Show when="signed-out">
              <div className="flex items-center justify-between">
                <p className="text-sm text-mist">{t("settings.account.why")}</p>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-midnight"
                  >
                    {t("settings.account.signIn")}
                  </button>
                </SignInButton>
              </div>
            </Show>
          </>
        ) : (
          <p className="text-sm text-mist">
            {t("settings.account.unconfigured")}
          </p>
        )}
      </Section>

      <Section title={t("settings.content")}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-mist">
            {t("settings.age")}{" "}
            <span className="text-blush">
              {ageConfirmed
                ? t("settings.age.confirmed")
                : t("settings.age.notConfirmed")}
            </span>
          </p>
          {ageConfirmed && (
            <button
              type="button"
              onClick={() => {
                void savePrefs({ ageConfirmed: false });
                setAgeConfirmed(false);
                track({
                  name: "settings_toggle",
                  toggle: "age_gate",
                  state: "reset",
                });
              }}
              className="rounded-full bg-plum-light px-4 py-2 text-xs text-mist hover:text-blush"
            >
              {t("settings.age.reset")}
            </button>
          )}
        </div>
      </Section>

      <Section title={t("settings.app")}>
        {platform.standalone ? (
          <p className="text-sm text-mist">{t("settings.app.installed")}</p>
        ) : installable ? (
          <button
            type="button"
            onClick={() =>
              void promptInstall().then((outcome) => {
                if (outcome) track({ name: "install_prompt", outcome });
              })
            }
            className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-midnight"
          >
            {t("settings.app.install")}
          </button>
        ) : platform.ios ? (
          <p className="text-sm text-mist">
            {t("settings.app.iosHint.before")}
            <span className="text-blush">
              {t("settings.app.iosHint.share")}
            </span>
            {t("settings.app.iosHint.mid")}
            <span className="text-blush">{t("settings.app.iosHint.add")}</span>
            {t("settings.app.iosHint.after")}
          </p>
        ) : (
          <p className="text-sm text-mist">{t("settings.app.eligible")}</p>
        )}
      </Section>

      <Section title={t("settings.usage")}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-blush">{t("settings.usage.toggle")}</p>
          <button
            type="button"
            role="switch"
            aria-checked={usageStats}
            onClick={toggleUsageStats}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              usageStats
                ? "bg-ember text-midnight"
                : "bg-plum-light text-mist hover:text-blush"
            }`}
          >
            {usageStats ? t("settings.usage.on") : t("settings.usage.off")}
          </button>
        </div>
        <p className="mt-2 text-xs text-mist">{t("settings.usage.body")}</p>
      </Section>

      <Section title={t("settings.data")}>
        <p className="text-sm text-mist">
          {t("settings.data.body")}{" "}
          <Link to="/privacy" className="underline">
            {t("settings.data.privacyLink")}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm(t("settings.data.confirm"))) {
              void clearAllLocalData().then(() => {
                setCleared(true);
                // Prefs are gone, so usage stats are back to the default —
                // drop the anonymous id and re-read the (default) choice.
                setUsageStats(true);
                resetAnalytics();
              });
            }
          }}
          className="mt-3 rounded-full bg-rose-950 px-5 py-2 text-sm text-rose-300 hover:bg-rose-900"
        >
          {cleared ? t("settings.data.cleared") : t("settings.data.clear")}
        </button>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl bg-plum p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist">
        {title}
      </h2>
      {children}
    </section>
  );
}
