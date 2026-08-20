import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { GameState, Tier } from "~/game/types";
import { createSession, DEFAULT_SKIP_BUDGET } from "~/game/engine";
import { DEMO_DECK_SLUG } from "~/game/demo-deck";
import { useDeckList } from "~/lib/use-decks";
import {
  loadPrefs,
  loadSession,
  requestPersistence,
  savePrefs,
  saveSession,
} from "~/lib/storage";
import { useAgeGate } from "~/lib/use-age-gate";
import { useI18n } from "~/lib/i18n";
import { SkipBudgetPicker } from "~/components/SkipBudgetPicker";
import { hasConvex } from "~/env";

export const Route = createFileRoute("/play/setup")({
  component: Setup,
});

const TIERS: Array<{ id: Tier; emoji: string }> = [
  { id: "sweet", emoji: "🌷" },
  { id: "flirty", emoji: "💫" },
  { id: "spicy", emoji: "🔥" },
];

function Setup() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const decks = useDeckList();

  const { withAgeCheck, ageGate } = useAgeGate();

  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [tier, setTier] = useState<Tier>("sweet");
  const [deckSlug, setDeckSlug] = useState<string | null>(null);
  const [skips, setSkips] = useState<number | null>(DEFAULT_SKIP_BUDGET);
  const [resumable, setResumable] = useState<GameState | null>(null);

  useEffect(() => {
    loadPrefs().then((p) => {
      if (p.playerNames) setNames(p.playerNames);
      if (p.lastTier) setTier(p.lastTier);
      if (p.lastSkipBudget !== undefined) setSkips(p.lastSkipBudget);
    });
    loadSession().then((s) => {
      if (s && s.phase !== "finished") setResumable(s);
    });
  }, []);

  const tierDecks = decks.filter((d) => d.tier === tier);
  const chosenDeck =
    tierDecks.find((d) => d.slug === deckSlug) ?? tierDecks[0] ?? null;

  const pickTier = (tierChoice: Tier) =>
    withAgeCheck(tierChoice, () => {
      setTier(tierChoice);
      setDeckSlug(null);
    });

  const begin = async () => {
    const playerNames: [string, string] = [
      names[0].trim() || t("setup.players.placeholder", { n: 1 }),
      names[1].trim() || t("setup.players.placeholder", { n: 2 }),
    ];
    const config = {
      tier,
      deckSlug: chosenDeck?.slug ?? DEMO_DECK_SLUG,
      playerNames,
      boardPresetId: "classic",
      skipsPerPlayer: skips,
    };
    // Await the write — /play reads the session on mount and would bounce
    // back here if it raced an uncommitted IDB transaction.
    await saveSession(createSession(config, Date.now()));
    void savePrefs({ playerNames, lastTier: tier, lastSkipBudget: skips });
    requestPersistence();
    navigate({ to: "/play" });
  };

  // Gate on the Deck actually being played, not just the tier button —
  // e.g. a remembered spicy lastTier must still hit the gate here. While
  // decks are still loading (no chosenDeck) fall back to the selected
  // tier, never a milder default: the gate must fail closed.
  const start = () =>
    withAgeCheck(chosenDeck?.tier ?? tier, () => void begin());

  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">{t("setup.title")}</h1>

      {resumable && (
        <button
          type="button"
          onClick={() => navigate({ to: "/play" })}
          className="mt-4 w-full rounded-2xl bg-plum-light p-4 text-left transition hover:bg-plum"
        >
          <p className="font-semibold text-blush">{t("setup.resume")}</p>
          <p className="text-xs text-mist">
            {resumable.config.playerNames.join(" & ")} ·{" "}
            {t(`tier.${resumable.config.tier}`)} ·{" "}
            {t("setup.resume.turn", { turn: resumable.stats.rolls + 1 })}
          </p>
        </button>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
          {t("setup.players")}
        </h2>
        <p className="mt-1 text-xs text-mist/60">{t("setup.players.note")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <input
              key={i}
              value={names[i]}
              onChange={(e) => {
                const next: [string, string] = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("setup.players.placeholder", { n: i + 1 })}
              maxLength={20}
              className="rounded-xl bg-plum px-4 py-3 text-blush placeholder:text-mist/40 focus:outline-2 focus:outline-ember"
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
          {t("setup.tier")}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {TIERS.map((tierOption) => (
            <button
              key={tierOption.id}
              type="button"
              onClick={() => pickTier(tierOption.id)}
              className={`rounded-2xl p-3 text-center transition ${
                tier === tierOption.id
                  ? "bg-ember text-midnight"
                  : "bg-plum text-mist hover:bg-plum-light"
              }`}
            >
              <span className="text-2xl">{tierOption.emoji}</span>
              <p className="mt-1 text-sm font-semibold">
                {t(`tier.${tierOption.id}`)}
              </p>
              <p
                className={`text-[10px] ${
                  tier === tierOption.id ? "text-midnight/70" : "text-mist/60"
                }`}
              >
                {t(`tier.${tierOption.id}.blurb`)}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
          {t("setup.deck")}
        </h2>
        <div className="mt-3 grid gap-2">
          {tierDecks.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => setDeckSlug(d.slug)}
              className={`rounded-2xl p-4 text-left transition ${
                chosenDeck?.slug === d.slug
                  ? "bg-plum-light ring-2 ring-ember"
                  : "bg-plum hover:bg-plum-light"
              }`}
            >
              <p className="font-semibold text-blush">{d.title}</p>
              <p className="text-xs text-mist">
                {d.description} ·{" "}
                {t("setup.deck.cards", { count: d.promptCount })}
              </p>
            </button>
          ))}
          {tierDecks.length === 0 && (
            <div className="rounded-2xl bg-plum p-4 text-sm text-mist">
              {t(hasConvex ? "setup.deck.noneConvex" : "setup.deck.noneDemo", {
                tier: t(`tier.${tier}`),
              })}
            </div>
          )}
        </div>
      </section>

      <SkipBudgetPicker
        value={skips}
        onChange={setSkips}
        title={t("setup.skips")}
      />

      <button
        type="button"
        onClick={start}
        className="mt-8 w-full rounded-full bg-ember py-4 text-lg font-semibold text-midnight shadow-lg shadow-ember/25 transition active:scale-95"
      >
        {t("setup.start")}
      </button>

      {ageGate}
    </main>
  );
}
