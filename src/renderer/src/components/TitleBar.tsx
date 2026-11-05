import { type ReactNode } from 'react'
import { Minus, Square, X, Sparkles, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'

/**
 * Custom title bar for the frameless window.
 *
 *   - The whole bar is draggable (`-webkit-app-region: drag`).
 *   - Interactive controls opt out with `no-drag`.
 *   - The "always on top" state is reflected in the badge styling for a
 *     subtle visual cue.
 */
export function TitleBar() {
  const settings = useAppStore((s) => s.settings)
  const openSettings = useAppStore((s) => s.openSettings)

  return (
    <header className="drag-region h-10 shrink-0 flex items-center justify-between px-3 border-b border-border-subtle bg-bg-base/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="grid place-items-center w-6 h-6 rounded-md bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-soft">
          <Sparkles size={13} />
        </span>
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          Solution Vault
        </span>
        {settings?.alwaysOnTop ? (
          <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent-500/40 text-accent-300 bg-accent-500/10">
            Her zaman üstte
          </span>
        ) : null}
      </div>

      <div className="no-drag flex items-center gap-0.5">
        <TitleButton onClick={openSettings} ariaLabel="Ayarlar">
          <SettingsIcon size={14} />
        </TitleButton>
        <TitleButton onClick={() => window.api.minimizeWindow()} ariaLabel="Küçült">
          <Minus size={14} />
        </TitleButton>
        <TitleButton onClick={() => window.api.maximizeWindow()} ariaLabel="Büyüt">
          <Square size={11} strokeWidth={2.2} />
        </TitleButton>
        <TitleButton
          onClick={() => window.api.closeWindow()}
          ariaLabel="Kapat"
          danger
        >
          <X size={14} />
        </TitleButton>
      </div>
    </header>
  )
}

function TitleButton({
  children,
  onClick,
  ariaLabel,
  danger
}: {
  children: ReactNode
  onClick: () => void
  ariaLabel: string
  danger?: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center w-8 h-7 rounded-md text-text-tertiary transition-colors',
        danger
          ? 'hover:bg-danger hover:text-white'
          : 'hover:bg-bg-elevated hover:text-text-primary'
      )}
    >
      {children}
    </button>
  )
}
