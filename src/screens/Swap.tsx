import { useMemo, useRef, useState } from "react";
import { useStore } from "../state";
import { ALBUM_IDS, stickerKey, type AlbumId, type Section } from "../types";
import { canonSlot, resolveLabel, splitLabel, type Sticker } from "../lib/parseLabel";
import { flagFor, nameFor } from "../data/flags";

type Mode = "lookup" | "share" | "offer" | "receive";

export default function Swap() {
  const { state, hasData, isOwned, setOwned, adjustDuplicate } = useStore();
  const [mode, setMode] = useState<Mode>("lookup");

  // Lookup state
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Sticker | null>(null);
  const [claimed, setClaimed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Share state
  const [shareAlbum, setShareAlbum] = useState<AlbumId | "both">("A");
  const [copied, setCopied] = useState(false);

  // Offer state
  const [offerText, setOfferText] = useState("");

  // Receive state
  const [receiveText, setReceiveText] = useState("");

  // ── Lookup ──────────────────────────────────────────────────────────────────

  const { exact, suggestions } = useMemo(
    () =>
      hasData && mode === "lookup"
        ? resolveLabel(query, state.sections)
        : { exact: null, suggestions: [] },
    [query, state.sections, hasData, mode],
  );

  const current: Sticker | null = picked ?? exact;

  const matchedSections = useMemo(() => {
    if (!hasData || picked || mode !== "lookup") return [];
    const { alpha, num } = splitLabel(query);
    if (num) return [];
    return state.sections
      .filter((sec) => !alpha || sec.code.toLowerCase().startsWith(alpha))
      .map((sec) => {
        const items = sec.slots
          .map((slot) => ({
            slot,
            needsA: !isOwned("A", sec.code, slot),
            needsB: !isOwned("B", sec.code, slot),
          }))
          .filter((x) => x.needsA || x.needsB);
        return { sec, items };
      });
  }, [query, state.sections, hasData, picked, isOwned, mode]);

  const countryNeedsList = useMemo(() => {
    const { alpha } = splitLabel(query);
    return alpha ? matchedSections : matchedSections.filter((g) => g.items.length > 0);
  }, [matchedSections, query]);

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

  // ── Share ───────────────────────────────────────────────────────────────────

  const shareMessage = useMemo(() => {
    if (!hasData) return "";
    const groups = state.sections
      .map((sec) => {
        const slots: string[] = [];
        for (const slot of sec.slots) {
          if (shareAlbum === "both") {
            if (!isOwned("A", sec.code, slot)) slots.push(slot);
            if (!isOwned("B", sec.code, slot)) slots.push(slot);
          } else {
            if (!isOwned(shareAlbum, sec.code, slot)) slots.push(slot);
          }
        }
        return { sec, missing: slots };
      })
      .filter((g) => g.missing.length > 0);
    const lines = groups.map(({ sec, missing }) => `${sec.code} ${sec.flag}: ${missing.join(", ")}`);
    return ["Figurinhas Faltantes", "--------------------", ...lines].join("\n");
  }, [state.sections, shareAlbum, hasData, isOwned]);

  function copyMessage() {
    navigator.clipboard.writeText(shareMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Offer ───────────────────────────────────────────────────────────────────

  const offerResults = useMemo(() => {
    if (!offerText.trim() || !hasData) return null;
    const byCode: Record<string, string[]> = {};
    for (const line of offerText.split("\n")) {
      // Match lines like: CODE [optional flag/text]: slot1, slot2, ...
      const m = line.match(/^([A-Z]{2,4})\b[^:]*:\s*(.+)$/);
      if (!m) continue;
      const rawSlots = m[2].split(",").map((s) => s.trim()).filter(Boolean);
      if (rawSlots.length > 0) byCode[m[1]] = rawSlots;
    }
    return Object.entries(byCode).flatMap(([code, rawSlots]) => {
      const sec = state.sections.find((s) => s.code === code);
      if (!sec) return [];
      const canOffer: { slot: string; count: number }[] = [];
      const cantOffer: string[] = [];
      for (const raw of rawSlots) {
        const realSlot = sec.slots.find((s) => canonSlot(s) === canonSlot(raw));
        if (!realSlot) continue;
        const n = state.duplicates[stickerKey(code, realSlot)] ?? 0;
        if (n > 0) canOffer.push({ slot: realSlot, count: n });
        else cantOffer.push(realSlot);
      }
      if (canOffer.length === 0 && cantOffer.length === 0) return [];
      return [{ sec, canOffer, cantOffer }];
    });
  }, [offerText, state.sections, state.duplicates, hasData]);

  const totalCanOffer = offerResults?.reduce((n, g) => n + g.canOffer.length, 0) ?? 0;

  const sparesMessage = useMemo(() => {
    if (!hasData) return "";
    const groups = state.sections
      .map((sec) => ({
        sec,
        slots: sec.slots.filter((slot) => (state.duplicates[stickerKey(sec.code, slot)] ?? 0) > 0),
      }))
      .filter((g) => g.slots.length > 0);
    const lines = groups.map(({ sec, slots }) => `${sec.code} ${sec.flag}: ${slots.join(", ")}`);
    return ["Figurinhas Repetidas", "--------------------", ...lines].join("\n");
  }, [state.sections, state.duplicates, hasData]);

  const [copiedSpares, setCopiedSpares] = useState(false);
  function copySpares() {
    navigator.clipboard.writeText(sparesMessage).then(() => {
      setCopiedSpares(true);
      setTimeout(() => setCopiedSpares(false), 2000);
    });
  }

  // ── Receive ─────────────────────────────────────────────────────────────────

  const receiveResults = useMemo(() => {
    if (!receiveText.trim() || !hasData) return null;
    const byCode: Record<string, string[]> = {};
    for (const line of receiveText.split("\n")) {
      const m = line.match(/^([A-Z]{2,4})\b[^:]*:\s*(.+)$/);
      if (!m) continue;
      const rawSlots = m[2].split(",").map((s) => s.trim()).filter(Boolean);
      if (rawSlots.length > 0) byCode[m[1]] = rawSlots;
    }
    return Object.entries(byCode).flatMap(([code, rawSlots]) => {
      const sec = state.sections.find((s) => s.code === code);
      if (!sec) return [];
      const needed: { slot: string; needsA: boolean; needsB: boolean }[] = [];
      for (const raw of rawSlots) {
        const realSlot = sec.slots.find((s) => canonSlot(s) === canonSlot(raw));
        if (!realSlot) continue;
        const needsA = !isOwned("A", code, realSlot);
        const needsB = !isOwned("B", code, realSlot);
        if (needsA || needsB) needed.push({ slot: realSlot, needsA, needsB });
      }
      if (needed.length === 0) return [];
      return [{ sec, needed }];
    });
  }, [receiveText, state.sections, hasData, isOwned]);

  const totalReceive = receiveResults?.reduce((n, g) => n + g.needed.length, 0) ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!hasData) return <EmptyState />;

  const neededBy = current
    ? ALBUM_IDS.filter((a) => !isOwned(a, current.code, current.slot))
    : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mode tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-800 p-1">
        {(["lookup", "share", "offer", "receive"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "rounded-lg py-2 text-xs font-semibold transition " +
              (mode === m ? "bg-sky-600 text-white" : "text-slate-300 active:bg-slate-700")
            }
          >
            {m === "lookup"
              ? "Look up"
              : m === "share"
                ? "Share"
                : m === "offer"
                  ? "Can offer"
                  : "Their spares"}
          </button>
        ))}
      </div>

      {/* ── Look up ── */}
      {mode === "lookup" && (
        <>
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

          {!current && countryNeedsList.length > 0 && (
            <div className="flex flex-col gap-4">
              {countryNeedsList.map(({ sec, items }) => (
                <CountryNeedsPanel
                  key={sec.code}
                  sec={sec}
                  items={items}
                  albumNames={{ A: state.albums.A.name, B: state.albums.B.name }}
                  onChoose={choose}
                />
              ))}
            </div>
          )}

          {!current && countryNeedsList.length === 0 && suggestions.length > 0 && (
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

          {query.trim() !== "" &&
            !current &&
            countryNeedsList.length === 0 &&
            suggestions.length === 0 && (
            <p className="rounded-lg bg-slate-800/60 p-4 text-center text-slate-400">
              No sticker matches &ldquo;{query}&rdquo;.
            </p>
          )}
        </>
      )}

      {/* ── Share missing ── */}
      {mode === "share" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-800 p-1">
            {(["A", "B", "both"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setShareAlbum(opt)}
                className={
                  "rounded-lg py-2 text-xs font-semibold transition " +
                  (shareAlbum === opt ? "bg-emerald-600 text-white" : "text-slate-300 active:bg-slate-700")
                }
              >
                {opt === "both" ? "Both" : state.albums[opt].name}
              </button>
            ))}
          </div>
          <button
            onClick={copyMessage}
            className={
              "rounded-xl px-4 py-3 font-bold transition " +
              (copied
                ? "bg-emerald-700 text-emerald-200"
                : "bg-sky-600 text-white active:bg-sky-500")
            }
          >
            {copied ? "Copied!" : "Copy message"}
          </button>
          <textarea
            readOnly
            value={shareMessage}
            rows={16}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 font-mono text-xs text-slate-300 outline-none"
          />
        </div>
      )}

      {/* ── Can I offer? ── */}
      {mode === "offer" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={copySpares}
            className={
              "rounded-xl px-4 py-3 font-bold transition " +
              (copiedSpares
                ? "bg-emerald-700 text-emerald-200"
                : "bg-sky-600 text-white active:bg-sky-500")
            }
          >
            {copiedSpares ? "Copied!" : "Copy my spares list"}
          </button>
          <textarea
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            rows={6}
            placeholder={"Paste a friend's missing list here…\n\nFWC 🏆: 1, 3, 5\nMEX 🇲🇽: 2, 8, 12"}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-500"
          />

          {offerResults === null && (
            <p className="text-center text-sm text-slate-500">
              Paste a "Figurinhas Faltantes" message above to see what you can offer.
            </p>
          )}

          {offerResults !== null && (
            <>
              <div className="rounded-xl bg-slate-800/70 px-4 py-2 text-sm">
                {totalCanOffer > 0 ? (
                  <>
                    <span className="font-bold text-emerald-400">{totalCanOffer}</span>
                    <span className="text-slate-300"> stickers you can offer</span>
                  </>
                ) : (
                  <span className="text-slate-400">No spares match their missing list.</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {offerResults.map(({ sec, canOffer, cantOffer }) => (
                  <div
                    key={sec.code}
                    className="rounded-xl border border-slate-800 bg-slate-800/50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{sec.flag}</span>
                      <span className="font-bold">{sec.code}</span>
                      <span className="text-sm text-slate-400">{sec.name}</span>
                      {canOffer.length > 0 && (
                        <span className="ml-auto rounded-full bg-emerald-700/50 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          {canOffer.length} can offer
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canOffer.map(({ slot, count }) => (
                        <button
                          key={slot}
                          onClick={() => adjustDuplicate(stickerKey(sec.code, slot), -1)}
                          className="group flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600/25 py-2 pl-3 pr-2 text-sm font-semibold text-emerald-300 tabular-nums active:bg-emerald-600/40"
                          aria-label={`remove ${sec.code}${slot} from spares`}
                          title="Remove from spares"
                        >
                          {sec.code}{slot}
                          {count > 1 && <span className="opacity-70">×{count}</span>}
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/80 text-base leading-none text-white group-active:bg-red-500">
                            −
                          </span>
                        </button>
                      ))}
                      {cantOffer.map((slot) => (
                        <span
                          key={slot}
                          className="flex min-h-11 items-center rounded-lg bg-slate-700/50 px-3 text-sm font-semibold text-slate-500 tabular-nums"
                        >
                          {sec.code}{slot}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Their spares ── */}
      {mode === "receive" && (
        <div className="flex flex-col gap-3">
          <textarea
            value={receiveText}
            onChange={(e) => setReceiveText(e.target.value)}
            rows={6}
            placeholder={"Paste a friend's spares list here…\n\nFWC 🏆: 3, 7, 12\nMEX 🇲🇽: 5, 9, 14"}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-500"
          />

          {receiveResults === null && (
            <p className="text-center text-sm text-slate-500">
              Paste a "Figurinhas Repetidas" message above to see what you need from them.
            </p>
          )}

          {receiveResults !== null && (
            <>
              <div className="rounded-xl bg-slate-800/70 px-4 py-2 text-sm">
                {totalReceive > 0 ? (
                  <>
                    <span className="font-bold text-emerald-400">{totalReceive}</span>
                    <span className="text-slate-300"> stickers you can request</span>
                  </>
                ) : (
                  <span className="text-slate-400">Nothing from their spares matches what you need.</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {receiveResults.map(({ sec, needed }) => (
                  <div
                    key={sec.code}
                    className="rounded-xl border border-slate-800 bg-slate-800/50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{sec.flag}</span>
                      <span className="font-bold">{sec.code}</span>
                      <span className="text-sm text-slate-400">{sec.name}</span>
                      <span className="ml-auto rounded-full bg-sky-700/50 px-2 py-0.5 text-xs font-bold text-sky-300">
                        {needed.length} needed
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {needed.map(({ slot, needsA, needsB }) => {
                        const tag =
                          needsA && needsB
                            ? "both"
                            : needsA
                              ? state.albums["A"].name
                              : state.albums["B"].name;
                        return (
                          <span
                            key={slot}
                            className="flex items-center gap-1 rounded bg-sky-600/20 px-2 py-1 text-xs font-semibold text-sky-300 tabular-nums"
                          >
                            {sec.code}{slot}
                            <span className="opacity-60">·{tag}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
  const dupes = state.duplicates[stickerKey(sticker.code, sticker.slot)] ?? 0;

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

      <div className={`mt-2 rounded-xl px-4 py-2 text-center text-sm font-semibold ${dupes > 0 ? "bg-amber-500/20 text-amber-300" : "bg-slate-700/50 text-slate-400"}`}>
        {dupes > 0 ? `You have ${dupes} spare${dupes > 1 ? "s" : ""} — can offer` : "No spares"}
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
