import { useEffect, useRef, useState } from 'react'
import { formatDate } from '../domain/dates'
import type { Booking, Day, Entity, Trip } from '../domain/trip'
import { Icon } from './Icon'
import { bookingLabel, choiceGroup, selectChoice } from '../domain/operations'
import { itemKindLabels, itemTimeLabel, resolveItemKind } from '../domain/itinerary'
import { TodayReview } from './TripTools'
import type { SaveTrip } from './Editor'

type Activity = Extract<Entity, { type: 'activity' }>
type SheetSelection = { group: string; selected: boolean; busy: boolean; onSelect: () => void }

export function BookingDetails({ booking }: { booking: Booking }) {
  return <div className="booking-details"><p><b>{bookingLabel(booking)} {booking.time}</b>{booking.date && ` · ${booking.date}`}{booking.arrivalBefore && ` · Arrive before ${booking.arrivalBefore}`}</p>
    {booking.reservationName && <p>Reservation: {booking.reservationName}</p>}{booking.reference && <p>Reference: {booking.reference}</p>}{booking.notes && <p className="preserve-lines">{booking.notes}</p>}
    <div className="actions">{booking.bookingUrl && <a className="detail-link" href={booking.bookingUrl} target="_blank" rel="noopener noreferrer">Open booking ↗</a>}{booking.documentUrl && <a className="detail-link" href={booking.documentUrl} target="_blank" rel="noopener noreferrer">Open document ↗</a>}</div>
  </div>
}

