import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { createTripStore, StaleTripError } from './trip-store'
import { parseTrip } from '../domain/trip'
import seed from '../data/initial-trip.json'

const setup = () => createTripStore(`test-${crypto.randomUUID()}`)

describe('native IndexedDB trip storage', () => {
  it('initializes once and preserves edits when the bundled seed changes', async () => {
    const store = setup()
    const trip = await store.loadOrInitialize(parseTrip(seed))
    trip.days[0].notes = 'Dinner booked for 20:00'
    const saved = await store.save(trip, trip.revision)
    expect(saved.revision).toBe(1)
    expect((await store.read())?.days[0].notes).toBe('Dinner booked for 20:00')
    const updatedSeed = parseTrip(seed); updatedSeed.name = 'New bundled title'
    expect(await store.loadOrInitialize(updatedSeed)).toEqual(saved)
  })
  it('serializes simultaneous first loads and prevents stale-tab overwrite', async () => {
    const store = setup()
    const [first, second] = await Promise.all([store.loadOrInitialize(parseTrip(seed)), store.loadOrInitialize(parseTrip(seed))])
    first.days[0].notes = 'Saved from phone tab one'
    await store.save(first, first.revision)
    second.days[0].notes = 'Stale tab two'
    await expect(store.save(second, second.revision)).rejects.toBeInstanceOf(StaleTripError)
    expect((await store.read())?.days[0].notes).toBe('Saved from phone tab one')
  })
  it('replaces imported state and saves the previous trip in the same transaction', async () => {
    const store = setup()
    const first = await store.loadOrInitialize(parseTrip(seed))
    first.days[0].notes = 'Local original'
    const current = await store.save(first, first.revision)
    const imported = parseTrip(seed); imported.days[0].notes = 'From the other phone'
    imported.revision = 200
    const replaced = await store.replace(imported, current.revision)
    expect(replaced.revision).toBe(2)
    expect((await store.read())?.days[0].notes).toBe('From the other phone')
    expect((await store.readBackup())?.days[0].notes).toBe('Local original')
  })
  it('leaves data untouched when replacement validation or revision checks fail', async () => {
    const store = setup()
    const current = await store.loadOrInitialize(parseTrip(seed))
    await expect(store.replace({ ...seed, schemaVersion: 99 }, current.revision)).rejects.toThrow()
    await expect(store.replace(seed, 999)).rejects.toBeInstanceOf(StaleTripError)
    expect(await store.read()).toEqual(current)
    expect(await store.readBackup()).toBeUndefined()
  })
  it('refuses invalid saved records instead of silently reseeding them', async () => {
    const name = `test-${crypto.randomUUID()}`
    const store = createTripStore(name)
    await store.loadOrInitialize(parseTrip(seed))
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 1)
      request.onsuccess = () => {
        const db = request.result; const tx = db.transaction('trip', 'readwrite')
        tx.objectStore('trip').put({ schemaVersion: 99 }, 'current')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
    await expect(store.loadOrInitialize(parseTrip(seed))).rejects.toThrow()
  })
})


describe('transaction failure and restore integrity', () => {
  it('rejects aborted writes and preserves current state and backup atomically', async () => {
    const store = setup()
    const initial = await store.loadOrInitialize(parseTrip(seed))
    const imported = parseTrip(seed); imported.days[0].notes = 'Imported'
    const current = await store.replace(imported, initial.revision)
    const originalPut = IDBObjectStore.prototype.put
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
      const request = originalPut.call(this, value, key)
      this.transaction.abort()
      return request
    })
    try {
      const next = structuredClone(current); next.days[0].notes = 'Must not commit'
      await expect(store.save(next, current.revision)).rejects.toThrow()
      await expect(store.replace(next, current.revision)).rejects.toThrow()
      expect(await store.read()).toEqual(current)
      expect(await store.readBackup()).toEqual(initial)
    } finally { spy.mockRestore() }
    const restored = await store.replace((await store.readBackup())!, current.revision)
    expect(restored.days[0].notes).toBe(initial.days[0].notes)
    expect(await store.readBackup()).toEqual(current)
  })
})
