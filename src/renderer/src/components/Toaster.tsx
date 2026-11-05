import { AnimatePresence, motion } from 'framer-motion'
import { Check, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'

const ICON = {
  success: <Check size={14} />,
  error: <AlertTriangle size={14} />,
  info: <Info size={14} />
}

const ACCENT = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent-400'
}

/**
 * Bottom-right toast stack. Each toast auto-dismisses; ones with `actionLabel`
 * (e.g. Undo after delete) get extra time.
 */
export function Toaster() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="pointer-events-auto min-w-[260px] max-w-sm glass rounded-lg shadow-elevated px-3 py-2 flex items-start gap-2.5"
          >
            <span className={cn('mt-0.5 shrink-0', ACCENT[t.kind])}>{ICON[t.kind]}</span>
            <span className="flex-1 text-sm text-text-primary">{t.text}</span>
            {t.actionLabel ? (
              <button
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
                className="text-xs font-medium text-accent-400 hover:text-accent-300 px-2 py-0.5 rounded transition-colors"
              >
                {t.actionLabel}
              </button>
            ) : null}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Kapat"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
