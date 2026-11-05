import { type ReactNode, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** Dialog max-width breakpoint. Defaults to '2xl'. */
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** When false, clicking the backdrop won't close. Useful for editor with unsaved changes. */
  dismissOnOverlay?: boolean
}

const SIZE: Record<NonNullable<DialogProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl'
}

/**
 * Centered modal dialog with frosted backdrop. Closes on Esc unless prevented
 * upstream. Uses Framer Motion for entrance/exit so dialogs feel premium and
 * never pop in abruptly.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = '2xl',
  dismissOnOverlay = true
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={dismissOnOverlay ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative w-full mx-4 max-h-[88vh] flex flex-col',
              'glass rounded-2xl shadow-elevated',
              SIZE[size]
            )}
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-subtle">
              <div className="min-w-0">
                {title ? (
                  <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-text-secondary mt-1">{description}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Diyaloğu kapat"
              >
                <X size={16} />
              </Button>
            </header>
            <div className="flex-1 min-h-0 overflow-auto px-6 py-5 selectable">{children}</div>
            {footer ? (
              <footer className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border-subtle bg-bg-base/30 rounded-b-2xl">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
