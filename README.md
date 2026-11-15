# MoneyMode

MoneyMode is a React + Vite application exported from Base44.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run:

   ```bash
   npm install
   npm run dev
   ```

3. Open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## Deploy the frontend

This repository is configured for a Vite static build. For Cloudflare Pages, use:

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20`

The `public/_redirects` file enables client-side routes to fall back to `index.html`.

## Important: Base44 backend dependency

This export is **not a fully standalone application**. It still imports `@base44/sdk` and uses Base44 services for authentication, app settings, data entities, and related backend operations. Hosting this repository on GitHub Pages, Cloudflare Pages, or another static host does not migrate those services.

Before expecting login, registration, dashboards, transactions, budgets, goals, or other data-backed features to work on a new host, you must have a working Base44 backend and configure the required public app settings. Do not put private API keys or server secrets in `VITE_*` variables; Vite exposes those values to browsers.

The app reads these build-time variables when provided:

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `VITE_BASE44_APP_BASE_URL`

Use the actual values from your Base44 project. Do not guess them or commit credentials to this repository. The app also uses Base44 API endpoints, so simply adding these variables may not be sufficient if Base44 does not permit the deployed origin or if the backend is no longer available.

## Upload to GitHub

1. Extract this ZIP file on your computer.
2. Sign in to GitHub and create a **new empty repository** named `moneymode` (do not initialize it with a README).
3. Open the new repository and choose **Add file → Upload files**.
4. Open the extracted `moneymode-github` folder on your computer, select all its contents (including hidden files such as `.gitignore` and `.github`), and drag them into GitHub's upload area.
5. Commit the upload to the `main` branch.

Do not upload a `.env` file, access token, or other secret.
