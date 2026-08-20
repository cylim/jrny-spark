import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { hasClerk, hasConvex } from "~/env";
import { createSession, DEFAULT_SKIP_BUDGET, zoneOf } from "~/game/engine";
import { CLASSIC } from "~/game/board-presets";
import { pinRejection, type PinRejection } from "~/game/pins";
import { DEMO_DECK_SLUG } from "~/game/demo-deck";
import type { Prompt, PromptKind, Tier } from "~/game/types";
import { useDeckList } from "~/lib/use-decks";
import { saveSession } from "~/lib/storage";
import { useAgeGate } from "~/lib/use-age-gate";
import { useI18n, type MessageKey } from "~/lib/i18n";
import { SkipBudgetPicker } from "~/components/SkipBudgetPicker";

export const Route = createFileRoute("/templates/new")({
  component: NewTemplate,
});

interface CustomRow {
  tile: number;
  text: string;
  kind: PromptKind;
}

const PIN_MESSAGES: Record<PinRejection, MessageKey> = {
  "out-of-range": "builder.pin.outOfRange",
  "snake-head": "builder.pin.snakeHead",
  "ladder-foot": "builder.pin.ladderFoot",
  finish: "builder.pin.finish",
};

/** The builder pins onto the classic board only (boardPreset is hardcoded below). */
function pinIssue(row: CustomRow): MessageKey | null {
  const rejection = pinRejection(CLASSIC, row.tile);
  return rejection ? PIN_MESSAGES[rejection] : null;
}

function NewTemplate() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const decks = useDeckList();
  const saveTemplate = useMutation(api.gameTemplates.save);
  const { withAgeCheck, ageGate } = useAgeGate();

  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("sweet");
  const [deckSlug, setDeckSlug] = useState<string | null>(null);
  const [skips, setSkips] = useState<number | null>(DEFAULT_SKIP_BUDGET);
  const [rows, setRows] = useState<CustomRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Match setup's tier picker: confirm 18+ before even browsing spicy decks.
  const pickTier = (tierChoice: Tier) =>
    withAgeCheck(tierChoice, () => {
      setTier(tierChoice);
      setDeckSlug(null);
    });

  const tierDecks = decks.filter((d) => d.tier === tier);
  const chosenSlug =
    tierDecks.find((d) => d.slug === deckSlug)?.slug ??
    tierDecks[0]?.slug ??
    DEMO_DECK_SLUG;
  const rowIssues = rows.map(pinIssue);
  const validRows = rows.filter(
    (r, i) => r.text.trim() && rowIssues[i] === null
  );
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
          playerNames: [
            t("setup.players.placeholder", { n: 1 }),
            t("setup.players.placeholder", { n: 2 }),
          ],
          boardPresetId: "classic",
          tilePrompts: toTilePrompts(),
          skipsPerPlayer: skips,
        },
        Date.now()
      )
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
        skipsPerPlayer: skips,
        customPrompts: validRows.map((r) => ({
          tile: r.tile,
          text: r.text.trim(),
          kind: r.kind,
        })),
      });
      navigate({ to: "/templates" });
    } catch (err) {
      setSaveError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : t("builder.save.error")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">{t("builder.title")}</h1>
      <p className="mt-2 text-xs text-mist">{t("builder.blurb")}</p>

      <label className="mt-6 block text-sm font-semibold uppercase tracking-wider text-mist">
        {t("builder.name")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("builder.name.placeholder")}
          maxLength={80}
          className="mt-2 w-full rounded-xl bg-plum px-4 py-3 font-normal normal-case tracking-normal text-blush placeholder:text-mist/40 focus:outline-2 focus:outline-ember"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-mist">
          {t("builder.tier")}
          <select
            value={tier}
            onChange={(e) => pickTier(e.target.value as Tier)}
            className="mt-2 w-full rounded-xl bg-plum px-3 py-3 font-normal normal-case tracking-normal text-blush"
          >
            <option value="sweet">{t("tier.sweet")} 🌷</option>
            <option value="flirty">{t("tier.flirty")} 💫</option>
            <option value="spicy">{t("tier.spicy")} 🔥</option>
          </select>
        </label>
        <label className="text-sm font-semibold uppercase tracking-wider text-mist">
          {t("builder.deck")}
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
            {tierDecks.length === 0 && (
              <option value={DEMO_DECK_SLUG}>{t("builder.deck.demo")}</option>
            )}
          </select>
        </label>
      </div>

      <SkipBudgetPicker
        value={skips}
        onChange={setSkips}
        title={t("builder.skips")}
      />

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
            {t("builder.pins")}
          </h2>
          <button
            type="button"
            onClick={() =>
              setRows([...rows, { tile: 10, text: "", kind: "question" }])
            }
            className="rounded-full bg-plum px-3 py-1 text-xs text-mist hover:text-blush"
          >
            {t("builder.pins.add")}
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {rows.map((row, i) => (
            <div key={i} className="rounded-2xl bg-plum p-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-mist">
                  {t("builder.pins.tile")}
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={row.tile}
                    onChange={(e) =>
                      update(i, { tile: Number(e.target.value) })
                    }
                    className="ml-2 w-16 rounded-lg bg-plum-light px-2 py-1 text-blush"
                  />
                </label>
                <select
                  value={row.kind}
                  onChange={(e) =>
                    update(i, { kind: e.target.value as PromptKind })
                  }
                  className="rounded-lg bg-plum-light px-2 py-1 text-xs text-blush"
                >
                  <option value="question">
                    {t("builder.pins.kind.question")}
                  </option>
                  <option value="action">
                    {t("builder.pins.kind.action")}
                  </option>
                  <option value="together">
                    {t("builder.pins.kind.together")}
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="ml-auto text-xs text-mist/60 hover:text-ember"
                >
                  {t("builder.pins.remove")}
                </button>
              </div>
              <textarea
                value={row.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder={t("builder.pins.placeholder")}
                rows={2}
                maxLength={280}
                className="mt-2 w-full rounded-lg bg-plum-light px-3 py-2 text-sm text-blush placeholder:text-mist/40"
              />
              {row.text.trim() !== "" && rowIssues[i] && (
                <p className="mt-1 text-xs text-ember-soft">
                  {t(rowIssues[i])}
                </p>
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
          {t("builder.play")}
        </button>
        {blocked && (
          <p className="text-center text-xs text-ember-soft">
            {t("builder.blocked")}
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
                {saving ? t("builder.saving") : t("builder.save")}
              </button>
              {saveError && (
                <p className="text-center text-xs text-ember-soft">
                  {saveError}
                </p>
              )}
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-full bg-plum-light py-3 text-sm text-mist"
                >
                  {t("builder.save.signIn")}
                </button>
              </SignInButton>
            </Show>
          </>
        ) : (
          <p className="text-center text-xs text-mist/60">
            {t("builder.save.demo")}
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
