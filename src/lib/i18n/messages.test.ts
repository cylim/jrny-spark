import { describe, expect, it } from "vitest";
import { en } from "./en";
import { ko } from "./ko";
import { zhHant } from "./zh-hant";
import { translate, type MessageKey } from "./messages";

describe("translate", () => {
  it("renders the requested locale", () => {
    expect(translate("ko", "nav.settings")).toBe("설정");
    expect(translate("zh-Hant", "nav.settings")).toBe("設定");
  });

  it("falls back to English for a missing translation — never a blank", () => {
    // Forge a key gap rather than depending on catalogs staying incomplete.
    const key = "nav.play" as MessageKey;
    const hadKo = ko[key];
    delete ko[key];
    try {
      expect(translate("ko", key)).toBe(en[key]);
    } finally {
      if (hadKo !== undefined) ko[key] = hadKo;
    }
  });

  it("interpolates {params} and leaves unknown placeholders visible", () => {
    expect(translate("en", "play.turn", { name: "Ava" })).toBe("Ava's turn");
    expect(translate("en", "play.turn", {})).toBe("{name}'s turn");
  });

  it("translated catalogs only use keys that exist in English", () => {
    for (const key of Object.keys(ko)) expect(key in en).toBe(true);
    for (const key of Object.keys(zhHant)) expect(key in en).toBe(true);
  });
});
