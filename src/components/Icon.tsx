export type IconName = 'today' | 'trip' | 'explore' | 'more' | 'arrow' | 'chevron' | 'pin' | 'check' | 'back' | 'edit' | 'close' | 'search' | 'alert'
const paths: Record<IconName, string> = {
  today: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2m2 10h3m4 0h3m-10 3h3',
  trip: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
  explore: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5Z',
  more: 'M5 6h14M5 12h14M5 18h14',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chevron: 'm9 18 6-6-6-6',
  pin: 'm4 10 16-6-6 16-3-7Z',
  check: 'm5 12 4 4L19 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  edit: 'm4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm9.8-12.2 3 3',
  close: 'm6 6 12 12M18 6 6 18',
  search: 'm20 20-4.5-4.5m2.5-4.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  alert: 'M12 9v4m0 4h.01M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
}
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
