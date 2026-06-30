# FWC Sticker Tracker

A mobile-first, offline PWA for tracking two FIFA World Cup sticker albums (Arthur &
Bernardo) and speeding up in-person swapping. All data lives in your browser
(`localStorage`) — no backend, no accounts, works with no signal.

## Tabs

- **Swap** — type the sticker label exactly as printed (`MEX8`, `FWC00`). Instantly shows
  whether each album NEEDS it, with one-tap "Mark have". Built for going through a pile fast.
- **Albums** — spreadsheet-style grid per album (toggle Arthur/Bernardo). Tap any sticker
  to flip have/missing. "Only missing" filter.
- **Missing** — scannable list of everything still needed per album.
- **Data** — load bundled albums, import/export CSV, full JSON backup/restore, rename/reset.

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

Edit `data/arthur.csv` / `data/bernardo.csv` and rebuild to refresh the bundled snapshot,
or just import a new CSV from the **Data** tab at any time. Your in-app edits override the
bundle until you re-import.
