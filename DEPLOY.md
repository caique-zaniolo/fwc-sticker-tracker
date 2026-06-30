# Deploying the FWC Sticker Tracker (from your other laptop)

This is a static PWA — any free static host works. Move this whole folder to your other
laptop first (you got it as a zip), then unzip and pick one option below.

## 0. One-time setup on the new laptop

Install Node.js 18+ (https://nodejs.org), then in the project folder:

```bash
npm install
npm run build      # outputs the deployable site into dist/
```

---

## Option A — Netlify Drop (fastest, no account/CLI needed)

1. Run `npm run build`.
2. Go to https://app.netlify.com/drop and drag the **`dist/` folder** onto the page.
3. You get an instant `https://<random>.netlify.app` URL.
4. Sign in (free) to keep the URL permanently; to update later, drag a fresh `dist/` again.
5. On your iPhone: open the URL in Safari → Share → **Add to Home Screen** (works offline after).

No `base` change needed — Netlify serves at the site root.

---

## Option B — GitHub Pages (permanent, auto-deploys on every push)

Uses your personal GitHub account on the new laptop.

1. Set the base path to your repo name in `vite.config.ts`:
   ```ts
   base: "/REPO_NAME/",   // e.g. "/fwc-stickers/"
   ```
   (Skip this only if the repo is named `<yourname>.github.io`, which serves at root.)

2. Create the repo and push (must be **public** for free Pages):
   ```bash
   git init
   git add -A
   git commit -m "FWC sticker tracker"
   gh auth login                       # log in as your PERSONAL account
   gh repo create REPO_NAME --public --source=. --push
   ```

3. The included workflow `.github/workflows/deploy.yml` builds and publishes on every push.
   In the repo on github.com: **Settings → Pages → Build and deployment → Source = GitHub Actions**
   (only needed once).

4. Your site: `https://<your-username>.github.io/REPO_NAME/`. Install to your iPhone home
   screen from Safari as above.

To update later: edit files, `git commit`, `git push` — it redeploys automatically.

---

## Option C — Cloudflare Pages (permanent, works with a private repo)

1. Push to GitHub (private is fine here) as in Option B steps 2 (use `--private`).
2. At https://dash.cloudflare.com → Pages → Connect to Git → pick the repo.
3. Build command `npm run build`, output directory `dist`. Deploy.
4. Set `base: "/"` in `vite.config.ts` (Cloudflare serves at root).

---

## Updating your sticker data later

Edit `data/arthur.csv`, `data/bernardo.csv`, `data/duplicates.csv` and rebuild/redeploy to
refresh the bundled snapshot — or just use the in-app **Data** tab to import a new CSV any
time (your in-app changes are saved in the browser regardless).
