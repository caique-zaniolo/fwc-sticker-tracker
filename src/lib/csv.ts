import type { AppState, AlbumId, Section, StickerKey } from "../types";
import { stickerKey } from "../types";
import { flagFor, nameFor } from "../data/flags";
import { canonSlot } from "./parseLabel";

export type ParsedAlbum = {
  sections: Section[];
  owned: Record<StickerKey, true>;
  counts: { have: number; missing: number; total: number };
};

function stripBom(s: string): string {
  return s.replace(/^﻿/, "");
}

/** Minimal CSV line splitter (handles simple quoted fields; our data has none). */
function splitLine(line: string): string[] {
  if (!line.includes('"')) return line.split(",");
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * Parse one album's wide-grid CSV.
 *
 * Format (matches the user's printed spreadsheet export):
 *   - Row 1 (header): first cell is a label like "Sticker"/"Stickers" (ignored);
 *     remaining cells are section codes (MEX, RSA, ..., FWC).
 *   - Each later row: first cell is the sticker number (0..20); a "0" row maps to
 *     slot "00" (the FWC zero sticker).
 *   - Cell semantics:
 *       "X"/"x"  -> OWNED (you have it)
 *       non-empty other (e.g. "MEX8") -> MISSING / NEEDED
 *       empty    -> that slot does not exist in this section
 */
export function parseAlbumCsv(text: string): ParsedAlbum {
  const lines = stripBom(text)
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("CSV looks empty — need a header row plus sticker rows.");

  const header = splitLine(lines[0]);
  const codes = header.slice(1).map((c) => c.trim()).filter((c) => c !== "");
  if (codes.length === 0) throw new Error("No section codes found in the header row.");

  // Collect slots (in row order) and owned flags per section.
  const slotsByCode = new Map<string, string[]>();
  const owned: Record<StickerKey, true> = {};
  let have = 0;
  let missing = 0;

  for (const code of codes) slotsByCode.set(code, []);

  for (let r = 1; r < lines.length; r++) {
    const cells = splitLine(lines[r]);
    const numRaw = (cells[0] ?? "").trim();
    if (numRaw === "") continue;
    const slot = numRaw === "0" ? "00" : canonSlot(numRaw);

    for (let c = 0; c < codes.length; c++) {
      const code = codes[c];
      const v = (cells[c + 1] ?? "").trim();
      if (v === "") continue; // slot absent for this section
      slotsByCode.get(code)!.push(slot);
      if (v.toUpperCase() === "X") {
        owned[stickerKey(code, slot)] = true;
        have++;
      } else {
        missing++;
      }
    }
  }

  const sections: Section[] = codes.map((code) => ({
    code,
    name: nameFor(code),
    flag: flagFor(code),
    slots: slotsByCode.get(code) ?? [],
  }));

  return { sections, owned, counts: { have, missing, total: have + missing } };
}

/** Export one album back to the same wide-grid CSV shape (round-trips owned state). */
export function exportAlbumCsv(state: AppState, album: AlbumId): string {
  const { sections } = state;
  const owned = state.albums[album].owned;

  // Determine the union of slot rows across all sections, ordered numerically with "00" first.
  const slotOrder = new Map<string, number>();
  for (const sec of sections) {
    for (const s of sec.slots) {
      const ord = s === "00" ? -1 : parseInt(s, 10);
      slotOrder.set(s, ord);
    }
  }
  const rows = [...slotOrder.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);

  const lines: string[] = [];
  lines.push(["Sticker", ...sections.map((s) => s.code)].join(","));
  for (const slot of rows) {
    const rowLabel = slot === "00" ? "0" : slot;
    const cells = [rowLabel];
    for (const sec of sections) {
      if (!sec.slots.includes(slot)) {
        cells.push("");
      } else if (owned[stickerKey(sec.code, slot)]) {
        cells.push("X");
      } else {
        cells.push(`${sec.code}${slot === "00" ? "0" : slot}`);
      }
    }
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

export type ParsedDuplicates = {
  dupes: Record<StickerKey, number>;
  total: number;
  distinct: number;
};

/**
 * Parse the shared duplicates grid (same wide layout as albums).
 * Cell meaning: empty -> none; "X"/"x" -> 1 spare; a number -> that many spares.
 */
export function parseDuplicatesCsv(text: string): ParsedDuplicates {
  const lines = stripBom(text)
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("Duplicates CSV looks empty.");

  const header = splitLine(lines[0]);
  const codes = header.slice(1).map((c) => c.trim());

  const dupes: Record<StickerKey, number> = {};
  let total = 0;
  let distinct = 0;

  for (let r = 1; r < lines.length; r++) {
    const cells = splitLine(lines[r]);
    const numRaw = (cells[0] ?? "").trim();
    if (numRaw === "") continue;
    const slot = numRaw === "0" ? "00" : canonSlot(numRaw);
    for (let c = 0; c < codes.length; c++) {
      const code = codes[c];
      if (!code) continue;
      const v = (cells[c + 1] ?? "").trim();
      if (v === "") continue;
      const n = v.toUpperCase() === "X" ? 1 : parseInt(v, 10);
      if (!Number.isFinite(n) || n <= 0) continue;
      dupes[stickerKey(code, slot)] = n;
      total += n;
      distinct++;
    }
  }
  return { dupes, total, distinct };
}

export type ParsedSparesMessage = ParsedDuplicates;

/**
 * Parse the freeform "spares" share message (the same text the Swap tab's
 * "Copy my spares list" produces) as an alternative to the CSV grid:
 *
 *   Figurinhas Repetidas
 *   --------------------
 *   MEX 🇲🇽: 2, 8, 12
 *   FWC 🏆: 00, 11, 13
 *
 * Only lines shaped like "CODE <anything>: slot, slot, ..." are read (the
 * title/divider lines and the flag are ignored); each listed slot counts as
 * one spare, and a slot repeated on the same line adds another.
 */
export function parseSparesMessage(text: string, sections: Section[]): ParsedSparesMessage {
  const dupes: Record<StickerKey, number> = {};
  let total = 0;
  let distinct = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^([A-Z]{2,4})\b[^:]*:\s*(.+)$/);
    if (!m) continue;
    const sec = sections.find((s) => s.code === m[1]);
    if (!sec) continue;
    for (const token of m[2].split(",").map((t) => t.trim()).filter(Boolean)) {
      const realSlot = sec.slots.find((s) => canonSlot(s) === canonSlot(token));
      if (!realSlot) continue;
      const key = stickerKey(sec.code, realSlot);
      if (dupes[key] === undefined) distinct++;
      dupes[key] = (dupes[key] ?? 0) + 1;
      total++;
    }
  }

  if (distinct === 0) throw new Error("No recognizable spares found in that text.");
  return { dupes, total, distinct };
}

/** Export the shared duplicates list back to the same wide-grid CSV shape. */
export function exportDuplicatesCsv(state: AppState): string {
  const { sections, duplicates } = state;
  const slotOrder = new Map<string, number>();
  for (const sec of sections) {
    for (const s of sec.slots) slotOrder.set(s, s === "00" ? -1 : parseInt(s, 10));
  }
  const rows = [...slotOrder.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);

  const lines: string[] = [];
  lines.push(["Sticker", ...sections.map((s) => s.code)].join(","));
  for (const slot of rows) {
    const cells = [slot === "00" ? "0" : slot];
    for (const sec of sections) {
      const n = duplicates[stickerKey(sec.code, slot)] ?? 0;
      cells.push(!sec.slots.includes(slot) || n <= 0 ? "" : n === 1 ? "X" : String(n));
    }
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

export function exportStateJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}
