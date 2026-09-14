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

## What the foundation includes

- The complete source dataset: 13 days, six stays, 68 library activities, one decision note, two named restaurants and six hotels.
- Today/day browsing, Trip, searchable Explore, read-only place details, More/planning notes.
- Editable day notes, saved in native IndexedDB and retained offline.
- A complete JSON export; validated import/atomic replacement primitives for the next phase.
- Install manifest, local icons, precached app shell and user-triggered updates.
- Data/storage tests, production-browser tests, agent instructions and a portable CI workflow.

This is phase 1. Full item/booking editing, the import confirmation UI, contextual action management and refinement belong to phase 2. See `docs/implementation.md` for the remaining work.

## Verification

```sh
npm run check
npm run test:e2e
```

On Windows, browser tests use installed Microsoft Edge. On Linux/macOS, install Chromium once:

```sh
npx playwright install --with-deps chromium
```

Browser tests use isolated storage, a fixed trip preview date, a phone viewport and the production service worker. They do not access your normal browser profile. Screenshots/traces are written to ignored `test-results/`.

## Data and privacy

The checked-in HTML is source material, not an app screen. `npm run data:generate` regenerates `src/data/initial-trip.json` and `docs/source-audit.md`. The converter retains source facts and flags unresolved choices; it does not verify current opening times or infer confirmed bookings. `npm run data:check` detects drift. Review explicit hotel mappings if dates or stays change.

Seed generation never touches browser data. Once initialized, the device's saved trip wins. Browser clearing/eviction can remove local data, so export backups. Phones do not synchronize.

Sensitive documents belong in restricted Google Drive storage. The app contains no credentials, private documents or document integrations. Any eventual public static deployment will expose its bundled seed itinerary even if the repository is private.

## Project map

| Path | Purpose |
| --- | --- |
| `src/domain/` | Versioned schema, inferred types and Spain-local calendar helpers |
| `src/storage/` | Native IndexedDB transactions and concurrency checks |
| `src/data/` | Generated initial trip |
| `src/components/` | Shared day view, actions, icons and PWA update prompt |
| `scripts/` | Reproducible source conversion and local SVG icon rendering |
| `tests/` | Production browser journeys |
| `docs/` | Architecture, source audit and phase handoff |

No hosting provider or deployment credentials are configured.
