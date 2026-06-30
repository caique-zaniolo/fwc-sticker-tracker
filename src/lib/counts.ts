import type { AppState, AlbumId, Section } from "../types";
import { stickerKey } from "../types";

export type Counts = { have: number; missing: number; total: number };

export function totalSlots(sections: Section[]): number {
  return sections.reduce((n, s) => n + s.slots.length, 0);
}

export function sectionCounts(
  section: Section,
  owned: Record<string, true>,
): Counts {
  let have = 0;
  for (const slot of section.slots) {
    if (owned[stickerKey(section.code, slot)]) have++;
  }
  const total = section.slots.length;
  return { have, missing: total - have, total };
}

export function albumCounts(state: AppState, album: AlbumId): Counts {
  const owned = state.albums[album].owned;
  const total = totalSlots(state.sections);
  let have = 0;
  for (const sec of state.sections) {
    for (const slot of sec.slots) {
      if (owned[stickerKey(sec.code, slot)]) have++;
    }
  }
  return { have, missing: total - have, total };
}
