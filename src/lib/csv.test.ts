import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseAlbumCsv, exportAlbumCsv, parseDuplicatesCsv } from "./csv";
import { emptyState } from "./storage";
import { stickerKey } from "../types";

const arthur = readFileSync("data/arthur.csv", "utf8");

describe("parseAlbumCsv (real arthur.csv)", () => {
  const parsed = parseAlbumCsv(arthur);

  it("reads 49 sections", () => {
    expect(parsed.sections.length).toBe(49);
  });

  it("counts X as have and codes as missing", () => {
    expect(parsed.counts.have).toBe(839);
    expect(parsed.counts.missing).toBe(141);
  });

  it("treats a code cell as MISSING (MEX8 not owned)", () => {
    expect(parsed.owned[stickerKey("MEX", "8")]).toBeUndefined();
  });

  it("treats an X cell as OWNED (MEX1 owned)", () => {
    expect(parsed.owned[stickerKey("MEX", "1")]).toBe(true);
  });

  it("maps the FWC zero row to slot 00 and marks it owned (X)", () => {
    const fwc = parsed.sections.find((s) => s.code === "FWC")!;
    expect(fwc.slots[0]).toBe("00");
    expect(parsed.owned[stickerKey("FWC", "00")]).toBe(true);
  });

  it("country sections have 20 slots, FWC has 20 (00 + 1..19)", () => {
    expect(parsed.sections.find((s) => s.code === "MEX")!.slots.length).toBe(20);
    const fwc = parsed.sections.find((s) => s.code === "FWC")!;
    expect(fwc.slots.length).toBe(20);
    expect(fwc.slots).not.toContain("20");
  });
});

describe("parseDuplicatesCsv (real duplicates.csv)", () => {
  const dup = parseDuplicatesCsv(readFileSync("data/duplicates.csv", "utf8"));

  it("treats X as one spare and empty as none", () => {
    // FWC row 0 ("00") is marked X in the file.
    expect(dup.dupes[stickerKey("FWC", "00")]).toBe(1);
    // MEX1 is empty in the duplicates file.
    expect(dup.dupes[stickerKey("MEX", "1")]).toBeUndefined();
  });

  it("reports a positive total and distinct count", () => {
    expect(dup.total).toBeGreaterThan(0);
    expect(dup.distinct).toBeGreaterThan(0);
    expect(dup.total).toBeGreaterThanOrEqual(dup.distinct);
  });
});

describe("CSV round-trip", () => {
  it("export then re-import yields identical owned set", () => {
    const parsed = parseAlbumCsv(arthur);
    const state = { ...emptyState(), sections: parsed.sections };
    state.albums.A.owned = parsed.owned;

    const csv = exportAlbumCsv(state, "A");
    const reparsed = parseAlbumCsv(csv);

    expect(reparsed.counts).toEqual(parsed.counts);
    expect(Object.keys(reparsed.owned).sort()).toEqual(Object.keys(parsed.owned).sort());
  });
});
