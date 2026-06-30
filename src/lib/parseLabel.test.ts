import { describe, it, expect } from "vitest";
import { canonSlot, splitLabel, resolveLabel } from "./parseLabel";
import type { Section } from "../types";

const sections: Section[] = [
  { code: "MEX", name: "Mexico", flag: "🇲🇽", slots: Array.from({ length: 20 }, (_, i) => String(i + 1)) },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", slots: Array.from({ length: 20 }, (_, i) => String(i + 1)) },
  { code: "FWC", name: "FIFA World Cup", flag: "🏆", slots: ["00", ...Array.from({ length: 20 }, (_, i) => String(i + 1))] },
];

describe("canonSlot", () => {
  it("normalizes numbers and zeros", () => {
    expect(canonSlot("8")).toBe("8");
    expect(canonSlot("08")).toBe("8");
    expect(canonSlot("0")).toBe("00");
    expect(canonSlot("00")).toBe("00");
    expect(canonSlot("20")).toBe("20");
  });
});

describe("splitLabel", () => {
  it("splits letters and trailing digits", () => {
    expect(splitLabel("MEX8")).toEqual({ alpha: "mex", num: "8" });
    expect(splitLabel("mex 8")).toEqual({ alpha: "mex", num: "8" });
    expect(splitLabel("MEX-8")).toEqual({ alpha: "mex", num: "8" });
    expect(splitLabel("FWC00")).toEqual({ alpha: "fwc", num: "00" });
    expect(splitLabel("brazil 3")).toEqual({ alpha: "brazil", num: "3" });
  });
});

describe("resolveLabel", () => {
  it("resolves an exact code+slot", () => {
    const { exact } = resolveLabel("MEX8", sections);
    expect(exact).toEqual({ code: "MEX", slot: "8" });
  });

  it("resolves FWC zero sticker variants", () => {
    expect(resolveLabel("FWC00", sections).exact).toEqual({ code: "FWC", slot: "00" });
    expect(resolveLabel("FWC0", sections).exact).toEqual({ code: "FWC", slot: "00" });
  });

  it("matches by country name", () => {
    expect(resolveLabel("brazil 3", sections).exact).toEqual({ code: "BRA", slot: "3" });
  });

  it("suggests sections while typing a partial code", () => {
    const { suggestions } = resolveLabel("b", sections);
    expect(suggestions.some((s) => s.code === "BRA")).toBe(true);
  });

  it("returns no exact for an out-of-range slot", () => {
    expect(resolveLabel("MEX99", sections).exact).toBeNull();
  });
});
