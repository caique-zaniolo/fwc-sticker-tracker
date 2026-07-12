import { useRef, useState } from "react";
import { useStore } from "../state";
import { ALBUM_IDS, type AlbumId, type AppState } from "../types";
import {
  parseAlbumCsv,
  exportAlbumCsv,
  exportStateJson,
  parseDuplicatesCsv,
  exportDuplicatesCsv,
  type ParsedAlbum,
} from "../lib/csv";
import { TEMPLATE_CSV } from "../lib/seed";
import { openPrintView } from "../lib/printMissing";
import { openDupesPrintView } from "../lib/printDupes";

function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function download(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { state, importAlbum, setDuplicates, renameAlbum, resetAlbum, replaceState } = useStore();

  function startFresh() {
    if (!confirm("Start fresh? This loads a blank album structure and clears all sticker data."))
      return;
    try {
      const parsed = parseAlbumCsv(TEMPLATE_CSV);
      importAlbum("A", parsed);
      importAlbum("B", parsed);
      setDuplicates({});
    } catch {
      alert("Could not load the album template.");
    }
  }

  function onDuplicatesFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseDuplicatesCsv(String(reader.result));
        setDuplicates(parsed.dupes);
        alert(`Imported ${parsed.total} spares (${parsed.distinct} distinct stickers).`);
      } catch {
        alert("That duplicates CSV could not be read.");
      }
    };
    reader.readAsText(file);
  }

  const [target, setTarget] = useState<AlbumId>("A");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedAlbum | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function doParse(raw: string) {
    setError(null);
    setPreview(null);
    try {
      const parsed = parseAlbumCsv(raw);
      setPreview(parsed);
      setText(raw);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse that CSV.");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => doParse(String(reader.result));
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!preview) return;
    importAlbum(target, preview);
    setPreview(null);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function onJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result)) as AppState;
        if (!obj.albums || !obj.sections) throw new Error("bad");
        replaceState(obj);
        alert("Backup restored.");
      } catch {
        alert("That JSON backup could not be read.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Get started */}
      <section className="rounded-2xl border border-emerald-700/50 bg-emerald-900/20 p-4">
        <h2 className="mb-3 text-base font-bold">Get started</h2>
        <div className="mb-3 flex flex-col gap-2">
          {ALBUM_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <span className="w-16 text-sm text-slate-400">Album {id}</span>
              <input
                value={state.albums[id].name}
                onChange={(e) => renameAlbum(id, e.target.value)}
                placeholder={`Album ${id}`}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={startFresh}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white active:bg-emerald-500"
        >
          Start fresh (blank albums)
        </button>
      </section>

      {/* Back up */}
      <section className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-base font-bold">Backup</h2>
        <p className="mb-3 text-sm text-slate-400">
          Save your stickers from both albums as a backup file (JSON format). You can use this file to restore your stickers on any device if you lose your data.
        </p>
        <p className="mb-3 text-sm text-slate-500">
          Filename: fwc-tracker-backup-{todayStamp()}.json
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() =>
              download(
                `fwc-tracker-backup-${todayStamp()}.json`,
                exportStateJson(state),
                "application/json",
              )
            }
            className="w-full rounded-lg bg-blue-600 py-2.5 mt-2 font-semibold text-white active:bg-blue-300"
          >
            Export full backup (JSON)
          </button>
          <label className="rounded-lg bg-blue-500 py-2 text-center text-sm mt-2 font-semibold active:bg-blue-300">
            Restore JSON backup
            <input type="file" accept=".json,application/json" onChange={onJsonFile} className="hidden" />
          </label>
        </div>
      </section>
      
      {/* Import album CSV */}
      <section className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-base font-bold">Import album CSV</h2>

        <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1">
          {ALBUM_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setTarget(id)}
              className={
                "rounded-lg py-2 text-sm font-semibold " +
                (target === id ? "bg-emerald-900 text-white" : "text-slate-300")
              }
            >
              Into {state.albums[id].name}
            </button>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="mb-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="...or paste CSV text here"
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 font-mono text-xs outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => doParse(text)}
          disabled={!text.trim()}
          className="mt-2 w-full rounded-lg bg-slate-700 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Preview pasted CSV
        </button>

        {error && <p className="mt-3 rounded-lg bg-red-500/20 p-2 text-sm text-red-300">{error}</p>}

        {preview && (
          <div className="mt-3 rounded-lg bg-slate-900 p-3 text-sm">
            <p className="mb-2 font-semibold text-emerald-400">Preview</p>
            <p>{preview.sections.length} sections</p>
            <p>
              <span className="font-bold text-emerald-400">{preview.counts.have}</span> have &middot;{" "}
              <span className="font-bold text-amber-400">{preview.counts.missing}</span> missing &middot;{" "}
              {preview.counts.total} total
            </p>
            <button
              onClick={confirmImport}
              className="mt-3 w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white active:bg-emerald-500"
            >
              Import into {state.albums[target].name} (replaces its data)
            </button>
          </div>
        )}
      </section>

      {/* Duplicates import */}
      <section className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
        <h2 className="mb-1 text-base font-bold">Import duplicates CSV</h2>
        <p className="mb-3 text-sm text-slate-400">
          One shared spares list for both albums. Cells: empty = none, &ldquo;X&rdquo; = 1 spare, a number =
          that many. Replaces the current duplicates list.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onDuplicatesFile}
          className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
        />
      </section>
      
      {/* Export */}
      <section className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-base font-bold">Export</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => openPrintView(state)}
            className="rounded-lg bg-slate-600 py-2 text-sm mt-2 font-semibold active:bg-slate-500"
          >
            Print missing stickers (PDF)
          </button>
          <button
            onClick={() => openDupesPrintView(state)}
            className="rounded-lg bg-slate-600 py-2 text-sm mt-2 font-semibold active:bg-slate-500"
          >
            Print duplicates list (PDF)
          </button>
          {ALBUM_IDS.map((id) => (
            <button
              key={id}
              onClick={() =>
                download(
                  `${state.albums[id].name.toLowerCase()}.csv`,
                  exportAlbumCsv(state, id),
                  "text/csv",
                )
              }
              className="rounded-lg bg-slate-700 py-2 text-sm mt-2 font-semibold active:bg-slate-600"
            >
              Export {state.albums[id].name} CSV
            </button>
          ))}
          <button
            onClick={() => download("duplicates.csv", exportDuplicatesCsv(state), "text/csv")}
            className="rounded-lg bg-slate-700 py-2 text-sm mt-2 font-semibold active:bg-slate-600"
          >
            Export duplicates CSV
          </button>
          </div>
      </section>

      {/* Reset albums */}
      <section className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-base font-bold">Reset sticker data</h2>
        <div className="flex flex-col gap-2">
          {ALBUM_IDS.map((id) => (
            <button
              key={id}
              onClick={() => {
                if (confirm(`Clear all sticker data for ${state.albums[id].name}?`)) resetAlbum(id);
              }}
              className="rounded-lg bg-red-600/80 py-2 text-sm mt-2 font-semibold active:bg-red-600"
            >
              Reset {state.albums[id].name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
