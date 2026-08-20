import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { hasClerk, hasConvex } from "~/env";
import { createSession, zoneOf } from "~/game/engine";
import { CLASSIC } from "~/game/board-presets";
import { pinRejection, type PinRejection } from "~/game/pins";
import { DEMO_DECK_SLUG } from "~/game/demo-deck";
import type { Prompt, PromptKind, Tier } from "~/game/types";
import { useDeckList } from "~/lib/use-decks";
import { saveSession } from "~/lib/storage";
import { useAgeGate } from "~/lib/use-age-gate";

export const Route = createFileRoute("/templates/new")({
  component: NewTemplate,
});

interface CustomRow {
  tile: number;
  text: string;
  kind: PromptKind;
}

const PIN_MESSAGES: Record<PinRejection, string> = {
  "out-of-range": "Pick a tile between 1 and 99.",
  "snake-head": "That's a snake head — the slide would swallow this card.",
  "ladder-foot": "That's a ladder foot — the climb would skip this card.",
  finish: "The finish tile ends the game — no card can fire there.",
};

/** The builder pins onto the classic board only (boardPreset is hardcoded below). */
function pinIssue(row: CustomRow): string | null {
  const rejection = pinRejection(CLASSIC, row.tile);
  return rejection ? PIN_MESSAGES[rejection] : null;
}

