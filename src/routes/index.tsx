import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "~/lib/i18n";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const features = [
    {
      icon: "🎲",
      title: t("home.feature1.title"),
      body: t("home.feature1.body"),
    },
    {
      icon: "💬",
      title: t("home.feature2.title"),
      body: t("home.feature2.body"),
    },
    {
      icon: "🔒",
      title: t("home.feature3.title"),
      body: t("home.feature3.body"),
    },
  ];

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-10 px-6 pb-16">
      <section className="text-center">
        <h1 className="font-display text-5xl leading-tight text-blush">
          {t("home.headline.before")}
          <span className="text-ember">{t("home.headline.accent")}</span>
          {t("home.headline.after")}
        </h1>
        <p className="mt-4 text-mist">{t("home.subtitle")}</p>
        <Link
          to="/play/setup"
          className="mt-8 inline-block rounded-full bg-ember px-10 py-4 text-lg font-semibold text-midnight shadow-lg shadow-ember/25 transition hover:bg-ember-soft"
        >
          {t("home.cta")}
        </Link>
        <p className="mt-3 text-xs text-mist/70">{t("home.noAccount")}</p>
      </section>

      <section className="grid gap-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl bg-plum p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <h2 className="font-semibold text-blush">{feature.title}</h2>
                <p className="text-sm text-mist">{feature.body}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-mist/60">
        {t("home.footer.byline")} ·{" "}
        <Link to="/privacy" className="underline hover:text-blush">
          {t("home.footer.privacy")}
        </Link>
      </footer>
    </main>
  );
}
