import { useEffect, useState } from 'react'

/**
 * Debounce a fast-changing value (e.g. a search input) so derived work
 * (filtering, fuzzy search, network calls) only runs after the user has
 * paused typing for `delay` ms.
 */
export function useDebounce<T>(value: T, delay = 80): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
