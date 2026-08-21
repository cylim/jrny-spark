import type { ActiveCard, PromptKind, Tier, Zone } from "~/game/types";
import type { Locale } from "~/lib/i18n/messages";
import type { FileRouteTypes } from "~/routeTree.gen";
import { env, hasPostHog } from "~/env";
import { loadPrefs, savePrefs } from "~/lib/storage";

/**
 * Content-free analytics (PRD §6.9, ADR 0001) — the single reviewed place.
 *
 * Part 1 is THE allow-list (PRD Appendix A): which events may ever leave the
 * device and with which properties. Adding or changing an event means editing
 * `AnalyticsEvent` and `ALLOW_LIST` here and re-reviewing against ADR 0001:
 * behavioral metadata only — never prompt ids, prompt text, or player names.
 * Two layers enforce it:
 * - compile time: `track()` only accepts `AnalyticsEvent`, whose property
 *   types are all closed unions or buckets (no free text);
 * - send time: `enforceAllowList` runs as PostHog's `before_send` and drops
 *   any event not named below — PostHog's own internals included — and
 *   strips any property not named below, so a stray spread can't leak.
 *
 * Part 2 wires PostHog (US, cookieless) behind the Settings opt-out, which is
 * honored BEFORE any capture: PostHog's code isn't even downloaded until the
 * local preference says yes.
 */

// ───────────────────────── Part 1: the allow-list ─────────────────────────

/** A TanStack route id — a closed set, never the raw URL a user typed. */
export type Route = FileRouteTypes["id"];
/** The only Game Type in the MVP (CONTEXT.md); Phase 2 adds more. */
export type GameType = "journey_board";
export type ErrorKind =
  "template_save" | "deck_unavailable" | "sw_register" | "unhandled";

export type AnalyticsEvent =
  | { name: "page_view"; route: Route }
  | { name: "session_started"; tier: Tier; game_type: GameType }
  | {
      name: "session_completed";
      duration_bucket: DurationBucket;
      cards_drawn_bucket: CardsDrawnBucket;
    }
  | {
      name: "card_shown";
      zone: Zone;
      kind: PromptKind;
      reason: ActiveCard["reason"];
    }
  | { name: "skip" }
  | { name: "pass" }
  | { name: "charm_choice"; choice: "charm" | "slide" }
  | { name: "exhaustion_choice"; choice: "stay" | "advance" }
  | { name: "install_prompt"; outcome: "accepted" | "dismissed" }
  | { name: "template_saved" }
  // Turning usage stats OFF is deliberately not an event: opt-out is
  // honored from that tap on, so the last thing we'd send is nothing.
  | { name: "settings_toggle"; toggle: "analytics"; state: "on" }
  | { name: "settings_toggle"; toggle: "language"; state: Locale }
  | { name: "settings_toggle"; toggle: "age_gate"; state: "reset" }
  | { name: "error"; kind: ErrorKind };

export type EventName = AnalyticsEvent["name"];

type PropertiesOf<N extends EventName> = Exclude<
  keyof Extract<AnalyticsEvent, { name: N }>,
  "name"
>;

/** Per-event property names the gate lets through — the runtime allow-list. */
const ALLOW_LIST = {
  page_view: ["route"],
  session_started: ["tier", "game_type"],
  session_completed: ["duration_bucket", "cards_drawn_bucket"],
  card_shown: ["zone", "kind", "reason"],
  skip: [],
  pass: [],
  charm_choice: ["choice"],
  exhaustion_choice: ["choice"],
  install_prompt: ["outcome"],
  template_saved: [],
  settings_toggle: ["toggle", "state"],
  error: ["kind"],
} as const satisfies { [N in EventName]: readonly PropertiesOf<N>[] };

/**
 * Compile-time completeness guard: `ALLOW_LIST` must name EVERY property of
 * every `AnalyticsEvent` member, or the gate would silently strip one.
 * `Unlisted[N]` is `never` exactly when event N is fully listed, so this
 * assignment only type-checks while the two definitions agree.
 */
