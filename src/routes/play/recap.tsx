import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lastHistory, type HistoryEntry } from "~/lib/storage";
import { useI18n } from "~/lib/i18n";

export const Route = createFileRoute("/play/recap")({
  component: Recap,
});

function Recap() {
  const { t } = useI18n();
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(
    undefined
  );

  useEffect(() => {
    lastHistory().then((e) => setEntry(e ?? null));
  }, []);

  if (entry === undefined) {
    return <main className="p-10 text-center text-mist">…</main>;
  }
  if (entry === null) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-mist">{t("recap.empty")}</p>
        <Link
          to="/play/setup"
          className="mt-4 inline-block rounded-full bg-ember px-8 py-3 font-semibold text-midnight"
        >
          {t("recap.empty.cta")}
        </Link>
      </main>
    );
  }

  const minutes = Math.max(
    1,
    Math.round((entry.finishedAt - entry.stats.startedAt) / 60000)
  );
  const stats: Array<[string, number | string]> = [
    [t("recap.stat.minutes"), minutes],
    [t("recap.stat.cards"), entry.stats.cardsDrawn],
    [t("recap.stat.ladders"), entry.stats.laddersClimbed],
    [t("recap.stat.charmed"), entry.stats.snakesCharmed],
    [t("recap.stat.slides"), entry.stats.snakesSlid],
    [t("recap.stat.rolls"), entry.stats.rolls],
  ];
  // The skips-used line renders only when a budget was configured — an
  // unlimited-skip game never guilt-trips (§4.8). Older entries have no
  // budget recorded, so they stay quiet too.
  if (typeof entry.skipsPerPlayer === "number") {
    stats.push([t("recap.stat.skips"), entry.stats.skipsUsed ?? 0]);
  }

  return (
    <main className="mx-auto max-w-md px-6 pb-16 text-center">
      <p className="text-5xl">🏁</p>
      {/* The playful "first to the finish" nod — the app's only winner
          mention, celebration without win/lose framing (§4.8). */}
      <h1 className="font-display mt-3 text-4xl text-blush">
        {t("recap.headline", { name: entry.winnerName })}
      </h1>
      <p className="mt-2 text-sm text-mist">
        {t("recap.subtitle", { tier: t(`tier.${entry.tier}`) })}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-plum p-4">
            <p className="font-display text-3xl text-ember-soft">{value}</p>
            <p className="mt-1 text-xs text-mist">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        <Link
          to="/play/setup"
          className="rounded-full bg-ember py-4 text-lg font-semibold text-midnight shadow-lg shadow-ember/25"
        >
          {t("recap.again")}
        </Link>
        <Link
          to="/"
          className="rounded-full bg-plum py-3 text-sm text-mist hover:text-blush"
        >
          {t("recap.home")}
        </Link>
      </div>

      <p className="mt-6 text-[10px] text-mist/50">{t("recap.privacy")}</p>
    </main>
  );
}
