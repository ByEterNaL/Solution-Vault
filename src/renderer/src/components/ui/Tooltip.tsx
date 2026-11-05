import { type ReactNode, useState, useRef } from 'react'
import { cn } from '@/lib/cn'

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const SIDE_CLS: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2'
}

/**
 * Lightweight tooltip — no portal, no positioning lib. Good enough for our
 * fixed in-window controls and keeps bundle size lean.
 */
export function Tooltip({ label, children, side = 'top', delay = 250 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (): void => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }
  const hide = (): void => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md',
            'bg-bg-overlay border border-border-default shadow-elevated',
            'px-2 py-1 text-xs text-text-primary',
            'animate-fade-in',
            SIDE_CLS[side]
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}
