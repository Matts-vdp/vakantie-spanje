import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { load } from 'cheerio'

// Archived one-time source importer. The checked-in JSON is now authoritative.
// A destination is mandatory and the canonical seed is deliberately protected.
const outputFlag = process.argv.indexOf('--output')
const requestedOutput = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined
if (!requestedOutput) throw new Error('Legacy converter only: provide --output <preview.json>. The canonical seed is edited directly.')
const outputPath = resolve(requestedOutput)
if (outputPath === resolve('src/data/initial-trip.json')) throw new Error('Refusing to overwrite the canonical seed: src/data/initial-trip.json')

// Never run against a traveller's saved trip.
const source = readFileSync('vacation-plan.html', 'utf8').replace(/\r\n/g, '\n')
const $ = load(source)
const clean = (value) => value.replace(/\s+/g, ' ').trim()
const content = (node) => {
  const copy = node.clone()
  copy.find('br').replaceWith(' ')
  copy.find('b, strong, p, li, div').append(' ')
  return clean(copy.text())
}
const text = (node, selector) => content(node.find(selector).first())
const links = (node) => node.find('a[href]').toArray()
  .map((el) => ({ label: content($(el)), url: $(el).attr('href') }))
  .filter((link) => /^https?:\/\//.test(link.url))
const unique = (values) => [...new Set(values)]
const common = (id, name, region) => ({
  id, name, region, description: '', notes: '', tags: [], links: [], facts: [], userCreated: false,
})
const facts = (node, selector) => node.find(selector).toArray().map((el) => {
  const item = $(el)
  const label = content(item.find('b').first())
  const copy = item.clone(); copy.find('b').remove()
  return { label, value: content(copy) }
})
const entities = []

$('#options .activity-card').each((i, el) => {
  const card = $(el)
  const sourceId = card.attr('id') ?? 'opt-oviedo-choice'
  const region = text(card.closest('.activity-group'), 'summary h3')
  const entity = {
    ...common(sourceId, text(card, 'h4'), region), sourceId,
    description: text(card, '.activity-summary'),
    notes: card.find('.activity-note').toArray().map((el) => content($(el))).join('\n\n'),
    tags: card.find('.chip, .activity-status').toArray().map((el) => content($(el))),
    links: links(card), facts: facts(card, '.activity-facts > div'),
  }
  entity.navigationUrl = entity.links.find((link) => link.url.includes('google.com/maps'))?.url
  entity.websiteUrl = entity.links.find((link) => !link.url.includes('google.com/maps'))?.url
  const factValue = (...labels) => entity.facts.filter((fact) => labels.includes(fact.label)).map((fact) => fact.value).join(' · ')
  if (!card.attr('id')) {
    entity.type = 'note'
    entity.note = { body: entity.description }
  } else {
    entity.type = 'activity'
    entity.activity = {
      duration: factValue('Time', 'Realistic time', 'Visit', 'Walk'),
      distance: factValue('Distance', 'Official route'),
      effort: factValue('Effort'), weather: factValue('Weather'),
      accessNotes: entity.notes, bookingRequirement: factValue('Booking'),
      timingNote: factValue('Hours', '29 Sep hours', '29 Sep', 'Best fit'),
    }
  }
  entities.push(entity)
})

const hotelIds = ['hotel-montemar', 'hotel-el-jisu', 'hotel-mypalace', 'hotel-o-palleiro', 'hotel-la-posta', 'hotel-palacio-aviles']
const hotelExtra = [
  { dinner: 'No restaurant at Montemar. Don Paco, the sister hotel across the road, is the arrival-night dinner option.', parking: '', arrivalRequirements: '', roomNotes: '' },
  { dinner: '20:30–22:00', parking: 'Free on-site parking', arrivalRequirements: 'Request a packed breakfast in advance for the early Cares bus day.', roomNotes: '', phone: '+34 942 73 30 38' },
  { dinner: 'Walk into León for tapas.', parking: 'Reservable on-site parking via vehicle lift; source lists €20 per car per day. Confirm with hotel.', arrivalRequirements: 'Confirm parking and whether breakfast is included in the rate.', roomNotes: '' },
  { dinner: 'Confirm dinner on both nights by phone.', parking: '', arrivalRequirements: 'Ring to arrange the stay and both dinners.', roomNotes: '' },
  { dinner: 'Village restaurants within walking distance; Casa Laureano is the source’s first choice.', parking: 'Parking nearby', arrivalRequirements: 'Advise arrival time in advance; confirm breakfast inclusion and serving time.', roomNotes: '' },
  { dinner: 'Flexible dinner around Calle Galiana.', parking: 'Source reports access to the car park through the hotel; confirm details.', arrivalRequirements: 'Ask whether an event is booked for the night before the flight.', roomNotes: 'Request the modern wing.' },
]
const dateRanges = [
  ['2026-09-20', '2026-09-22'], ['2026-09-22', '2026-09-25'], ['2026-09-25', '2026-09-27'],
  ['2026-09-27', '2026-09-29'], ['2026-09-29', '2026-10-01'], ['2026-10-01', '2026-10-02'],
]
const stays = []
$('#hotels tbody tr').each((i, el) => {
  const cells = $(el).find('td')
  const id = hotelIds[i]
  const { phone, ...extra } = hotelExtra[i]
  const hotel = {
    ...common(id, content(cells.eq(2)), content(cells.eq(1))),
    type: 'hotel', sourceId: `hotels/row-${i + 1}`,
    navigationUrl: cells.eq(2).find('a').attr('href'),
    links: links(cells.eq(2)),
    hotel: { checkIn: content(cells.eq(3)), checkOut: content(cells.eq(4)), breakfast: content(cells.eq(5)), ...extra },
  }
  if (phone) hotel.phone = phone
  entities.push(hotel)
  const [checkInDate, checkOutDate] = dateRanges[i]
  stays.push({ id: `stay-${i + 1}`, hotelId: id, checkInDate, checkOutDate,
    booking: { required: true, status: 'booked', notes: 'Reservation confirmed by the traveller.' },
  })
})
if (stays.length !== 6) throw new Error('Expected six hotel rows. Review the source conversion.')

// These real-world entities occur only in the day plans, outside the activity library.
entities.push(
  { ...common('restaurant-don-paco', 'Don Paco', 'Llanes'), type: 'restaurant',
    description: 'Arrival-night dinner in the sister hotel’s old convent dining room.',
    restaurant: { mealNote: 'Reserve the arrival-night table in advance.', openingNote: '' } },
  { ...common('restaurant-casa-laureano', 'Casa Laureano', 'San Martín de Teverga'), type: 'restaurant',
    description: 'The source’s first choice for Asturian stews, wild game, sausage and fabada.',
    restaurant: { mealNote: 'Walk from La Posta.', openingNote: 'Check current opening nights shortly before the trip.' } },
)

const entityIds = new Set(entities.map((e) => e.id))
// Narrative destinations explicitly named in the source, reusing existing places/links.
// Do not infer a trail turn, shuttle pickup, airport terminal or unnamed restaurant.
const narrativePlaces = {
  'day-2-item-4': ['opt-llanes-beaches'],
  'day-3-item-5': ['hotel-el-jisu'], 'day-3-item-6': ['hotel-el-jisu'],
  'day-4-item-3': ['opt-fuente-de'], 'day-4-item-4': ['hotel-el-jisu'], 'day-4-item-5': ['hotel-el-jisu'],
  'day-5-item-5': ['hotel-el-jisu'], 'day-8-item-3': ['opt-canedo'],
  'day-8-item-4': ['hotel-o-palleiro'], 'day-8-item-6': ['hotel-o-palleiro'],
  'day-9-item-4': ['opt-orellan-viewpoint'], 'day-9-item-5': ['hotel-o-palleiro'],
  'day-10-item-4': ['hotel-la-posta'],
}
const refs = (node) => unique(node.find('a.activity-ref').toArray().map((el) => $(el).attr('href').slice(1)))
const timelineKind = (title, ids) => {
  const value = title.toLowerCase()
  if (/\b(e-?bike|cycle|cycling|ride|shuttle|distance as you go)\b/.test(value)) return 'bike'
  if (/\b(fly|flight)\b/.test(value)) return 'flight'
  if (/\b(walk|walking|hike|hiking|stroll|on foot|turn around|cross the puertos)\b/.test(value)) return 'walk'
  if (/^choose\b/.test(value)) return 'other'
  if (/\b(breakfast|lunch|dinner|tapas|eat|drinks?)\b/.test(value)) return 'food'
  if (/\b(check[ -]?in|hotel arrival|arrive in san martín)\b/.test(value)) return 'stay'
  if (/\b(drive|driving|leave|continue (?:to|north|west)|collect the car|park below|cross puerto|return to hotel|arrive at .*airport)\b/.test(value)) return 'drive'
  const linked = ids.map((id) => entities.find((entity) => entity.id === id)).filter(Boolean)
  if (linked.some((entity) => entity.type === 'restaurant')) return 'food'
  if (linked.some((entity) => entity.type === 'hotel')) return 'stay'
  if (linked.length === 1 && linked[0].type === 'activity') {
    const tags = linked[0].tags.join(' ').toLowerCase()
    if (/\b(e-?bike|cycling)\b/.test(tags)) return 'bike'
    if (/\b(hike|walk|walking)\b/.test(tags)) return 'walk'
  }
  return linked.some((entity) => entity.type === 'activity') ? 'visit' : 'other'
}
const relevantNoticeTitles = {
  1: ['Choose one'], 2: ['Must know'], 3: ['Action at check-in'], 4: ['Weather decides', 'If the top is cloudy'],
  5: ['Access and safety'], 6: [], 7: ['Book only if'], 8: ['Advance booking required', 'Check one week before'],
  9: ['Major alternative'], 10: ['Route instruction'], 11: ['Before today'], 12: ['Timing conflict', 'If it rains'], 13: [],
}
const days = []
$('.day').each((i, el) => {
  const node = $(el)
  const number = Number(text(node, '.daynum').replace('Day ', ''))
  if (number !== i + 1) throw new Error('Source days are not sequential')
  const dateText = text(node, '.daydate')
  const match = dateText.match(/(\d+) (Sep|Oct)/)
  if (!match) throw new Error(`Cannot read date: ${dateText}`)
  const date = `2026-${match[2] === 'Sep' ? '09' : '10'}-${match[1].padStart(2, '0')}`
  const id = `day-${number}`
  const items = node.find('.timeline > li').toArray().map((el, index) => {
    const row = $(el)
    const rawTitle = text(row, 'strong')
    const timing = rawTitle.match(/^(\d{2}:\d{2})(?:–(\d{2}:\d{2}))?\s*·\s*/)
    const item = {
      id: `${id}-item-${index + 1}`, title: timing ? rawTitle.slice(timing[0].length) : rawTitle,
      description: text(row, 'p'), entityIds: refs(row), optional: /optional|version|choose/i.test(rawTitle),
      status: 'planned', notes: '',
    }
    if (timing) { item.time = timing[1]; if (timing[2]) item.endTime = timing[2] }
    if (number === 1 && row.hasClass('dinner')) {
      item.entityIds.push('restaurant-don-paco')
      item.booking = { required: true, status: 'unknown', notes: 'Reserve this table; no confirmation provided.' }
    }
    if (number === 10 && row.hasClass('dinner')) item.entityIds.push('restaurant-casa-laureano')
    if (['day-1-item-1', 'day-1-item-2', 'day-13-item-3', 'day-13-item-4'].includes(item.id)) {
      item.booking = { required: true, status: 'booked', notes: /Fly/.test(item.title) ? 'Flight confirmed by the traveller.' : 'Rental car confirmed by the traveller.' }
    }
    if (narrativePlaces[item.id]) item.entityIds = unique([...item.entityIds, ...narrativePlaces[item.id]])
    if (['day-12-item-2', 'day-12-item-3'].includes(item.id)) item.choiceGroup = 'Day 12 morning: Las Xanas or Naranco'
    item.kind = timelineKind(item.title, item.entityIds)
    return item
  })
  const dayFacts = node.find('.log > div').toArray().map((el) => ({ label: text($(el), 'span'), value: text($(el), 'b') }))
  const sourceNotices = node.find('.plan-card').toArray().map((el) => {
    const card = $(el); const copy = card.clone(); copy.find('b').first().remove()
    return { title: text(card, 'b'), body: content(copy), kind: card.hasClass('important') ? 'warning' : card.hasClass('choice') ? 'choice' : 'info' }
  })
  const day = {
    id, date, title: text(node, '.day-title h3'),
    summary: dayFacts.filter((f) => f.label !== 'Sleep' && f.label !== 'Book').map((f) => `${f.label}: ${f.value}`).join(' · '),
    facts: dayFacts, items,
    notices: relevantNoticeTitles[number] ? sourceNotices.filter((notice) => relevantNoticeTitles[number].includes(notice.title)) : sourceNotices,
    background: node.find('.day-notes').children().toArray().map((el) => content($(el))).filter(Boolean), notes: '',
  }
  const stay = stays.find((s) => s.checkInDate <= date && date < s.checkOutDate)
  if (stay) day.stayId = stay.id
  days.push(day)
})
if (days.length !== 13) throw new Error('Expected 13 days. Review the source conversion.')
for (const day of days) for (const item of day.items) for (const id of item.entityIds) {
  if (!entityIds.has(id)) throw new Error(`Unresolved activity reference: ${id}`)
}

const actions = []
$('#board .board-row').each((_, el) => {
  const row = $(el); const timing = text(row, '.board-when')
  if (timing === 'Improvise') return
  row.find('li').each((_, el) => {
    const description = content($(el))
    const title = text($(el), 'strong') || description.split(' — ')[0]
    const matching = entities.filter((entity) => description.toLowerCase().includes(entity.name.toLowerCase()))
    const hotelAction = matching.some((entity) => entity.type === 'hotel')
    actions.push({ id: `action-${actions.length + 1}`, title, description, timing,
      entityIds: matching.map((e) => e.id), dayIds: [], status: hotelAction || /one-way car hire/i.test(title) ? 'done' : 'pending',
      kind: /re-check|recheck/i.test(description) ? 'access' : /confirm/i.test(description) ? 'confirmation' : 'booking',
    })
  })
})
const practicalNotes = $('#notes .note-card').toArray().map((el) => ({ title: text($(el), 'h4'), body: text($(el), 'p') }))
practicalNotes.push({ title: 'Before departure: reconfirm time-sensitive information', body: text($('footer'), 'p') })
$('#options .library-note, #options > .callout, #board .board-row:last-child').each((_, el) => {
  practicalNotes.push({ title: 'Planning context', body: content($(el)) })
})
const trip = {
  schemaVersion: 2, id: 'green-spain-2026', name: 'Green Spain', timezone: 'Europe/Madrid',
  startDate: '2026-09-20', endDate: '2026-10-02', updatedAt: '2026-08-10T00:00:00.000Z', revision: 0,
  entities, stays, days, actions, practicalNotes, documentLinks: [],
  source: { file: 'vacation-plan.html', sha256: createHash('sha256').update(source).digest('hex'), notes: [
    'Converted from the working plan. Source facts and opening hours are not newly verified.',
    'Hotel stays, both flights and the rental car are confirmed from traveller feedback. Other reservations remain unknown until supplied.',
    'Dates are 20 September–2 October 2026, Europe/Madrid. Seed timestamp denotes the source revision month, not a user save.',
    'Mutually exclusive choices remain optional itinerary entries; no automatic selection was made.',
    'Booking-board timing remains relative (This week / Final week); exact due dates need confirmation.',
    'Day 9 mentions Ponferrada; the library says it is closed Monday. This conflict is preserved for review.',
    'Day 12 requires choosing Las Xanas or Naranco. They do not fit together.',
    'No private document URLs, reservation names, references or sensitive documents were supplied.',
      'Phase 2 maps 12 narrative destination rows to existing source places; no new location or opening claims are inferred. Day 12 morning entries share an editable exclusive choice group.',
      'Keep-in-mind notices retain only actionable safety, access, weather, timing and choice constraints; repeated itinerary and planning-history cards are omitted.',
  ] },
}
const output = `${JSON.stringify(trip, null, 2)}\n`
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, output)
console.log(`Wrote legacy conversion preview to ${outputPath}. The canonical seed was not changed.`)
