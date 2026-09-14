import { z } from 'zod'

const id = z.string().min(1)
const text = z.string()
const date = z.iso.date()
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const webUrl = z.url().refine((value) => ['https:', 'http:'].includes(new URL(value).protocol), 'Use an HTTP(S) link')
const link = z.object({ label: text, url: webUrl })
const fact = z.object({ label: text, value: text })
const booking = z.object({
  required: z.boolean().nullable(),
  status: z.enum(['unknown', 'not-needed', 'pending', 'booked', 'needs-check', 'cancelled']),
  date: date.optional(),
  time: time.optional(),
  arrivalBefore: time.optional(),
  reservationName: text.optional(),
  reference: text.optional(),
  documentUrl: webUrl.optional(),
  notes: text,
})
const common = {
  id,
  name: z.string().min(1),
  region: text,
  description: text,
  notes: text,
  tags: z.array(text),
  links: z.array(link),
  navigationUrl: webUrl.optional(),
  websiteUrl: webUrl.optional(),
  phone: text.optional(),
  facts: z.array(fact),
  sourceId: text.optional(),
  userCreated: z.boolean(),
}
export const entitySchema = z.discriminatedUnion('type', [
  z.object({ ...common, type: z.literal('hotel'), hotel: z.object({
    checkIn: text, checkOut: text, breakfast: text, dinner: text, parking: text,
    arrivalRequirements: text, roomNotes: text,
  }) }),
  z.object({ ...common, type: z.literal('activity'), activity: z.object({
    duration: text, distance: text, effort: text, weather: text, accessNotes: text,
    bookingRequirement: text, timingNote: text,
  }) }),
  z.object({ ...common, type: z.literal('restaurant'), restaurant: z.object({
    mealNote: text, openingNote: text,
  }) }),
  z.object({ ...common, type: z.literal('note'), note: z.object({ body: text }) }),
  z.object({ ...common, type: z.literal('transport'), transport: z.object({
    mode: z.enum(['flight', 'car', 'bus', 'bike', 'other']), details: text,
  }) }),
])
const itemSchema = z.object({
  id, title: z.string().min(1), description: text,
  entityIds: z.array(id),
  time: time.optional(),
  endTime: time.optional(),
  optional: z.boolean(),
  status: z.enum(['planned', 'done', 'skipped']),
  booking: booking.optional(),
  notes: text,
})
const daySchema = z.object({
  id, date, title: z.string().min(1), summary: text,
  facts: z.array(fact),
  items: z.array(itemSchema),
  stayId: id.optional(),
  notices: z.array(z.object({ title: text, body: text, kind: z.enum(['info', 'warning', 'choice']) })),
  background: z.array(text),
  notes: text,
})
const staySchema = z.object({ id, hotelId: id, checkInDate: date, checkOutDate: date, booking })
const actionSchema = z.object({
  id, title: text, description: text,
  timing: text,
  dueDate: date.optional(),
  entityIds: z.array(id),
  dayIds: z.array(id),
  status: z.enum(['pending', 'done']),
  kind: z.enum(['booking', 'access', 'confirmation', 'decision']),
})

export const tripSchema = z.object({
  schemaVersion: z.literal(1),
  id, name: z.string().min(1),
  timezone: z.string().refine((value) => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false }
  }, 'Unknown timezone'),
  startDate: date, endDate: date,
  updatedAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
  entities: z.array(entitySchema),
  stays: z.array(staySchema),
  days: z.array(daySchema).min(1),
  actions: z.array(actionSchema),
  practicalNotes: z.array(z.object({ title: text, body: text })),
  documentLinks: z.array(link),
  source: z.object({ file: text, sha256: text, notes: z.array(text) }),
}).superRefine((trip, ctx) => {
  const problem = (message: string) => ctx.addIssue({ code: 'custom', message })
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) problem(`Duplicate ${label}`)
  }
  unique(trip.entities.map((e) => e.id), 'entity ID')
  unique(trip.days.map((d) => d.id), 'day ID')
  unique(trip.days.map((d) => d.date), 'day date')
  unique(trip.stays.map((s) => s.id), 'stay ID')
  unique(trip.actions.map((a) => a.id), 'action ID')
  unique(trip.days.flatMap((d) => d.items.map((i) => i.id)), 'itinerary item ID')
  if (trip.startDate > trip.endDate) problem('Trip dates are reversed')
  if (trip.days[0].date !== trip.startDate || trip.days.at(-1)?.date !== trip.endDate) problem('Days must cover the trip dates')
  const entities = new Map(trip.entities.map((e) => [e.id, e]))
  const stays = new Map(trip.stays.map((s) => [s.id, s]))
  const days = new Set(trip.days.map((d) => d.id))
  const checkRefs = (refs: string[]) => refs.forEach((ref) => {
    if (!entities.has(ref)) problem(`Missing entity: ${ref}`)
  })
  trip.stays.forEach((stay) => {
    if (entities.get(stay.hotelId)?.type !== 'hotel') problem(`Stay ${stay.id} needs a hotel`)
    if (stay.checkInDate >= stay.checkOutDate) problem(`Invalid stay dates: ${stay.id}`)
  })
  trip.days.forEach((day, index) => {
    if (index && Date.parse(day.date) - Date.parse(trip.days[index - 1].date) !== 86_400_000) problem('Trip days must be consecutive and ordered')
    day.items.forEach((item) => checkRefs(item.entityIds))
    if (day.stayId) {
      const stay = stays.get(day.stayId)
      if (!stay || day.date < stay.checkInDate || day.date >= stay.checkOutDate) problem(`Invalid overnight stay on ${day.date}`)
    }
  })
  trip.actions.forEach((action) => {
    checkRefs(action.entityIds)
    action.dayIds.forEach((ref) => { if (!days.has(ref)) problem(`Missing day: ${ref}`) })
  })
})

export type Trip = z.infer<typeof tripSchema>
export type Entity = z.infer<typeof entitySchema>
export type Day = Trip['days'][number]
export type Booking = z.infer<typeof booking>

/** Boundary used by the seed, IndexedDB reads and future file imports. */
export function parseTrip(value: unknown): Trip {
  return tripSchema.parse(value)
}

export function serializeTrip(trip: Trip): string {
  return JSON.stringify(parseTrip(trip), null, 2)
}
