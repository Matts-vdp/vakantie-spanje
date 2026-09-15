import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { parseTrip } from '../src/domain/trip.ts'

const seedPath = 'src/data/initial-trip.json'
const raw = readFileSync(seedPath, 'utf8')
const input = JSON.parse(raw)
const trip = parseTrip(input)

// The canonical seed must already use the current portable schema. In-memory
// migrations are for imported or persisted traveller data, not this source file.
if (trip.schemaVersion !== input.schemaVersion) {
  throw new Error(`Canonical seed uses schema v${input.schemaVersion}; update it to v${trip.schemaVersion}.`)
}

// Zod strips unknown keys and applies defaults. Reject either in the canonical
// source so a typo or incomplete edit cannot silently change during load/export.
if (!isDeepStrictEqual(trip, input)) {
  throw new Error('Canonical seed contains unknown fields or relies on schema defaults. Store the validated shape explicitly.')
}

const failures = []
const warnings = []
const fail = (message) => failures.push(message)
const warn = (message) => warnings.push(message)
const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))]
const rejectDuplicateRefs = (owner, refs) => {
  const duplicates = duplicateValues(refs)
  if (duplicates.length) fail(`${owner} repeats references: ${duplicates.join(', ')}`)
}

const allItems = trip.days.flatMap((day) => day.items.map((item) => ({ day, item })))
const choiceGroups = new Map()
const actionLinkedItems = new Set(trip.actions.flatMap((action) => action.itemIds ?? []))

for (const { day, item } of allItems) {
  rejectDuplicateRefs(item.id, item.entityIds)
  if (item.endTime && !item.time) fail(`${item.id} has an end time without a start time`)
  if (item.time && item.endTime && item.endTime <= item.time) fail(`${item.id} has a non-increasing time range`)
  if (item.choiceGroup) choiceGroups.set(item.choiceGroup, [...(choiceGroups.get(item.choiceGroup) ?? []), item.id])
  if (item.booking?.required === true && item.booking.status === 'not-needed') fail(`${item.id} requires booking but is marked not needed`)
  if (item.booking?.required === false && ['pending', 'booked'].includes(item.booking.status)) fail(`${item.id} does not require booking but has ${item.booking.status} booking state`)
  if (['drive', 'walk', 'visit', 'stay', 'bike'].includes(item.kind) && item.entityIds.length === 0 && !actionLinkedItems.has(item.id)) {
    warn(`${day.id}/${item.id} has no linked entity or direct action`)
  }
}

for (const [group, itemIds] of choiceGroups) {
  if (itemIds.length < 2) fail(`Choice group "${group}" has only one itinerary item`)
}

for (const action of trip.actions) {
  rejectDuplicateRefs(action.id, action.entityIds)
  rejectDuplicateRefs(action.id, action.dayIds)
  rejectDuplicateRefs(action.id, action.itemIds ?? [])
  rejectDuplicateRefs(action.id, action.stayIds ?? [])
  if (![action.entityIds, action.dayIds, action.itemIds ?? [], action.stayIds ?? []].some((refs) => refs.length)) {
    warn(`${action.id} is not linked to a day, visit, stay or entity`)
  }
}

for (const stay of trip.stays) {
  if (stay.booking.required === true && stay.booking.status === 'not-needed') fail(`${stay.id} requires booking but is marked not needed`)
  if (stay.booking.required === false && ['pending', 'booked'].includes(stay.booking.status)) fail(`${stay.id} does not require booking but has ${stay.booking.status} booking state`)
}

const serializedSeed = JSON.stringify(input)
for (const artifact of ['UBERFINAL', 'source’s first choice', "source's first choice"]) {
  if (serializedSeed.includes(artifact)) fail(`Canonical seed still contains conversion artifact: ${artifact}`)
}

if (failures.length) throw new Error(`Canonical seed quality checks failed:\n- ${failures.join('\n- ')}`)
if (warnings.length) console.warn(`Canonical seed quality warnings:\n- ${warnings.join('\n- ')}`)

const visits = trip.days.reduce((count, day) => count + day.items.length, 0)
console.log(`Canonical seed is valid: ${trip.days.length} days, ${trip.stays.length} stays, ${trip.entities.length} entities and ${visits} visits.`)
