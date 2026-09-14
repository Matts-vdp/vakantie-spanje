import { describe, expect, it } from 'vitest'
import seed from '../data/initial-trip.json'
import { parseTrip, serializeTrip } from './trip'
import { activeDay, tripDate } from './dates'

describe('source dataset and portable schema', () => {
  it('contains the full trip, with reusable hotels and library entities', () => {
    const trip = parseTrip(seed)
    expect(trip.days).toHaveLength(13)
    expect(trip.stays).toHaveLength(6)
    expect(trip.entities.filter((e) => e.type === 'activity')).toHaveLength(68)
    expect(trip.entities.filter((e) => e.type === 'hotel')).toHaveLength(6)
    expect(trip.days.filter((d) => d.stayId === 'stay-2')).toHaveLength(3)
    expect(trip.days[12].stayId).toBeUndefined()
    expect(trip.days[1].items[1].entityIds).toContain('opt-covadonga')
    expect(trip.stays.every((s) => s.booking.status === 'unknown')).toBe(true)
  })
  it('round-trips edits and user-created entities in a single JSON document', () => {
    const trip = parseTrip(seed)
    trip.days[0].notes = 'Meet at the airport café ☕'
    trip.entities.push({ id: 'my-note', type: 'note', name: 'Remember this', region: '', description: '', notes: '', tags: [], links: [], facts: [], userCreated: true, note: { body: 'Bring a towel' } })
    expect(parseTrip(JSON.parse(serializeTrip(trip)))).toEqual(trip)
  })
  it('rejects incompatible schemas, malformed dates, duplicate IDs and broken references', () => {
    expect(() => parseTrip({ ...seed, schemaVersion: 99 })).toThrow()
    expect(() => parseTrip({ ...seed, timezone: 'Never/Here' })).toThrow()
    const broken = structuredClone(seed)
    broken.days[0].date = '2026-02-31'
    expect(() => parseTrip(broken)).toThrow()
    const duplicate = parseTrip(seed); duplicate.entities.push(duplicate.entities[0])
    expect(() => parseTrip(duplicate)).toThrow('Duplicate entity ID')
    const dangling = parseTrip(seed); dangling.days[0].items[0].entityIds = ['missing']
    expect(() => parseTrip(dangling)).toThrow('Missing entity')
    const overnight = parseTrip(seed); overnight.days[2].stayId = 'stay-1'
    expect(() => parseTrip(overnight)).toThrow('Invalid overnight stay')
  })
  it('rejects script links before importing or persisting', () => {
    const trip = parseTrip(seed); trip.entities[0].navigationUrl = 'javascript:alert(1)'
    expect(() => parseTrip(trip)).toThrow()
  })
  it('migrates v1 without mutating it or merging seed updates, and validates migrated data', () => {
    const legacy = { ...structuredClone(seed), schemaVersion: 1 }
    legacy.days[0].notes = 'Keep traveller edits'
    legacy.entities[0].name = 'Edited place name'
    legacy.actions[0].status = 'done'
    const migrated = parseTrip(legacy)
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.days[0].notes).toBe('Keep traveller edits')
    expect(migrated.entities[0].name).toBe('Edited place name')
    expect(migrated.actions[0].status).toBe('done')
    expect(legacy.schemaVersion).toBe(1)
    legacy.days[0].items[0].entityIds = ['missing']
    expect(() => parseTrip(legacy)).toThrow('Missing entity')
  })
})

describe('trip calendar', () => {
  it('uses midnight in Spain, independent of the device timezone', () => {
    expect(tripDate(new Date('2026-09-20T22:30:00Z'), 'Europe/Madrid')).toBe('2026-09-21')
    expect(activeDay(parseTrip(seed), new Date('2026-09-20T22:30:00Z')).day.id).toBe('day-2')
  })
  it('previews the first day before departure and the final day after returning', () => {
    const trip = parseTrip(seed)
    expect(activeDay(trip, new Date('2026-09-14T12:00:00Z'))).toMatchObject({ phase: 'before', day: { id: 'day-1' } })
    expect(activeDay(trip, new Date('2026-10-04T12:00:00Z'))).toMatchObject({ phase: 'after', day: { id: 'day-13' } })
  })
})
