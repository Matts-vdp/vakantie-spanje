export type IconName = 'today' | 'trip' | 'explore' | 'more' | 'arrow' | 'chevron' | 'pin' | 'check' | 'back' | 'edit' | 'close' | 'search' | 'alert' | 'drive' | 'walk' | 'food' | 'visit' | 'stay' | 'flight' | 'bike'
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
  drive: 'M5 17h14v-5l-2-5H7l-2 5v5Zm2-10-2 5h14l-2-5M7 17v2m10-2v2M7.5 14h.01m9 0h.01',
  walk: 'M13 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 18 1-6 2-3 2 3 3 1m-9-9-3 4-3 1m6-5 4 3',
  food: 'M6 3v8m-3-8v5a3 3 0 0 0 6 0V3M6 11v10m8-18v18m0-7h4V3a4 4 0 0 0-4 4Z',
  visit: 'M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M2 21h20M12 3l8 5H4Z',
  stay: 'M3 20V9m0 7h18v4m0-7v3M7 13V8h5a3 3 0 0 1 3 3v2H7Z',
  flight: 'm3 11 18-7-7 17-3-6-5 2 2-5Z',
  bike: 'M5.5 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM9 6h3l3 6m-9.5 3h6L9 9m3 0h4',
}
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
