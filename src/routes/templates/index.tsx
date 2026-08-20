import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { hasClerk, hasConvex } from "~/env";
import { createSession, DEFAULT_SKIP_BUDGET, zoneOf } from "~/game/engine";
import type { Prompt } from "~/game/types";
import { saveSession } from "~/lib/storage";
import { useAgeGate } from "~/lib/use-age-gate";
import { useDeckList } from "~/lib/use-decks";
import { useI18n } from "~/lib/i18n";

export const Route = createFileRoute("/templates/")({
  component: Templates,
});

function Templates() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-blush">
          {t("templates.title")}
        </h1>
        <Link
          to="/templates/new"
          className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-midnight"
        >
          {t("templates.new")}
        </Link>
      </div>
      <p className="mt-2 text-xs text-mist">{t("templates.blurb")}</p>

      {!hasClerk || !hasConvex ? (
        <div className="mt-6 rounded-2xl bg-plum p-5 text-sm text-mist">
          {t("templates.unconfigured.before")}
          <Link to="/templates/new" className="underline">
            {t("templates.unconfigured.link")}
          </Link>
          {t("templates.unconfigured.after")}
        </div>
      ) : (
        <>
          <Show when="signed-out">
            <div className="mt-6 rounded-2xl bg-plum p-5 text-center">
              <p className="text-sm text-mist">{t("templates.signIn.note")}</p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="mt-3 rounded-full bg-ember px-6 py-2 text-sm font-semibold text-midnight"
                >
                  {t("templates.signIn")}
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
  const { t } = useI18n();
  const decks = useDeckList();
  const { withAgeCheck, ageGate } = useAgeGate();
  // Only mounted when hasConvex && hasClerk (gated by the parent) — no skip.
  const templates = useQuery(api.gameTemplates.list, {});
  const remove = useMutation(api.gameTemplates.remove);

  if (templates === undefined)
    return <p className="mt-6 text-sm text-mist">{t("templates.loading")}</p>;
  if (templates.length === 0) {
    return (
      <p className="mt-6 text-sm text-mist">
        {t("templates.empty.before")}
        <span className="text-blush">{t("templates.empty.new")}</span>
        {t("templates.empty.after")}
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
          playerNames: [
            t("setup.players.placeholder", { n: 1 }),
            t("setup.players.placeholder", { n: 2 }),
          ],
          boardPresetId: template.boardPreset,
          tilePrompts,
          // Templates saved before budgets existed play with the default;
          // null (unlimited) must pass through untouched.
          skipsPerPlayer:
            template.skipsPerPlayer === undefined
              ? DEFAULT_SKIP_BUDGET
              : template.skipsPerPlayer,
        },
        Date.now()
      )
    );
    navigate({ to: "/play" });
  };

  const play = (template: (typeof templates)[number]) => {
    // Gate on the Deck's own tier; the stored tier (server-derived from the
    // same deck at save time) is the fallback when the deck list is loading.
    const deckTier =
      decks.find((d) => d.slug === template.deckSlug)?.tier ?? template.tier;
    withAgeCheck(deckTier, () => void begin(template));
  };

  return (
    <div className="mt-6 grid gap-3">
      {templates.map((template) => (
        <div key={template._id} className="rounded-2xl bg-plum p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blush">{template.name}</p>
              <p className="text-xs text-mist">
                {t(`tier.${template.tier}`)} · {template.deckSlug} ·{" "}
                {t("templates.meta.pins", {
                  count: template.customPrompts.length,
                })}{" "}
                ·{" "}
                {template.skipsPerPlayer === null
                  ? t("templates.meta.skips.unlimited")
                  : t("templates.meta.skips", {
                      count: template.skipsPerPlayer ?? DEFAULT_SKIP_BUDGET,
                    })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => play(template)}
                className="rounded-full bg-ember px-4 py-1.5 text-xs font-semibold text-midnight"
              >
                {t("templates.play")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      t("templates.delete.confirm", { name: template.name })
                    )
                  )
                    void remove({ id: template._id });
                }}
                className="rounded-full bg-plum-light px-3 py-1.5 text-xs text-mist hover:text-blush"
              >
                {t("templates.delete")}
              </button>
            </div>
          </div>
        </div>
      ))}
      {ageGate}
    </div>
  );
}
