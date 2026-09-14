# Green Spain Travel Companion — Functional & Technical Specification

## 1. Purpose

Build a small mobile-first travel companion for a 12-night road trip through northern Spain.

The source vacation plan is detailed and useful for planning, but too dense for day-to-day use while travelling. The companion should convert that plan into something operational: fast to scan, easy to edit, easy to navigate from, and reliable even when connectivity is poor.

The app should answer two primary questions extremely well:

1. **What are we doing today / tomorrow / later in the trip?**
2. **How do I quickly get to or learn more about the place we are going?**

A third core requirement is:

3. **Can we make small trip changes while travelling without editing source code?**

The app is not intended to replace Google/Apple Maps, hotel websites, booking providers, or Google Drive. It should act as the central index and operational itinerary that links directly into those systems.

---

## 2. Product Principles

### 2.1 Function before presentation
The interface should prioritize clarity, speed, and large tap targets. Decorative travel imagery is not required and should generally be avoided.

The design should feel closer to a utility app such as Maps, Reminders, or Calendar than a travel magazine.

### 2.2 Minimize friction
For any real-world place, the user should not need to copy an address or search manually in another app.

Where relevant, provide direct actions such as:

- **Navigate**
- **Website**
- **Call**
- **Open booking / ticket**

### 2.3 Contextual information
Information should appear where it is useful.

Examples:

- Hotel check-in information should appear on the current day.
- A booking needed for tomorrow should appear on Today.
- The full activity library should remain available in Explore.
- Detailed hotel-specific information should appear on the hotel detail page.

### 2.4 One current trip state
Version 1 should use one canonical trip data structure on each device rather than a base dataset plus override/merge layers.

The current trip state should contain the latest edits made by the user.

### 2.5 Easy to change during the trip
Small operational edits should be possible directly in the app.

AI/code changes are for improving the application itself, not for routine itinerary updates.

---

# 3. Scope

## 3.1 In scope for version 1

- Mobile-first React application.
- Installable PWA.
- Offline access to the core itinerary and app UI.
- Day-by-day itinerary.
- Full trip overview.
- Full activity/place library.
- Hotel information.
- Direct navigation links.
- Website links.
- Phone links.
- Booking status and booked times.
- Notes.
- Add/edit/delete user-created trip items.
- Export complete trip data as JSON.
- Import complete trip data from JSON.
- Local persistence on each device.
- Sensitive documents stored externally in Google Drive.
- GitHub repository suitable for AI-assisted development.
- Static deployment.
- Ability for Codex/cloud AI development workflows to modify the app repository independently of a home computer.

## 3.2 Explicitly out of scope for version 1

- Cloud synchronization between both phones.
- User accounts.
- Realtime shared editing.
- Backend database.
- Storing sensitive PDFs or ticket files inside the app.
- Storing passport information.
- Storing payment information.
- Full booking-provider integrations.
- Restaurant reservation integrations.
- Automatic email parsing.
- Automatic Google Drive file discovery.
- Sophisticated offline conflict resolution.
- Rich travel photography as a primary UI element.

Cloud synchronization may be added later if time remains.

---

# 4. Primary Usage Scenarios

The implementation should be evaluated against these scenarios.

## 4.1 Morning: "What are we doing today?"
The user opens the app and immediately sees:

- today's date;
- route/day title;
- ordered itinerary;
- important times;
- drive/walk durations where relevant;
- booking status for timed items;
- tonight's hotel;
- anything that still needs attention soon.

The user should not need to open multiple screens to understand the day.

## 4.2 In the car: "Take me there"
The user sees the next place and taps **Navigate**.

The app opens the configured map/navigation destination directly.

No address copying should be necessary.

## 4.3 At a place: "What do we need to know?"
The user opens the place/activity and can quickly see:

- relevant operational details;
- booking status/time;
- notes;
- website;
- navigation;
- phone if applicable;
- booking/ticket link if applicable.

## 4.4 Evening: "What are we doing tomorrow?"
Today should include a compact tomorrow preview.

It should also surface anything that should be done now for tomorrow or the following days.

Example:

- Fuente Dé cable car — not booked.
- Cares access bus — still needs booking.
- Las Médulas — recheck trail access.

## 4.5 Bad weather / change of mind: "What else can we do?"
The user opens Explore and browses the complete activity library.

The full researched set of alternatives should remain available rather than being removed after planning.