export function PlaceActions({ entity }: { entity: Entity }) {
  return <div className="actions">
    {entity.navigationUrl && <a className="action primary" href={entity.navigationUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={16} />Navigate</a>}
    {entity.websiteUrl && <a className="action" href={entity.websiteUrl} target="_blank" rel="noopener noreferrer">Website ↗</a>}
    {entity.phone && <a className="action" href={`tel:${entity.phone.replace(/[^+\d]/g, '')}`}>Call</a>}
  </div>
}

function StatusBadge({ booking, hideTime = false }: { booking: Booking; hideTime?: boolean }) {
  return <span className={`status-badge ${booking.status}`}>{booking.status === 'booked' && <Icon name="check" size={13} />}{bookingLabel(booking)}{booking.time && !hideTime && ` · ${booking.time}`}</span>
}

function DateSelector({ trip, day }: { trip: Trip; day: Day }) {
  const selected = useRef<HTMLAnchorElement>(null)
  useEffect(() => { selected.current?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [day.id])
  return <nav className="date-selector" aria-label="Choose a trip date">
    {trip.days.map((option) => {
      const date = new Date(`${option.date}T12:00:00Z`)
      return <a ref={option.id === day.id ? selected : undefined} key={option.id} className="date-pill" aria-current={option.id === day.id ? 'date' : undefined} href={`#/today/${option.id}`} aria-label={`${formatDate(option.date)} · ${option.title}`}>
        <span>{new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(date)}</span>
        <b>{date.getUTCDate()}</b>
        <small>{new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(date)}</small>
      </a>
    })}
  </nav>
}

function DayNote({ day, onSave, onDirty }: { day: Day; onSave: (value: string) => Promise<void>; onDirty: (value: boolean) => void }) {
  const [draft, setDraft] = useState(day.notes)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const dirty = draft !== day.notes
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try { await onSave(draft); onDirty(false); setMessage('Note saved on this device.'); setOpen(false) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Your note is still here; try again.') }
    finally { setSaving(false) }
  }
  return <>
    <div className="section-heading"><h2>The day ahead</h2><button className="text-button note-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Icon name="edit" size={15} />{day.notes ? 'Edit day note' : 'Add day note'}</button></div>
    <div className="day-note">
      {day.notes && <p className="day-note-copy preserve-lines">{day.notes}</p>}
      {open && <form onSubmit={(event) => { void save(event) }}>
      <label className="sr-only" htmlFor={`day-note-${day.id}`}>Day note</label>
      <textarea id={`day-note-${day.id}`} value={draft} disabled={saving} placeholder="Add a note for this day…" rows={3} onChange={(event) => { setDraft(event.target.value); onDirty(event.target.value !== day.notes); setMessage(''); setError('') }} />
      <div className="note-footer"><span className="muted">{dirty ? 'Unsaved changes' : 'Saved only on this device'}</span><button className="button" disabled={!dirty || saving} type="submit">{saving ? 'Saving…' : 'Save note'}</button></div>
      </form>}
      {message && <p role="status" className="success">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  </>
}

export function ActivitySheet({ entity, selection, onClose }: { entity?: Activity; selection?: SheetSelection; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!entity) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', escape) }
  }, [entity, onClose])
  if (!entity) return null
  const facts = [
    { label: 'Duration', value: entity.activity.duration }, { label: 'Distance', value: entity.activity.distance },
    { label: 'Effort', value: entity.activity.effort }, { label: 'Weather', value: entity.activity.weather },
    { label: 'Booking', value: entity.activity.bookingRequirement }, { label: 'Timing', value: entity.activity.timingNote },
  ].filter((fact) => fact.value)
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="activity-sheet" role="dialog" aria-modal="true" aria-labelledby="activity-sheet-title">
      <div className="sheet-handle" />
      <header className="sheet-head"><div><p className="eyebrow">{entity.region} · activity</p><h2 id="activity-sheet-title">{entity.name}</h2></div><button ref={close} className="icon-button" aria-label="Close activity details" onClick={onClose}><Icon name="close" size={20} /></button></header>
      <div className="sheet-body">{entity.description && <p className="sheet-lede">{entity.description}</p>}<PlaceActions entity={entity} />
        {selection && <div className="sheet-choice"><div><strong>{selection.group}</strong><small>{selection.selected ? 'This option is selected.' : 'Choose this option for the itinerary.'}</small></div><button className="button" disabled={selection.selected || selection.busy} onClick={selection.onSelect}>{selection.selected ? 'Selected' : 'Choose this option'}</button></div>}
        {facts.length > 0 && <dl className="sheet-facts">{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        {entity.notes && <div className="sheet-note preserve-lines">{entity.notes}</div>}
        {entity.activity.accessNotes && entity.activity.accessNotes !== entity.notes && <div className="sheet-note preserve-lines">{entity.activity.accessNotes}</div>}
        <a className="detail-link" href={`#/place/${entity.id}`}>Open full details & editing <Icon name="arrow" size={16} /></a>
      </div>
    </section>
  </div>
}

export function DayView({ trip, day, todayMode = false, onSaveNote, onDirty, onSaveTrip }: { onSaveTrip: SaveTrip; trip: Trip; day: Day; todayMode?: boolean; onSaveNote: (value: string) => Promise<void>; onDirty: (value: boolean) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState<Activity>()
  const [detailChoiceId, setDetailChoiceId] = useState<string>()
  const [noticesOpen, setNoticesOpen] = useState(true)
  async function update(nextTrip: Trip) { setBusy(true); setError(''); try { await onSaveTrip(nextTrip); return true } catch (e) { setError((e as Error).message); return false } finally { setBusy(false) } }
  const index = trip.days.findIndex((option) => option.id === day.id)
  const next = trip.days[index + 1]
  const stay = trip.stays.find((option) => option.id === day.stayId)
  const checkoutStay = !stay ? trip.stays.find((option) => option.checkOutDate === day.date) : undefined
  const stayContext = stay ?? checkoutStay
  const checkoutOnly = !stay && Boolean(checkoutStay)
  const hotel = trip.entities.find((entity) => entity.id === stayContext?.hotelId)
  const entities = new Map(trip.entities.map((entity) => [entity.id, entity]))
  type ItineraryRow = { type: 'item'; item: Day['items'][number] } | { type: 'choice'; group: string; items: Day['items'] }
  const itineraryRows: ItineraryRow[] = []
  const grouped = new Set<string>()
  day.items.forEach((item) => {
    const group = choiceGroup(trip, item)
    if (!group) itineraryRows.push({ type: 'item', item })
    else if (!grouped.has(group)) {
      grouped.add(group)
      itineraryRows.push({ type: 'choice', group, items: day.items.filter((candidate) => choiceGroup(trip, candidate) === group) })
    }
  })
  const notices = day.notices
  return <div className="day-view">
    {todayMode && <DateSelector trip={trip} day={day} />}
    <header className="page-heading compact-day-heading">
      <h1>{day.title}</h1>
    </header>
    {error && <p role="alert" className="error">{error}</p>}
    <section className="day-ahead" aria-label="Day itinerary">
      <DayNote key={day.id} day={day} onSave={onSaveNote} onDirty={onDirty} />
      <ol className="timeline">{itineraryRows.map((row) => {
        if (row.type === 'choice') {
          const hasSelection = row.items.some((item) => item.status === 'skipped')
          return <li className="choice-row" key={row.group}>
            <div className="timeline-marker flex-time"><span className="timeline-time">Choice</span><span className="timeline-kind visit" title="Choose an activity"><Icon name="visit" size={16} /></span></div>
            <div className="timeline-content"><div className="timeline-title"><h3>{row.group}</h3></div><p>Tap an option for details.</p><div className="choice-options">{row.items.map((item) => {
              const activity = item.entityIds.map((id) => entities.get(id)).find((entity): entity is Activity => entity?.type === 'activity')
              const selected = hasSelection && item.status !== 'skipped'
              const shortTitle = item.title.replace(/^.*?—\s*/, '').replace(/^./, (letter) => letter.toUpperCase())
              return <div className={`choice-option ${selected ? 'selected' : ''} ${item.status === 'skipped' ? 'skipped' : ''}`} key={item.id}>
                {activity ? <button onClick={() => { setDetail(activity); setDetailChoiceId(item.id) }} aria-label={`View details for ${activity.name}`}><strong>{shortTitle}</strong><small>{selected ? 'Selected' : item.status === 'skipped' ? 'Not selected' : activity.name}</small><Icon name="chevron" size={15} /></button> : <a href={`#/item/${item.id}`}><strong>{shortTitle}</strong><small>View option</small><Icon name="chevron" size={15} /></a>}
              </div>
            })}</div></div>
          </li>
        }
        const item = row.item
        const kind = resolveItemKind(item, entities)
        return <li key={item.id}>
        <div className={`timeline-marker ${item.time ? '' : 'flex-time'}`}><span className="timeline-time">{itemTimeLabel(item)}</span><span className={`timeline-kind ${kind}`} title={itemKindLabels[kind]}>{kind === 'other' ? <i /> : <Icon name={kind} size={16} />}</span></div>
        <div className="timeline-content">
          <div className="timeline-title"><h3>{item.title}</h3><a className="icon-button edit-visit" href={`#/item/${item.id}`} aria-label={`Edit ${item.title}`}><Icon name="edit" size={16} /></a></div>
          <div className="meta-line">{item.status !== 'planned' && <span className={`status-badge ${item.status}`}>{item.status}</span>}{item.booking && <StatusBadge booking={item.booking} hideTime={item.booking.time === item.time} />}{item.optional && <span className="status-badge optional">Optional</span>}{item.booking?.arrivalBefore && <span className="status-badge neutral">Arrive by {item.booking.arrivalBefore}</span>}</div>
          {item.notes && <p className="preserve-lines">{item.notes}</p>}
          <p>{item.description}</p>
          {item.entityIds.length > 0 && <div className="item-places">{item.entityIds.map((id) => {
            const entity = entities.get(id)
            if (!entity) return null
            return <div className="item-place" key={id}>
              {entity.type === 'activity'
                ? <button className="place-name entity-detail-trigger" onClick={() => setDetail(entity)}>{entity.name}<Icon name="chevron" size={15} /></button>
                : <a className="place-name" href={`#/place/${id}`}>{entity.name}<Icon name="chevron" size={15} /></a>}
              {entity.navigationUrl && <a className="compact-action" href={entity.navigationUrl} target="_blank" rel="noopener noreferrer" aria-label={`Navigate to ${entity.name}`} title={`Navigate to ${entity.name}`}><Icon name="pin" size={16} /><span className="sr-only">Navigate to {entity.name}</span></a>}
            </div>
          })}</div>}
        </div>
      </li>})}</ol>
    </section>
    {hotel?.type === 'hotel' && <section className="hotel-panel">
      <p className="eyebrow">{checkoutOnly ? 'Checking out' : 'Tonight'} · {hotel.region}</p><div className="hotel-title"><h2><a href={`#/place/${hotel.id}`}>{hotel.name}</a></h2>{stayContext && <StatusBadge booking={stayContext.booking} />}</div>
      <dl>{checkoutOnly ? <div><dt>Check-out</dt><dd>{hotel.hotel.checkOut || 'Confirm with hotel'}</dd></div> : <div><dt>Check-in</dt><dd>{hotel.hotel.checkIn || 'Confirm with hotel'}</dd></div>}<div><dt>Breakfast</dt><dd>{hotel.hotel.breakfast || 'Confirm with hotel'}</dd></div>{hotel.hotel.parking && <div><dt>Parking</dt><dd>{hotel.hotel.parking}</dd></div>}</dl>
      <div className="hotel-actions"><PlaceActions entity={hotel} /><a className="action" href={`#/place/${hotel.id}`}>Details</a>{stayContext && <a className="icon-button" href={`#/stay/${stayContext.id}`} aria-label={`Edit stay at ${hotel.name}`}><Icon name="edit" size={16} /></a>}</div>
      <details className="hotel-more"><summary>{checkoutOnly ? 'Departure & stay details' : 'Arrival & stay details'}</summary>{stayContext && <BookingDetails booking={stayContext.booking} />}{hotel.hotel.arrivalRequirements && <p>{hotel.hotel.arrivalRequirements}</p>}{hotel.notes && <p>{hotel.notes}</p>}<p className="small muted">{stayContext?.checkInDate} — {stayContext?.checkOutDate} · Checkout {hotel.hotel.checkOut || 'confirm with hotel'}</p>{hotel.hotel.dinner && <p className="small">Dinner: {hotel.hotel.dinner}</p>}</details>
    </section>}
    {!hotel && <section className="notice no-stay"><h2>No overnight stay</h2><p>No hotel assigned to this night.</p><a className="detail-link" href="#/explore">Choose a hotel in Explore</a></section>}
    {notices.length > 0 && <details className="notices" open={noticesOpen} onToggle={(event) => setNoticesOpen(event.currentTarget.open)}><summary><span>Keep in mind</span><Icon name="chevron" size={17} /></summary><div className="notice-list">{notices.map((notice, i) => <div key={i} className={`notice ${notice.kind}`}><h3>{notice.title}</h3><p>{notice.body}</p></div>)}</div></details>}
    {day.background.length > 0 && <details className="background"><summary>Details & planning background</summary>{day.background.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</details>}
    <section className="day-review" aria-labelledby="day-review-title"><div className="section-heading"><h2 id="day-review-title">Actions & bookings to review</h2></div><div className="actions"><a className="button" href={`#/new/${day.id}`}>Add a place or note</a><a className="action" href="#/explore">Find an alternative</a></div><TodayReview trip={trip} dayId={day.id} /></section>
    {next && <a className="tomorrow" href={`#/${todayMode ? 'today' : 'day'}/${next.id}`}><span className="eyebrow">Tomorrow · {formatDate(next.date)}</span><strong>{next.title}</strong><span>{next.items.filter((item) => item.status !== 'skipped').slice(0, 3).map((item) => `${item.time ? itemTimeLabel(item) : item.booking?.time || ''} ${item.title}`).join(' · ')}</span><span className="detail-link">See the next day <Icon name="arrow" size={18} /></span></a>}
    <ActivitySheet entity={detail} selection={detailChoiceId ? (() => {
      const item = day.items.find((candidate) => candidate.id === detailChoiceId)
      const group = item && choiceGroup(trip, item)
      if (!item || !group) return undefined
      const selected = item.status !== 'skipped' && day.items.some((candidate) => choiceGroup(trip, candidate) === group && candidate.status === 'skipped')
      return { group, selected, busy, onSelect: () => { void update(selectChoice(trip, item.id)).then((saved) => { if (saved) { setDetail(undefined); setDetailChoiceId(undefined) } }) } }
    })() : undefined} onClose={() => { setDetail(undefined); setDetailChoiceId(undefined) }} />
  </div>
}
