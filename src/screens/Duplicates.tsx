import { useMemo, useState } from "react";
import { useStore } from "../state";
import { stickerKey } from "../types";
import { resolveLabel } from "../lib/parseLabel";

export default function Duplicates() {
  const { state, hasData, adjustDuplicate } = useStore();
  const [query, setQuery] = useState("");

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

  // Derive totals from section-valid slots only, so stray keys can't inflate counts.
  const totalSpares = groups.reduce((a, g) => a + g.items.reduce((x, i) => x + i.n, 0), 0);
  const distinct = groups.reduce((a, g) => a + g.items.length, 0);

  if (!hasData)
    return <p className="p-8 text-center text-slate-400">Import your albums in the “Data” tab first.</p>;

  function addOne() {
    const pick = exact ?? suggestions[0];
    if (pick) {
      adjustDuplicate(stickerKey(pick.code, pick.slot), 1);
      setQuery("");
    }
  }

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

      {groups.length === 0 && (
        <p className="rounded-xl bg-slate-800/60 p-6 text-center text-slate-400">
          No duplicates yet. Add spares above, or import a duplicates CSV in the “Data” tab.
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
