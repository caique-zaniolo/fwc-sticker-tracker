import type { AppState } from "../types";
import { stickerKey } from "../types";

/** Open a print-ready A4-portrait HTML page showing the shared duplicates list. */
export function openDupesPrintView(state: AppState): void {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Could not open print window — check your popup blocker.");
    return;
  }
  win.document.write(buildHtml(state));
  win.document.close();
}

function buildHtml(state: AppState): string {
  const { sections, albums, duplicates } = state;
  const nameA = albums.A.name;
  const nameB = albums.B.name;

  const SLOTS = Array.from({ length: 20 }, (_, i) => String(i + 1));

  const active = sections.filter((s) => s.slots.length > 0);

  let totalSpares = 0;
  let totalDistinct = 0;

  const bodyRows = active
    .map((sec) => {
      let secSpares = 0;
      let secDistinct = 0;

      const cells = SLOTS.map((slot) => {
        if (!sec.slots.includes(slot)) {
          return `<td class="x"></td>`;
        }
        const n = duplicates[stickerKey(sec.code, slot)] ?? 0;
        if (n === 0) return `<td class="none"></td>`;
        secSpares += n;
        secDistinct++;
        const label = `${sec.code}${slot}`;
        if (n === 1) return `<td class="d1">${label}</td>`;
        return `<td class="dn">${label}<span class="nx">&times;${n}</span></td>`;
      }).join("");

      totalSpares += secSpares;
      totalDistinct += secDistinct;

      const countCell =
        secSpares > 0
          ? `<td class="cnt have">${secSpares}</td>`
          : `<td class="cnt zero">—</td>`;

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
<title>FWC — Duplicates</title>
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
  .col-slot { }
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

  thead tr th {
    background: #0c4a6e;
    color: #f0f9ff;
    font-size: 6pt;
    font-weight: 700;
    height: 11pt;
  }
  thead tr th:first-child,
  thead tr th:nth-child(2) {
    background: #082f49;
  }

  td.code {
    font-weight: 700;
    font-size: 6pt;
    text-align: left;
    padding-left: 1.5pt;
    background: #f0f9ff;
    letter-spacing: -0.02em;
  }
  td.flag {
    font-size: 9pt;
    line-height: 1;
    background: #f0f9ff;
  }
  td.x    { background: #e2e8f0; }          /* slot absent */
  td.none { background: #f8fafc; }          /* exists but no spare */

  td.d1 {
    font-size: 5pt;
    font-weight: 700;
    color: #0c4a6e;
    background: #bae6fd;                    /* sky-200 */
  }
  td.dn {
    font-size: 4.5pt;
    font-weight: 700;
    color: #7c2d12;
    background: #fed7aa;                    /* orange-200 — multiple spares */
    position: relative;
  }
  .nx {
    font-size: 4pt;
    font-weight: 900;
    vertical-align: super;
  }

  td.cnt {
    font-weight: 700;
    font-size: 6.5pt;
    background: #f0f9ff;
  }
  td.cnt.have { color: #0c4a6e; }
  td.cnt.zero { color: #94a3b8; }
</style>
</head>
<body>
<div class="page-header">
  <div class="title">
    ${nameA} &amp; ${nameB} <span>| Figurinhas Repetidas</span>
  </div>
  <div class="legend">
    azul = 1 repetida &nbsp;|&nbsp; laranja = mais de 1
    <br>TOTAL <b>${totalSpares}</b> &nbsp;&nbsp; DISTINTAS <b>${totalDistinct}</b>
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
