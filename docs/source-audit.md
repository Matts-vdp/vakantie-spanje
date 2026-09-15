# Source conversion audit

Historical record of the one-time conversion from the planning HTML. This file and the HTML are retained for provenance; `src/data/initial-trip.json` is now the authoritative maintained seed and is not regenerated from them.

- 13 calendar days, 6 hotel stays, 12 nights.
- 70 library activities, three transport entities, one library decision note, two named restaurants, six hotel entities.
- 71 itinerary rows, with shared entity references and separate rows for exclusive choices.
- 16 booking/check actions; 13 practical/context notes.
- All activity facts, tags, external links and notes retained. Daily background and choices retained as text, never embedded HTML.
- Original files remain unchanged and are not copied into the production build.

## Assumptions and review items

- Originally converted from the working plan; the canonical JSON is now maintained directly.
- Hotel stays, both flights and the rental car are confirmed from traveller feedback. Other reservations remain unknown until supplied.
- Dates are 20 September–2 October 2026, Europe/Madrid. Seed timestamp denotes the latest canonical-data review, not a user save.
- Mutually exclusive choices are separate optional itinerary entries in explicit choice groups; no automatic selection was made.
- Booking-board timing remains relative (This week / Final week); exact due dates need confirmation.
- Day 9 mentions Ponferrada; the library says it is closed Monday. This conflict is preserved for review.
- Day 12 requires choosing Las Xanas or Naranco. They do not fit together.
- No private document URLs, reservation names, references or sensitive documents were supplied.
- The September review added exact navigation targets for Playa de Toró and the Covadonga sanctuary, transport entities for the Covadonga and Cares buses and Asturias Airport, direct hotel/restaurant actions, structured time ranges and explicit booking state. Day 1, Day 2, Day 7 and Day 12 alternatives use editable exclusive choice groups.
- Official operator or tourism sources were checked for Covadonga, Cares, Fuente Dé, El Soplao, Palacio de Canedo, Asturias Airport, hotels and named restaurants. Unconfirmed slots and live access/weather conditions remain explicit rechecks rather than static claims.
- Keep-in-mind notices retain only actionable safety, access, weather, timing and choice constraints; repeated itinerary and planning-history cards are omitted.

At conversion time, hotel dates and operational notes had an explicit mapping in the legacy converter. The later canonical review filled verifiable gaps directly in JSON and preserved unresolved details as notes. Future corrections belong directly in the canonical JSON.
