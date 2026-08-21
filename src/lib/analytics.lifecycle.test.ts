import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The consent lifecycle (PRD §6.9): what decides whether anything is sent.
 * PostHog and IndexedDB are the two system boundaries and are mocked; the
 * module is re-imported per test because its state is a singleton.
 */
const mocks = vi.hoisted(() => {
  const posthog = {
    init: vi.fn(),
    capture: vi.fn(),
    set_config: vi.fn(),
    reset: vi.fn(),
  };
  let pendingPrefs: ((p: { analyticsOptOut?: boolean }) => void) | null = null;
  const storage = {
    prefs: {} as { analyticsOptOut?: boolean },
    loadPrefs: vi.fn(
      () =>
        new Promise<{ analyticsOptOut?: boolean }>((resolve) => {
          pendingPrefs = resolve;
        })
    ),
    savePrefs: vi.fn(async (patch: { analyticsOptOut?: boolean }) => {
      storage.prefs = { ...storage.prefs, ...patch };
    }),
    /** Let the pending loadPrefs() resolve with the current prefs. */
    resolvePrefs() {
      pendingPrefs?.(storage.prefs);
      pendingPrefs = null;
    },
  };
  /** When set, the posthog-js download stays pending until released. */
  const download = { gate: null as Promise<void> | null };
  return { posthog, storage, download };
});

vi.mock("~/lib/storage", () => ({
  loadPrefs: mocks.storage.loadPrefs,
  savePrefs: mocks.storage.savePrefs,
}));
vi.mock("~/env", () => ({ env: { posthogKey: "phc_test" }, hasPostHog: true }));

const { posthog, storage, download } = mocks;
const tick = () => new Promise((r) => setTimeout(r, 0));
const fresh = async () => {
  vi.resetModules();
  // Registered per test (doMock, not hoisted) so the factory — and the
  // download gate — run again for each fresh module instance.
  vi.doMock("posthog-js", async () => {
    if (download.gate) await download.gate;
    return { default: posthog };
  });
  return import("./analytics");
};

beforeEach(() => {
  vi.clearAllMocks();
  storage.prefs = {};
  download.gate = null;
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  vi.stubGlobal("document", { documentElement: { lang: "ko" } });
  vi.stubGlobal("navigator", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    maxTouchPoints: 5,
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consent lifecycle", () => {
  it("holds events until the preference is known, then sends them with the common properties", async () => {
    const { initAnalytics, track } = await fresh();
    initAnalytics();
    track({ name: "page_view", route: "/settings" });
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();

    storage.resolvePrefs(); // no opt-out saved → on
    await tick();

    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("page_view", {
      route: "/settings",
      device_class: "mobile",
      locale: "ko",
      $geoip_disable: true,
    });
  });

  it("holds events tracked before the boot call too — a route effect can't lose one", async () => {
    const { initAnalytics, track } = await fresh();
    track({ name: "error", kind: "sw_register" });
    initAnalytics();
    storage.resolvePrefs();
    await tick();
    expect(posthog.capture).toHaveBeenCalledWith(
      "error",
      expect.objectContaining({ kind: "sw_register" })
    );
  });

  it("drops held events and never loads PostHog when the preference is off", async () => {
    storage.prefs = { analyticsOptOut: true };
    const { initAnalytics, track } = await fresh();
    initAnalytics();
    track({ name: "skip" });
    storage.resolvePrefs();
    await tick();
    track({ name: "pass" });
    await tick();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("initializes PostHog US, cookieless, with nothing automatic and the gate as before_send", async () => {
    const { initAnalytics } = await fresh();
    initAnalytics();
    storage.resolvePrefs();
    await tick();
    const config = posthog.init.mock.calls[0][1];
    expect(posthog.init.mock.calls[0][0]).toBe("phc_test");
    expect(config).toMatchObject({
      api_host: "https://us.i.posthog.com",
      persistence: "localStorage",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      capture_exceptions: false,
      advanced_disable_flags: true,
    });
    // The gate: allow-listed events pass, PostHog's own internals don't.
    const outgoing = (event: string) => ({
      uuid: "u",
      event,
      properties: { distinct_id: "d", zone: 2, $current_url: "x" },
    });
    expect(config.before_send(outgoing("card_shown"))?.properties).toEqual({
      distinct_id: "d",
      zone: 2,
    });
    expect(config.before_send(outgoing("$pageview"))).toBeNull();
  });

  it("opting out stops everything: nothing sent, stored identity wiped, before_send closed", async () => {
    const { initAnalytics, setAnalyticsEnabled, track } = await fresh();
    initAnalytics();
    storage.resolvePrefs();
    await tick();
    const config = posthog.init.mock.calls[0][1];

    await setAnalyticsEnabled(false);
    track({ name: "skip" });
    await tick();

    expect(storage.prefs).toEqual({ analyticsOptOut: true });
    expect(posthog.set_config).toHaveBeenCalledWith({
      disable_persistence: true,
    });
    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(
      config.before_send({ uuid: "u", event: "skip", properties: {} })
    ).toBeNull();
  });

  it("opting out while PostHog is still downloading still wipes its storage once it arrives, and sends nothing", async () => {
    let release!: () => void;
    download.gate = new Promise<void>((r) => (release = r));
    const { initAnalytics, setAnalyticsEnabled, track } = await fresh();
    initAnalytics();
    track({ name: "pass" });
    storage.resolvePrefs(); // on → download starts and stays pending
    await tick();
    expect(posthog.init).not.toHaveBeenCalled();

    await setAnalyticsEnabled(false); // before the download finishes
    release();
    await tick();

    expect(posthog.init).toHaveBeenCalledTimes(1); // it did arrive and write…
    expect(posthog.set_config).toHaveBeenCalledWith({
      disable_persistence: true,
    }); // …and was told to delete that
    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("switching usage stats back on resumes persistence and records that toggle", async () => {
    const { initAnalytics, setAnalyticsEnabled } = await fresh();
    initAnalytics();
    storage.resolvePrefs();
    await tick();
    await setAnalyticsEnabled(false);
    await tick();
    posthog.capture.mockClear();

    await setAnalyticsEnabled(true);
    await tick();

    expect(storage.prefs).toEqual({ analyticsOptOut: false });
    expect(posthog.set_config).toHaveBeenLastCalledWith({
      disable_persistence: false,
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      "settings_toggle",
      expect.objectContaining({ toggle: "analytics", state: "on" })
    );
  });

  it("a toggle that lands before the preference is read wins over the stale read", async () => {
    storage.prefs = {}; // stored: on
    const { initAnalytics, setAnalyticsEnabled, track } = await fresh();
    initAnalytics();
    await setAnalyticsEnabled(false); // user opts out while loadPrefs is pending
    storage.resolvePrefs(); // resolves with the OLD prefs object? no — savePrefs updated it
    await tick();
    track({ name: "skip" });
    await tick();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
