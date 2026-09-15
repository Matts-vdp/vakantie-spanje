import type { Day, Entity, ItemKind } from './trip'

type Item = Day['items'][number]

export const itemKindLabels: Record<ItemKind, string> = {
  auto: 'Automatic',
  drive: 'Driving',
  walk: 'Walking or hiking',
  food: 'Food or drink',
  visit: 'Visit or activity',
  stay: 'Hotel or check-in',
  flight: 'Flight',
  bike: 'Cycling',
  other: 'Other',
}

export const itemTimeLabel = (item: Item) => item.time ? `${item.time}${item.endTime ? `–${item.endTime}` : ''}` : 'Flex'

/** Resolve only from the traveller's current item and linked places. No seed data is consulted. */
export function resolveItemKind(item: Item, entities: Map<string, Entity>): Exclude<ItemKind, 'auto'> {
  if (item.kind !== 'auto') return item.kind

  const title = item.title.toLocaleLowerCase('en')
  if (/\b(fly|flight)\b/.test(title)) return 'flight'
  if (/\b(e-?bike|cycle|cycling|ride|shuttle)\b/.test(title)) return 'bike'
  if (/\b(walk|walking|hike|hiking|stroll|on foot)\b/.test(title)) return 'walk'
  if (/^choose\b/.test(title)) return 'other'
  if (/\b(breakfast|lunch|dinner|tapas|eat|drinks?)\b/.test(title)) return 'food'
  if (/\b(check[ -]?in|hotel arrival|arrive at the hotel)\b/.test(title)) return 'stay'
  if (/\b(drive|driving|leave for|leave .* around|continue (?:to|north|west)|collect the car|park below|return to hotel|arrive at .*airport)\b/.test(title)) return 'drive'

  const linked = item.entityIds.map((id) => entities.get(id)).filter((entity): entity is Entity => Boolean(entity))
  if (linked.some((entity) => entity.type === 'restaurant')) return 'food'
  const transport = linked.find((entity) => entity.type === 'transport')
  if (transport?.type === 'transport') {
    if (transport.transport.mode === 'flight') return 'flight'
    if (transport.transport.mode === 'bike') return 'bike'
    if (['car', 'bus'].includes(transport.transport.mode)) return 'drive'
  }
  if (linked.some((entity) => entity.type === 'hotel')) return 'stay'
  const tags = linked.flatMap((entity) => entity.tags).join(' ').toLocaleLowerCase('en')
  if (/\b(e-?bike|cycling)\b/.test(tags)) return 'bike'
  if (/\b(hike|walk|walking)\b/.test(tags)) return 'walk'
  return linked.some((entity) => entity.type === 'activity') ? 'visit' : 'other'
}
