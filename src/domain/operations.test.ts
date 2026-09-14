import { describe, expect, it } from 'vitest'
import seed from '../data/initial-trip.json'
import { parseTrip, serializeTrip } from './trip'
import { actionDone, actionTargets, emptyBooking, moveItem, nearActions, newEntity, removeEntity, schedule, selectChoice } from './operations'

describe('phase 2 canonical trip operations', () => {
  it('moves a booked visit without duplicating it or breaking its action relationship', () => {
    const trip = parseTrip(seed)
    trip.days[2].items[1].booking = { ...emptyBooking(), status: 'booked', time: '10:00' }
    const moved = parseTrip(moveItem(trip, 'day-3-item-2', 'day-5', 0))
    expect(moved.days[4].items[0].booking?.time).toBe('10:00')
    expect(moved.days.flatMap(d => d.items).filter(i => i.id === 'day-3-item-2')).toHaveLength(1)
    expect(actionTargets(moved, moved.actions[7]).dayIds).toEqual(['day-5'])
    expect(actionDone(moved, moved.actions[7])).toBe(true)
    moved.days[4].items[0].booking!.status = 'pending'
    expect(actionDone(moved, moved.actions[7])).toBe(false)
  })
  it('keeps multi-booking and operational confirmations honest', () => {
    const trip = parseTrip(seed)
    trip.days[7].items[1].booking = { ...emptyBooking(), status: 'booked' }
    expect(actionDone(trip, trip.actions[9])).toBe(false)
    trip.days[7].items[2].booking = { ...emptyBooking(), status: 'not-needed' }
    expect(actionDone(trip, trip.actions[9])).toBe(true)
    trip.stays[1].booking.status = 'booked'
    expect(actionDone(trip, trip.actions[3])).toBe(false)
    trip.actions[3].status = 'done'
    expect(actionDone(trip, trip.actions[3])).toBe(true)
  })
  it('protects shared places and deletes only unused traveller-created entities', () => {
    let trip = parseTrip(seed)
    const entity = { ...newEntity('restaurant'), name: 'Lunch stop' }
    trip.entities.push(entity)
    trip = schedule(trip, entity, 'day-1')
    expect(() => removeEntity(trip, entity.id)).toThrow('still used')
    trip.days[0].items.pop()
    expect(removeEntity(trip, entity.id).entities.some(e => e.id === entity.id)).toBe(false)
    expect(() => removeEntity(trip, trip.entities[0].id)).toThrow('Only traveller-created')
  })
  it('assigns a reusable hotel as an overnight stay and rejects the final night', () => {
    const trip = parseTrip(seed)
    const hotel = trip.entities.find(e => e.type === 'hotel')!
    const next = parseTrip(schedule(trip, hotel, 'day-3'))
    expect(next.stays.at(-1)?.hotelId).toBe(hotel.id)
    expect(next.days[2].stayId).toBe(next.stays.at(-1)?.id)
    expect(() => schedule(trip, hotel, 'day-13')).toThrow('final trip day')
  })
  it('supports old v1 exports without reseeding and preserves all additive fields', () => {
    const legacy = parseTrip(seed)
    legacy.days.forEach(d => d.items.forEach(i => { delete i.choiceGroup }))
    legacy.days[0].notes = 'Existing traveller data'
    const parsed = parseTrip({ ...JSON.parse(serializeTrip(legacy)), schemaVersion: 1 })
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.days[0].notes).toBe('Existing traveller data')
    const chosen = selectChoice(parsed, 'day-12-item-2')
    expect(chosen.days[11].items[2].status).toBe('skipped')
    expect(chosen.entities.some(e => e.id === 'opt-naranco')).toBe(true)
    chosen.days[0].items[0].choiceGroup = 'A or B'
    chosen.days[0].items[0].booking = { ...emptyBooking(), bookingUrl: 'https://example.com/booking' }
    chosen.actions[0].itemIds = [chosen.days[0].items[0].id]
    chosen.actions[0].stayIds = [chosen.stays[0].id]
    expect(parseTrip(JSON.parse(serializeTrip(chosen)))).toEqual(chosen)
    chosen.actions[0].itemIds = ['missing']
    expect(() => parseTrip(chosen)).toThrow('Missing visit')
  })
  it('surfaces a three-day window and overdue explicit deadlines without inventing dates', () => {
    const trip = parseTrip(seed)
    expect(nearActions(trip, trip.days[1]).map(a => a.id)).toContain('action-8')
    expect(nearActions(trip, trip.days[5]).map(a => a.id)).not.toContain('action-8')
    trip.actions[15].dueDate = trip.days[1].date
    expect(nearActions(trip, trip.days[2]).map(a => a.id)).toContain('action-16')
  })
})
