# Phase 2 verification

Verified on 14 September 2026 with Node **24.11.1**, pinned installed dependencies, Windows and isolated headless Microsoft Edge at a Pixel 7 viewport. No normal traveller browser profile was modified by tests.

## Completed

- `npm run check` passes: source-conversion drift, ESLint, **19 unit/storage tests**, TypeScript, production build and PWA generation.
- `npm run test:e2e` passes: **11 production-browser journeys**.
- Unit/storage checks cover existing seed-once/revision behavior, migration of version-1 edits into version 2, automatic and explicit timeline icons, lossless current-format round trips, invalid/future schemas and links, broken references, shared-entity deletion safeguards, moving booked visits and action relationships, exclusive choices, hotel scheduling and contextual dates.
- An injected IndexedDB transaction abort rejects both save and replacement, preserves the current trip and existing backup, and never reports success. Restore swaps records with a new local revision.
- Browser checks cover browsing, hotel information/navigation, day-note persistence, offline reopen/editing, link/Back draft guards, restaurant creation with a confirmed time, shared place notes, moving/removing visits, safe entity deletion, booking resolution in More, exclusive Day 12 selection, hotel night reassignment and shared hotel details, and creating a simple note.
- Cross-context JSON transfer reproduces the complete operational trip (except expected local revision/save timestamp). Malformed/future-version files and cancellation preserve data. Both directions of backup restore are verified. Test document URLs are synthetic and stored only in isolated browser data.
- A second tab's committed change rejects a stale form save while retaining its draft.
- The lifecycle test builds **actual phase 1 commit `b19af3327af667c9a959e7da17e429bf0c584325`**, installs its service worker under a generic static **`/travel/`** path, saves an edit, then switches the server to the actual phase 2 build. The update waits while a note is dirty, migrates without losing edits, and supports new offline editing and reopening. A subsequent worker-byte change verifies that a new phase 2 form also disables Update while dirty.
- Phone-width screenshots inspected for the add-hotel form, refined Today/day/hotel view, activity bottom sheet, Trip, More and filtered Explore. Today’s date strip and requested section order have explicit position assertions; overflow assertions pass. Mockup comparison led to grouped rows/cards, semantic status pills, compact hotel disclosure, visible attention items, filter chips and collapsed More audits.
- Original planning HTML/specification remain unchanged. Production output includes local icons, manifest and precached assets, and excludes source documents. No production rollout was performed.

## Reproduce

```sh
npm run check
npm run test:e2e
npm run preview
```

Browser testing builds the historical fixture into `node_modules/.cache/lifecycle-old`; it requires the baseline commit in local Git history. CI now fetches history. On Windows it uses installed Edge; elsewhere install Chromium with `npx playwright install --with-deps chromium`. Local Windows sandbox execution required subprocess escalation for Vite/Vitest and browser startup; those were environment restrictions, not app failures.

Screenshots are generated under ignored `test-results/`, including `phase2-hotel-form.png`, `phase2-day-phone.png`, `phase2-explore.png`, and `phase2-upgraded-subdirectory.png`. Tests use isolated data and the production service worker; the original foundation journeys fix the preview date, while new feature tests select explicit days.

## Remaining limits

Actual iOS/Android installation, platform Maps handoff, physical-phone file sharing and offline reopening on the travellers' devices still need real-device checks. Browser emulation is not a phone test. Linux CI is configured but has not been executed in this Windows session.

External Maps, booking sites and restricted Drive files are not cached by this app. Source opening/access facts were preserved, not re-researched. Missing destinations and personal booking information remain for traveller input. V2 exports require an updated receiving app; v1 imports remain supported without seed merging.

Vite reports a non-blocking chunk-size warning: the main bundle, including the full itinerary and runtime validation, is about 516 kB before gzip / 147 kB gzip. The complete local precache is about 552 KiB. There are no remote runtime asset dependencies.
