import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lastHistory, type HistoryEntry } from "~/lib/storage";

export const Route = createFileRoute("/play/recap")({
  component: Recap,
});

function Recap() {
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);

  useEffect(() => {
    lastHistory().then((e) => setEntry(e ?? null));
  }, []);

  if (entry === undefined) {
    return <main className="p-10 text-center text-mist">…</main>;
  }
  if (entry === null) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-mist">No finished games yet.</p>
        <Link to="/play/setup" className="mt-4 inline-block rounded-full bg-ember px-8 py-3 font-semibold text-midnight">
          Start one
        </Link>
      </main>
    );
  }

  const minutes = Math.max(1, Math.round((entry.finishedAt - entry.stats.startedAt) / 60000));
  const stats: Array<[string, number | string]> = [
    ["Minutes together", minutes],
    ["Cards drawn", entry.stats.cardsDrawn],
    ["Ladders climbed", entry.stats.laddersClimbed],
    ["Snakes charmed", entry.stats.snakesCharmed],
    ["Slides taken", entry.stats.snakesSlid],
    ["Rolls", entry.stats.rolls],
  ];

  return (
    <main className="mx-auto max-w-md px-6 pb-16 text-center">
      <p className="text-5xl">🏁</p>
      <h1 className="font-display mt-3 text-4xl text-blush">{entry.winnerName} made it!</h1>
      <p className="mt-2 text-sm text-mist">
        A <span className="capitalize">{entry.tier}</span> journey, finished together.
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
          Play again
        </Link>
        <Link to="/" className="rounded-full bg-plum py-3 text-sm text-mist hover:text-blush">
          Home
        </Link>
      </div>

      <p className="mt-6 text-[10px] text-mist/50">
        This recap lives only on this phone. What you said and did isn't stored anywhere.
      </p>
    </main>
  );
}
