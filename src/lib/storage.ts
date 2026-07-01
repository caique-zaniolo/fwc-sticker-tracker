import type { AppState, Section } from "../types";

const KEY = "fwc-tracker-v1";
const SCHEMA_VERSION = 1;

export function emptyState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    sections: [],
    albums: {
      A: { name: "Album A", owned: {} },
      B: { name: "Album B", owned: {} },
    },
    duplicates: {},
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== "object" || !parsed.albums) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failure — non-fatal; state stays in memory.
  }
}

/** Union two section lists by code, preserving order and merging slot lists. */
export function mergeSections(existing: Section[], incoming: Section[]): Section[] {
  const byCode = new Map<string, Section>();
  for (const s of existing) byCode.set(s.code, { ...s, slots: [...s.slots] });
  for (const s of incoming) {
    const cur = byCode.get(s.code);
    if (!cur) {
      byCode.set(s.code, { ...s, slots: [...s.slots] });
    } else {
      const seen = new Set(cur.slots);
      for (const slot of s.slots) if (!seen.has(slot)) cur.slots.push(slot);
      // Fill name/flag if the existing one was a bare fallback.
      if (cur.name === cur.code && s.name !== s.code) cur.name = s.name;
      if (cur.flag === "🏳️" && s.flag !== "🏳️") cur.flag = s.flag;
    }
  }
  // Keep incoming order primarily, then any extras from existing.
  const order = [...incoming.map((s) => s.code), ...existing.map((s) => s.code)];
  const out: Section[] = [];
  const added = new Set<string>();
  for (const code of order) {
    if (added.has(code)) continue;
    const sec = byCode.get(code);
    if (sec) {
      out.push(sec);
      added.add(code);
    }
  }
  return out;
}