function NewTemplate() {
  const navigate = useNavigate();
  const decks = useDeckList();
  const saveTemplate = useMutation(api.gameTemplates.save);
  const { withAgeCheck, ageGate } = useAgeGate();

  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("sweet");
  const [deckSlug, setDeckSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<CustomRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Match setup's tier picker: confirm 18+ before even browsing spicy decks.
  const pickTier = (t: Tier) =>
    withAgeCheck(t, () => {
      setTier(t);
      setDeckSlug(null);
    });

  const tierDecks = decks.filter((d) => d.tier === tier);
  const chosenSlug = tierDecks.find((d) => d.slug === deckSlug)?.slug ?? tierDecks[0]?.slug ?? DEMO_DECK_SLUG;
  const rowIssues = rows.map(pinIssue);
  const validRows = rows.filter((r, i) => r.text.trim() && rowIssues[i] === null);
  // Refuse to proceed while a written card sits on a forbidden tile — dropping
  // it silently is exactly the bug pins are meant to escape.
  const blocked = rows.some((r, i) => r.text.trim() && rowIssues[i] !== null);

  const toTilePrompts = (): Record<number, Prompt> => {
    const out: Record<number, Prompt> = {};
    for (const r of validRows) {
      out[r.tile] = {
        id: `custom-draft-${r.tile}`,
        zone: zoneOf(r.tile),
        kind: r.kind,
        text: r.text.trim(),
      };
    }
    return out;
  };

  const beginDraft = async () => {
    // Awaited — /play reads the session on mount (see setup.tsx).
    await saveSession(
      createSession(
        {
          tier,
          deckSlug: chosenSlug,
          playerNames: ["Player 1", "Player 2"],
          boardPresetId: "classic",
          tilePrompts: toTilePrompts(),
        },
        Date.now(),
      ),
    );
    navigate({ to: "/play" });
  };

  const playNow = () => {
    // Gate on the chosen Deck's own tier — a draft is a session start too.
    const deckTier = decks.find((d) => d.slug === chosenSlug)?.tier ?? tier;
    withAgeCheck(deckTier, () => void beginDraft());
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Tier is derived server-side from the deck — never sent by the client.
      await saveTemplate({
        name: name.trim() || "Our game",
        deckSlug: chosenSlug,
        boardPreset: "classic",
        customPrompts: validRows.map((r) => ({ tile: r.tile, text: r.text.trim(), kind: r.kind })),
      });
      navigate({ to: "/templates" });
    } catch (err) {
      setSaveError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Couldn't save — check your connection and sign-in, then try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">Build a Template</h1>
      <p className="mt-2 text-xs text-mist">
        Pin your own cards to specific tiles — inside jokes, real plans, your
        own dares. They override deck draws on those tiles.
      </p>

      <label className="mt-6 block text-sm font-semibold uppercase tracking-wider text-mist">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Anniversary special"
          maxLength={80}
          className="mt-2 w-full rounded-xl bg-plum px-4 py-3 font-normal normal-case tracking-normal text-blush placeholder:text-mist/40 focus:outline-2 focus:outline-ember"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-mist">
          Tier
          <select
            value={tier}
            onChange={(e) => pickTier(e.target.value as Tier)}
            className="mt-2 w-full rounded-xl bg-plum px-3 py-3 font-normal normal-case tracking-normal text-blush"
          >
            <option value="sweet">Sweet 🌷</option>
            <option value="flirty">Flirty 💫</option>
            <option value="spicy">Spicy 🔥</option>
          </select>
        </label>
        <label className="text-sm font-semibold uppercase tracking-wider text-mist">
          Deck
          <select
            value={chosenSlug}
            onChange={(e) => setDeckSlug(e.target.value)}
            className="mt-2 w-full rounded-xl bg-plum px-3 py-3 font-normal normal-case tracking-normal text-blush"
          >
            {tierDecks.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.title}
              </option>
            ))}
            {tierDecks.length === 0 && <option value={DEMO_DECK_SLUG}>Demo deck</option>}
          </select>
        </label>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">Pinned cards</h2>
          <button
            type="button"
            onClick={() => setRows([...rows, { tile: 10, text: "", kind: "question" }])}
            className="rounded-full bg-plum px-3 py-1 text-xs text-mist hover:text-blush"
          >
            + Add card
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {rows.map((row, i) => (
            <div key={i} className="rounded-2xl bg-plum p-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-mist">
                  Tile
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={row.tile}
                    onChange={(e) => update(i, { tile: Number(e.target.value) })}
                    className="ml-2 w-16 rounded-lg bg-plum-light px-2 py-1 text-blush"
                  />
                </label>
                <select
                  value={row.kind}
                  onChange={(e) => update(i, { kind: e.target.value as PromptKind })}
                  className="rounded-lg bg-plum-light px-2 py-1 text-xs text-blush"
                >
                  <option value="question">Question</option>
                  <option value="action">Action</option>
                  <option value="together">Together</option>
                </select>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="ml-auto text-xs text-mist/60 hover:text-ember"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={row.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Your card text…"
                rows={2}
                maxLength={280}
                className="mt-2 w-full rounded-lg bg-plum-light px-3 py-2 text-sm text-blush placeholder:text-mist/40"
              />
              {row.text.trim() !== "" && rowIssues[i] && (
                <p className="mt-1 text-xs text-ember-soft">{rowIssues[i]}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-3">
        <button
          type="button"
          onClick={playNow}
          disabled={blocked}
          className="rounded-full bg-ember py-4 text-lg font-semibold text-midnight shadow-lg shadow-ember/25 active:scale-95 disabled:opacity-50"
        >
          Play now
        </button>
        {blocked && (
          <p className="text-center text-xs text-ember-soft">
            Move the flagged cards to open tiles first.
          </p>
        )}
        {hasClerk && hasConvex ? (
          <>
            <Show when="signed-in">
              <button
                type="button"
                onClick={save}
                disabled={saving || blocked}
                className="rounded-full bg-plum-light py-3 text-sm text-blush disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to My Templates"}
              </button>
              {saveError && <p className="text-center text-xs text-ember-soft">{saveError}</p>}
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className="rounded-full bg-plum-light py-3 text-sm text-mist">
                  Sign in to save this Template
                </button>
              </SignInButton>
            </Show>
          </>
        ) : (
          <p className="text-center text-xs text-mist/60">
            Saving needs Clerk + Convex configured — playing works right now.
          </p>
        )}
      </div>
      {ageGate}
    </main>
  );

  function update(index: number, patch: Partial<CustomRow>) {
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
}
