import { useRef, useState } from 'react'
import { parseTrip, type Booking, type Entity, type ItemKind, type Trip } from '../domain/trip'
import { actionTargets, actionUsesBookings, emptyBooking, moveItem, newEntity, removeEntity, schedule } from '../domain/operations'
import { itemKindLabels } from '../domain/itinerary'

export type SaveTrip = (trip: Trip) => Promise<void>
export function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value?: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="field">{label}{type === 'textarea' ? <textarea aria-label={label} value={value ?? ''} onChange={e => onChange(e.target.value)} /> : <input aria-label={label} type={type} required={required} value={value ?? ''} onChange={e => onChange(e.target.value)} />}</label>
}
export function BookingFields({ value, onChange }: { value: Booking; onChange: (booking: Booking) => void }) {
  return <fieldset><legend>Booking · Spain local time</legend>
    <label className="field">Booking required<select aria-label="Booking required" value={value.required === null ? 'unknown' : String(value.required)} onChange={e => onChange({ ...value, required: e.target.value === 'unknown' ? null : e.target.value === 'true' })}><option value="unknown">Unknown</option><option value="true">Yes</option><option value="false">No</option></select></label>
    <label className="field">Booking status<select aria-label="Booking status" value={value.status} onChange={e => onChange({ ...value, status: e.target.value as Booking['status'] })}>{['unknown', 'pending', 'booked', 'not-needed', 'needs-check', 'cancelled'].map(s => <option key={s} value={s}>{s === 'booked' ? 'Confirmed' : s}</option>)}</select></label>
    {(['date', 'time', 'arrivalBefore', 'reservationName', 'reference', 'bookingUrl', 'documentUrl', 'notes'] as const).map(key => <Field key={key} label={{ date: 'Booked date', time: 'Booked time', arrivalBefore: 'Arrive before', reservationName: 'Reservation name', reference: 'Booking reference', bookingUrl: 'Booking link', documentUrl: 'Document / Drive link', notes: 'Booking notes' }[key]} type={key === 'date' ? 'date' : ['time', 'arrivalBefore'].includes(key) ? 'time' : key.endsWith('Url') ? 'url' : key === 'notes' ? 'textarea' : 'text'} value={value[key]} onChange={v => onChange({ ...value, [key]: v || (key === 'notes' ? '' : undefined) })} />)}
  </fieldset>
}
export function Editor({ trip, mode, id, onSave, onDirty }: { trip: Trip; mode: string; id?: string; onSave: SaveTrip; onDirty: (value: boolean) => void }) {
  const [draft, setDraft] = useState(() => structuredClone(trip))
  const [created, setCreated] = useState<Entity>(() => newEntity('activity'))
  const typeDrafts = useRef(new Map<string, Entity>())
  const [createdBooking, setCreatedBooking] = useState<Booking>(emptyBooking)
  const [dayId, setDayId] = useState(id && mode === 'new' ? id : trip.days[0].id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)
  const entity = mode === 'new' ? created : draft.entities.find(e => e.id === id)
  const day = draft.days.find(d => d.items.some(i => i.id === id))
  const item = day?.items.find(i => i.id === id)
  const stay = draft.stays.find(s => s.id === id)
  const action = draft.actions.find(a => a.id === id)
  function change(work: (next: Trip) => void) { const next = structuredClone(draft); work(next); setDraft(next); setChanged(true); onDirty(true) }
  function changeEntity(value: Entity) { if (mode === 'new') { setCreated(value); setChanged(true); onDirty(true) } else change(n => { n.entities = n.entities.map(e => e.id === id ? value : e) }) }
  async function commit(next: Trip, destination: string) {
    setSaving(true); setError('')
    try { await onSave(parseTrip(next)); onDirty(false); location.hash = destination }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed. Your draft is still here.') }
    finally { setSaving(false) }
  }
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    let next = draft
    try {
      if (mode === 'new') {
        next = { ...draft, entities: [...draft.entities, created] }
        if (dayId) {
          next = schedule(next, created, dayId)
          if (created.type === 'hotel') next.stays.at(-1)!.booking = createdBooking
          else if (created.type !== 'note') next.days.find(d => d.id === dayId)!.items.at(-1)!.booking = createdBooking
        }
      }
      if (mode === 'schedule' && entity) next = schedule(draft, entity, dayId)
      if (mode === 'stay' && stay) {
        const original = trip.stays.find(s => s.id === id)!
        if (original.checkInDate !== stay.checkInDate || original.checkOutDate !== stay.checkOutDate) {
          next = structuredClone(draft)
          next.days.forEach(d => { if (d.stayId === id) delete d.stayId; if (d.date >= stay.checkInDate && d.date < stay.checkOutDate) d.stayId = id })
        }
      }
      void commit(next, mode === 'item' ? `#/day/${day?.id}` : ['new', 'schedule'].includes(mode) && dayId ? `#/day/${dayId}` : mode === 'entity' ? `#/place/${id}` : '#/more')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.') }
  }
  const daySelect = (value: string, update: (v: string) => void, allowNone = false) => <label className="field">Day<select aria-label="Day" value={value} onChange={e => update(e.target.value)}>{allowNone && <option value="">Library only</option>}{trip.days.map(d => <option key={d.id} value={d.id}>{d.date} · {d.title}</option>)}</select></label>
  if ((['entity', 'schedule'].includes(mode) && !entity) || (mode === 'item' && !item) || (mode === 'stay' && !stay) || (mode === 'action' && !action)) return <><h1>This entry is no longer in your trip</h1><a className="action" href="#/today">Return to Today</a></>
  return <><h1>{mode === 'new' ? 'Add a place or note' : mode === 'schedule' ? `Schedule ${entity?.name ?? 'place'}` : mode === 'documents' ? 'Edit document shortcuts' : mode === 'item' ? 'Edit visit' : mode === 'stay' ? 'Edit stay' : mode === 'action' ? 'Review action' : 'Edit place'}</h1>
    <p className="muted">Changes save on this device, including offline.</p>
    <form className="editor" onSubmit={submit}><fieldset disabled={saving}>
      {mode === 'new' && <label className="field">Type<select aria-label="Type" value={created.type} onChange={e => { typeDrafts.current.set(created.type, created); const next = structuredClone(typeDrafts.current.get(e.target.value) ?? newEntity(e.target.value as Entity['type'])); Object.assign(next, Object.fromEntries(Object.entries(created).filter(([key]) => !['type', 'hotel', 'activity', 'restaurant', 'note', 'transport'].includes(key)))); changeEntity(next) }}>{['activity', 'hotel', 'restaurant', 'note'].map(t => <option key={t}>{t}</option>)}</select></label>}
      {(mode === 'new' || mode === 'entity') && entity && <>
        <Field label="Name" value={entity.name} required onChange={v => changeEntity({ ...entity, name: v })} />
        {mode === 'new' && daySelect(dayId, v => { setDayId(v); setChanged(true); onDirty(true) }, true)}
        <details open={mode === 'entity'}><summary>Place details & notes (optional)</summary>
        {(['region', 'description', 'notes', 'navigationUrl', 'websiteUrl', 'phone'] as const).map(key => <Field key={key} label={{ name: 'Name', region: 'Region', description: 'Description', notes: 'Place notes', navigationUrl: 'Navigation link', websiteUrl: 'Website link', phone: 'Phone' }[key]} value={entity[key]}  type={key.endsWith('Url') ? 'url' : ['notes', 'description'].includes(key) ? 'textarea' : 'text'} onChange={v => changeEntity({ ...entity, [key]: v || (['navigationUrl', 'websiteUrl', 'phone'].includes(key) ? undefined : '') })} />)}
        {Object.entries(entity.type === 'hotel' ? entity.hotel : entity.type === 'activity' ? entity.activity : entity.type === 'restaurant' ? entity.restaurant : entity.type === 'note' ? entity.note : {}).map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={value} onChange={v => changeEntity({ ...entity, [entity.type]: { ...(entity.type === 'hotel' ? entity.hotel : entity.type === 'activity' ? entity.activity : entity.type === 'restaurant' ? entity.restaurant : entity.type === 'note' ? entity.note : {}), [key]: v } } as Entity)} />)}
        </details>
      </>}
      {mode === 'schedule' && daySelect(dayId, v => { setDayId(v); setChanged(true); onDirty(true) })}
      {mode === 'new' && dayId && created.type !== 'note' && <details><summary>Booking details (optional)</summary><BookingFields value={createdBooking} onChange={v => { setCreatedBooking(v); setChanged(true); onDirty(true) }} /></details>}
      {['new', 'schedule'].includes(mode) && entity?.type === 'hotel' && <p>A hotel is assigned to the selected night. Edit the stay afterwards to extend its dates or adjust its booking.</p>}
      {mode === 'item' && item && day && <>
        <Field label="Visit title" required value={item.title} onChange={v => change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.title = v })} />
        <label className="field">Timeline icon<select aria-label="Timeline icon" value={item.kind} onChange={e => change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.kind = e.target.value as ItemKind })}>{(Object.entries(itemKindLabels) as [ItemKind, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {daySelect(day.id, v => { setDraft(moveItem(draft, item.id, v)); setChanged(true); onDirty(true) })}
        {(['time', 'endTime', 'description', 'notes', 'choiceGroup'] as const).map(key => <Field key={key} label={{ time: 'Start time', endTime: 'End time', description: 'Visit description', notes: 'Visit notes', choiceGroup: 'Exclusive choice group (optional)' }[key]} type={key.includes('Time') || key === 'time' ? 'time' : 'text'} value={item[key]} onChange={v => change(n => { Object.assign(n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!, { [key]: v || (['description', 'notes'].includes(key) ? '' : undefined) }) })} />)}
        <label className="field">Visit status<select aria-label="Visit status" value={item.status} onChange={e => change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.status = e.target.value as typeof item.status })}>{['planned', 'done', 'skipped'].map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="check-field"><input type="checkbox" checked={item.optional} onChange={e => change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.optional = e.target.checked })} />Optional visit</label>
        <label className="field">Visit places<select aria-label="Visit places" multiple value={item.entityIds} onChange={e => { const ids = Array.from(e.target.selectedOptions, o => o.value); change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.entityIds = ids }) }}>{draft.entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <BookingFields value={item.booking ?? emptyBooking()} onChange={v => change(n => { n.days.find(d => d.id === day.id)!.items.find(i => i.id === id)!.booking = v })} />
      </>}
      {mode === 'stay' && stay && <>
        <label className="field">Hotel<select aria-label="Hotel" value={stay.hotelId} onChange={e => change(n => { n.stays.find(s => s.id === id)!.hotelId = e.target.value })}>{draft.entities.filter(e => e.type === 'hotel').map(e => <option value={e.id} key={e.id}>{e.name}</option>)}</select></label>
        {(['checkInDate', 'checkOutDate'] as const).map(key => <Field key={key} label={key === 'checkInDate' ? 'Check-in date' : 'Check-out date'} type="date" required value={stay[key]} onChange={v => change(n => { n.stays.find(s => s.id === id)![key] = v })} />)}
        <p className="small">Changing dates assigns this hotel to the covered nights. Checkout is the following morning.</p>
        <BookingFields value={stay.booking} onChange={v => change(n => { n.stays.find(s => s.id === id)!.booking = v })} />
      </>}
      {mode === 'action' && action && <>
        <h2>{action.title}</h2><p>{action.description}</p>
        <Field label="Action deadline (optional)" type="date" value={action.dueDate} onChange={v => change(n => { n.actions.find(a => a.id === id)!.dueDate = v || undefined })} />
        {!actionUsesBookings(draft, action) && <label className="field">Action status<select aria-label="Action status" value={action.status} onChange={e => change(n => { n.actions.find(a => a.id === id)!.status = e.target.value as typeof action.status })}><option value="pending">Pending</option><option value="done">Done / checked</option></select></label>}
        <p>For booking-only actions, confirmation comes from the linked bookings below. Access, arrival and extra arrangements must be checked separately.</p>
        {actionTargets(draft, action).visits.map(({ item: i }) => <div key={i.id}><h2>{i.title}</h2><BookingFields value={i.booking ?? emptyBooking()} onChange={v => change(n => { n.days.flatMap(d => d.items).find(item => item.id === i.id)!.booking = v })} /></div>)}
        {actionTargets(draft, action).stays.map(s => <div key={s.id}><h2>{draft.entities.find(e => e.id === s.hotelId)?.name}</h2><BookingFields value={s.booking} onChange={v => change(n => { n.stays.find(st => st.id === s.id)!.booking = v })} /></div>)}
      </>}
      {mode === 'documents' && <><p>Store links to your restricted Drive folder or documents. External links need connectivity and the appropriate account.</p>{draft.documentLinks.map((link, index) => <div key={index}><Field label={`Shortcut ${index + 1} name`} value={link.label} required onChange={v => change(n => { n.documentLinks[index].label = v })} /><Field label={`Shortcut ${index + 1} URL`} value={link.url} type="url" required onChange={v => change(n => { n.documentLinks[index].url = v })} /><button className="text-button" type="button" onClick={() => change(n => { n.documentLinks.splice(index, 1) })}>Remove shortcut {index + 1}</button></div>)}<button className="action" type="button" onClick={() => change(n => { n.documentLinks.push({ label: '', url: '' }) })}>Add shortcut</button></>}
      <div className="editor-footer"><button className="button" type="submit">{saving ? 'Saving…' : 'Save changes'}</button><button className="action" type="button" onClick={() => { if (!changed || confirm('Discard unsaved changes?')) { onDirty(false); location.hash = '#/today' } }}>Cancel</button></div>
      {mode === 'entity' && entity?.userCreated && <button type="button" className="text-button danger" onClick={() => { try { const next = removeEntity(draft, entity.id); if (confirm('Delete this place from the library?')) void commit(next, '#/explore') } catch (e) { setError((e as Error).message) } }}>Delete unused place</button>}
      {mode === 'item' && item && <button type="button" className="text-button danger" onClick={() => { if (confirm('Remove this visit from the day? Shared places remain in Explore.')) { const next = structuredClone(draft); next.days.forEach(d => { d.items = d.items.filter(i => i.id !== id) }); next.actions.forEach(a => { if (a.itemIds) a.itemIds = a.itemIds.filter(i => i !== id) }); void commit(next, `#/day/${day?.id}`) } }}>Remove scheduled visit</button>}
      {mode === 'stay' && stay && <button type="button" className="text-button danger" onClick={() => { if (confirm('Remove this stay and its overnight assignments? The hotel remains in Explore.')) { const next = structuredClone(draft); next.stays = next.stays.filter(s => s.id !== id); next.days.forEach(d => { if (d.stayId === id) delete d.stayId }); next.actions.forEach(a => { if (a.stayIds) a.stayIds = a.stayIds.filter(s => s !== id) }); void commit(next, '#/more') } }}>Remove stay</button>}
    </fieldset>{error && <p className="error" role="alert">{error}</p>}</form></>
}
