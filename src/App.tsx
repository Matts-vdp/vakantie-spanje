import { useEffect, useState } from 'react'
import seed from './data/initial-trip.json'
import { parseTrip, serializeTrip, type Entity, type Trip } from './domain/trip'
import { activeDay, formatDate } from './domain/dates'
import { tripStore } from './storage/trip-store'
import { DayView, PlaceActions } from './components/DayView'
import { Icon, type IconName } from './components/Icon'
import { PwaStatus } from './components/PwaStatus'

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' }, { id: 'trip', label: 'Trip', icon: 'trip' },
  { id: 'explore', label: 'Explore', icon: 'explore' }, { id: 'more', label: 'More', icon: 'more' },
]
const readRoute = () => window.location.hash.replace(/^#\/?/, '') || 'today'

function PlaceDetail({ entity }: { entity: Entity }) {
  const detailFacts = entity.type === 'hotel' ? [
    { label: 'Check-in', value: entity.hotel.checkIn }, { label: 'Check-out', value: entity.hotel.checkOut },
    { label: 'Breakfast', value: entity.hotel.breakfast }, { label: 'Dinner', value: entity.hotel.dinner },
    { label: 'Parking', value: entity.hotel.parking }, { label: 'Arrival', value: entity.hotel.arrivalRequirements },
    { label: 'Room requests', value: entity.hotel.roomNotes },
  ] : entity.facts
  return <article className="place-detail">
    <a className="detail-link" href="#/explore"><Icon name="back" size={16} />All places</a>
    <header className="page-heading"><p className="eyebrow">{entity.type} · {entity.region}</p><h1>{entity.name}</h1><p className="lede">{entity.description}</p><PlaceActions entity={entity} /></header>
    <dl className="detail-facts">{detailFacts.filter((f) => f.value).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    {entity.notes && <section><h2>Good to know</h2><p className="preserve-lines">{entity.notes}</p></section>}
    {entity.type === 'restaurant' && <p>{entity.restaurant.mealNote} {entity.restaurant.openingNote}</p>}
    {entity.links.length > 0 && <section><h2>Useful links</h2><ul className="link-list">{entity.links.map((link, i) => <li key={i}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></li>)}</ul></section>}
    <p className="small muted">From your planning notes. Check current opening times and access before you go.</p>
  </article>
}

function Explore({ trip }: { trip: Trip }) {
  const [search, setSearch] = useState('')
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const results = trip.entities.filter((e) => normalize([e.name, e.region, e.type, e.description, e.notes, ...e.tags].join(' ')).includes(normalize(search)))
  return <>
    <header className="page-heading"><p className="eyebrow">Keep your options open</p><h1>Explore</h1><p className="lede">The places you planned. And the ones you might.</p></header>
    <label className="search-label" htmlFor="search">Find a place, region or activity</label>
    <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try Potes, a cave, or a rainy day…" />
    <p className="small muted" role="status">{results.length} places & notes</p>
    <div className="browse-list">{results.map((entity) => <article key={entity.id}><a className="browse-title" href={`#/place/${entity.id}`}><div><span className="eyebrow">{entity.region} · {entity.type}</span><h2>{entity.name}</h2></div><Icon name="arrow" /></a>{entity.description && <p>{entity.description}</p>}<PlaceActions entity={entity} /></article>)}</div>
    {!results.length && <p>No places found. Try another name or region.</p>}
  </>
}

function More({ trip }: { trip: Trip }) {
  const [message, setMessage] = useState('')
  async function requestStorage() {
    if (!navigator.storage?.persist) { setMessage('This browser manages storage automatically. Keep exported backups too.'); return }
    try {
      const granted = await navigator.storage.persist()
      setMessage(granted ? 'Persistent storage granted by this browser.' : 'The browser manages storage automatically. Keep exported backups too.')
    } catch { setMessage('Storage preference could not be changed. You can still export a backup.') }
  }
  function exportTrip() {
    const url = URL.createObjectURL(new Blob([serializeTrip(trip)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `trip-export-${trip.id}.json`
    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  return <>
    <header className="page-heading"><p className="eyebrow">Everything else, close at hand</p><h1>More</h1></header>
    <section className="tool-section"><h2>Your trip, on this device</h2><p>Edits are saved here. Export a copy to keep a backup of your current trip.</p><button className="button" onClick={exportTrip}>Export trip data</button><button className="text-button" onClick={() => { void requestStorage() }}>Ask browser to keep trip data</button>{message && <p role="status">{message}</p>}<p className="small muted">Clearing browser data removes local edits. The two phones keep separate copies.</p></section>
    <section className="tool-section"><h2>Before you go</h2><div className="checklist">{trip.actions.map((action) => <div key={action.id}><span className="tag">{action.timing}</span><h3>{action.title}</h3><p>{action.description}</p></div>)}</div></section>
    <section><h2>Practical notes</h2>{trip.practicalNotes.map((note, index) => <details className="background" key={index}><summary>{note.title}</summary><p>{note.body}</p></details>)}</section>
  </>
}

export function App() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState('')
  const [route, setRoute] = useState(readRoute)
  const [dirty, setDirty] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    void tripStore.loadOrInitialize(parseTrip(seed)).then((value) => { if (!cancelled) setTrip(value) }).catch((error: unknown) => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load device storage.') })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    const update = () => {
      const next = readRoute()
      if (next === route) return
      if (dirty && !window.confirm('Leave this day without saving your note?')) {
        window.history.pushState(null, '', `#/${route}`)
        return
      }
      setDirty(false); setRoute(next); window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [dirty, route])
  useEffect(() => {
    const connection = () => setOnline(navigator.onLine)
    const clock = window.setInterval(() => setNow(new Date()), 60_000)
    window.addEventListener('online', connection); window.addEventListener('offline', connection)
    return () => { clearInterval(clock); window.removeEventListener('online', connection); window.removeEventListener('offline', connection) }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (error) return <main className="loading"><h1>Your trip could not be opened</h1><p role="alert">{error}</p><p>Existing trip data has not been replaced. Check browser storage settings, or close other tabs and retry.</p><button className="button" onClick={() => location.reload()}>Try again</button></main>
  if (!trip) return <main className="loading" role="status"><img src="./icon.svg" width="48" height="48" alt="" /><h1>Opening your trip…</h1><p>Getting your itinerary from this device.</p></main>
  const current = activeDay(trip, now)
  const [section, id] = route.split('/')
  const selectedDay = section === 'day' ? trip.days.find((d) => d.id === id) : current.day
  const selectedEntity = section === 'place' ? trip.entities.find((e) => e.id === id) : undefined
  const tab = section === 'day' ? 'trip' : section === 'place' ? 'explore' : section
  async function saveNote(value: string) {
    if (!trip || !selectedDay) return
    const next = { ...trip, days: trip.days.map((day) => day.id === selectedDay.id ? { ...day, notes: value } : day) }
    const saved = await tripStore.save(next, trip.revision)
    setTrip(saved)
  }
  const notFound = !['today', 'day', 'trip', 'explore', 'more', 'place'].includes(section) || (section === 'day' && !selectedDay) || (section === 'place' && !selectedEntity)
  return <div className="app">
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
    <header className="app-header"><a className="brand" href="#/today"><img src="./icon.svg" width="34" height="34" alt="" /><span>Green Spain<small>20 Sep — 2 Oct 2026</small></span></a><span className="device-status"><span className={`status-dot ${online ? '' : 'offline'}`} />{online ? 'On this device' : 'Offline'}</span></header>
    <main id="main" className="main" tabIndex={-1}>
      {notFound ? <><h1>That page isn’t here</h1><a className="action" href="#/today">Return to your itinerary</a></> : null}
      {!notFound && (section === 'today' || section === 'day') && selectedDay && <DayView key={selectedDay.id} trip={trip} day={selectedDay} context={section === 'today' ? current.phase === 'before' ? 'Your trip starts soon · Preview' : current.phase === 'after' ? 'Trip complete · Last day' : 'Today' : undefined} onSaveNote={saveNote} onDirty={setDirty} />}
      {section === 'trip' && <><header className="page-heading"><p className="eyebrow">13 days · 12 nights · 6 bases</p><h1>The whole trip</h1><p className="lede">From the coast to the mountains. One day at a time.</p></header><div className="trip-list">{trip.days.map((day, index) => <a className="trip-row" key={day.id} href={`#/day/${day.id}`}><span className="day-number">{String(index + 1).padStart(2, '0')}</span><div><span className="eyebrow">{formatDate(day.date)}{day.date === current.today ? ' · Today' : ''}</span><h2>{day.title}</h2><p>{day.summary}</p></div><Icon name="arrow" /></a>)}</div></>}
      {section === 'explore' && <Explore trip={trip} />}
      {section === 'place' && selectedEntity && <PlaceDetail entity={selectedEntity} />}
      {section === 'more' && <More trip={trip} />}
    </main>
    <PwaStatus busy={dirty} />
    <nav className="bottom-nav" aria-label="Main navigation">{tabs.map((item) => <a key={item.id} href={`#/${item.id}`} aria-current={tab === item.id ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span></a>)}</nav>
  </div>
}
