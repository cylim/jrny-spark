import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

// The plain-language version of the privacy line (PRD §2.1). Keep this page
// honest and current — it is the product's trust contract.
function Privacy() {
  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">Privacy, plainly</h1>
      <p className="mt-3 text-sm text-mist">
        Spark is a game about intimacy, so we hold one line without exception:{" "}
        <strong className="text-blush">what happens during a session stays on your phone.</strong>
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl bg-plum p-4">
          <h2 className="text-sm font-semibold text-emerald-300">Our servers know</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-mist">
            <li>Who you are — only if you create an account</li>
            <li>Game setups you chose to save (board, tier, your custom card text)</li>
            <li>What you bought, once premium decks exist</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-plum p-4">
          <h2 className="text-sm font-semibold text-ember-soft">Our servers never know</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-mist">
            <li>Anything that happened during a game</li>
            <li>Which cards you drew, answered, or skipped</li>
            <li>Player names — they never leave the device</li>
            <li>Any answer, note, or photo — we have no way to receive them</li>
          </ul>
        </div>
      </div>

      <p className="mt-6 text-sm text-mist">
        Live games, recaps, and preferences are stored only in this browser's
        local storage. You can wipe everything in{" "}
        <a href="/settings" className="underline">
          Settings → Clear local data
        </a>
        . No accounts are required to play, and there are no ads and no
        third-party trackers.
      </p>
    </main>
  );
}
