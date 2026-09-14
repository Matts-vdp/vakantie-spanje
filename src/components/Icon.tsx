export type IconName = 'today' | 'trip' | 'explore' | 'more' | 'arrow' | 'pin' | 'check' | 'back'
const paths: Record<IconName, string> = {
  today: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2m2 10h3m4 0h3m-10 3h3',
  trip: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
  explore: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5Z',
  more: 'M5 6h14M5 12h14M5 18h14',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  pin: 'm4 10 16-6-6 16-3-7Z',
  check: 'm5 12 4 4L19 6',
  back: 'M19 12H5m6-6-6 6 6 6',
}
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
