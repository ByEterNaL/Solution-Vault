import { type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}

/**
 * Polished empty / placeholder state. Used for "no entry selected", "no
 * results", and the very first launch CTA.
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="max-w-sm mx-auto text-center px-6 py-10 animate-fade-in">
      <div className="mx-auto mb-4 grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-700/10 border border-accent-500/20 text-accent-300">
        {icon ?? <Sparkles size={20} />}
      </div>
      <h3 className="text-base font-semibold text-text-primary tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
