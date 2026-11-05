/**
 * Tiny `clsx`-style helper. We keep it dependency-free so the renderer bundle
 * stays small. Accepts strings, numbers, arrays and `Record<string, boolean>`.
 */
type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined }

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) out.push(key)
      }
    }
  }
  return out.join(' ')
}
