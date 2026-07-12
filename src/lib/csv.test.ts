import { describe, it, expect } from "vitest";
import { parseAlbumCsv, exportAlbumCsv, parseDuplicatesCsv } from "./csv";
import { emptyState } from "./storage";
import { stickerKey } from "../types";

// Small synthetic fixture covering the shapes the parser needs to handle:
// a country section, the FWC section's special "0" -> "00" row, an X (owned)
// cell, a code (missing) cell, and an empty (slot doesn't exist) cell.
const FIXTURE_CSV = [
  "Sticker,MEX,FWC",
  "0,,X",
  "1,X,FWC1",
  "2,MEX2,X",
].join("\n");

describe("parseAlbumCsv", () => {
  const parsed = parseAlbumCsv(FIXTURE_CSV);

  it("reads one section per column", () => {
    expect(parsed.sections.length).toBe(2);
  });

  it("counts X as have and codes as missing", () => {
    expect(parsed.counts.have).toBe(3);
    expect(parsed.counts.missing).toBe(2);
  });

  it("treats a code cell as MISSING (MEX2 not owned)", () => {
    expect(parsed.owned[stickerKey("MEX", "2")]).toBeUndefined();
  });

  it("treats an X cell as OWNED (MEX1 owned)", () => {
    expect(parsed.owned[stickerKey("MEX", "1")]).toBe(true);
  });

  it("maps the FWC zero row to slot 00 and marks it owned (X)", () => {
    const fwc = parsed.sections.find((s) => s.code === "FWC")!;
    expect(fwc.slots[0]).toBe("00");
    expect(parsed.owned[stickerKey("FWC", "00")]).toBe(true);
  });

  it("only includes slots present for that section (MEX has no 00)", () => {
    const mex = parsed.sections.find((s) => s.code === "MEX")!;
    expect(mex.slots).toEqual(["1", "2"]);
    const fwc = parsed.sections.find((s) => s.code === "FWC")!;
    expect(fwc.slots).toEqual(["00", "1", "2"]);
  });
});

describe("parseDuplicatesCsv", () => {
  const DUPES_CSV = ["Sticker,MEX,FWC", "0,,X", "1,,3"].join("\n");
  const dup = parseDuplicatesCsv(DUPES_CSV);

  it("treats X as one spare and a number as that many", () => {
    expect(dup.dupes[stickerKey("FWC", "00")]).toBe(1);
    expect(dup.dupes[stickerKey("FWC", "1")]).toBe(3);
  });

  it("treats an empty cell as no spares", () => {
    expect(dup.dupes[stickerKey("MEX", "1")]).toBeUndefined();
  });

  it("reports a positive total and distinct count", () => {
    expect(dup.total).toBe(4);
    expect(dup.distinct).toBe(2);
  });
});

describe("CSV round-trip", () => {
  it("export then re-import yields identical owned set", () => {
    const parsed = parseAlbumCsv(FIXTURE_CSV);
    const state = { ...emptyState(), sections: parsed.sections };
    state.albums.A.owned = parsed.owned;

    const csv = exportAlbumCsv(state, "A");
    const reparsed = parseAlbumCsv(csv);

    expect(reparsed.counts).toEqual(parsed.counts);
    expect(Object.keys(reparsed.owned).sort()).toEqual(Object.keys(parsed.owned).sort());
  });
});
