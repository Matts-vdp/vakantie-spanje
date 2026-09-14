import { useState } from 'react'
import { parseTrip, serializeTrip, type Trip } from '../domain/trip'
import { actionDone, actionTargets, actionUsesBookings, bookingLabel, nearActions } from '../domain/operations'
import { tripStore } from '../storage/trip-store'
import type { SaveTrip } from './Editor'

function downloadTrip(trip: Trip, prefix = 'trip-export') {
  const url = URL.createObjectURL(new Blob([serializeTrip(trip)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${prefix}-${trip.id}.json`; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}
export function ActionList({ trip, dayId }: { trip: Trip; dayId?: string }) {
  const day = trip.days.find(d => d.id === dayId)
  const actions = day ? nearActions(trip, day) : trip.actions
  const content = <>
    {!actions.length && <p>No unresolved checklist actions in this window.</p>}
    <div className="checklist">{actions.map(action => {
      const targets = actionTargets(trip, action)
      return <div key={action.id}><span className="tag">{actionDone(trip, action) ? 'Resolved' : actionUsesBookings(trip, action) ? 'Booking pending' : 'Checks pending'} · {action.dueDate ?? action.timing}</span><h3>{action.title}</h3>{!day && <p>{action.description}</p>}<div className="actions"><a className="action" href={`#/action/${action.id}`}>Review action</a>{[...new Set(targets.dayIds)].slice(0, day ? 1 : undefined).map(id => <a className="detail-link" key={id} href={`#/day/${id}`}>{trip.days.find(d => d.id === id)?.date}</a>)}</div></div>
    })}</div></>
  return day ? <details className="attention-summary"><summary>{actions.length} actions to review · next 3 days</summary>{content}</details> : <section className="tool-section"><h2>Booking & check actions</h2>{content}</section>
}
export function BookingOverview({ trip, dayId }: { trip: Trip; dayId?: string }) {
  const day = trip.days.find(d => d.id === dayId)
  const limit = day ? new Date(Date.parse(day.date) + 2 * 86400000).toISOString().slice(0, 10) : ''
  const visits = trip.days.filter(d => !day || (d.date >= day.date && d.date <= limit)).flatMap(d => d.items.filter(i => i.booking && i.status !== 'skipped').map(i => ({ id: i.id, name: i.title, date: d.date, booking: i.booking!, route: 'item' })))
  const stays = trip.stays.filter(s => !day || (s.checkInDate <= limit && s.checkOutDate > day.date)).map(s => ({ id: s.id, name: trip.entities.find(e => e.id === s.hotelId)?.name, date: s.checkInDate, booking: s.booking, route: 'stay' }))
  const rows = [...visits, ...stays].filter(r => !day || !['booked', 'not-needed', 'cancelled'].includes(r.booking.status))
  const content = <>{!rows.length && <p>No bookings needing attention.</p>}{rows.map(r => <div className="booking-row" key={r.id}><a href={`#/${r.route}/${r.id}`}><strong>{r.name}</strong></a><p>{r.date} · {bookingLabel(r.booking)} {r.booking.time && `· ${r.booking.time}`} {r.booking.arrivalBefore && `· Arrive before ${r.booking.arrivalBefore}`}</p>{r.booking.documentUrl && <a className="detail-link" href={r.booking.documentUrl} target="_blank" rel="noopener noreferrer">Open document ↗</a>}</div>)}</>
  return day ? <details className="attention-summary"><summary>{rows.length} unconfirmed bookings · next 3 days</summary>{content}</details> : <section className="tool-section"><h2>All visit & stay bookings</h2>{content}</section>
}
export function MoreTools({ trip, onReplace, onDirty }: { trip: Trip; onReplace: SaveTrip; onDirty: (value: boolean) => void }) {
  const [candidate, setCandidate] = useState<Trip | null>(null)
  const [kind, setKind] = useState('Import')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function select(file?: File) {
    if (!file) return
    setMessage(''); setCandidate(null); setBusy(true); onDirty(true)
    try { if (file.size > 5_000_000) throw new Error('This file is too large. Choose a trip JSON export under 5 MB.'); setCandidate(parseTrip(JSON.parse(await file.text()))); setKind('Import') }
    catch { setMessage('This file is not a compatible trip export. Current data is unchanged.'); onDirty(false) }
    finally { setBusy(false) }
  }
  async function backup() {
    setBusy(true); setMessage('')
    try { const value = await tripStore.readBackup(); if (!value) { setMessage('No pre-import backup exists yet.'); return } setCandidate(value); setKind('Restore backup'); onDirty(true) }
    catch (e) { setMessage((e as Error).message) } finally { setBusy(false) }
  }
  async function replace() {
    if (!candidate) return
    setBusy(true)
    try { await onReplace(candidate); setCandidate(null); onDirty(false); setMessage('Trip replaced on this device. The previous trip is now the pre-import backup.') }
    catch (e) { setMessage((e as Error).message) } finally { setBusy(false) }
  }
  return <>
    <section className="tool-section"><h2>Your trip, on this device</h2><p>Export the entire trip to transfer it to another phone or keep a backup.</p><div className="actions"><button className="button" onClick={() => downloadTrip(trip)}>Export trip data</button><button className="action" disabled={busy} onClick={() => { void backup() }}>Review pre-import backup</button></div>
      <label className="field">Import trip data<input type="file" accept=".json,application/json" disabled={busy} onChange={e => { void select(e.target.files?.[0]); e.target.value = '' }} /></label>
      {candidate && <div className="import-preview"><h3>{kind}: {candidate.name}</h3><p>{candidate.startDate} — {candidate.endDate} · {candidate.days.length} days · {candidate.entities.length} places · {candidate.stays.length} stays · {candidate.days.reduce((n, d) => n + d.items.length, 0)} visits</p><p>Saved {candidate.updatedAt}. This replaces this device’s entire current trip, including notes, bookings and document links. Nothing is merged. One previous trip is kept atomically as a backup; restoring swaps that backup with the current trip.</p><div className="actions"><button className="action" disabled={busy} onClick={() => downloadTrip(trip, 'before-replacement')}>Export current data first</button>{kind === 'Restore backup' && <button className="action" onClick={() => downloadTrip(candidate, 'backup')}>Download backup</button>}<button className="button" disabled={busy} onClick={() => { void replace() }}>Confirm entire trip replacement</button><button className="action" disabled={busy} onClick={() => { setCandidate(null); onDirty(false); setMessage('Replacement cancelled. Current trip is unchanged.') }}>Cancel replacement</button></div></div>}
      {message && <p role="status">{message}</p>}<button className="text-button" onClick={() => { void navigator.storage?.persist?.().then(granted => setMessage(granted ? 'Persistent storage granted.' : 'Browser storage is managed automatically. Keep exports too.')).catch(() => setMessage('Storage preference could not be changed.')) }}>Ask browser to keep trip data</button>
    </section>
    <section className="tool-section"><h2>Documents</h2>{!trip.documentLinks.length && <p>Add your restricted Drive folder or document links. No files are stored in this app.</p>}{trip.documentLinks.map((l, i) => <p key={i}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></p>)}<a className="action" href="#/documents">Edit document shortcuts</a></section>
    <BookingOverview trip={trip} /><ActionList trip={trip} />
    <section><h2>Practical notes</h2>{trip.practicalNotes.map((note, i) => <details className="background" key={i}><summary>{note.title}</summary><p>{note.body}</p></details>)}</section>
  </>
}
