# Application architecture

## Canonical data and storage

A React/TypeScript/Vite SPA uses hash routes and native IndexedDB directly. React renders one canonical trip; `src/storage/trip-store.ts` owns durable reads, commit-aware writes and atomic replacement. Runtime dependencies remain React, React DOM and Zod. There is no backend, storage wrapper, synchronization or base/override merge.

The database version remains 1, with a `trip` store and `current` / `before-import` keys. Seed initialization happens only in an empty store and is atomic even with concurrent first loads. Connections close after transactions and on version change. Saves compare the persisted revision inside the same write transaction, then resolve only on commit. A stale or aborted save cannot overwrite data and leaves the form draft visible.

## Portable schema v2 and v1 migration

`src/domain/trip.ts` validates all storage, seed, save and JSON boundaries. It checks dates, times, unique IDs, entity/day/stay/visit references, overnight consistency and HTTP(S) URLs. V2 adds optional `booking.bookingUrl`, itinerary `choiceGroup`, action `itemIds` / `stayIds`, and the itinerary `kind` used for timeline icons. A missing icon choice defaults to `auto`. Existing document URLs and all previous fields retain their meaning.

`parseTrip` recognizes schema v1, copies its top-level record with version 2, then validates it with the complete current schema. Missing timeline icon choices default to automatic classification based only on the current title and linked entities; no seed is consulted or merged. Migration does not modify the input or overwrite traveller fields. It occurs in memory on read; the next committed save or replacement persists v2. Validation failure leaves the original record untouched. Other versions are rejected. Database versioning and portable format versioning are independent.

Version 2 is deliberate even though some fields are optional: the old version-1 validator would silently strip unknown fields. Old builds refuse a v2 record/export instead of accepting a lossy downgrade. Sharing from an old phone to an updated phone is supported; update the receiving app before importing a v2 export. There is no automatic downgrade.

## Ownership and editing

Entities are reusable typed hotel/activity/restaurant/note/transport records. Venue information belongs to the entity, reservations to a visit or stay. Days own ordered visits; visits may reference multiple places. Visit titles remain independently editable labels, while linked names and venue details use shared entities. Stays reference one hotel and use an exclusive checkout date.

`domain/operations.ts` contains scheduling, moving, safe entity deletion, exclusive-choice selection and action derivation. `components/Editor.tsx` holds a separate whole-trip draft while editing a place, visit, stay, action or document shortcuts. Required fields are minimal; type-specific details stay typed. Creating a hotel with a day creates a one-night stay; subsequent date changes reassign nights only at save time. Existing reservations are retained when a different hotel is assigned. Explicit remove-stay controls clear day/action references without deleting the venue. Source entities cannot be deleted; user-created entities can only be deleted once unused. Visit removal retains shared entities and removes explicit action references.

App-level refs guard internal/hash/Back navigation immediately and prevent navigation during writes. Dirty forms prompt before leaving, unload warns, and the calendar does not advance while dirty or writing. State updates only after a successful transaction. Service-worker updates are disabled for all dirty forms, import previews and in-flight writes. Form failure messages retain the draft for correction or copying before a reload.

## Actions, booking state and calendar

Today uses Europe/Madrid and a minute clock. Before departure it previews the first day; after return it shows the final day. Contextual actions use the selected day plus two following days. Explicit deadlines at or before the window end also appear when a target is still ahead; an unassigned action appears on the first-day preview. More always shows all actions. Relative source labels (This week, 2–3 weeks out, Final week) are preserved without invented absolute dates. The traveller may set a real deadline in Review action.

For the original `green-spain-2026` trip, stable source IDs derive action relationships even in old saved files. This is a view relationship, not a seed merge. Explicit `itemIds` / `stayIds` override these defaults. Moving a linked visit moves the contextual reminder with it. Removed targets are not resurrected.

| Source actions | Operational targets |
| --- | --- |
| 1 / 2 / 5 | La Posta / MyPalace / O Palleiro stays and extra confirmations |
| 3 | Montemar and Palacio de Avilés stays, plus room/event requests |
| 4 | El Jisu stay, plus the packed-breakfast request |
| 6 | Arrival and departure days; car hire confirmation |
| 7 / 8 / 9 | Fuente Dé / El Soplao / day-7 optional morning visit |
| 10 | Both the Canedo tour and restaurant visits |
| 11 / 12 / 13 | Don Paco / Covadonga access bus / Cares access bus |
| 14 | Senda del Oso bicycle and return-shuttle visits |
| 15 / 16 | Cabrales cheese cave / Las Médulas access review |

Booking-only actions are resolved only when every linked booking is confirmed (`booked`) or not needed. They reopen if a booking becomes pending. They do not offer a contradictory manual Done toggle. Access/confirmation actions, and the mixed hotel tasks 3/4, retain a separate Done/check state. A confirmed room is not evidence of a packed breakfast, dinner, parking or event confirmation. Source compound wording remains visible for review. Optional bookings can be explicitly marked not needed. Skipping a visit alone never cancels a reservation.

Source Day 12 morning visits share an exclusive group, also derived for v1 files that lack the field. Selecting one marks it planned and other group members skipped, leaving all library alternatives available. No initial choice is inferred. Other multi-place rows retain the source's ambiguity and can be edited through visit associations/status.

## Import and backup

More accepts a JSON file up to 5 MB, validates it, and shows name, dates, record counts and timestamp. Selection does not write data. Explicit replacement warns that the entire receiving trip is replaced; a current-data export is offered alongside confirmation. The existing `replace` transaction stores current data as backup and writes the replacement together, using the receiving device's revision. A stale confirmation or malformed/incompatible file leaves both current and backup untouched.

Review pre-import backup validates and previews the single stored backup and allows downloading it. Restore uses the same confirmed replacement transaction, so current and backup swap. A cancelled preview performs no write. All screens receive the new canonical state after commit. Clearing browser storage can still remove both records: exported files remain the independent backup.

## Source and offline boundaries

The build-time converter processes the planning HTML only for empty-device seed data. Twelve explicit narrative destinations now reuse existing source entities/links; uncertain trail turns, parking/shuttle pickup points, airport terminals and restaurant URLs are left unset. The source audit documents this. Neither the original HTML nor specification is copied into the production output.

The PWA precaches local app assets and the bundled seed. IndexedDB is independent of app-shell caches. No service-worker activation, seed regeneration or application startup resets local edits. Maps, websites, booking links and restricted Drive links are external and not cached or embedded. The app contains no private documents or supplied private URLs.

Production uses relative asset URLs and hash routes; a generic static server can serve a subdirectory. The browser lifecycle test builds actual phase 1 commit `b19af3327af667c9a959e7da17e429bf0c584325` into an ignored dependency-cache fixture, installs it under `/travel/`, then serves the current build and verifies update/offline persistence. CI fetches history for that fixture. Node 24 and the committed lockfile remain the expected environment. Rollout is separate.
