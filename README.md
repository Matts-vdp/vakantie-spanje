# Green Spain Travel Companion

A mobile-first, local-first itinerary for 20 September–2 October 2026.
React + TypeScript + Vite, native IndexedDB, and a statically built PWA.

## Run locally

Use Node 24 (see `.nvmrc`). From this directory:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. The development server intentionally does not register a service worker; use a production preview to test offline behaviour:

```sh
npm run check
npm run preview
```

The preview runs at `http://127.0.0.1:4173`. Visit it online and wait for **Ready for offline use** before disconnecting. Localhost is a secure context for service workers. An actual phone needs an HTTPS development URL for installation/offline testing; ordinary LAN HTTP is insufficient. Choose production hosting in the rollout phase.

## Phase 2 application

- Complete source itinerary and reusable library, with Today, Trip, filtered Explore and place details.
- Offline add/edit forms for places, notes, visits and stays; day associations, reordering and exclusive choices.
- Visit/stay bookings, contextual reminders, action review and traveller-entered document shortcuts.
- Full JSON export/import with explicit replacement, pre-import backup download and restore.
- Native IndexedDB, stale-tab/draft protection, portable-data migrations and safe app updates.

See `docs/implementation.md` for behavior and assumptions, and `docs/verification.md` for completed checks. Rollout remains out of scope. Version-1 exports can be imported; update a receiving app before importing a version-2 export.

## Verification

```sh
npm run check
npm run test:e2e
```

On Windows, browser tests use installed Microsoft Edge. On Linux/macOS, install Chromium once:

```sh
npx playwright install --with-deps chromium
```

Browser tests use isolated storage, explicit trip days, a phone viewport and the production service worker. The upgrade test builds phase 1 from commit b19af3327af667c9a959e7da17e429bf0c584325, so this commit must be available in local Git history. They do not access your normal browser profile. Screenshots/traces are written to ignored `test-results/`.

## Data and privacy

`src/data/initial-trip.json` is the authoritative initial dataset. Edit it directly and run `npm run data:check` to validate it against the current portable schema. The checked-in HTML and `docs/source-audit.md` are historical source material, not app screens or regeneration inputs for normal development. The archived converter requires an explicit preview output path and refuses to overwrite the canonical seed.

Seed generation never touches browser data. Once initialized, the device's saved trip wins. Browser clearing/eviction can remove local data, so export backups. Phones do not synchronize.

Sensitive documents belong in restricted Google Drive storage. The app contains no credentials, private documents or document integrations. Any eventual public static deployment will expose its bundled seed itinerary even if the repository is private.

## GitHub Pages deployment

Pushes to `main` are built and deployed by `.github/workflows/deploy-pages.yml`; the existing validation workflow continues to run independently. In the GitHub repository, select **Settings → Pages → Build and deployment → GitHub Actions** once to enable the deployment source. The project site is then available at:

<https://matts-vdp.github.io/vakantie-spanje/>

The relative Vite base is intentional: it keeps generated assets, the web manifest and service worker valid under the GitHub Pages repository subdirectory while preserving deployment to other static subdirectories. GitHub Pages is public, including when a plan permits Pages for a private repository; do not add sensitive itinerary data or private documents to bundled assets.

## Project map

| Path | Purpose |
| --- | --- |
| `src/domain/` | Versioned schema, inferred types and Spain-local calendar helpers |
| `src/storage/` | Native IndexedDB transactions and concurrency checks |
| `src/data/` | Authoritative initial trip dataset |
| `src/components/` | Shared day view, actions, icons and PWA update prompt |
| `scripts/` | Seed validation, archived source conversion and local SVG icon rendering |
| `tests/` | Production browser journeys |
| `docs/` | Architecture, source audit and phase handoff |

GitHub Pages deployment uses the repository-provided `GITHUB_TOKEN`; no deployment credentials are stored in the repository.
