export type AlbumId = "A" | "B";

/** One row of the album: a country or the special FWC section. */
export type Section = {
  code: string; // e.g. "MEX", "FWC"
  name: string; // e.g. "Mexico", "FIFA World Cup"
  flag: string; // emoji, e.g. "🇲🇽" or "🏆"
  slots: string[]; // e.g. ["1".."20"] or ["00","1".."19"]
};

/** Canonical sticker identifier: `${code}-${slot}` e.g. "MEX-8", "FWC-00". */
export type StickerKey = string;

export type AlbumState = {
  name: string;
  owned: Record<StickerKey, true>;
};

export type AppState = {
  schemaVersion: number;
  sections: Section[];
  albums: Record<AlbumId, AlbumState>;
  /** One shared spares list across both albums: stickerKey -> how many spares held. */
  duplicates: Record<StickerKey, number>;
};

export const ALBUM_IDS: AlbumId[] = ["A", "B"];

export function stickerKey(code: string, slot: string): StickerKey {
  return `${code}-${slot}`;
}
