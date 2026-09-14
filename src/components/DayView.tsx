import { useState } from 'react'
import { formatDate } from '../domain/dates'
import type { Day, Entity, Trip } from '../domain/trip'
import { Icon } from './Icon'

export function PlaceActions({ entity }: { entity: Entity }) {
  return <div className="actions">
    {entity.navigationUrl && <a className="action primary" href={entity.navigationUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={16} />Navigate</a>}
    {entity.websiteUrl && <a className="action" href={entity.websiteUrl} target="_blank" rel="noopener noreferrer">Website ↗</a>}
    {entity.phone && <a className="action" href={`tel:${entity.phone.replace(/[^+\d]/g, '')}`}>Call</a>}
  </div>
}

function DayNote({ day, onSave, onDirty }: { day: Day; onSave: (value: string) => Promise<void>; onDirty: (value: boolean) => void }) {
  const [draft, setDraft] = useState(day.notes)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const dirty = draft !== day.notes
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try { await onSave(draft); onDirty(false); setMessage('Note saved on this device.') }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Your note is still here; try again.') }
    finally { setSaving(false) }
  }
  return <section className="note-section">
    <h2>Your day note</h2>
    <p className="muted">A reminder, a change of plan, or something to come back to.</p>
    <form onSubmit={(event) => { void save(event) }}>
      <label className="sr-only" htmlFor="day-note">Day note</label>
      <textarea id="day-note" value={draft} disabled={saving} placeholder="Add a note for this day…" rows={3} onChange={(event) => { setDraft(event.target.value); onDirty(event.target.value !== day.notes); setMessage(''); setError('') }} />
      <div className="note-footer"><span className="muted">{dirty ? 'Unsaved changes' : 'Saved only on this device'}</span><button className="button" disabled={!dirty || saving} type="submit">{saving ? 'Saving…' : 'Save note'}</button></div>
      {message && <p role="status" className="success">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  </section>
}

export function DayView({ trip, day, context, onSaveNote, onDirty }: { trip: Trip; day: Day; context?: string; onSaveNote: (value: string) => Promise<void>; onDirty: (value: boolean) => void }) {
  const index = trip.days.findIndex((d) => d.id === day.id)
  const next = trip.days[index + 1]
  const stay = trip.stays.find((s) => s.id === day.stayId)
  const hotel = trip.entities.find((entity) => entity.id === stay?.hotelId)
  const entities = new Map(trip.entities.map((entity) => [entity.id, entity]))
  return <>
    <header className="page-heading">
      <p className="eyebrow">{context || 'Your itinerary'} <span>· Day {index + 1} of {trip.days.length}</span></p>
      <p className="date">{formatDate(day.date)}</p>
      <h1>{day.title}</h1>
      <div className="day-facts">{day.facts.filter((fact) => !['Sleep', 'Book'].includes(fact.label)).map((fact) => <span key={fact.label}><b>{fact.label}</b> {fact.value}</span>)}</div>
    </header>
    <div className="day-layout">
      <div>
        <section aria-label="Day itinerary">
          <div className="section-heading"><h2>The day ahead</h2><span className="muted">{day.items.length} stops & moments</span></div>
          <ol className="timeline">{day.items.map((item, i) => <li key={item.id}>
            <div className="timeline-marker"><span>{item.time || String(i + 1).padStart(2, '0')}</span></div>
            <div className="timeline-content">
              <h3>{item.title}</h3>
              {item.optional && <span className="tag">Optional / choice</span>}
              <p>{item.description}</p>
              {item.entityIds.map((id) => { const entity = entities.get(id); return entity ? <div className="item-place" key={id}><a className="detail-link" href={`#/place/${id}`}>{entity.name}<Icon name="arrow" size={16} /></a><PlaceActions entity={entity} /></div> : null })}
            </div>
          </li>)}</ol>
        </section>
        <DayNote key={day.id} day={day} onSave={onSaveNote} onDirty={onDirty} />
        {day.background.length > 0 && <details className="background"><summary>Details & planning background</summary>{day.background.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</details>}
      </div>
      <aside className="day-sidebar">
        {hotel?.type === 'hotel' && <section className="hotel-panel">
          <p className="eyebrow">Tonight · {hotel.region}</p>
          <h2><a href={`#/place/${hotel.id}`}>{hotel.name}</a></h2>
          <dl><div><dt>Check-in</dt><dd>{hotel.hotel.checkIn || 'Confirm with hotel'}</dd></div><div><dt>Breakfast</dt><dd>{hotel.hotel.breakfast || 'Confirm with hotel'}</dd></div>{hotel.hotel.parking && <div><dt>Parking</dt><dd>{hotel.hotel.parking}</dd></div>}</dl>
          <PlaceActions entity={hotel} />
          <p className="small muted">Booking {stay?.booking.status === 'unknown' ? 'not yet confirmed in the app' : stay?.booking.status}</p>
        </section>}
        {!hotel && <section className="notice"><h2>Heading home</h2><p>No overnight stay planned for this day.</p></section>}
        {day.notices.length > 0 && <section className="notices"><h2>Keep in mind</h2>{day.notices.map((notice, i) => <div key={i} className={`notice ${notice.kind}`}><h3>{notice.title}</h3><p>{notice.body}</p></div>)}</section>}
        {next && <a className="tomorrow" href={`#/day/${next.id}`}><span className="eyebrow">Tomorrow · {formatDate(next.date)}</span><strong>{next.title}</strong><span className="detail-link">See the next day <Icon name="arrow" size={18} /></span></a>}
      </aside>
    </div>
  </>
}
