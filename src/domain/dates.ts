import type { Trip } from './trip'

export function tripDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function activeDay(trip: Trip, now = new Date()) {
  const today = tripDate(now, trip.timezone)
  const phase = today < trip.startDate ? 'before' : today > trip.endDate ? 'after' : 'during'
  const day = trip.days.find((d) => d.date === today) ?? (phase === 'before' ? trip.days[0] : trip.days[trip.days.length - 1])
  return { day, phase, today } as const
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}
