import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "~/lib/i18n";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

// The plain-language version of the privacy line (PRD §2.1). Keep this page
// honest and current — it is the product's trust contract.
function Privacy() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">{t("privacy.title")}</h1>
      <p className="mt-3 text-sm text-mist">
        {t("privacy.intro.before")}
        <strong className="text-blush">{t("privacy.intro.strong")}</strong>
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl bg-plum p-4">
          <h2 className="text-sm font-semibold text-emerald-300">
            {t("privacy.know.title")}
          </h2>
          <ul className="mt-2 list-inside list-disc text-sm text-mist">
            <li>{t("privacy.know.1")}</li>
            <li>{t("privacy.know.2")}</li>
            <li>{t("privacy.know.3")}</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-plum p-4">
          <h2 className="text-sm font-semibold text-ember-soft">
            {t("privacy.never.title")}
          </h2>
          <ul className="mt-2 list-inside list-disc text-sm text-mist">
            <li>{t("privacy.never.1")}</li>
            <li>{t("privacy.never.2")}</li>
            <li>{t("privacy.never.3")}</li>
            <li>{t("privacy.never.4")}</li>
          </ul>
        </div>
      </div>

      {/* The analytics disclosure (§6.9): provider, what is and isn't
          collected — mirrors src/lib/analytics.ts. */}
      <section className="mt-6 rounded-2xl bg-plum p-4">
        <h2 className="text-sm font-semibold text-blush">
          {t("privacy.analytics.title")}
        </h2>
        <p className="mt-2 text-sm text-mist">{t("privacy.analytics.body")}</p>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          {t("privacy.analytics.collected.title")}
        </h3>
        <ul className="mt-1 list-inside list-disc text-sm text-mist">
          <li>{t("privacy.analytics.collected.1")}</li>
          <li>{t("privacy.analytics.collected.2")}</li>
          <li>{t("privacy.analytics.collected.3")}</li>
          <li>{t("privacy.analytics.collected.4")}</li>
          <li>{t("privacy.analytics.collected.5")}</li>
        </ul>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-ember-soft">
          {t("privacy.analytics.never.title")}
        </h3>
        <ul className="mt-1 list-inside list-disc text-sm text-mist">
          <li>{t("privacy.analytics.never.1")}</li>
          <li>{t("privacy.analytics.never.2")}</li>
          <li>{t("privacy.analytics.never.3")}</li>
        </ul>
        <p className="mt-3 text-sm text-mist">
          {t("privacy.analytics.optout.before")}
          <Link to="/settings" className="underline">
            {t("privacy.analytics.optout.link")}
          </Link>
          {t("privacy.analytics.optout.after")}
        </p>
      </section>

      <p className="mt-6 text-sm text-mist">
        {t("privacy.outro.before")}
        <Link to="/settings" className="underline">
          {t("privacy.outro.link")}
        </Link>
        {t("privacy.outro.after")}
      </p>
    </main>
  );
}