## 4.6 Hotel arrival
The user should be able to access tonight's hotel directly from Today and see:

- check-in;
- check-out;
- breakfast;
- dinner if relevant;
- parking;
- phone;
- website;
- booking link;
- notes;
- Navigate.

## 4.7 Small itinerary adjustment
Examples:

- Mark the cable car as booked.
- Save the booking time.
- Add a note to an activity.
- Add a restaurant reservation.
- Change tomorrow's departure time.
- Add a new stop.
- Mark something skipped.
- Add a useful website or navigation link.

These should not require GitHub or an AI coding agent.

## 4.8 Sharing the latest trip state between phones
Version 1 does not automatically synchronize devices.

A user should be able to:

1. Export the full current trip data to one JSON file.
2. Share the file with the other phone.
3. Import it.
4. Replace the current local trip state after explicit confirmation.

---

# 5. Main Navigation

Recommended primary navigation:

- **Today**
- **Trip**
- **Explore**
- **More**

Do not add extra primary tabs unless actual usage justifies them.

Bookings should be available contextually and through More rather than requiring a permanent main navigation tab.

---

# 6. Today Page

Today is the most important page in the application.

It should prioritize operational information over description.

## 6.1 Header

Show:

- current trip date;
- day number if useful;
- concise title or route.

Example:

**Tue 22 Sep**  
**Llanes → El Soplao → Potes**

Avoid large decorative headers.

## 6.2 Today's itinerary

Show an ordered timeline/list.

Each row may contain:

- time, when known;
- place/activity name;
- concise secondary information;
- status;
- relevant warning;
- quick action or detail affordance.

Examples of secondary information:

- 45 min drive;
- 3 hour walk;
- booked 09:10;
- optional;
- moderate;
- arrive 30 min early.

The timeline should be understandable at a glance.

## 6.3 Direct place actions

Where useful, itinerary items should expose or lead immediately to:

- Navigate;
- Website;
- Call;
- Booking/ticket.

Do not make the user search for an address.

## 6.4 Tonight / Hotel section

Hotel information must be easy to access from Today.

Show at minimum:

- hotel name;
- city/location;
- check-in;
- breakfast if useful for the next morning;
- parking note if important;
- booking status if relevant.

Primary action:

- **Navigate**

Secondary actions where available:

- Call;
- Website;
- Open booking.

Tapping the hotel opens its detail page.

## 6.5 Tomorrow preview

Show a compact preview containing:

- date;
- title/route;
- key timed activity;
- important departure implication if relevant.

Tapping it opens that future day.

## 6.6 Needs attention / Upcoming actions

Show unresolved items that matter in the next few days.

Examples:

- booking required but still pending;
- access/trail needs rechecking;
- hotel requires arrival confirmation;
- bike shuttle not confirmed.

Each action should include:

- what;
- when;
- status;
- useful direct action where possible.

Avoid showing already-resolved items unless there is a reason.

---

# 7. Trip Page

The Trip page answers:

**"What have we planned on the other days?"**

## 7.1 Day-based, not hotel-based

Show every actual vacation day, not just the six accommodation bases.

The complete trip contains 13 calendar days including travel-home day.

## 7.2 Day row contents

Each day should show:

- date;
- day title/route;
- concise summary;
- important metadata.

Useful metadata may include:

- total driving;
- walk/ride duration;
- booking required;
- hotel change;
- weather-sensitive.

## 7.3 Interaction

Tapping a day opens the same day-detail structure used by Today.

"Today" is therefore conceptually just the currently active trip day.

This avoids maintaining separate content models for Current Day and Future Day.

---

# 8. Explore Page

Explore preserves the complete researched activity/place library.

It exists primarily for alternatives, browsing, and lookup during the trip.

## 8.1 Search

Provide text search across at least:

- place/activity name;
- base/region;
- type;
- description;
- notes/tags if available.

## 8.2 Filters

Useful filters may include:

- location/base;
- activity type;
- duration;
- effort;
- weather suitability;
- booking required;
- booked/not booked;
- optional/current plan.

Do not implement excessive filters before the core browsing experience works.

## 8.3 Activity rows/cards

Photography is not required.

Each item should show useful scan information such as:

- name;
- type;
- duration;
- effort;
- booking requirement/status;
- weather relevance;
- short summary.

Primary actions:

- Navigate;
- Website.

Tapping the item opens the detail page.

---

# 9. Place / Activity Detail Pages

The data model should support shared common fields plus type-specific information.

