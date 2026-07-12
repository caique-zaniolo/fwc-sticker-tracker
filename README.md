# FWC Sticker Tracker

A mobile-first, offline PWA for tracking two FIFA World Cup sticker albums and speeding up
in-person swapping. All data lives in your browser (`localStorage`) — no backend, no
accounts, works with no signal. Each album can be renamed from the Data tab (e.g. to a
person's name).

## Tabs

- **Albums** — spreadsheet-style grid per album (toggle between the two). Tap any sticker
  to flip have/missing. "Only missing" filter.
- **Swap** — four modes for trading in person or over chat:
  - *Look up* — browse every country's still-needed stickers, or type a label (`MEX8`,
    `FWC00`) to jump straight to it and mark it have with one tap.
  - *Share* — copy your missing list to send to someone.
  - *Can offer* — paste someone else's missing list to see what you have spare to offer them.
  - *Their spares* — paste someone else's spares list to see what you can request from them.
- **Spares** — track and manage duplicate stickers per album.
- **Data** — load the blank template, import/export CSV per album, import/export a shared
  duplicates list, full JSON backup/restore, rename/reset albums.

## CSV format

Wide grid (one file per album):
- Header row: first cell is a label (ignored); remaining cells are section codes
  (`MEX`, `RSA`, …, `FWC`).
- Each row: first cell is the sticker number (`0`–`20`); the `0` row maps to slot `00`.
- Cell meaning: **`X` = you have it**, **a code like `MEX8` = missing/needed**, empty = slot
  doesn't exist in that section.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (parser, counts, CSV round-trip)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Deploy (free)

It's a static site — deploy the `dist/` folder:

- **Netlify Drop**: run `npm run build`, then drag `dist/` onto https://app.netlify.com/drop.
- **Cloudflare Pages / Netlify (git)**: connect the repo, build command `npm run build`,
  output dir `dist`.
- **GitHub Pages**: set `base: "/<repo-name>/"` in `vite.config.ts`, build, publish `dist/`.

On your phone, open the deployed URL and "Add to Home Screen" to install it as an app
(works offline afterward).

## Updating album data

Use the **Data** tab in-app to import a CSV per album at any time, or edit the CSV files
under `data/` and rebuild to refresh the bundled snapshot. In-app edits override the bundle
until you re-import.
