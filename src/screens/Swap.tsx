import { useMemo, useRef, useState } from "react";
import { useStore } from "../state";
import { ALBUM_IDS, stickerKey, type AlbumId, type Section } from "../types";
import { resolveLabel, splitLabel, type Sticker } from "../lib/parseLabel";
import { flagFor, nameFor } from "../data/flags";

export default function Swap() {
  const { state, hasData, isOwned, setOwned } = useStore();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Sticker | null>(null);
  const [claimed, setClaimed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { exact, suggestions } = useMemo(
    () => (hasData ? resolveLabel(query, state.sections) : { exact: null, suggestions: [] }),
    [query, state.sections, hasData],
  );

  // The sticker currently in focus: an explicit pick, else the parsed exact match.
  const current: Sticker | null = picked ?? exact;

  // Country-needs mode: query is a bare section code with no number typed yet.
  const countryNeeds = useMemo(() => {
    if (!hasData || picked) return null;
    const { alpha, num } = splitLabel(query);
    if (!alpha || num) return null;
    const sec = state.sections.find((s) => s.code.toLowerCase() === alpha);
    if (!sec) return null;
    const items = sec.slots
      .map((slot) => ({
        slot,
        needsA: !isOwned("A", sec.code, slot),
        needsB: !isOwned("B", sec.code, slot),
      }))
      .filter((x) => x.needsA || x.needsB);
    return { sec, items };
  }, [query, state.sections, hasData, picked, isOwned]);

  function choose(s: Sticker) {
    setPicked(s);
    setQuery(`${s.code}${s.slot === "00" ? "0" : s.slot}`);
  }

  function next() {
    setQuery("");
    setPicked(null);
    inputRef.current?.focus();
  }

  function claim(album: AlbumId, s: Sticker) {
    const key = stickerKey(s.code, s.slot);
    if (!isOwned(album, s.code, s.slot)) {
      setOwned(album, key, true);
      setClaimed((c) => c + 1);
    }
  }

  if (!hasData) {
    return <EmptyState />;
  }

  const neededBy = current
    ? ALBUM_IDS.filter((a) => !isOwned(a, current.code, current.slot))
    : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="sticky top-0 -mx-4 -mt-4 bg-slate-900/95 px-4 pt-4 pb-3 backdrop-blur">
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Type the sticker label (e.g. MEX8, FWC00)
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (exact) choose(exact);
                else if (suggestions[0]) choose(suggestions[0]);
              }
            }}
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="MEX8"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-lg uppercase tracking-wide outline-none focus:border-emerald-500"
          />
          <button
            onClick={next}
            className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold active:bg-slate-600"
          >
            Clear
          </button>
        </div>
        {claimed > 0 && (
          <p className="mt-2 text-xs text-emerald-400">{claimed} claimed this session</p>
        )}
      </div>

      {/* Country-needs panel: bare code typed, no number yet */}
      {!current && countryNeeds && (
        <CountryNeedsPanel
          sec={countryNeeds.sec}
          items={countryNeeds.items}
          albumNames={{ A: state.albums.A.name, B: state.albums.B.name }}
          onChoose={choose}
        />
      )}

      {/* Suggestions while typing and no concrete sticker chosen yet */}
      {!current && !countryNeeds && suggestions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {suggestions.map((s) => (
            <li key={stickerKey(s.code, s.slot)}>
              <button
                onClick={() => choose(s)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-left active:bg-slate-700"
              >
                <span className="text-2xl">{flagFor(s.code)}</span>
                <span className="font-semibold">
                  {s.code}
                  {s.slot === "00" ? "00" : s.slot}
                </span>
                <span className="text-slate-400">{nameFor(s.code)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <StickerCard sticker={current} neededBy={neededBy} onClaim={claim} onNext={next} />
      )}

      {query.trim() !== "" && !current && !countryNeeds && suggestions.length === 0 && (
        <p className="rounded-lg bg-slate-800/60 p-4 text-center text-slate-400">
          No sticker matches &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}

function StickerCard({
  sticker,
  neededBy,
  onClaim,
  onNext,
}: {
  sticker: Sticker;
  neededBy: AlbumId[];
  onClaim: (album: AlbumId, s: Sticker) => void;
  onNext: () => void;
}) {
  const { state, isOwned } = useStore();

  let verdict: { text: string; cls: string };
  if (neededBy.length === ALBUM_IDS.length) {
    verdict = { text: "NEEDED — keep it (both albums)", cls: "bg-emerald-600" };
  } else if (neededBy.length === 1) {
    verdict = {
      text: `NEEDED — ${state.albums[neededBy[0]].name} only`,
      cls: "bg-emerald-600",
    };
  } else {
    verdict = { text: "Not needed — you both have it", cls: "bg-slate-600" };
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <div className="flex items-center gap-4">
        <span className="text-5xl">{flagFor(sticker.code)}</span>
        <div>
          <div className="text-2xl font-bold">
            {sticker.code}
            {sticker.slot === "00" ? "00" : sticker.slot}
          </div>
          <div className="text-slate-400">{nameFor(sticker.code)}</div>
        </div>
      </div>

      <div className={`mt-4 rounded-xl px-4 py-2 text-center font-bold ${verdict.cls}`}>
        {verdict.text}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {ALBUM_IDS.map((album) => {
          const have = isOwned(album, sticker.code, sticker.slot);
          return (
            <button
              key={album}
              disabled={have}
              onClick={() => onClaim(album, sticker)}
              className={
                "flex flex-col items-center gap-1 rounded-xl px-3 py-4 text-center font-semibold transition " +
                (have
                  ? "cursor-default bg-slate-700 text-slate-400"
                  : "bg-emerald-600 text-white active:bg-emerald-500")
              }
            >
              <span className="text-sm opacity-80">{state.albums[album].name}</span>
              <span className="text-lg">{have ? "Have" : "+ Mark have"}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="mt-4 w-full rounded-xl bg-slate-700 py-3 font-semibold active:bg-slate-600"
      >
        Next sticker
      </button>
    </div>
  );
}

function CountryNeedsPanel({
  sec,
  items,
  albumNames,
  onChoose,
}: {
  sec: Section;
  items: { slot: string; needsA: boolean; needsB: boolean }[];
  albumNames: { A: string; B: string };
  onChoose: (s: Sticker) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{flagFor(sec.code)}</span>
          <div>
            <div className="font-bold text-lg">{sec.code}</div>
            <div className="text-slate-400 text-sm">{nameFor(sec.code)}</div>
          </div>
        </div>
        <p className="text-emerald-400 text-sm font-medium">Both albums complete for this section</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{flagFor(sec.code)}</span>
        <div>
          <div className="font-bold text-lg">{sec.code}</div>
          <div className="text-slate-400 text-sm">{nameFor(sec.code)}</div>
        </div>
        <span className="ml-auto text-slate-400 text-sm">{items.length} needed</span>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map(({ slot, needsA, needsB }) => {
          const label = `${sec.code}${slot === "00" ? "00" : slot}`;
          const tag = needsA && needsB ? "both" : needsA ? albumNames.A : albumNames.B;
          const tagCls =
            needsA && needsB
              ? "bg-emerald-700 text-emerald-100"
              : "bg-slate-600 text-slate-200";
          return (
            <li key={slot}>
              <button
                onClick={() => onChoose({ code: sec.code, slot })}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-700/40 px-3 py-2 text-left active:bg-slate-700"
              >
                <span className="font-semibold w-16">{label}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${tagCls}`}>{tag}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-400">
      <span className="text-5xl">📒</span>
      <h2 className="text-lg font-semibold text-slate-200">No albums loaded yet</h2>
      <p>Go to the &ldquo;Data&rdquo; tab and tap &ldquo;Start fresh&rdquo; or import a CSV.</p>
    </div>
  );
}
