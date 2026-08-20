import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { hasClerk, hasConvex } from "~/env";
import { createSession, zoneOf } from "~/game/engine";
import type { Prompt } from "~/game/types";
import { saveSession } from "~/lib/storage";
import { useAgeGate } from "~/lib/use-age-gate";
import { useDeckList } from "~/lib/use-decks";

export const Route = createFileRoute("/templates/")({
  component: Templates,
});

function Templates() {
  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-blush">My Templates</h1>
        <Link
          to="/templates/new"
          className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-midnight"
        >
          + New
        </Link>
      </div>
      <p className="mt-2 text-xs text-mist">
        Templates hold setups only — boards, decks and your pinned cards. Never
        what happened while playing.
      </p>

      {!hasClerk || !hasConvex ? (
        <div className="mt-6 rounded-2xl bg-plum p-5 text-sm text-mist">
          Cloud saves need Clerk + Convex configured (demo mode right now).
          You can still build and play Templates from{" "}
          <Link to="/templates/new" className="underline">
            New Template
          </Link>
          .
        </div>
      ) : (
        <>
          <Show when="signed-out">
            <div className="mt-6 rounded-2xl bg-plum p-5 text-center">
              <p className="text-sm text-mist">Sign in to keep your Templates on every device.</p>
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
            <TemplatesList />
          </Show>
        </>
      )}
    </main>
  );
}

function TemplatesList() {
  const navigate = useNavigate();
  const decks = useDeckList();
  const { withAgeCheck, ageGate } = useAgeGate();
  // Only mounted when hasConvex && hasClerk (gated by the parent) — no skip.
  const templates = useQuery(api.gameTemplates.list, {});
  const remove = useMutation(api.gameTemplates.remove);

  if (templates === undefined) return <p className="mt-6 text-sm text-mist">Loading…</p>;
  if (templates.length === 0) {
    return (
      <p className="mt-6 text-sm text-mist">
        Nothing saved yet — build one with <span className="text-blush">+ New</span>.
      </p>
    );
  }

  const begin = async (template: (typeof templates)[number]) => {
    const tilePrompts: Record<number, Prompt> = {};
    for (const p of template.customPrompts) {
      tilePrompts[p.tile] = {
        id: `custom-${template._id}-${p.tile}`,
        zone: zoneOf(p.tile),
        kind: p.kind,
        text: p.text,
      };
    }
    // Awaited — /play reads the session on mount (see setup.tsx).
    await saveSession(
      createSession(
        {
          tier: template.tier,
          deckSlug: template.deckSlug,
          playerNames: ["Player 1", "Player 2"],
          boardPresetId: template.boardPreset,
          tilePrompts,
        },
        Date.now(),
      ),
    );
    navigate({ to: "/play" });
  };

  const play = (template: (typeof templates)[number]) => {
    // Gate on the Deck's own tier; the stored tier (server-derived from the
    // same deck at save time) is the fallback when the deck list is loading.
    const deckTier = decks.find((d) => d.slug === template.deckSlug)?.tier ?? template.tier;
    withAgeCheck(deckTier, () => void begin(template));
  };

  return (
    <div className="mt-6 grid gap-3">
      {templates.map((template) => (
        <div key={template._id} className="rounded-2xl bg-plum p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blush">{template.name}</p>
              <p className="text-xs capitalize text-mist">
                {template.tier} · {template.deckSlug} · {template.customPrompts.length} pinned cards
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => play(template)}
                className="rounded-full bg-ember px-4 py-1.5 text-xs font-semibold text-midnight"
              >
                Play
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${template.name}"?`)) void remove({ id: template._id });
                }}
                className="rounded-full bg-plum-light px-3 py-1.5 text-xs text-mist hover:text-blush"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      {ageGate}
    </div>
  );
}
