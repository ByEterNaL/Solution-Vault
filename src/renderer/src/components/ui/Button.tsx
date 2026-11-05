import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white shadow-soft hover:shadow-glow',
  secondary:
    'bg-bg-elevated hover:bg-bg-overlay text-text-primary border border-border-default hover:border-border-strong',
  ghost: 'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary',
  danger: 'bg-danger/90 hover:bg-danger text-white shadow-soft'
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-base gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-md p-0'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', leadingIcon, trailingIcon, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-0',
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
    </button>
  )
})
