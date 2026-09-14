import type { Booking, Day, Entity, Trip } from './trip'

export type Item = Day['items'][number]
export const emptyBooking = (): Booking => ({ required: null, status: 'unknown', notes: '' })
export const bookingLabel = (booking?: Booking) => booking?.status === 'booked' ? 'Confirmed' : booking?.status === 'not-needed' ? 'Not needed' : booking?.status === 'needs-check' ? 'Needs checking' : booking?.status ?? 'unknown'
export function newEntity(type: Entity['type']): Entity {
  const common = { id: crypto.randomUUID(), name: '', region: '', description: '', notes: '', tags: [], links: [], facts: [], userCreated: true }
  switch (type) {
    case 'hotel': return { ...common, type, hotel: { checkIn: '', checkOut: '', breakfast: '', dinner: '', parking: '', arrivalRequirements: '', roomNotes: '' } }
    case 'restaurant': return { ...common, type, restaurant: { mealNote: '', openingNote: '' } }
    case 'note': return { ...common, type, note: { body: '' } }
    case 'transport': return { ...common, type, transport: { mode: 'other', details: '' } }
    default: return { ...common, type: 'activity', activity: { duration: '', distance: '', effort: '', weather: '', accessNotes: '', bookingRequirement: '', timingNote: '' } }
  }
}
export function schedule(trip: Trip, entity: Entity, dayId: string): Trip {
  const next = structuredClone(trip)
  const day = next.days.find(d => d.id === dayId)
  if (!day) throw new Error('Choose a day.')
  if (entity.type === 'hotel') {
    if (day.date === trip.endDate) throw new Error('The final trip day has no overnight stay. Choose an earlier day.')
    const stay = { id: crypto.randomUUID(), hotelId: entity.id, checkInDate: day.date, checkOutDate: new Date(Date.parse(day.date) + 86400000).toISOString().slice(0, 10), booking: emptyBooking() }
    next.stays.push(stay)
    day.stayId = stay.id
    return next
  }
  day.items.push({ id: crypto.randomUUID(), title: entity.name, description: '', entityIds: [entity.id], optional: false, status: 'planned', notes: '' })
  return next
}
export function removeEntity(trip: Trip, id: string): Trip {
  const entity = trip.entities.find(e => e.id === id)
  if (!entity?.userCreated) throw new Error('Only traveller-created places can be deleted.')
  if (trip.days.some(d => d.items.some(i => i.entityIds.includes(id))) || trip.stays.some(s => s.hotelId === id) || trip.actions.some(a => a.entityIds.includes(id))) throw new Error('This place is still used. Remove its visits, stays and action associations first.')
  return { ...trip, entities: trip.entities.filter(e => e.id !== id) }
}
export function moveItem(trip: Trip, itemId: string, dayId: string, position?: number): Trip {
  const next = structuredClone(trip)
  const from = next.days.find(d => d.items.some(i => i.id === itemId))
  const to = next.days.find(d => d.id === dayId)
  if (!from || !to) throw new Error('Visit or destination day is missing.')
  const index = from.items.findIndex(i => i.id === itemId)
  const [item] = from.items.splice(index, 1)
  to.items.splice(position ?? to.items.length, 0, item)
  return next
}
// Source relationships are derived for old version-1 files too; no seed is merged into saved data.
const sourceTargets: Record<string, { items?: string[]; stays?: string[]; days?: string[] }> = {
  'action-1': { stays: ['stay-5'] }, 'action-2': { stays: ['stay-3'] },
  'action-3': { stays: ['stay-1', 'stay-6'] }, 'action-4': { stays: ['stay-2'] },
  'action-5': { stays: ['stay-4'] }, 'action-6': { days: ['day-1', 'day-13'] },
  'action-7': { items: ['day-4-item-1'] }, 'action-8': { items: ['day-3-item-2'] },
  'action-9': { items: ['day-7-item-1'] }, 'action-10': { items: ['day-8-item-2', 'day-8-item-3'] },
  'action-11': { items: ['day-1-item-6'] }, 'action-12': { items: ['day-2-item-1'] },
  'action-13': { items: ['day-5-item-1'] }, 'action-14': { items: ['day-11-item-2', 'day-11-item-4'] },
  'action-15': { items: ['day-5-item-4'] }, 'action-16': { items: ['day-9-item-1'] },
}
export function actionTargets(trip: Trip, action: Trip['actions'][number]) {
  const source = trip.id === 'green-spain-2026' ? sourceTargets[action.id] : undefined
  const itemIds = action.itemIds ?? source?.items ?? []
  const stayIds = action.stayIds ?? source?.stays ?? []
  const visits = trip.days.flatMap(day => day.items.filter(i => itemIds.includes(i.id)).map(item => ({ day, item })))
  const stays = trip.stays.filter(s => stayIds.includes(s.id))
  const dayIds = [...action.dayIds, ...(source?.days ?? []), ...visits.map(v => v.day.id), ...trip.days.filter(d => stays.some(s => s.id === d.stayId)).map(d => d.id)]
  return { visits, stays, dayIds }
}
export function actionDone(trip: Trip, action: Trip['actions'][number]) {
  const { visits, stays } = actionTargets(trip, action)
  const bookings = [...visits.map(v => v.item.booking), ...stays.map(s => s.booking)]
  // The original hotel-board rows predate confirmed stay data. Resolve them from the
  // stay bookings for existing device data as well as newly generated seeds.
  const canonicalHotelAction = trip.id === 'green-spain-2026' && ['action-1', 'action-2', 'action-3', 'action-4', 'action-5'].includes(action.id)
  if (canonicalHotelAction && stays.length > 0) return stays.every(stay => ['booked', 'not-needed'].includes(stay.booking.status))
  if (actionUsesBookings(trip, action)) return bookings.every(b => b?.status === 'booked' || b?.status === 'not-needed')
  return action.status === 'done'
}
export function actionUsesBookings(trip: Trip, action: Trip['actions'][number]) {
  const targets = actionTargets(trip, action)
  return action.kind === 'booking' && targets.visits.length + targets.stays.length > 0
}
export function nearActions(trip: Trip, day: Day) {
  const end = new Date(Date.parse(day.date) + 2 * 86400000).toISOString().slice(0, 10)
  return trip.actions.filter(a => {
    if (actionDone(trip, a)) return false
    const targets = actionTargets(trip, a)
    const dates = trip.days.filter(d => targets.dayIds.includes(d.id)).map(d => d.date)
    return dates.some(date => date >= day.date && date <= end) || Boolean(a.dueDate && a.dueDate <= end && (!dates.length || dates.some(date => date >= day.date))) || (!dates.length && day.id === trip.days[0].id)
  })
}
export function choiceGroup(trip: Trip, item: Item) {
  return item.choiceGroup ?? (trip.id === 'green-spain-2026' && ['day-12-item-2', 'day-12-item-3'].includes(item.id) ? 'Day 12 morning: Las Xanas or Naranco' : undefined)
}
export function selectChoice(trip: Trip, itemId: string): Trip {
  const next = structuredClone(trip)
  const item = next.days.flatMap(d => d.items).find(i => i.id === itemId)
  if (!item) throw new Error('Visit is missing.')
  const group = choiceGroup(next, item)
  if (group) next.days.flatMap(d => d.items).filter(i => choiceGroup(next, i) === group).forEach(i => { i.status = i.id === itemId ? 'planned' : 'skipped' })
  return next
}
