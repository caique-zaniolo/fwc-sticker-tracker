import type { AppState } from "../types";
import { stickerKey } from "../types";

/** Open a print-ready A4-portrait HTML page showing the consolidated missing list. */
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

  // Numeric slots 1-20
  const SLOTS = Array.from({ length: 20 }, (_, i) => String(i + 1));

  // Only sections that have at least one defined slot
  const active = sections.filter((s) => s.slots.length > 0);

  // Compute totals and build rows
  let totalHave = 0;
  let totalMissing = 0;

  const bodyRows = active
    .map((sec) => {
      let secMissing = 0;
      let secHave = 0;

      const cells = SLOTS.map((slot) => {
        if (!sec.slots.includes(slot)) {
          return `<td class="x"></td>`;
        }
        const key = stickerKey(sec.code, slot);
        const aHas = !!albums.A.owned[key];
        const bHas = !!albums.B.owned[key];
        if (aHas && bHas) {
          secHave++;
          return `<td class="g"></td>`;
        }
        secMissing++;
        return `<td class="m">${sec.code}${slot}</td>`;
      }).join("");

      totalHave += secHave;
      totalMissing += secMissing;

      const countCell =
        secMissing > 0
          ? `<td class="cnt miss">${secMissing}</td>`
          : `<td class="cnt ok">&#10003;</td>`;

      return `<tr>
        <td class="code">${sec.code}</td>
        <td class="flag">${sec.flag}</td>
        ${cells}
        ${countCell}
      </tr>`;
    })
    .join("\n");

  const headerCells = SLOTS.map((n) => `<th>${n}</th>`).join("");

  const colgroup = `<colgroup>
    <col class="col-code">
    <col class="col-flag">
    ${SLOTS.map(() => `<col class="col-slot">`).join("")}
    <col class="col-cnt">
  </colgroup>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>FWC — Missing Stickers</title>
<style>
  @page {
    size: A4 portrait;
    margin: 7mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 6.5pt;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header ── */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2mm;
  }
  .page-header .title {
    font-size: 9pt;
    font-weight: 900;
    letter-spacing: 0.02em;
  }
  .page-header .title span {
    font-weight: 400;
    color: #555;
    font-size: 7.5pt;
  }
  .page-header .legend {
    font-size: 6.5pt;
    color: #444;
    text-align: right;
    line-height: 1.5;
  }
  .page-header .legend b { color: #111; font-size: 7.5pt; }

  /* ── Table ── */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .col-code { width: 15pt; }
  .col-flag { width: 13pt; }
  .col-slot { /* fills remaining width equally */ }
  .col-cnt  { width: 13pt; }

  th, td {
    border: 0.25pt solid #aaa;
    text-align: center;
    vertical-align: middle;
    height: 13.5pt;
    overflow: hidden;
    white-space: nowrap;
    padding: 0;
  }

  /* header row */
  thead tr th {
    background: #1e293b;
    color: #f8fafc;
    font-size: 6pt;
    font-weight: 700;
    height: 11pt;
  }
  thead tr th:first-child,
  thead tr th:nth-child(2) {
    background: #0f172a;
  }

  /* body cells */
  td.code {
    font-weight: 700;
    font-size: 6pt;
    text-align: left;
    padding-left: 1.5pt;
    background: #f1f5f9;
    letter-spacing: -0.02em;
  }
  td.flag {
    font-size: 9pt;
    line-height: 1;
    background: #f1f5f9;
  }
  td.g {
    background: #94a3b8;    /* slate-400 — "have" */
  }
  td.x {
    background: #e2e8f0;    /* slot absent for this section */
  }
  td.m {
    font-size: 5pt;
    font-weight: 700;
    color: #0f172a;
    background: #ffffff;
    letter-spacing: -0.03em;
  }
  td.cnt {
    font-weight: 700;
    font-size: 6.5pt;
    background: #f1f5f9;
  }
  td.cnt.miss { color: #b45309; }
  td.cnt.ok   { color: #15803d; font-size: 8pt; }
</style>
</head>
<body>
<div class="page-header">
  <div class="title">
    ${nameA} &amp; ${nameB} <span>| Álbum de Figurinhas</span>
  </div>
  <div class="legend">
    escuro = JÁ TEM &nbsp;|&nbsp; claro = FALTA
    <br>TEM <b>${totalHave}</b> &nbsp;&nbsp; FALTA <b>${totalMissing}</b>
  </div>
</div>
<table>
  ${colgroup}
  <thead>
    <tr>
      <th></th><th></th>
      ${headerCells}
      <th></th>
    </tr>
  </thead>
  <tbody>
    ${bodyRows}
  </tbody>
</table>
</body>
</html>`;
}
