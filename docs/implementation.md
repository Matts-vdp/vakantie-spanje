# Implementation status

## Phase 2 — complete initial application

Implemented locally on 14 September 2026. Phase 4 rollout remains out of scope.

- Add and edit activities, hotels, restaurants and notes. Name and an optional day are the only initial decisions; extra venue and booking fields use progressive disclosure. All typed venue fields and links remain reusable.
- Edit visit titles, times, notes, place associations, day, optional flag and planned/done/skipped status. Move a visit between days or reorder it with earlier/later controls. Remove a visit without deleting its library places. Delete only unused traveller-created entities.
- Schedule library places from their details. Scheduling a hotel creates an overnight stay; edit its date range, hotel and reservation separately. Day assignments apply only on save, so intermediate date input cannot change other nights.
- Visit and stay bookings have unknown/pending/confirmed/not-needed/needs-check/cancelled states, booked date/time, arrival-before time, reservation name/reference, booking/document links and notes. The portable value `booked` displays as Confirmed.
- Today and all other days share hotel information, important times, document/navigation actions, tomorrow preview, and compact expandable near-term action/booking summaries.
- More contains a functional action review and complete booking overview. Booking-only actions derive resolution from their linked visits/stays. Additional hotel requests, access checks and shuttle arrangements remain explicitly reviewable.
- Explore has accent-insensitive search and type, region and planned/alternative filters. Place details show associated days, visits and stay reservations.
- Day 12's Las Xanas/Naranco entries form an exclusive group. Choosing either skips the other without deleting its library entry. Groups are editable; other source alternatives can be chosen by editing visit places/status.
- Traveller-entered Drive/document shortcuts and booking links store URLs only, with an empty state when none have been supplied.
- JSON import has file validation, summary, explicit whole-trip replacement, a current-data export, and pre-import backup download/restore. Restore swaps current and backup atomically. No merging.
- Native IndexedDB remains the durable store. Writes resolve after commit, stale tabs are rejected, and failed saves retain form drafts. Navigation, browser Back, unload, the Today date rollover and service-worker updates respect unsaved forms/in-flight writes.
- Portable schema v2 explicitly migrates v1 in memory without seed merging. Timeline icon choices default safely to automatic classification when absent. V2 exports prevent old builds from silently dropping new fields. Unsupported versions fail safely. The next successful save persists the migrated state.
- The source converter adds 12 narrative-to-existing-place associations and explicit Day 12 choice groups. Original planning HTML/specification are unchanged. Existing device data is not enriched with these seed changes.
- Full validation, offline browser journeys, cross-context transfer, an actual phase-1-to-phase-2 service-worker upgrade and static `/travel/` hosting have been exercised. See `verification.md`.

## Material assumptions

The near-term window is the selected day plus two following calendar days, in the trip timezone. Explicit overdue action deadlines are surfaced if their target is still ahead. Source relative timing labels remain relative: no exact deadline is invented. Unassigned actions appear on the first-day preview and in More. Source action mappings and booking/confirmation distinctions are documented in `architecture.md`.

Scheduling a hotel initially assigns one night (not the final departure day). Dates can then be extended in Edit stay. Reassigning a night does not cancel or delete the previous reservation; old stays remain in the booking overview until the traveller removes them. Skipping a visit does not cancel a real reservation; use its booking status explicitly.

## Phase 3 — user refinement

- Refined Today with the mockup-style date strip, a title-only day heading, itinerary-first ordering, compact edit icons, activity bottom sheets, and a day-note control beside “The day ahead”. Hotel stays, flights, and rental car are confirmed in the seed from traveller feedback; existing device data is never overwritten by this update.
- Replaced timeline dots with compact monochrome activity icons for driving, walking, food, visits, stays, flights and cycling. Seed entries carry explicit choices; new or uncategorized visits can use automatic classification or a manual override in Edit visit.
- Adopted the mockup’s strongest utility patterns without its lower-contrast dark palette: a sticky screen header, grouped timeline and Trip rows, semantic status pills, honest “Flex” timing, primary-only navigation in itinerary rows, compact hotel disclosure, visible near-term attention rows, filter chips, scan-friendly Explore cards, and activity bottom sheets from both Today and Explore.
- Gather traveller feedback on the complete initial application.
- Verify installation, Maps handoff, physical-phone file sharing and offline reopening on actual iOS/Android devices.
- Traveller confirmation of bookings, remaining source ambiguities and destination links not provided by the source.

## Phase 4 — rollout

Not performed. No hosting provider, deployment, account system, backend or synchronization has been added.
