import { useMemo, useState } from "react";
import { useStore } from "../state";
import { type AlbumId } from "../types";
import { sectionCounts } from "../lib/counts";
import AlbumToggle from "../components/AlbumToggle";

export default function Missing() {
  const { state, hasData, isOwned } = useStore();
  const [album, setAlbum] = useState<AlbumId>("A");

  const groups = useMemo(() => {
    if (!hasData) return [];
    return state.sections
      .map((sec) => ({
        sec,
        missing: sec.slots.filter((slot) => !isOwned(album, sec.code, slot)),
      }))
      .filter((g) => g.missing.length > 0);
  }, [state.sections, album, hasData, isOwned]);

  if (!hasData)
    return <p className="p-8 text-center text-slate-400">Import your albums in the “Data” tab first.</p>;

  const totalMissing = groups.reduce((n, g) => n + g.missing.length, 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      <AlbumToggle album={album} onChange={setAlbum} />
      <p className="px-1 text-sm text-slate-400">
        <span className="font-bold text-amber-400">{totalMissing}</span> stickers still needed for{" "}
        {state.albums[album].name}.
      </p>

      {groups.length === 0 && (
        <p className="rounded-xl bg-emerald-600/20 p-6 text-center text-emerald-300">
          🎉 Album complete — nothing missing!
        </p>
      )}

      <div className="flex flex-col gap-2">
        {groups.map(({ sec, missing }) => {
          const sc = sectionCounts(sec, state.albums[album].owned);
          return (
            <div key={sec.code} className="rounded-xl border border-slate-800 bg-slate-800/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{sec.flag}</span>
                <span className="font-bold">{sec.code}</span>
                <span className="text-sm text-slate-400">{sec.name}</span>
                <span className="ml-auto text-xs text-slate-500">{sc.missing} missing</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((slot) => (
                  <span
                    key={slot}
                    className="rounded bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300 tabular-nums"
                  >
                    {sec.code}
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
