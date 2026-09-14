import { parseTrip, type Trip } from '../domain/trip'

const DB_NAME = 'green-spain-companion'
const STORE = 'trip'
const CURRENT = 'current'
const BACKUP = 'before-import'

export class StaleTripError extends Error {
  constructor() { super('This trip changed in another tab. Reload before saving again. Your text is still in this form.') }
}

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('Device storage is unavailable. Enable browser storage and try again.'))
      return
    }
    const request = indexedDB.open(name, 1)
    let blocked = false
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE)
    }
    request.onblocked = () => {
      blocked = true
      reject(new Error('Close other Green Spain tabs, then try again to unlock device storage.'))
    }
    request.onerror = () => reject(request.error ?? new Error('Could not open device storage.'))
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      if (blocked) db.close()
      else resolve(db)
    }
  })
}

/** Short native IndexedDB transactions. Never report a save before commit. */
export function createTripStore(name = DB_NAME) {
  async function transaction<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, result: (value: T) => void, fail: (error: unknown) => void) => void): Promise<T> {
    const db = await openDatabase(name)
    return new Promise<T>((resolve, reject) => {
      let tx: IDBTransaction
      try { tx = db.transaction(STORE, mode) } catch (error) { db.close(); reject(error); return }
      let result: T
      let failure: unknown
      const fail = (error: unknown) => { failure = error; tx.abort() }
      tx.oncomplete = () => { db.close(); resolve(result) }
      tx.onabort = () => { db.close(); reject(failure ?? tx.error ?? new Error('Device storage could not save the trip.')) }
      tx.onerror = () => { failure ??= tx.error }
      try { work(tx.objectStore(STORE), (value) => { result = value }, fail) } catch (error) { fail(error) }
    })
  }

  return {
    /** Read and seed in one write transaction so two first-load tabs cannot race. */
    async loadOrInitialize(seed: Trip): Promise<Trip> {
      const initial = parseTrip(seed)
      return transaction('readwrite', (store, result, fail) => {
        const request = store.get(CURRENT)
        request.onsuccess = () => {
          try {
            if (request.result === undefined) { store.add(initial, CURRENT); result(initial) }
            else result(parseTrip(request.result))
          } catch (error) { fail(error) }
        }
      })
    },
    async read(): Promise<Trip | undefined> {
      return transaction('readonly', (store, result, fail) => {
        const request = store.get(CURRENT)
        request.onsuccess = () => {
          try { result(request.result === undefined ? undefined : parseTrip(request.result)) } catch (error) { fail(error) }
        }
      })
    },
    async save(next: Trip, expectedRevision: number): Promise<Trip> {
      const checked = parseTrip(next)
      return transaction('readwrite', (store, result, fail) => {
        const request = store.get(CURRENT)
        request.onsuccess = () => {
          try {
            const current = parseTrip(request.result)
            if (current.revision !== expectedRevision) throw new StaleTripError()
            const saved = { ...checked, revision: current.revision + 1, updatedAt: new Date().toISOString() }
            store.put(saved, CURRENT)
            result(saved)
          } catch (error) { fail(error) }
        }
      })
    },
    /** Caller must obtain replacement confirmation. Backup and replacement commit together. */
    async replace(value: unknown, expectedRevision: number): Promise<Trip> {
      const imported = parseTrip(value)
      return transaction('readwrite', (store, result, fail) => {
        const request = store.get(CURRENT)
        request.onsuccess = () => {
          try {
            const current = parseTrip(request.result)
            if (current.revision !== expectedRevision) throw new StaleTripError()
            const saved = { ...imported, revision: current.revision + 1, updatedAt: new Date().toISOString() }
            store.put(current, BACKUP)
            store.put(saved, CURRENT)
            result(saved)
          } catch (error) { fail(error) }
        }
      })
    },
    async readBackup(): Promise<Trip | undefined> {
      return transaction('readonly', (store, result, fail) => {
        const request = store.get(BACKUP)
        request.onsuccess = () => {
          try { result(request.result === undefined ? undefined : parseTrip(request.result)) } catch (error) { fail(error) }
        }
      })
    },
  }
}

export const tripStore = createTripStore()
