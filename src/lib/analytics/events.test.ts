import { describe, expect, it } from "vitest";
import {
  cardsDrawnBucket,
  deviceClass,
  durationBucket,
  enforceAllowList,
} from "./events";

const MINUTE = 60_000;

describe("durationBucket", () => {
  it("buckets a session's length so raw durations never leave the device", () => {
    expect(durationBucket(0)).toBe("<5m");
    expect(durationBucket(4 * MINUTE + 59_999)).toBe("<5m");
    expect(durationBucket(5 * MINUTE)).toBe("5-15m");
    expect(durationBucket(15 * MINUTE)).toBe("15-30m");
    expect(durationBucket(29 * MINUTE)).toBe("15-30m");
    expect(durationBucket(30 * MINUTE)).toBe("30-60m");
    expect(durationBucket(60 * MINUTE)).toBe("60m+");
    expect(durationBucket(3 * 60 * MINUTE)).toBe("60m+");
  });
});

describe("cardsDrawnBucket", () => {
  it("buckets the card count with the §1.5 'at least 12' target on an edge", () => {
    expect(cardsDrawnBucket(0)).toBe("0");
    expect(cardsDrawnBucket(1)).toBe("1-5");
    expect(cardsDrawnBucket(5)).toBe("1-5");
    expect(cardsDrawnBucket(6)).toBe("6-11");
    expect(cardsDrawnBucket(11)).toBe("6-11");
    expect(cardsDrawnBucket(12)).toBe("12-20");
    expect(cardsDrawnBucket(20)).toBe("12-20");
    expect(cardsDrawnBucket(21)).toBe("21+");
    expect(cardsDrawnBucket(140)).toBe("21+");
  });
});

describe("deviceClass", () => {
  const IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const IPAD =
    "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
  // iPadOS 13+ masquerades as a Mac — only the touch points give it away.
  const IPADOS_AS_MAC =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
  const ANDROID_PHONE =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
  const ANDROID_TABLET =
    "Mozilla/5.0 (Linux; Android 13; SM-X906C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const MAC =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const WINDOWS =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  it("classifies phones as mobile", () => {
    expect(deviceClass(IPHONE, 5)).toBe("mobile");
    expect(deviceClass(ANDROID_PHONE, 5)).toBe("mobile");
  });

  it("classifies tablets — including iPadOS pretending to be a Mac", () => {
    expect(deviceClass(IPAD, 5)).toBe("tablet");
    expect(deviceClass(ANDROID_TABLET, 5)).toBe("tablet");
    expect(deviceClass(IPADOS_AS_MAC, 5)).toBe("tablet");
  });

  it("classifies everything else as desktop", () => {
    expect(deviceClass(MAC, 0)).toBe("desktop");
    expect(deviceClass(WINDOWS, 0)).toBe("desktop");
    expect(deviceClass("", 0)).toBe("desktop");
  });
});

describe("enforceAllowList (the before_send gate)", () => {
  // The shape PostHog hands to before_send — only what the gate looks at.
  const outgoing = (event: string, properties: Record<string, unknown>) => ({
    uuid: "u-1",
    event,
    properties,
  });
  const PLUMBING = {
    distinct_id: "anon-1",
    $device_id: "dev-1",
    $session_id: "s-1",
    $window_id: "w-1",
    $insert_id: "i-1",
    $time: 1_700_000_000,
    token: "phc_x",
    $lib: "web",
    $lib_version: "1.0.0",
    $process_person_profile: false,
    $is_identified: false,
    $geoip_disable: true,
  };

  it("drops anything that is not an allow-listed event — PostHog's own included", () => {
    for (const name of [
      "$pageview",
      "$pageleave",
      "$opt_in",
      "$exception",
      "$autocapture",
      "$web_vitals",
      "prompt_text",
    ]) {
      expect(enforceAllowList(outgoing(name, { ...PLUMBING }))).toBeNull();
    }
  });

  it("lets an allow-listed event through with its own, common, and plumbing properties", () => {
    const result = enforceAllowList(
      outgoing("card_shown", {
        ...PLUMBING,
        zone: 2,
        kind: "action",
        reason: "charm",
        device_class: "mobile",
        locale: "ko",
      })
    );
    expect(result?.event).toBe("card_shown");
    expect(result?.properties).toEqual({
      ...PLUMBING,
      zone: 2,
      kind: "action",
      reason: "charm",
      device_class: "mobile",
      locale: "ko",
    });
  });

  it("strips every property the event's allow-list entry doesn't name", () => {
    const result = enforceAllowList(
      outgoing("skip", {
        ...PLUMBING,
        device_class: "desktop",
        locale: "en",
        // A stray spread of a Prompt, plus PostHog's own URL/UA noise.
        id: "prompt-42",
        text: "Tell me a secret",
        zone: 1,
        $current_url: "https://spark.jrny.app/play",
        $pathname: "/play",
        $referrer: "https://example.com",
        $raw_user_agent: "Mozilla/5.0",
        $browser_language: "en-US",
        $screen_width: 390,
        $timezone: "Asia/Seoul",
      })
    );
    expect(result?.properties).toEqual({
      ...PLUMBING,
      device_class: "desktop",
      locale: "en",
    });
  });

  it("removes person payloads — no $set / $set_once / $unset ever leave", () => {
    const result = enforceAllowList({
      ...outgoing("page_view", { ...PLUMBING, route: "/settings" }),
      $set: { email: "x@y.z" },
      $set_once: { $initial_referrer: "https://example.com" },
      $unset: ["foo"],
    });
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("$set");
    expect(result).not.toHaveProperty("$set_once");
    expect(result).not.toHaveProperty("$unset");
  });

  it("passes null through (a previous before_send already dropped the event)", () => {
    expect(enforceAllowList(null)).toBeNull();
  });
});