Do not force every place type into an identical flat set of fields.

## 9.1 Common fields

Most real-world entities may support:

- id;
- name;
- type;
- short description;
- navigation target/link;
- website;
- phone;
- notes;
- booking information;
- external booking/document link;
- associated day(s).

## 9.2 Hotel-specific information

Hotels may additionally contain:

- check-in time/window;
- check-out time;
- breakfast time;
- dinner/restaurant information;
- parking information;
- stay dates;
- number of nights;
- room/request notes;
- arrival requirements.

The hotel detail page should make these fields prominent.

## 9.3 Activity-specific information

Activities may additionally contain:

- duration;
- distance;
- effort;
- weather dependence;
- access notes;
- arrival-before time;
- booking required;
- booking status;
- booked time;
- opening/timing note.

## 9.4 Restaurant-specific information

Restaurants may additionally contain:

- reservation status;
- reservation time;
- reservation name;
- opening note;
- meal note.

## 9.5 Navigation action

For any place with a location, **Navigate** should be the most prominent action.

The navigation target may be:

- a maps URL;
- coordinates;
- a place URL/query suitable for the chosen mapping provider.

The user should never need to manually copy the address from the app.

## 9.6 Website action

If an official or useful website exists, it should be one tap away.

This is important for attractions where the user may need:

- live opening information;
- tickets;
- weather/access notices;
- current visitor information.

## 9.7 Notes

Users should be able to add/edit simple notes to:

- a day;
- a hotel;
- an activity;
- a restaurant;
- another place/item.

Notes do not need complicated formatting.

---

# 10. Add / Edit Functionality

Small trip edits are a core feature.

The app should provide a simple editing experience optimized for use on a phone.

## 10.1 Supported edits

At minimum:

- change an item time;
- mark booking status;
- save booking/reservation time;
- add/edit a note;
- add/edit navigation link;
- add/edit website link;
- change day association;
- add a new activity/place;
- add a restaurant reservation;
- add a simple note;
- delete a user-created item;
- optionally mark items skipped/done.

## 10.2 Add new item

The form should allow creating at least:

- Activity;
- Hotel;
- Restaurant;
- Note.

Only a small number of fields should be mandatory.

For a generic activity, the minimum should be approximately:

- name;
- day.

Everything else should be optional.

## 10.3 Editing philosophy

Do not build a complex CMS.

The goal is to support practical changes in seconds.

---

# 11. Booking Model

The app should store operational booking state, not necessarily the sensitive booking document.

Useful booking information may include:

- booking required: yes/no;
- booking status;
- booked date/time;
- arrival-before time;
- reservation name;
- optional booking reference;
- external booking/document link;
- note.

Sensitive PDFs and tickets should live in Google Drive.

The application may link to the Drive document/folder.

---

# 12. Google Drive / Sensitive Documents

Sensitive material should not be bundled into the deployed PWA or public/static repository.

Examples:

- boarding passes;
- flight PDFs;
- hotel confirmations;
- rental agreements;
- attraction tickets;
- insurance documents;
- QR/barcodes.

Store these in a shared Google Drive folder restricted to the travellers' Google accounts.

The app should store only the minimum practical metadata needed for the trip plus an optional link to the relevant Drive file/folder.

Do not assume "anyone with link" sharing.

---

# 13. Data Storage

## 13.1 Canonical local trip data

Version 1 should use one canonical trip data structure per device.

Do not implement a base-data plus override-data merge system.

The loaded trip state should represent the current truth of the trip on that device.

## 13.2 One file vs multiple files

The conceptual source of truth should be one complete trip dataset.

The implementation may physically split data internally if necessary for maintainability, but import/export must produce a single portable trip file.

The dataset is small enough that file size is not a concern.

## 13.3 Data relationships

Avoid duplicating reusable information.

Example:

Hotel El Jisu should exist once as a hotel entity.

Multiple days can reference it.

A day should not contain a separate copy of the hotel's full check-in, breakfast, phone, and parking information.

The same principle applies to activities reused in Explore and the itinerary.

## 13.4 Typed entities

The data model should differentiate types so type-specific information remains easy to represent.

At minimum consider:

- hotel;
- activity;
- restaurant;
- note;
- possibly transport or generic place if needed.

Use shared common fields plus type-specific sections/properties.

---

# 14. Export / Import

This is the version 1 solution for sharing edits between phones.

## 14.1 Export

Provide an action under More such as:

