import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { hasClerk, hasConvex } from "~/env";
import { createSession, zoneOf } from "~/game/engine";
import type { Prompt } from "~/game/types";
import { saveSession } from "~/lib/storage";

export const Route = createFileRoute("/games/")({
  component: Games,
});

function Games() {
  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-blush">Your games</h1>
        <Link
          to="/games/new"
          className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-midnight"
        >
          + New
        </Link>
      </div>
      <p className="mt-2 text-xs text-mist">
        Saved setups only — boards, decks and your custom cards. Never what
        happened while playing.
      </p>

      {!hasClerk || !hasConvex ? (
        <div className="mt-6 rounded-2xl bg-plum p-5 text-sm text-mist">
          Cloud saves need Clerk + Convex configured (demo mode right now).
          You can still build and play custom games from{" "}
          <Link to="/games/new" className="underline">
            New game
          </Link>
          .
        </div>
      ) : (
        <>
          <Show when="signed-out">
            <div className="mt-6 rounded-2xl bg-plum p-5 text-center">
              <p className="text-sm text-mist">Sign in to keep your game setups on every device.</p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="mt-3 rounded-full bg-ember px-6 py-2 text-sm font-semibold text-midnight"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <SavedGamesList />
          </Show>
        </>
      )}
    </main>
  );
}

function SavedGamesList() {
  const navigate = useNavigate();
  // Only mounted when hasConvex && hasClerk (gated by the parent) — no skip.
  const games = useQuery(api.games.list, {});
  const remove = useMutation(api.games.remove);

  if (games === undefined) return <p className="mt-6 text-sm text-mist">Loading…</p>;
  if (games.length === 0) {
    return (
      <p className="mt-6 text-sm text-mist">
        Nothing saved yet — build one with <span className="text-blush">+ New</span>.
      </p>
    );
  }

  const play = async (game: (typeof games)[number]) => {
    const tilePrompts: Record<number, Prompt> = {};
    for (const p of game.customPrompts) {
      tilePrompts[p.tile] = {
        id: `custom-${game._id}-${p.tile}`,
        zone: zoneOf(p.tile),
        kind: p.kind,
        text: p.text,
      };
    }
    // Awaited — /play reads the session on mount (see setup.tsx).
    await saveSession(
      createSession(
        {
          tier: game.tier,
          deckSlug: game.deckSlug,
          playerNames: ["Player 1", "Player 2"],
          boardPresetId: game.boardPreset,
          tilePrompts,
        },
        Date.now(),
      ),
    );
    navigate({ to: "/play" });
  };

  return (
    <div className="mt-6 grid gap-3">
      {games.map((game) => (
        <div key={game._id} className="rounded-2xl bg-plum p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blush">{game.name}</p>
              <p className="text-xs capitalize text-mist">
                {game.tier} · {game.deckSlug} · {game.customPrompts.length} custom cards
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => play(game)}
                className="rounded-full bg-ember px-4 py-1.5 text-xs font-semibold text-midnight"
              >
                Play
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${game.name}"?`)) void remove({ id: game._id });
                }}
                className="rounded-full bg-plum-light px-3 py-1.5 text-xs text-mist hover:text-blush"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
