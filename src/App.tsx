import { useEffect, useRef, useState } from 'react'
import seed from './data/initial-trip.json'
import { parseTrip, type Entity, type Trip } from './domain/trip'
import { activeDay, formatDate } from './domain/dates'
import { tripStore } from './storage/trip-store'
import { ActivitySheet, DayView, PlaceActions, BookingDetails } from './components/DayView'
import { Icon, type IconName } from './components/Icon'
import { PwaStatus } from './components/PwaStatus'
import { Editor } from './components/Editor'
import { MoreTools } from './components/TripTools'
import { readTheme, saveTheme, type Theme } from './theme'

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' }, { id: 'trip', label: 'Trip', icon: 'trip' },
  { id: 'explore', label: 'Explore', icon: 'explore' }, { id: 'more', label: 'More', icon: 'more' },
]
const initialTrip = parseTrip(seed)
const readRoute = () => window.location.hash.replace(/^#\/?/, '') || 'today'

function PlaceDetail({ entity, trip }: { entity: Entity; trip: Trip }) {
  const detailFacts = entity.type === 'hotel' ? [
    { label: 'Check-in', value: entity.hotel.checkIn }, { label: 'Check-out', value: entity.hotel.checkOut },
    { label: 'Breakfast', value: entity.hotel.breakfast }, { label: 'Dinner', value: entity.hotel.dinner },
    { label: 'Parking', value: entity.hotel.parking }, { label: 'Arrival', value: entity.hotel.arrivalRequirements },
    { label: 'Room requests', value: entity.hotel.roomNotes },
  ] : entity.type === 'activity' ? Object.entries(entity.activity).map(([label, value]) => ({ label: label.replace(/([A-Z])/g, ' $1'), value })) : entity.facts
  return <article className="place-detail">
    <a className="detail-link" href="#/explore"><Icon name="back" size={16} />All places</a>
    <header className="page-heading"><p className="eyebrow">{entity.type} · {entity.region}</p><h1>{entity.name}</h1><p className="lede">{entity.description}</p><PlaceActions entity={entity} /></header>
    <dl className="detail-facts">{detailFacts.filter((f) => f.value).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    {entity.type === 'note' && <p className="preserve-lines">{entity.note.body}</p>}
    {entity.notes && <section><h2>Good to know</h2><p className="preserve-lines">{entity.notes}</p></section>}
    {entity.type === 'restaurant' && <p>{entity.restaurant.mealNote} {entity.restaurant.openingNote}</p>}
    {entity.links.length > 0 && <section><h2>Useful links</h2><ul className="link-list">{entity.links.map((link, i) => <li key={i}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></li>)}</ul></section>}
    <section><h2>Visits & reservations</h2>{trip.days.flatMap(d => d.items.filter(i => i.entityIds.includes(entity.id)).map(i => <div className="booking-row" key={i.id}><a href={`#/item/${i.id}`}>{d.date} · {i.title} · {i.status}</a>{i.booking && <BookingDetails booking={i.booking} />}</div>))}{trip.stays.filter(s => s.hotelId === entity.id).map(s => <div className="booking-row" key={s.id}><a href={`#/stay/${s.id}`}>{s.checkInDate} — {s.checkOutDate} · {(Date.parse(s.checkOutDate) - Date.parse(s.checkInDate)) / 86400000} nights</a><BookingDetails booking={s.booking} /></div>)}</section><section><h2>Plan & edit</h2><div className="actions"><a className="action" href={`#/entity/${entity.id}`}>Edit place</a><a className="button" href={`#/schedule/${entity.id}`}>Schedule this place</a></div>{trip.days.filter(d => d.items.some(i => i.entityIds.includes(entity.id)) || trip.stays.some(s => s.hotelId === entity.id && s.id === d.stayId)).map(d => <p key={d.id}><a href={`#/day/${d.id}`}>{formatDate(d.date)} · {d.title}</a></p>)}</section><p className="small muted">From your planning notes. Check current opening times and access before you go.</p>
  </article>
}

function Explore({ trip }: { trip: Trip }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [region, setRegion] = useState('')
  const [planned, setPlanned] = useState('')
  const [detail, setDetail] = useState<Extract<Entity, { type: 'activity' }>>()
  const plannedIds = new Set([...trip.days.flatMap(d => d.items.filter(i => i.status !== 'skipped').flatMap(i => i.entityIds)), ...trip.stays.filter(s => trip.days.some(d => d.stayId === s.id)).map(s => s.hotelId)])
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const results = trip.entities.filter(e => (!type || e.type === type) && (!region || e.region === region) && (!planned || plannedIds.has(e.id) === (planned === 'planned'))).filter((e) => normalize([e.name, e.region, e.type, e.description, e.notes, ...e.tags].join(' ')).includes(normalize(search)))
  return <>
    <header className="page-heading"><p className="eyebrow">Keep your options open</p><h1>Explore</h1><p className="lede">The places you planned. And the ones you might.</p></header>
    <div className="search-wrap"><Icon name="search" size={19} /><label className="sr-only" htmlFor="search">Find a place, region or activity</label><input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search places, regions, or activities" /></div>
    <div className="filter-chips" aria-label="Type filters">{['', ...new Set(trip.entities.map(e => e.type))].map(value => <button key={value || 'all'} className="filter-chip" aria-pressed={type === value} onClick={() => setType(value)}>{value || 'All'}</button>)}</div>
    <div className="filter-selects"><label>Region<select aria-label="Region" value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{[...new Set(trip.entities.map(e => e.region))].filter(Boolean).sort().map(r => <option key={r}>{r}</option>)}</select></label><label>Plan<select aria-label="Plan" value={planned} onChange={e => setPlanned(e.target.value)}><option value="">All places</option><option value="planned">Planned</option><option value="alternative">Alternatives</option></select></label></div>
    <div className="browse-toolbar"><p className="small muted" role="status">{results.length} places & notes</p><a className="text-button" href="#/new">+ Add a place</a></div>
    <div className="activity-grid">{results.map((entity) => {
      const meta = entity.type === 'activity' ? [entity.activity.duration, entity.activity.effort] : entity.type === 'hotel' ? [entity.hotel.checkIn && `Check-in ${entity.hotel.checkIn}`] : entity.facts.slice(0, 2).map(fact => fact.value)
      const content = <><div className="activity-top"><div><h2>{entity.name}</h2><span>{entity.region} · {entity.type}</span></div><Icon name="chevron" size={18} /></div>{entity.description && <p>{entity.description}</p>}<div className="meta-line">{meta.filter(Boolean).map(value => <span className="status-badge neutral" key={value}>{value}</span>)}</div></>
      return <article className="activity-card" key={entity.id}>{entity.type === 'activity' ? <button className="activity-card-button" onClick={() => setDetail(entity)}>{content}</button> : <a className="activity-card-button" href={`#/place/${entity.id}`}>{content}</a>}</article>
    })}</div>
    {!results.length && <div className="empty-state"><Icon name="search" />No places match that search.</div>}
    <ActivitySheet entity={detail} onClose={() => setDetail(undefined)} />
  </>
}

export function App() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState('')
  const [route, setRoute] = useState(readRoute)
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const writing = useRef(false)
  const [saving, setSaving] = useState(false)
  const guardDirty = (value: boolean) => { dirtyRef.current = value; setDirty(value) }
  const [online, setOnline] = useState(navigator.onLine)
  const [now, setNow] = useState(() => new Date())
  const [theme, setTheme] = useState<Theme>(readTheme)

  function changeTheme(next: Theme) {
    saveTheme(next)
    setTheme(next)
  }

  useEffect(() => {
    let cancelled = false
    void tripStore.loadOrInitialize(initialTrip).then((value) => { if (!cancelled) setTrip(value) }).catch((error: unknown) => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load device storage.') })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    const update = () => {
      const next = readRoute()
      if (next === route) return
      if (writing.current || (dirtyRef.current && !window.confirm('Leave without saving your changes?'))) {
        window.history.pushState(null, '', `#/${route}`)
        return
      }
      guardDirty(false); setRoute(next); window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [dirty, route])
  useEffect(() => {
    const connection = () => setOnline(navigator.onLine)
    const clock = window.setInterval(() => (!dirtyRef.current && !writing.current) && setNow(new Date()), 60_000)
    window.addEventListener('online', connection); window.addEventListener('offline', connection)
    return () => { clearInterval(clock); window.removeEventListener('online', connection); window.removeEventListener('offline', connection) }
  }, [])
  useEffect(() => {
    if (!dirty && !saving) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, saving])

  if (error) return <main className="loading"><h1>Your trip could not be opened</h1><p role="alert">{error}</p><p>Existing trip data has not been replaced. Check browser storage settings, or close other tabs and retry.</p><button className="button" onClick={() => location.reload()}>Try again</button></main>
  if (!trip) return <main className="loading" role="status"><img src="./icon.svg" width="48" height="48" alt="" /><h1>Opening your trip…</h1><p>Getting your itinerary from this device.</p></main>
  const current = activeDay(trip, now)
  const [section, id] = route.split('/')
  const selectedDay = section === 'day' || (section === 'today' && id) ? trip.days.find((d) => d.id === id) : current.day
  const selectedEntity = section === 'place' ? trip.entities.find((e) => e.id === id) : undefined
  const tab = section === 'day' ? 'trip' : section === 'place' ? 'explore' : section
  const editing = ['new', 'entity', 'item', 'stay', 'schedule', 'documents', 'action'].includes(section)
  const screenTitle = editing ? 'Edit trip' : section === 'day' ? 'Trip' : section === 'place' ? 'Explore' : tabs.find(item => item.id === tab)?.label ?? 'Green Spain'
  async function saveTrip(next: Trip, replace = false) {
    if (!trip || writing.current) throw new Error('A save is already in progress. Try again shortly.')
    writing.current = true; setSaving(true)
    try { const saved = await (replace ? tripStore.replace(next, trip.revision) : tripStore.save(next, trip.revision)); setTrip(saved) }
    finally { writing.current = false; setSaving(false) }
  }
  async function saveNote(value: string) {
    if (!trip || !selectedDay) return
    const next = { ...trip, days: trip.days.map((day) => day.id === selectedDay.id ? { ...day, notes: value } : day) }
    await saveTrip(next)
  }
  const notFound = !['today', 'day', 'trip', 'explore', 'more', 'place', 'new', 'entity', 'item', 'stay', 'schedule', 'documents', 'action'].includes(section) || (['day', 'today'].includes(section) && !selectedDay) || (section === 'place' && !selectedEntity)
  return <div className="app">
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
    <header className="app-header"><a className="brand" href="#/today"><img src="./icon.svg" width="32" height="32" alt="" /><span>{screenTitle}<small>Green Spain · 20 Sep — 2 Oct</small></span></a><span className="device-status"><span className={`status-dot ${online ? '' : 'offline'}`} />{online ? 'On this device' : 'Offline ready'}</span></header>
    <main id="main" className="main" tabIndex={-1}>
      {notFound ? <><h1>That page isn’t here</h1><a className="action" href="#/today">Return to your itinerary</a></> : null}
      {!notFound && (section === 'today' || section === 'day') && selectedDay && <DayView key={selectedDay.id} trip={trip} day={selectedDay} todayMode={section === 'today'} onSaveNote={saveNote} onDirty={guardDirty} onSaveTrip={saveTrip} />}
      {section === 'trip' && <><header className="page-heading"><p className="eyebrow">20 September — 2 October</p><h1>The whole trip</h1><p className="lede">13 days · 12 nights · 6 bases</p></header><div className="trip-list">{trip.days.map((day, index) => <a className={`trip-row ${day.date === current.today ? 'current' : ''}`} key={day.id} href={`#/day/${day.id}`}><span className="day-number">Day<b>{index + 1}</b></span><div><h2>{day.title}</h2><p>{formatDate(day.date)}</p><div className="meta-line">{day.facts.filter(fact => !['Sleep', 'Book'].includes(fact.label)).slice(0, 2).map(fact => <span className="status-badge neutral" key={fact.label}>{fact.label}: {fact.value}</span>)}</div></div><Icon name="chevron" size={18} /></a>)}</div></>}
      {section === 'explore' && <Explore trip={trip} />}
      {section === 'place' && selectedEntity && <PlaceDetail entity={selectedEntity} trip={trip} />}
      {section === 'more' && <><header className="page-heading"><h1>More</h1></header><MoreTools trip={trip} initialTrip={initialTrip} onReplace={next => saveTrip(next, true)} onDirty={guardDirty} theme={theme} onThemeChange={changeTheme} /></>}
      {['new', 'entity', 'item', 'stay', 'schedule', 'documents', 'action'].includes(section) && <Editor key={route} trip={trip} mode={section} id={id} onSave={saveTrip} onDirty={guardDirty} />}
    </main>
    <PwaStatus busy={dirty || saving} />
    <nav className="bottom-nav" aria-label="Main navigation">{tabs.map((item) => <a key={item.id} href={`#/${item.id}`} aria-current={tab === item.id ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span></a>)}</nav>
  </div>
}