type Unlisted = {
  [N in EventName]: Exclude<PropertiesOf<N>, (typeof ALLOW_LIST)[N][number]>;
};
const _allowListCoversEveryProperty: { [N in EventName]: never } =
  {} as Unlisted;
void _allowListCoversEveryProperty;

/** Common properties on every event (Appendix A): device class and locale. */
export const COMMON_PROPERTIES = ["device_class", "locale"] as const;

/**
 * PostHog transport plumbing we let through — ids/timestamps ingestion needs,
 * the library tag, and the flags that keep person profiles and GeoIP off.
 * Everything else PostHog attaches (URL, referrer, user agent, screen,
 * timezone, browser language…) is stripped.
 */
const PLUMBING_PROPERTIES = new Set<string>([
  "distinct_id",
  "$device_id",
  "$session_id",
  "$window_id",
  "$insert_id",
  "$time",
  "token",
  "$lib",
  "$lib_version",
  "$process_person_profile",
  "$is_identified",
  "$geoip_disable",
]);

function isAllowedEvent(name: string): name is EventName {
  return Object.prototype.hasOwnProperty.call(ALLOW_LIST, name);
}

/** The slice of PostHog's CaptureResult the gate touches (structural). */
interface Outgoing {
  event: string;
  properties: Record<string, unknown>;
  $set?: unknown;
  $set_once?: unknown;
  $unset?: unknown;
}

/**
 * PostHog `before_send`: the last word on what leaves the device. Returns
 * null (drop) for any event not in the allow-list, and otherwise a copy with
 * only allow-listed, common, and plumbing properties — and no person payloads.
 */
export function enforceAllowList<T extends Outgoing>(
  outgoing: T | null
): T | null {
  if (!outgoing || !isAllowedEvent(outgoing.event)) return null;
  const allowed = new Set<string>([
    ...ALLOW_LIST[outgoing.event],
    ...COMMON_PROPERTIES,
  ]);
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(outgoing.properties)) {
    if (allowed.has(key) || PLUMBING_PROPERTIES.has(key))
      properties[key] = value;
  }
  const { $set, $set_once, $unset, ...rest } = outgoing;
  void $set;
  void $set_once;
  void $unset;
  return { ...rest, properties } as T;
}

// — Buckets: a session's length and card count leave the device only as
// coarse bands, never raw numbers (§6.9). —

const MINUTE = 60_000;

export type DurationBucket = "<5m" | "5-15m" | "15-30m" | "30-60m" | "60m+";

/** Session length band; edges follow the §1.5 "median 15–30 min" target. */
export function durationBucket(ms: number): DurationBucket {
  if (ms < 5 * MINUTE) return "<5m";
  if (ms < 15 * MINUTE) return "5-15m";
  if (ms < 30 * MINUTE) return "15-30m";
  if (ms < 60 * MINUTE) return "30-60m";
  return "60m+";
}

export type CardsDrawnBucket = "0" | "1-5" | "6-11" | "12-20" | "21+";

/** Cards-drawn band; the §1.5 "≥ 12 prompts per session" target is an edge. */
export function cardsDrawnBucket(count: number): CardsDrawnBucket {
  if (count <= 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 11) return "6-11";
  if (count <= 20) return "12-20";
  return "21+";
}

export type DeviceClass = "mobile" | "tablet" | "desktop";

/**
 * Coarse device class — one of the two common properties on every event
 * (Appendix A). iPadOS 13+ reports a Mac user agent, so a touch-capable
 * "Mac" counts as a tablet.
 */
export function deviceClass(
  userAgent: string,
  maxTouchPoints: number
): DeviceClass {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "tablet";
  if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return "tablet";
  if (
    /Mobi|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    )
  )
    return "mobile";
  return "desktop";
}

// ──────────────── Part 2: PostHog wiring behind the opt-out ────────────────

/**
 * Lifecycle: `initAnalytics()` reads the opt-out preference; until it is
 * known (or while PostHog is still downloading) events wait in a small
 * queue, then are sent only if the answer is "on" — otherwise dropped,
 * never stored. An opted-out (or unconfigured) install never loads PostHog
 * and never writes to the browser.
 */
