import type { ActiveCard, PromptKind, Tier, Zone } from "~/game/types";
import type { Locale } from "~/lib/i18n/messages";
import type { FileRouteTypes } from "~/routeTree.gen";

/**
 * THE analytics allow-list (PRD Appendix A, §6.9) — the single reviewed place
 * that defines which events may ever leave the device and with which
 * properties. Adding or changing an event means editing `AnalyticsEvent`
 * and `ALLOW_LIST` here and re-reviewing against ADR 0001: behavioral
 * metadata only — never prompt ids, prompt text, or player names.
 *
 * Two layers enforce it:
 * - compile time: `track()` only accepts `AnalyticsEvent`, whose property
 *   types are all closed unions or buckets (no free text);
 * - send time: `enforceAllowList` runs as PostHog's `before_send` and drops
 *   any event not named below — PostHog's own internals included — and
 *   strips any property not named below, so a stray spread can't leak.
 */

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

// Compile-time completeness: every property of every event must be listed,
// or the gate would silently strip it. `Unlisted[N]` is `never` when complete.
type Unlisted = {
  [N in EventName]: Exclude<PropertiesOf<N>, (typeof ALLOW_LIST)[N][number]>;
};
const _everyPropertyIsListed: { [N in EventName]: never } = {} as Unlisted;
void _everyPropertyIsListed;

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
