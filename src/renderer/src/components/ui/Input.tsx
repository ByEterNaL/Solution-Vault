import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
  /** When true, renders as a large search-bar style field. */
  variant?: 'default' | 'search'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, trailingSlot, variant = 'default', ...rest },
  ref
) {
  const isSearch = variant === 'search'
  return (
    <div
      className={cn(
        'group relative flex items-center w-full transition-all duration-150',
        isSearch
          ? 'h-12 rounded-xl bg-bg-surface/60 border border-border-subtle hover:border-border-default focus-within:border-accent-500/60 focus-within:bg-bg-surface focus-within:shadow-glow'
          : 'h-9 rounded-md bg-bg-surface border border-border-default hover:border-border-strong focus-within:border-accent-500/60',
        className
      )}
    >
      {leadingIcon ? (
        <span
          className={cn(
            'flex items-center justify-center text-text-tertiary',
            isSearch ? 'pl-4 pr-2' : 'pl-2.5 pr-1'
          )}
        >
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'flex-1 bg-transparent outline-none placeholder:text-text-tertiary text-text-primary',
          isSearch ? 'text-base px-1' : 'text-sm px-3'
        )}
        {...rest}
      />
      {trailingSlot ? (
        <span className={cn('flex items-center', isSearch ? 'pr-3' : 'pr-2')}>
          {trailingSlot}
        </span>
      ) : null}
    </div>
  )
})