type PostHogClient = (typeof import("posthog-js"))["default"];

const state = {
  initialized: false,
  /** A key is configured and we're in a browser. */
  available: false,
  /** The opt-out preference has been read (or set by the toggle). */
  ready: false,
  enabled: false,
  /** Set once posthog-js has been downloaded and initialized. */
  client: null as PostHogClient | null,
  loading: null as Promise<void> | null,
  queue: [] as AnalyticsEvent[],
  unhandledReported: 0,
};
const MAX_QUEUE = 20;
const MAX_UNHANDLED = 5;

/** Lazy: download + init PostHog once, only when usage stats are on. */
function ensureClient(): Promise<void> {
  state.loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(env.posthogKey!, {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      // Cookieless: the only thing kept in the browser is a random anonymous
      // id in localStorage (so §1.5 return-play is countable). Opt-out
      // removes it; Clear local data replaces it with a fresh one (see
      // applyChoice / resetAnalytics).
      persistence: "localStorage",
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
      before_send: (outgoing) =>
        state.enabled ? enforceAllowList(outgoing) : null,
    });
    state.client = posthog;
  });
  return state.loading;
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
  if (!state.client || !state.enabled) return;
  const pending = state.queue;
  state.queue = [];
  for (const event of pending) send(state.client, event);
}

/**
 * Delete what PostHog stored (the anonymous id), stop it writing anything
 * further, and forget the id in memory too — so nothing of PostHog's remains
 * in this browser after opting out.
 */
function forgetStoredIdentity(posthog: PostHogClient): void {
  posthog.set_config({ disable_persistence: true });
  posthog.reset();
}

function applyChoice(on: boolean): void {
  state.ready = true;
  state.enabled = on;
  if (!on) {
    state.queue = [];
    // If PostHog is still downloading, the .then() below cleans up instead:
    // init() writes the id before anyone can stop it, and the toggle must
    // still leave nothing behind.
    if (state.client) forgetStoredIdentity(state.client);
    return;
  }
  void ensureClient().then(() => {
    if (!state.client) return;
    if (!state.enabled) {
      // Toggled off while loading — honor it now that the client exists.
      forgetStoredIdentity(state.client);
      return;
    }
    state.client.set_config({ disable_persistence: false });
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
  if (!state.ready) applyChoice(!optOut);
}

/**
 * Record an allow-listed event. Safe to call from anywhere on the client; a
 * no-op on the server, without a PostHog key, or while usage stats are off.
 */
export function track(event: AnalyticsEvent): void {
  if (!state.available) return;
  if (state.ready && !state.enabled) return;
  if (state.client && state.enabled) {
    send(state.client, event);
    return;
  }
  // Preference unknown, or PostHog still loading: hold, bounded.
  if (state.queue.length < MAX_QUEUE) state.queue.push(event);
}

/** Boot once on the client. Reads the opt-out before PostHog exists. */
export function initAnalytics(): void {
  if (state.initialized) return;
  state.initialized = true;
  if (typeof window === "undefined" || !hasPostHog) return;
  state.available = true;
  void syncFromPrefs();
  // Crash signal only — the kind, never a message or stack (those may
  // contain user text). Capped so an error loop can't spam.
  const unhandled = () => {
    if (state.unhandledReported++ < MAX_UNHANDLED)
      track({ name: "error", kind: "unhandled" });
  };
  window.addEventListener("error", unhandled);
  window.addEventListener("unhandledrejection", unhandled);
}

/** Settings toggle: persist the choice and apply it before any further capture. */
export async function setAnalyticsEnabled(on: boolean): Promise<void> {
  await savePrefs({ analyticsOptOut: !on });
  if (!state.available) return;
  applyChoice(on);
  if (on) track({ name: "settings_toggle", toggle: "analytics", state: "on" });
}

/**
 * Settings → Clear local data: drop the anonymous id and start from the
 * (now default) preference again, exactly as a fresh install would.
 */
export function resetAnalytics(): void {
  if (!state.available) return;
  state.client?.reset();
  state.ready = false;
  state.queue = [];
  void syncFromPrefs();
}
