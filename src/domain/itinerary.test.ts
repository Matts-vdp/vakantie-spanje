import { describe, expect, it } from 'vitest'
import seed from '../data/initial-trip.json'
import { resolveItemKind } from './itinerary'
import { parseTrip } from './trip'

describe('timeline item kinds', () => {
  const trip = parseTrip(seed)
  const entities = new Map(trip.entities.map((entity) => [entity.id, entity]))

  it('honours an explicit traveller choice', () => {
    const item = structuredClone(trip.days[0].items[0])
    item.kind = 'visit'
    item.title = 'Drive somewhere'
    expect(resolveItemKind(item, entities)).toBe('visit')
  })

  it('classifies legacy automatic entries from their current content', () => {
    const item = structuredClone(trip.days[0].items[0])
    item.kind = 'auto'
    item.entityIds = []
    item.title = 'Walk into the old town'
    expect(resolveItemKind(item, entities)).toBe('walk')
    item.title = 'Leave for the airport'
    expect(resolveItemKind(item, entities)).toBe('drive')
    item.title = 'Choose the morning plan'
    expect(resolveItemKind(item, entities)).toBe('other')
  })

  it('uses linked place types while letting the item title take priority', () => {
    const item = structuredClone(trip.days[0].items[0])
    item.kind = 'auto'
    item.title = 'Evening reservation'
    item.entityIds = ['restaurant-don-paco']
    expect(resolveItemKind(item, entities)).toBe('food')
    item.title = 'Walk back from dinner'
    expect(resolveItemKind(item, entities)).toBe('walk')
  })
})
