import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-10 px-6 pb-16">
      <section className="text-center">
        <h1 className="font-display text-5xl leading-tight text-blush">
          Play your way <span className="text-ember">closer</span>.
        </h1>
        <p className="mt-4 text-mist">
          A board game journey for two. Roll, climb, and draw cards that turn
          an ordinary night into a closer one.
        </p>
        <Link
          to="/play/setup"
          className="mt-8 inline-block rounded-full bg-ember px-10 py-4 text-lg font-semibold text-midnight shadow-lg shadow-ember/25 transition hover:bg-ember-soft"
        >
          Play now
        </Link>
        <p className="mt-3 text-xs text-mist/70">
          No account needed. One phone, two players.
        </p>
      </section>

      <section className="grid gap-3">
        {[
          ["🎲", "Roll & journey", "A classic board with a twist — ladders bring you closer, snakes dare you."],
          ["💬", "Draw a card", "Sweet, flirty, or spicy — you choose the tier, the game raises the warmth as you climb."],
          ["🔒", "Stays between you", "What happens in a session never leaves your phone. Ever."],
        ].map(([icon, title, body]) => (
          <div key={title} className="rounded-2xl bg-plum p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <h2 className="font-semibold text-blush">{title}</h2>
                <p className="text-sm text-mist">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-mist/60">
        A <span className="text-mist">JRNY</span> thing ·{" "}
        <Link to="/privacy" className="underline hover:text-blush">
          how we handle privacy
        </Link>
      </footer>
    </main>
  );
}
