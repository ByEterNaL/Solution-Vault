import { useEffect } from 'react'

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ShortcutBinding {
  /** Combo description like "ctrl+n", "ctrl+shift+c", "esc". Modifiers are case-insensitive. */
  combo: string
  handler: (e: KeyboardEvent) => void
  /** When true, also fires inside <input>/<textarea>. Default: false. */
  allowInInput?: boolean
  /** When true, prevents default & stops propagation. Default: true. */
  preventDefault?: boolean
}

const MOD_KEYS: Modifier[] = ['ctrl', 'meta', 'shift', 'alt']

function parse(combo: string): { key: string; mods: Set<Modifier> } {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim())
  const mods = new Set<Modifier>()
  let key = ''
  for (const p of parts) {
    if ((MOD_KEYS as string[]).includes(p)) mods.add(p as Modifier)
    else key = p
  }
  return { key, mods }
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function matches(e: KeyboardEvent, parsed: ReturnType<typeof parse>): boolean {
  const { key, mods } = parsed
  if (e.key.toLowerCase() !== key && e.code.toLowerCase() !== key) {
    // Special-case: "space" → key === " "
    if (!(key === 'space' && e.code === 'Space')) return false
  }
  if (mods.has('ctrl') !== (e.ctrlKey || (e.metaKey && navigator.platform.startsWith('Mac'))))
    return false
  if (mods.has('shift') !== e.shiftKey) return false
  if (mods.has('alt') !== e.altKey) return false
  return true
}

/**
 * Bind multiple keyboard shortcuts to the document.
 *
 * Bindings array is read on every event; that's fine because the array is
 * tiny (a dozen entries at most) and this avoids `useCallback` choreography
 * in callers.
 */
export function useShortcuts(bindings: ShortcutBinding[]): void {
  useEffect(() => {
    const parsed = bindings.map((b) => ({ ...b, parsed: parse(b.combo) }))
    const onKeyDown = (e: KeyboardEvent): void => {
      for (const b of parsed) {
        if (!b.allowInInput && isEditable(e.target)) {
          // Always allow Esc & explicit allow-in-input bindings
          if (b.parsed.key !== 'escape') continue
        }
        if (matches(e, b.parsed)) {
          if (b.preventDefault !== false) {
            e.preventDefault()
            e.stopPropagation()
          }
          b.handler(e)
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bindings])
}
