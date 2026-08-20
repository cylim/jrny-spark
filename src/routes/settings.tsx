import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { hasClerk } from "~/env";
import { clearAllLocalData, loadPrefs, savePrefs } from "~/lib/storage";
import { canPromptInstall, isIos, isStandalone, onInstallAvailable, promptInstall } from "~/lib/install";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [cleared, setCleared] = useState(false);
  // Platform detection only after mount — calling isStandalone()/isIos()
  // during render would make server HTML and client hydration disagree.
  const [platform, setPlatform] = useState({ standalone: false, ios: false });

  useEffect(() => {
    loadPrefs().then((p) => setAgeConfirmed(Boolean(p.ageConfirmed)));
    setInstallable(canPromptInstall());
    setPlatform({ standalone: isStandalone(), ios: isIos() });
    return onInstallAvailable(() => setInstallable(true));
  }, []);

  return (
    <main className="mx-auto max-w-md px-6 pb-16">
      <h1 className="font-display text-3xl text-blush">Settings</h1>

      <Section title="Account">
        {hasClerk ? (
          <>
            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <UserButton />
                <p className="text-sm text-mist">Signed in — your Templates sync.</p>
              </div>
            </Show>
            <Show when="signed-out">
              <div className="flex items-center justify-between">
                <p className="text-sm text-mist">Only needed to save your Templates.</p>
                <SignInButton mode="modal">
                  <button type="button" className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-midnight">
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </Show>
          </>
        ) : (
          <p className="text-sm text-mist">Sign-in not configured (demo mode) — see README.</p>
        )}
      </Section>

      <Section title="Content">
        <div className="flex items-center justify-between">
          <p className="text-sm text-mist">
            18+ confirmation: <span className="text-blush">{ageConfirmed ? "confirmed" : "not confirmed"}</span>
          </p>
          {ageConfirmed && (
            <button
              type="button"
              onClick={() => {
                void savePrefs({ ageConfirmed: false });
                setAgeConfirmed(false);
              }}
              className="rounded-full bg-plum-light px-4 py-2 text-xs text-mist hover:text-blush"
            >
              Reset
            </button>
          )}
        </div>
      </Section>

      <Section title="App">
        {platform.standalone ? (
          <p className="text-sm text-mist">Installed on this device ✓</p>
        ) : installable ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-midnight"
          >
            Install Spark on this device
          </button>
        ) : platform.ios ? (
          <p className="text-sm text-mist">
            To install on iPhone: tap <span className="text-blush">Share</span> →{" "}
            <span className="text-blush">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-sm text-mist">Your browser will offer installation once eligible.</p>
        )}
      </Section>

      <Section title="Your data">
        <p className="text-sm text-mist">
          Games in progress, recaps, preferences and cached decks live only on
          this device.{" "}
          <Link to="/privacy" className="underline">
            Read how privacy works
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Erase all local Spark data on this device? This can't be undone.")) {
              void clearAllLocalData().then(() => setCleared(true));
            }
          }}
          className="mt-3 rounded-full bg-rose-950 px-5 py-2 text-sm text-rose-300 hover:bg-rose-900"
        >
          {cleared ? "Cleared ✓" : "Clear all local data"}
        </button>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl bg-plum p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist">{title}</h2>
      {children}
    </section>
  );
}
