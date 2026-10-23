# Maison Debrah public website recreation

Local React/Vite recreation of the public pages and product catalogue at [maisondebrah.com](https://maisondebrah.com). It uses public site data captured on 23 October 2026 and 935 public image and logo files saved under `public/media`.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Local URL printed by Vite. To check the production build:

```powershell
npm.cmd run lint
npm.cmd run build
```

GitHub Pages uses `npm.cmd run build:pages` and the workflow in `.github/workflows/deploy.yml`. The public URL is `https://yohannesmulugeta.github.io/Maisondebrah/`. On Pages, navigation uses URL hashes so catalogue and product links continue to work after a browser refresh.

The browser verification script expects the development server at `http://127.0.0.1:5174/`. Change `origin` in `scripts/verify-local.mjs` if Vite uses another port, then run `node scripts/verify-local.mjs`.

## Public content and boundaries

- `src/data/catalog.json` contains 255 public product records and 31 categories. `pages.json` and `posts.json` contain 23 pages and 3 posts from the public WordPress API.
- `public/media` contains 935 distinct public media URLs found in those records and the inspected page designs. `src/data/media-manifest.json` records the URLs saved and any failures.
- The image and content sync scripts are under `scripts/`. Running them again refreshes the public snapshot and may change the result if the source website changes.
- Browsing, search, sorting, product galleries, and a browser-stored quotation list work locally. The contact and brochure forms prepare an email in the visitor's email application. Account login and registration link to the original site because its private database and approval rules are unavailable.
- No backend, database, payment flow, hosting, or deployment is included. This local copy is not connected to the original WordPress site.

Before using copied media or content on a public deployment, confirm you have the rights to do so and obtain the original site's backend/export if identical private workflows are required.
