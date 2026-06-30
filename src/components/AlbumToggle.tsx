import { useStore } from "../state";
import { ALBUM_IDS, type AlbumId } from "../types";

export default function AlbumToggle({
  album,
  onChange,
}: {
  album: AlbumId;
  onChange: (a: AlbumId) => void;
}) {
  const { state } = useStore();
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-800 p-1">
      {ALBUM_IDS.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={
            "rounded-lg py-2 text-sm font-semibold transition " +
            (album === id ? "bg-emerald-600 text-white" : "text-slate-300 active:bg-slate-700")
          }
        >
          {state.albums[id].name}
        </button>
      ))}
    </div>
  );
}
