import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState, AlbumId, StickerKey } from "./types";
import { stickerKey } from "./types";
import { emptyState, loadState, saveState } from "./lib/storage";
import type { ParsedAlbum } from "./lib/csv";

type Store = {
  state: AppState;
  hasData: boolean;
  isOwned: (album: AlbumId, code: string, slot: string) => boolean;
  setOwned: (album: AlbumId, key: StickerKey, owned: boolean) => void;
  toggleOwned: (album: AlbumId, key: StickerKey) => void;
  importAlbum: (album: AlbumId, parsed: ParsedAlbum) => void;
  adjustDuplicate: (key: StickerKey, delta: number) => void;
  setDuplicates: (dupes: Record<StickerKey, number>) => void;
  renameAlbum: (album: AlbumId, name: string) => void;
  resetAlbum: (album: AlbumId) => void;
  replaceState: (next: AppState) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  const isOwned = useCallback(
    (album: AlbumId, code: string, slot: string) =>
      !!state.albums[album].owned[stickerKey(code, slot)],
    [state],
  );

  const setOwned = useCallback((album: AlbumId, key: StickerKey, owned: boolean) => {
    setState((s) => {
      const next = { ...s.albums[album].owned };
      if (owned) next[key] = true;
      else delete next[key];
      return { ...s, albums: { ...s.albums, [album]: { ...s.albums[album], owned: next } } };
    });
  }, []);

  const toggleOwned = useCallback((album: AlbumId, key: StickerKey) => {
    setState((s) => {
      const next = { ...s.albums[album].owned };
      if (next[key]) delete next[key];
      else next[key] = true;
      return { ...s, albums: { ...s.albums, [album]: { ...s.albums[album], owned: next } } };
    });
  }, []);

  const importAlbum = useCallback((album: AlbumId, parsed: ParsedAlbum) => {
    // Both albums share one structure, so the latest import defines the section
    // list outright (this also drops any stale slots from earlier imports).
    setState((s) => ({
      ...s,
      sections: parsed.sections,
      albums: {
        ...s.albums,
        [album]: { ...s.albums[album], owned: { ...parsed.owned } },
      },
    }));
  }, []);

  const adjustDuplicate = useCallback((key: StickerKey, delta: number) => {
    setState((s) => {
      const next = { ...s.duplicates };
      const n = (next[key] ?? 0) + delta;
      if (n <= 0) delete next[key];
      else next[key] = n;
      return { ...s, duplicates: next };
    });
  }, []);

  const setDuplicates = useCallback((dupes: Record<StickerKey, number>) => {
    setState((s) => ({ ...s, duplicates: { ...dupes } }));
  }, []);

  const renameAlbum = useCallback((album: AlbumId, name: string) => {
    setState((s) => ({
      ...s,
      albums: { ...s.albums, [album]: { ...s.albums[album], name } },
    }));
  }, []);

  const resetAlbum = useCallback((album: AlbumId) => {
    setState((s) => ({
      ...s,
      albums: { ...s.albums, [album]: { ...s.albums[album], owned: {} } },
    }));
  }, []);

  const replaceState = useCallback((next: AppState) => {
    setState({ ...emptyState(), ...next });
  }, []);

  const value = useMemo<Store>(
    () => ({
      state,
      hasData: state.sections.length > 0,
      isOwned,
      setOwned,
      toggleOwned,
      importAlbum,
      adjustDuplicate,
      setDuplicates,
      renameAlbum,
      resetAlbum,
      replaceState,
    }),
    [
      state,
      isOwned,
      setOwned,
      toggleOwned,
      importAlbum,
      adjustDuplicate,
      setDuplicates,
      renameAlbum,
      resetAlbum,
      replaceState,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