**Export trip data**

It should export the complete current trip state as a JSON file.

The export should include user edits and newly created items.

## 14.2 Import

Provide:

**Import trip data**

The user selects a previously exported file.

Before replacing local state:

- validate that the file is structurally compatible;
- show a clear confirmation;
- warn that the current local trip state will be replaced;
- ideally offer an automatic backup/export first.

Do not silently merge imported data with the existing state in version 1.

## 14.3 Versioning

The exported dataset should contain a schema/version identifier so future application versions can detect incompatible or older formats.

Detailed migration logic can remain simple initially.

---

# 15. Offline Behaviour

Offline reliability is important.

## 15.1 Must work offline

After initial load/install, users should still be able to access:

- Today;
- Trip;
- Explore;
- place details;
- hotel information;
- notes;
- booking status;
- locally stored edits.

The core app shell and trip data should be cached locally.

## 15.2 External actions

These may require internet unless separately cached by the external app:

- websites;
- Google Drive;
- live ticket pages;
- live weather;
- web-based Maps data.

Navigation should hand off to the installed mapping application wherever possible.

Users can independently download offline map areas in their mapping app.

## 15.3 Offline edits

Preferred behaviour:

- local edits should still save while offline because the trip state is local-first.

No cloud synchronization is required in version 1.

---

# 16. More Page

More contains useful but less frequently accessed tools.

Suggested sections:

## 16.1 Bookings overview
A complete list of items that are:

- booked;
- pending;
- need checking.

This is an audit view, not the primary day-to-day interaction.

Important booking tasks should still surface contextually on Today.

## 16.2 Documents
Links to:

- shared Google Drive trip folder;
- relevant booking folders/files if useful.

## 16.3 Export / Import
- Export trip data.
- Import trip data.

## 16.4 Practical information
Optional items:

- emergency numbers;
- insurance contact;
- rental car assistance;
- airline contact;
- trip notes.

Avoid turning More into a large travel encyclopedia.

---

# 17. Visual / UX Requirements

## 17.1 No image dependency
The core app should work and look complete without destination photography.

Do not use large scenic images as layout elements.

## 17.2 Clear hierarchy
Prioritize:

1. time;
2. place/activity;
3. status/action;
4. concise secondary information.

## 17.3 Actions
Large, obvious tap targets.

Use consistent placement/naming.

For example:

- Navigate is primary for real-world places.
- Website is secondary.
- Call and Booking appear when relevant.

## 17.4 Avoid card overload
Do not put every piece of content in a large rounded card.

Use:

- whitespace;
- section headings;
- dividers;
- compact rows;
- cards only where they materially group information.

## 17.5 Mobile first
Design for phone use first.

Desktop responsiveness is useful for development but not the primary target.

---

# 18. Technical Setup

## 18.1 Frontend stack

Use:

- React;
- TypeScript;
- Vite.

Keep dependencies modest.

The application should be understandable and maintainable by an AI coding agent.

## 18.2 PWA

The app should be installable as a Progressive Web App.

Requirements include:

- application manifest;
- app icons;
- offline caching/service worker;
- standalone/mobile-friendly behavior;
- safe update behavior.

A newly deployed version should not make the existing installed app unusable if connectivity is unavailable.

## 18.3 Local persistence

Store current trip data locally on the device.

Use a durable browser storage mechanism appropriate for structured application data.

Do not depend solely on an in-memory React state.

## 18.4 Repository

Use a private GitHub repository.

Repository contents should include:

- React application;
- trip data used for initial/default setup;
- project documentation;
- AI agent instructions;
- tests/build checks;
- deployment workflow.

Do not commit sensitive ticket PDFs or personal documents.

## 18.5 AI-agent friendliness

Include a root-level agent instruction file/document explaining at least:

- this is an active travel companion;
- preserve offline functionality;
- preserve import/export compatibility;
- prefer small, low-risk changes;
- do not add personal/sensitive documents to the repository;
- run project validation/build checks before proposing a change;
- preserve mobile usability;
- avoid unnecessary refactors during the live trip.

## 18.6 Deployment

The app should be statically deployable from the GitHub repository.

The implementation should remain hosting-provider agnostic.

Possible deployment choices include GitHub Pages or authenticated static hosting.

Important privacy consideration:

Even if the repository is private, a normal public static deployment may expose the itinerary. Do not place highly sensitive information in the deployed dataset.

