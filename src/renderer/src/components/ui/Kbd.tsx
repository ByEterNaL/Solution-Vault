import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Renders one or more keys as a keyboard shortcut hint, e.g.:
 *   <Kbd keys={['Ctrl', 'Shift', 'Space']} />
 */
interface KbdProps {
  keys: string[]
  className?: string
}

export function Kbd({ keys, className }: KbdProps): ReactNode {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="font-mono text-[10px] leading-none px-1.5 py-1 rounded border border-border-default bg-bg-elevated text-text-secondary shadow-soft"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}
