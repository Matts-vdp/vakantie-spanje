import { describe, expect, it } from 'vitest'
import seed from '../data/initial-trip.json'
import { itemTimeLabel, resolveItemKind } from './itinerary'
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

  it('formats exact times and time windows for the timeline', () => {
    const item = structuredClone(trip.days[0].items[0])
    expect(itemTimeLabel({ ...item, time: '09:20', endTime: '11:15' })).toBe('09:20–11:15')
    expect(itemTimeLabel({ ...item, time: undefined, endTime: undefined })).toBe('Flex')
  })
})
