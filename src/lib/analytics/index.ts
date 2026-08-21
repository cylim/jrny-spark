import { env, hasPostHog } from "~/env";
import { loadPrefs, savePrefs } from "~/lib/storage";
import { deviceClass, enforceAllowList, type AnalyticsEvent } from "./events";

export { cardsDrawnBucket, durationBucket } from "./events";
export type { AnalyticsEvent } from "./events";

/**
 * Content-free analytics (PRD §6.9, ADR 0001): PostHog US, cookieless, only
 * the allow-listed events in ./events.ts. The Settings opt-out lives in local
 * prefs and is honored BEFORE any capture: PostHog's code isn't even
 * downloaded, let alone initialized, until the preference says yes — so an
 * opted-out (or unconfigured) install never loads it and never writes to
 * the browser.
 *
 * Events tracked before the preference is known, or while PostHog is still
 * loading, wait in a small queue; they are sent only if the answer is "on"
 * and dropped otherwise — never stored.
 */
type PostHogClient = (typeof import("posthog-js"))["default"];

let initialized = false;
/** A key is configured and we're in a browser. */
let available = false;
/** The opt-out preference has been read (or set by the toggle). */
let ready = false;
let enabled = false;
let client: PostHogClient | null = null;
let loading: Promise<void> | null = null;
let queue: AnalyticsEvent[] = [];
const MAX_QUEUE = 20;
let unhandledReported = 0;
const MAX_UNHANDLED = 5;

/** Lazy: download + init PostHog once, only when usage stats are on. */
function ensureClient(): Promise<void> {
  loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(env.posthogKey!, {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      // Cookieless: the only thing kept in the browser is a random anonymous
      // id in localStorage (so §1.5 return-play is countable); it is wiped on
      // opt-out (opt_out_persistence_by_default) and on Clear local data.
      persistence: "localStorage",
      opt_out_persistence_by_default: true,
      person_profiles: "never",
      // Nothing automatic ever fires — only track() with allow-listed events.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      disable_external_dependency_loading: true,
      capture_performance: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      rageclick: false,
      advanced_disable_flags: true,
      // The allow-list gate — the last word on what leaves the device.
      before_send: (outgoing) => (enabled ? enforceAllowList(outgoing) : null),
    });
    client = posthog;
  });
  return loading;
}

function send(posthog: PostHogClient, event: AnalyticsEvent): void {
  const { name, ...properties } = event;
  posthog.capture(name, {
    ...properties,
    // Common properties (Appendix A). Locale comes from <html lang>, which
    // the I18nProvider keeps current — no import of the React layer here.
    device_class: deviceClass(
      navigator.userAgent,
      navigator.maxTouchPoints ?? 0
    ),
    locale: document.documentElement.lang || "en",
    // Never derive a location from the IP address.
    $geoip_disable: true,
  });
}

function flush(): void {
  if (!client || !enabled) return;
  const pending = queue;
  queue = [];
  for (const event of pending) send(client, event);
}

function applyChoice(on: boolean): void {
  ready = true;
  enabled = on;
  if (!on) {
    queue = [];
    // Stops capture and removes the stored anonymous id.
    client?.opt_out_capturing();
    return;
  }
  void ensureClient().then(() => {
    if (!enabled || !client) return; // toggled off again while loading
    // Realign PostHog's own consent flag (e.g. after a reset()).
    if (client.has_opted_out_capturing())
      client.opt_in_capturing({ captureEventName: false });
    flush();
  });
}

async function syncFromPrefs(): Promise<void> {
  let optOut = false;
  try {
    optOut = Boolean((await loadPrefs()).analyticsOptOut);
  } catch {
    optOut = false;
  }
  // A Settings toggle may have answered first — don't override it.
  if (!ready) applyChoice(!optOut);
}

/**
 * Record an allow-listed event. Safe to call from anywhere on the client; a
 * no-op on the server, without a PostHog key, or while usage stats are off.
 */
export function track(event: AnalyticsEvent): void {
  if (!available) return;
  if (ready && !enabled) return;
  if (client && enabled) {
    send(client, event);
    return;
  }
  // Preference unknown, or PostHog still loading: hold, bounded.
  if (queue.length < MAX_QUEUE) queue.push(event);
}

/** Boot once on the client. Reads the opt-out before PostHog exists. */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined" || !hasPostHog) return;
  available = true;
  void syncFromPrefs();
  // Crash signal only — the kind, never a message or stack (those may
  // contain user text). Capped so an error loop can't spam.
  const unhandled = () => {
    if (unhandledReported++ < MAX_UNHANDLED)
      track({ name: "error", kind: "unhandled" });
  };
  window.addEventListener("error", unhandled);
  window.addEventListener("unhandledrejection", unhandled);
}

/** Settings toggle: persist the choice and apply it before any further capture. */
export async function setAnalyticsEnabled(on: boolean): Promise<void> {
  await savePrefs({ analyticsOptOut: !on });
  if (!available) return;
  applyChoice(on);
  if (on) track({ name: "settings_toggle", toggle: "analytics", state: "on" });
}

/**
 * Settings → Clear local data: drop the anonymous id and start from the
 * (now default) preference again, exactly as a fresh install would.
 */
export function resetAnalytics(): void {
  if (!available) return;
  client?.reset();
  ready = false;
  queue = [];
  void syncFromPrefs();
}
