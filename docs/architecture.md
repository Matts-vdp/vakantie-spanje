# Foundation architecture

## Application

A Vite-built React SPA with hash navigation. Hash routes work on a generic static file server and at a subdirectory without rewrite rules. Today and historical/future days use the same `DayView`. Styling uses system fonts and local SVG/PNG icons, with no runtime font or imagery dependency.

React owns the current in-memory view of the canonical trip. `src/storage/trip-store.ts` owns durable reads/writes. A component reports success only after the storage transaction commits; failed saves leave the draft in the form. There is no base/override merge system.

Runtime dependencies are React, React DOM and Zod. Zod supplies runtime boundary validation and inferred TypeScript types. IndexedDB is accessed directly; there is no storage wrapper library. Cheerio is used only by the source converter; Vitest, fake-indexeddb and Playwright are development-only.

## Version 1 dataset

`schemaVersion` versions the portable JSON format, independently from IndexedDB's database version. The current database has one object store, `trip`, with keys `current` and (after an import) `before-import`.

- Entities are a discriminated union: hotel, activity, restaurant, note and transport. Common metadata and links remain shared; type-specific fields have their own sections.
- Days own ordered itinerary items. An item can reference several entities because the planning source contains choices and multi-place stops. Explicit times are optional; suggested times in prose remain planning context.
- Stays reference hotel entities and check-in/check-out dates. Checkout is exclusive: the last morning has no overnight stay. Operational reservations belong to scheduled items or stays, not to reusable place descriptions.
- `booking.required = null` means unspecified. `status = unknown` distinguishes missing booking evidence from known pending or confirmed bookings.
- Actions separately represent booking, access, confirmation and decision work. The source's relative timing is retained until real deadlines are chosen.
- Notes, source provenance, links and the complete library travel in one JSON export. Internal document links start empty.

`parseTrip` validates the seed, storage reads and imported files, including unique IDs, references, chronological dates, compatible versions and HTTP(S) links. Unsupported or damaged stored data produces a recoverable error screen; it is never silently reset.

## Storage and concurrency

Initialization checks and writes in one read-write transaction so simultaneous first loads cannot overwrite each other. Database connections close after each transaction and on `versionchange`. A blocked upgrade tells users to close other tabs.

Saving checks the persisted revision inside the same transaction before writing the complete next snapshot. A stale tab receives an error and retains its unsaved form text. `revision` is local concurrency metadata; import increments the receiving device's revision rather than trusting the sender's revision.

The `replace` primitive validates before opening a write transaction, then backs up current state and replaces it atomically. Its caller must provide explicit replacement confirmation; that UI is phase 2. Only one pre-import backup is retained. Browser storage is not a guaranteed backup: clearing site data and browser eviction remain possible.

## Dates

Trip dates are ISO calendar dates and use `Europe/Madrid` for Today. Before departure, Today explicitly previews day 1; after the trip it shows the last day with a trip-complete label. The clock refreshes once per minute. Tests fix the clock to avoid date-dependent failures. User-entered booked times will use local wall-clock time in the trip timezone.

## PWA and updates

`vite-plugin-pwa` generates the manifest and service worker. Only locally built app assets are precached; the seed is bundled in JavaScript. External websites, Maps and Drive are never cached by the app. Current trip state stays in IndexedDB, independently of app-shell caches.

New workers wait for a user-triggered update. The update action is disabled while a note is dirty. No application startup, seed regeneration or service-worker activation resets traveller data. New schema versions must add and test an explicit migration before shipping.

Tests exercise production offline reloads. Physical phone installation, cross-phone file transfer, platform-specific navigation handoff and a real old-build/new-build update cycle remain explicit later checks.

## Build and portability

The production output is `dist/`. Original planning HTML/Markdown, tests, source-only conversion tools and personal documents are not copied there. Dependencies are pinned in package.json and package-lock.json. CI can build/test from a Linux checkout without a home PC. Hosting, GitHub connection and deployment configuration remain rollout work.
