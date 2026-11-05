import { Hash } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TagPillProps {
  name: string
  active?: boolean
  onClick?: () => void
  size?: 'xs' | 'sm'
  showHash?: boolean
}

/**
 * Hash-prefixed tag chip. Deterministic hue based on the tag name so the same
 * tag always renders in the same color across the app — visual continuity
 * without forcing the user to manage colors manually.
 */
export function TagPill({ name, active, onClick, size = 'sm', showHash = true }: TagPillProps) {
  const hue = hashHue(name)
  const interactive = !!onClick

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium transition-all duration-150 max-w-[14rem]',
        size === 'xs' ? 'h-5 px-1.5 text-[10.5px]' : 'h-6 px-2 text-xs',
        active
          ? 'ring-1 ring-accent-400/60'
          : 'opacity-90 hover:opacity-100',
        interactive ? 'cursor-pointer' : 'cursor-default'
      )}
      style={{
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.12)`,
        color: `hsl(${hue}, 80%, 78%)`,
        borderColor: `hsla(${hue}, 70%, 60%, 0.30)`
      }}
    >
      {showHash ? <Hash size={size === 'xs' ? 9 : 10} className="opacity-70" /> : null}
      <span className="truncate">{name}</span>
    </button>
  )
}

function hashHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}
