import { useMemo, useRef, useState } from "react";
import { useStore } from "../state";
import { stickerKey, type AlbumId } from "../types";
import { canonSlot, resolveLabel } from "../lib/parseLabel";

export default function Duplicates() {
  const { state, hasData, adjustDuplicate, setOwned } = useStore();
  const [query, setQuery] = useState("");
  const [activeAdd, setActiveAdd] = useState<string | null>(null);
  const [slotInput, setSlotInput] = useState("");
  const slotRef = useRef<HTMLInputElement>(null);
  const [showAudit, setShowAudit] = useState(false);

  const { exact, suggestions } = useMemo(
    () => (hasData ? resolveLabel(query, state.sections) : { exact: null, suggestions: [] }),
    [query, state.sections, hasData],
  );

  const groups = useMemo(() => {
    return state.sections
      .map((sec) => ({
        sec,
        items: sec.slots
          .map((slot) => ({ slot, n: state.duplicates[stickerKey(sec.code, slot)] ?? 0 }))
          .filter((x) => x.n > 0),
      }))
      .filter((g) => g.items.length > 0);
  }, [state.sections, state.duplicates]);

  const issues = useMemo(() => {
    const result: {
      key: string;
      flag: string;
      code: string;
      slot: string;
      missingA: boolean;
      missingB: boolean;
    }[] = [];
    for (const sec of state.sections) {
      for (const slot of sec.slots) {
        const key = stickerKey(sec.code, slot);
        if ((state.duplicates[key] ?? 0) === 0) continue;
        const missingA = !state.albums["A"].owned[key];
        const missingB = !state.albums["B"].owned[key];
        if (missingA || missingB) result.push({ key, flag: sec.flag, code: sec.code, slot, missingA, missingB });
      }
    }
    return result;
  }, [state.sections, state.duplicates, state.albums]);

  // Derive totals from section-valid slots only, so stray keys can't inflate counts.
  const totalSpares = groups.reduce((a, g) => a + g.items.reduce((x, i) => x + i.n, 0), 0);
  const distinct = groups.reduce((a, g) => a + g.items.length, 0);

  if (!hasData)
    return <p className="p-8 text-center text-slate-400">Import your albums in the "Data" tab first.</p>;

  function addOne() {
    const pick = exact ?? suggestions[0];
    if (pick) {
      adjustDuplicate(stickerKey(pick.code, pick.slot), 1);
      setQuery("");
    }
  }

  function openInlineAdd(code: string) {
    setActiveAdd(code);
    setSlotInput("");
    setTimeout(() => slotRef.current?.focus(), 0);
  }

  function submitInlineAdd(slots: string[], code: string) {
    const canon = canonSlot(slotInput);
    const real = slots.find((s) => canonSlot(s) === canon);
    if (real) {
      adjustDuplicate(stickerKey(code, real), 1);
      setSlotInput("");
      setTimeout(() => slotRef.current?.focus(), 0);
    }
  }

  function markOwned(key: string, album: AlbumId) {
    setOwned(album, key, true);
  }

  const albumName = (id: AlbumId) => state.albums[id].name || `Album ${id}`;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="rounded-xl bg-slate-800/70 px-4 py-2 text-sm">
        <span className="font-bold text-sky-400">{totalSpares}</span> spares ·{" "}
        <span className="font-bold text-sky-400">{distinct}</span> distinct stickers
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOne()}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Add a spare — type e.g. MEX8"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base uppercase outline-none focus:border-sky-500"
        />
        <button
          onClick={addOne}
          disabled={!exact && suggestions.length === 0}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-40 active:bg-sky-500"
        >
          + Add
        </button>
      </div>

      {/* Album audit */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50">
        <button
          onClick={() => setShowAudit((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold"
        >
          <span>Album check</span>
          {issues.length > 0 ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
              {issues.length}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-emerald-200">
              OK
            </span>
          )}
          <span className="ml-auto text-slate-500">{showAudit ? "▲" : "▼"}</span>
        </button>

        {showAudit && (
          <div className="border-t border-slate-700 px-4 py-3">
            {issues.length === 0 ? (
              <p className="text-sm text-slate-400">
                All spares are owned in both albums.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-400">
                  These stickers are in your spares list but not marked as owned in one or both albums.
                </p>
                {issues.map(({ key, flag, code, slot, missingA, missingB }) => (
                  <div
                    key={key}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2"
                  >
                    <span className="text-lg">{flag}</span>
                    <span className="font-bold tabular-nums">
                      {code}{slot}
                    </span>
                    <span className="text-xs text-amber-400">
                      missing from{" "}
                      {missingA && missingB
                        ? "both albums"
                        : missingA
                          ? albumName("A")
                          : albumName("B")}
                    </span>
                    <div className="ml-auto flex gap-1">
                      {missingA && (
                        <button
                          onClick={() => markOwned(key, "A")}
                          className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-bold text-white active:bg-emerald-600"
                        >
                          + {albumName("A")}
                        </button>
                      )}
                      {missingB && (
                        <button
                          onClick={() => markOwned(key, "B")}
                          className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-bold text-white active:bg-emerald-600"
                        >
                          + {albumName("B")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {groups.length === 0 && (
        <p className="rounded-xl bg-slate-800/60 p-6 text-center text-slate-400">
          No duplicates yet. Add spares above, or import a duplicates CSV in the "Data" tab.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {groups.map(({ sec, items }) => (
          <div key={sec.code} className="rounded-xl border border-slate-800 bg-slate-800/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{sec.flag}</span>
              <span className="font-bold">{sec.code}</span>
              <span className="text-sm text-slate-400">{sec.name}</span>
              <span className="ml-auto text-xs text-slate-500">
                {items.reduce((a, b) => a + b.n, 0)} spares
              </span>
              {activeAdd === sec.code ? (
                <>
                  <span className="text-xs font-bold text-slate-400">{sec.code}</span>
                  <input
                    ref={slotRef}
                    value={slotInput}
                    onChange={(e) => setSlotInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitInlineAdd(sec.slots, sec.code);
                      if (e.key === "Escape") setActiveAdd(null);
                    }}
                    placeholder="8"
                    className="w-12 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-sm outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => submitInlineAdd(sec.slots, sec.code)}
                    className="rounded-md bg-sky-600 px-2 py-1 text-xs font-bold text-white active:bg-sky-500"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setActiveAdd(null)}
                    className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300 active:bg-slate-600"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openInlineAdd(sec.code)}
                  className="rounded-lg bg-sky-600/20 px-2 py-1 text-xs font-bold text-sky-400 active:bg-sky-600/40"
                >
                  + Add
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map(({ slot, n }) => {
                const key = stickerKey(sec.code, slot);
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-2 py-1.5"
                  >
                    <button
                      onClick={() => adjustDuplicate(key, -1)}
                      className="h-8 w-8 rounded-md bg-slate-700 text-lg font-bold leading-none active:bg-slate-600"
                      aria-label="remove one"
                    >
                      −
                    </button>
                    <span className="min-w-12 text-center text-sm font-bold tabular-nums">
                      {sec.code}
                      {slot}
                      {n > 1 && <span className="ml-1 text-sky-400">×{n}</span>}
                    </span>
                    <button
                      onClick={() => adjustDuplicate(key, 1)}
                      className="h-8 w-8 rounded-md bg-sky-600 text-lg font-bold leading-none text-white active:bg-sky-500"
                      aria-label="add one"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
