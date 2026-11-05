// Force Turkish locale so the UI string is consistent regardless of OS locale.
const RTF = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' })

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1]
]

/**
 * "3 minutes ago", "yesterday", "in 2 weeks". Locale-aware via Intl.
 * Returns null if input is falsy so callers can skip rendering cleanly.
 */
export function relativeTime(timestamp: number | undefined | null): string | null {
  if (!timestamp) return null
  const diffSec = (timestamp - Date.now()) / 1000
  for (const [unit, secs] of STEPS) {
    if (Math.abs(diffSec) >= secs || unit === 'second') {
      return RTF.format(Math.round(diffSec / secs), unit)
    }
  }
  return null
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
