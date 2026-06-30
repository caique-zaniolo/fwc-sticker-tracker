import { useState } from "react";
import { StoreProvider } from "./state";
import Swap from "./screens/Swap";
import AlbumGrid from "./screens/AlbumGrid";
import Missing from "./screens/Missing";
import Duplicates from "./screens/Duplicates";
import Settings from "./screens/Settings";

type Tab = "swap" | "albums" | "missing" | "dupes" | "data";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "swap", label: "Swap", icon: "🔄" },
  { id: "albums", label: "Albums", icon: "📒" },
  { id: "missing", label: "Missing", icon: "🔎" },
  { id: "dupes", label: "Dupes", icon: "🃏" },
  { id: "data", label: "Data", icon: "⚙️" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("swap");

  return (
    <StoreProvider>
      <div className="mx-auto flex h-full max-w-screen-sm flex-col">
        <header className="safe-top flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
          <span className="text-xl">⚽</span>
          <h1 className="text-base font-bold">FWC Sticker Tracker</h1>
        </header>

        <main className="flex-1 overflow-y-auto pb-2">
          {tab === "swap" && <Swap />}
          {tab === "albums" && <AlbumGrid />}
          {tab === "missing" && <Missing />}
          {tab === "dupes" && <Duplicates />}
          {tab === "data" && <Settings />}
        </main>

        <nav className="safe-bottom grid grid-cols-5 border-t border-slate-800 bg-slate-900">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition " +
                (tab === t.id ? "text-emerald-400" : "text-slate-400 active:text-slate-200")
              }
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </StoreProvider>
  );
}
