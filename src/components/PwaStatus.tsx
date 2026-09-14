import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaStatus({ busy }: { busy: boolean }) {
  const [error, setError] = useState('')
  const { offlineReady: [offlineReady, setOfflineReady], needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError() { setError('Offline setup could not finish. Reopen the app while connected to try again.') },
  })
  if (!offlineReady && !needRefresh && !error) return null
  return <aside className="pwa-message" aria-live="polite">
    <span>{error || (needRefresh ? 'An app update is ready.' : 'Ready for offline use on this device.')}</span>
    {needRefresh && <button disabled={busy} onClick={() => { void updateServiceWorker(true).catch(() => setError('The update could not finish. Please try again while connected.')) }}>{busy ? 'Finish editing first' : 'Update app'}</button>}
    <button className="text-button" onClick={() => { setOfflineReady(false); setNeedRefresh(false); setError('') }}>Dismiss</button>
  </aside>
}