The hosting/privacy choice can be finalized separately without changing the application architecture.

## 18.7 AI changes while travelling

The repository should support cloud-based AI coding workflows so application improvements can be made without leaving a home PC running.

Routine itinerary edits must not depend on this.

Use AI/code changes for:

- bug fixes;
- layout improvements;
- new filters;
- changed app behavior;
- technical improvements.

Use in-app editing for:

- booking status/time;
- notes;
- restaurants;
- added activities;
- changed day plans.

---

# 19. Initial Source Data

The existing vacation planning HTML is the source material for the initial dataset.

Important categories already present include:

- 13 day-by-day plans;
- six hotel stays;
- hotel check-in/check-out/breakfast details;
- driving durations;
- walking/ride durations;
- timed/bookable attractions;
- weather-dependent day choices;
- restaurant ideas;
- full activity library;
- booking checklist;
- pre-trip notes;
- Google Maps links;
- external information links.

The implementation process should transform that planning material into structured trip entities rather than simply embed or reproduce the existing HTML.

The detailed planning document can remain as a reference/archive.

---

# 20. Current Trip Structure to Preserve

The current high-level bases are:

- Llanes;
- Camaleño / Potes;
- León;
- Orellán / Las Médulas;
- San Martín de Teverga;
- Avilés.

The trip includes planned activities such as:

- Lagos de Covadonga;
- El Soplao;
- Fuente Dé / Áliva;
- Cares Gorge;
- León;
- Palacio de Canedo;
- Las Médulas;
- Astorga;
- Senda del Oso;
- Oviedo;
- Avilés.

The complete source planning document should be consulted while creating the initial structured data so useful details and alternatives are not lost.

---

# 21. Acceptance Criteria

Version 1 is successful when the following can be demonstrated on a phone.

## Today
- Open the app and understand today's plan within a few seconds.
- Navigate directly to a planned place.
- Navigate directly to tonight's hotel.
- See hotel check-in and breakfast information.
- See tomorrow's plan.
- See unresolved near-term booking actions.

## Trip
- Browse every day of the vacation.
- Open any future/past day.

## Explore
- Search or browse the full activity library.
- Open an activity.
- Navigate to it.
- Open its website.

## Details
- Hotel fields display hotel-specific information.
- Activity fields display activity-specific information.
- Restaurant fields display reservation-specific information.

## Editing
- Add a note.
- Mark an activity booked.
- Save a booking time.
- Add a restaurant reservation.
- Add a new activity/place.
- See the change immediately in the relevant day.

## Persistence
- Reload/reopen the PWA and retain edits.

## Import/export
- Export the complete current trip state.
- Import that file on another device.
- Have the second device show the same current trip state.

## Offline
- Reopen the installed app without network access.
- View the itinerary, Explore data, hotels, and notes.

## Privacy
- No sensitive ticket PDFs or booking documents are bundled into the deployed app.
- External private documents remain in restricted Google Drive storage.

---

# 22. Priorities for Implementation

Recommended implementation order:

1. Define the trip data model and schema/versioning.
2. Transform the existing vacation plan into the initial dataset.
3. Implement local persistence.
4. Build the Today page.
5. Build reusable day/detail navigation.
6. Build Trip.
7. Build place/activity/hotel detail pages.
8. Add direct Navigate / Website / Call actions.
9. Build Explore.
10. Add small edit/add forms.
11. Add export/import.
12. Add More / booking overview / Drive shortcuts.
13. Add PWA installation and offline caching.
14. Test the full app on actual phones.
15. Only then consider cloud synchronization or other enhancements.

---

# 23. Key Product Decision Summary

- **React + TypeScript + Vite.**
- **PWA, mobile-first and offline-capable.**
- **Functionality and clarity over visuals.**
- **No decorative destination imagery required.**
- **Today is the primary screen.**
- **Trip shows every day.**
- **Explore preserves the full researched activity library.**
- **Real-world places provide direct Navigate and Website actions.**
- **Tonight's hotel is highly visible on Today.**
- **Hotels/activities/restaurants have type-specific fields.**
- **Small edits happen inside the app.**
- **One current trip state per device.**
- **No cloud sync in version 1.**
- **Export/import one complete JSON file to share between phones.**
- **Sensitive documents remain in restricted Google Drive storage.**
- **Private GitHub repository for source code.**
- **Static deployment and cloud AI coding workflow supported.**
- **AI development is optional for trip operation; the app must remain useful without it.**
