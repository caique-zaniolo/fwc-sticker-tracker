import { useState } from "react";
import { useStore } from "../state";
import { type AlbumId, stickerKey } from "../types";
import { albumCounts, sectionCounts } from "../lib/counts";
import AlbumToggle from "../components/AlbumToggle";

export default function AlbumGrid() {
  const { state, hasData, isOwned, toggleOwned } = useStore();
  const [album, setAlbum] = useState<AlbumId>("A");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  if (!hasData) return <Empty />;

  const totals = albumCounts(state, album);
  const allCollapsed = collapsed.size > 0 && collapsed.size === state.sections.length;

  function toggleSection(code: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    setCollapsed(allCollapsed ? new Set() : new Set(state.sections.map((sec) => sec.code)));
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <AlbumToggle album={album} onChange={setAlbum} />

      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl bg-slate-800/90 px-4 py-2 text-sm backdrop-blur">
        <span>
          <span className="font-bold text-emerald-400">{totals.have}</span> have ·{" "}
          <span className="font-bold text-amber-400">{totals.missing}</span> missing
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
            />
            Only missing
          </label>
          <button
            onClick={toggleAll}
            className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-600"
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex flex-col gap-3">
          {state.sections.map((sec) => {
            const sc = sectionCounts(sec, state.albums[album].owned);
            if (onlyMissing && sc.missing === 0) return null;
            const isCollapsed = collapsed.has(sec.code);
            return (
              <div key={sec.code} className="border-b border-slate-800/60 py-2">
                <button
                  onClick={() => toggleSection(sec.code)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
                    <span className="text-3xl leading-none">{sec.flag}</span>
                    <span className="text-xs font-bold tracking-wide">{sec.code}</span>
                  </div>
                  <span className="flex-1 truncate text-sm text-slate-300">{sec.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {sc.have}/{sc.total}
                  </span>
                  <span
                    className={
                      "shrink-0 pl-1 text-xs text-slate-500 transition-transform " +
                      (isCollapsed ? "" : "rotate-180")
                    }
                  >
                    ▾
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-2 flex items-start gap-2 pl-16">
                    <div className="grid flex-1 grid-cols-5 gap-1.5">
                      {sec.slots.map((slot) => {
                        const have = isOwned(album, sec.code, slot);
                        if (onlyMissing && have) return null;
                        return (
                          <button
                            key={slot}
                            onClick={() => toggleOwned(album, stickerKey(sec.code, slot))}
                            className={
                              "h-12 w-full rounded-lg text-base font-bold tabular-nums transition " +
                              (have
                                ? "bg-slate-800 text-slate-600"
                                : "bg-amber-400 text-slate-900 shadow-sm shadow-amber-400/30")
                            }
                            title={`${sec.code}${slot} — ${have ? "have" : "missing"}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="px-1 pb-2 text-center text-xs text-slate-500">
        Tap any sticker to toggle have / missing.
      </p>
    </div>
  );
}

function Empty() {
  return (
    <p className="p-8 text-center text-slate-400">Import your albums in the “Data” tab first.</p>
  );
}
