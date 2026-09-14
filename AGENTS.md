# Green Spain travel companion

Read `travel-companion-spec.md` and `docs/implementation.md` before changing scope.
This is a mobile travel utility that must stay usable during an active trip.

## Stack and boundaries
- React, TypeScript, Vite. Native IndexedDB only; do not introduce Dexie or another storage wrapper.
- No backend, accounts, synchronization, AI API integration, or booking-provider integration in v1.
- One complete canonical trip per device. Initialize from the bundled seed only when storage is empty. Never merge seed updates over traveller edits.
- Days reference reusable typed places and stays; do not duplicate hotel entities in each day.
- Validate all imported/persisted data with `src/domain/trip.ts`; maintain JSON export compatibility. Unsupported versions must fail safely without deleting saved data.
- Resolve saves only after IndexedDB transaction completion. Preserve stale-tab protection and atomic backup/replacement.
- Keep app-shell caching independent of trip storage. Do not force service-worker updates while a user has unsaved edits.
- No sensitive PDFs, booking documents, passports, payment data, secrets, or personal exports in source or public assets. Private repository does not imply private hosting.
- Preserve mobile usability, offline access, and useful direct actions. Prefer compact rows and utility styling over photography.

## Work style
- Take complete, coherent implementation slices; carry them through verification without stopping for routine decisions.
- Record material assumptions in docs. Ask only when missing information changes the product and cannot be inferred.
- Keep changes small and low risk during the live trip; avoid unrelated refactors.
- Never overwrite the original specification or planning HTML as a side effect of app changes. Preserve existing user edits.
- The source converter is build-time development tooling, never an import/merge path for current device data.
- Check the selected Node version and use the committed package lock. Cross-platform commands must work on Windows and Linux.

## Commands and verification
- Node 24 recommended; `npm ci` installs pinned dependencies.
- `npm run dev` starts the app at localhost; `npm run check` checks source conversion, ESLint, unit tests, TypeScript, production build, and PWA generation.
- `npm run test:e2e` tests the built app, persistence, export, and offline reopening. Run `npm run build` first.
- On Windows tests use installed Edge in a headless isolated profile. Elsewhere install Chromium with `npx playwright install --with-deps chromium`.
- Test meaningful failure paths around storage and schema changes. Do not write tests that only duplicate trivial presentation code.
- Inspect the app at phone width for UI changes. Actual iOS/Android installation and map handoff need real-device verification; never describe emulation as a phone test.
- See `docs/architecture.md` for data ownership, update semantics, and remaining foundations.
