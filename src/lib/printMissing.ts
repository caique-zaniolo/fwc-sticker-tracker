import type { AppState } from "../types";
import { stickerKey } from "../types";

/** Open a print-ready A4-landscape HTML page showing the consolidated missing list. */
export function openPrintView(state: AppState): void {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Could not open print window — check your popup blocker.");
    return;
  }
  win.document.write(buildHtml(state));
  win.document.close();
}

function buildHtml(state: AppState): string {
  const { sections, albums } = state;
  const nameA = albums.A.name;
  const nameB = albums.B.name;

  // All numeric slots 1-20 as strings (canonical form used in sec.slots)
  const SLOTS = Array.from({ length: 20 }, (_, i) => String(i + 1));

  // Only render sections that have at least one defined slot
  const active = sections.filter((s) => s.slots.length > 0);

  const headerCells = SLOTS.map((n) => `<th>${n}</th>`).join("");

  let totalMissingA = 0;
  let totalMissingB = 0;

  const bodyRows = active
    .map((sec) => {
      let secMissing = 0;

      const cells = SLOTS.map((slot) => {
        if (!sec.slots.includes(slot)) {
          return `<td class="x"></td>`;
        }
        const key = stickerKey(sec.code, slot);
        const aHas = !!albums.A.owned[key];
        const bHas = !!albums.B.owned[key];
        if (!aHas) totalMissingA++;
        if (!bHas) totalMissingB++;
        if (aHas && bHas) return `<td class="g"></td>`;
        secMissing++;
        return `<td class="m">${sec.code}${slot}</td>`;
      }).join("");

      const countCell =
        secMissing > 0
          ? `<td class="cnt missing-cnt">${secMissing}</td>`
          : `<td class="cnt ok-cnt">✓</td>`;

      return `<tr>
        <td class="code">${sec.code}</td>
        <td class="flag">${sec.flag}</td>
        ${cells}
        ${countCell}
      </tr>`;
    })
    .join("\n");

  const colgroup = `<colgroup>
    <col style="width:22pt"><col style="width:16pt">
    ${SLOTS.map(() => `<col>`).join("")}
    <col style="width:16pt">
  </colgroup>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>FWC — Missing Stickers</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #111; }

  .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2.5mm; }
  .header h1 { font-size: 9pt; font-weight: bold; }
  .header h1 span { font-weight: normal; color: #666; }
  .header .totals { font-size: 7pt; color: #444; }
  .header .totals b { color: #111; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td {
    border: 0.3pt solid #bbb;
    text-align: center;
    vertical-align: middle;
    height: 10.5pt;
    overflow: hidden;
    white-space: nowrap;
  }
  thead th {
    background: #1e293b;
    color: #fff;
    font-size: 6pt;
    font-weight: bold;
    height: 12pt;
  }
  thead th:first-child,
  thead th:nth-child(2) { background: #334155; }

  td.code { font-weight: 700; font-size: 6.5pt; text-align: left; padding-left: 2pt; background: #f1f5f9; }
  td.flag { font-size: 9pt; line-height: 1; background: #f1f5f9; }
  td.g    { background: #94a3b8; }
  td.x    { background: #e2e8f0; }
  td.m    { font-size: 5.5pt; font-weight: 700; color: #1e293b; background: #fff; }
  td.cnt  { font-weight: 700; font-size: 7pt; background: #f1f5f9; }
  td.missing-cnt { color: #b45309; }
  td.ok-cnt      { color: #15803d; font-size: 8pt; }
</style>
</head>
<body>
<div class="header">
  <h1>FWC Sticker Tracker — ${nameA} &amp; ${nameB} <span>| Missing Stickers (consolidated)</span></h1>
  <div class="totals">
    ${nameA}: <b>${totalMissingA}</b> missing &nbsp;|&nbsp;
    ${nameB}: <b>${totalMissingB}</b> missing
  </div>
</div>
<table>
  ${colgroup}
  <thead>
    <tr>
      <th>TEAM</th><th></th>
      ${headerCells}
      <th>MISS</th>
    </tr>
  </thead>
  <tbody>
    ${bodyRows}
  </tbody>
</table>
</body>
</html>`;
}
