import type { Section } from "../types";

export type Sticker = { code: string; slot: string };

/** Canonicalize a slot/number token so "8","08" -> "8" and "0","00" -> "00". */
export function canonSlot(token: string): string {
  const t = token.trim();
  if (t === "") return "";
  if (/^0+$/.test(t)) return "00";
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? t : String(n);
}

/** Split raw user input into an alpha (code/name) part and a numeric (slot) part. */
export function splitLabel(raw: string): { alpha: string; num: string } {
  const s = raw.trim();
  // Letters (incl. accented) for the code/name, trailing digits for the slot.
  const m = s.match(/^([\p{L}\s.&'’-]*?)\s*0*(\d+)?\s*$/u);
  if (!m) return { alpha: s.toLowerCase(), num: "" };
  // Trim surrounding whitespace and separator punctuation from the alpha part.
  const alpha = (m[1] || "")
    .toLowerCase()
    .replace(/^[\s.&'’-]+|[\s.&'’-]+$/g, "");
  const num = m[2] ?? "";
  // Re-extract num including a possible leading-zero "00" the regex stripped.
  const numMatch = s.match(/(\d+)\s*$/);
  return { alpha, num: numMatch ? numMatch[1] : num };
}

function slotExists(section: Section, slot: string): boolean {
  return section.slots.some((s) => canonSlot(s) === canonSlot(slot));
}

function realSlot(section: Section, slot: string): string | null {
  const found = section.slots.find((s) => canonSlot(s) === canonSlot(slot));
  return found ?? null;
}

/**
 * Resolve free-typed input (e.g. "MEX8", "mex 8", "brazil 3", "fwc00") against the
 * album sections. Returns an exact sticker when both a section and a valid slot are
 * identified, plus a ranked suggestion list for the autocomplete dropdown.
 */
export function resolveLabel(
  raw: string,
  sections: Section[],
): { exact: Sticker | null; suggestions: Sticker[] } {
  const { alpha, num } = splitLabel(raw);
  if (!alpha && !num) return { exact: null, suggestions: [] };

  // Rank sections: exact code match first, then code prefix, then name prefix, then name contains.
  const scored = sections
    .map((sec) => {
      const code = sec.code.toLowerCase();
      const name = sec.name.toLowerCase();
      let score = -1;
      if (alpha) {
        if (code === alpha) score = 100;
        else if (code.startsWith(alpha)) score = 80;
        else if (name.startsWith(alpha)) score = 60;
        else if (name.includes(alpha)) score = 40;
      } else {
        score = 10; // no alpha typed yet: keep all, slot will narrow
      }
      return { sec, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.sec.code.localeCompare(b.sec.code));

  const suggestions: Sticker[] = [];
  let exact: Sticker | null = null;

  for (const { sec } of scored) {
    if (num) {
      if (slotExists(sec, num)) {
        const slot = realSlot(sec, num)!;
        suggestions.push({ code: sec.code, slot });
      }
    } else {
      // No number yet: suggest the section's first slot as a stand-in entry.
      suggestions.push({ code: sec.code, slot: sec.slots[0] });
    }
    if (suggestions.length >= 8) break;
  }

  // Exact when the top section matched by code (or single name match) and slot is valid.
  if (num && scored.length > 0) {
    const top = scored[0];
    const strongCode = top.score >= 80 && (alpha === top.sec.code.toLowerCase() || top.score === 80);
    if ((strongCode || scored.length === 1) && slotExists(top.sec, num)) {
      exact = { code: top.sec.code, slot: realSlot(top.sec, num)! };
    }
  }

  return { exact, suggestions };
}
