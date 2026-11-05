import { useState, useEffect } from 'react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Kbd } from './ui/Kbd'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/cn'

/**
 * App-wide settings.
 *
 * Hotkeys are captured live: focus an input then press the combo you want.
 * We render the captured combo using <Kbd /> for clarity.
 */
export function SettingsDialog() {
  const open = useAppStore((s) => s.settingsOpen)
  const close = useAppStore((s) => s.closeSettings)
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.setSettings)

  const [toggleHotkey, setToggleHotkey] = useState(settings?.toggleHotkey ?? '')
  const [quickAddHotkey, setQuickAddHotkey] = useState(settings?.quickAddHotkey ?? '')
  const [startWithSystem, setStartWithSystem] = useState(settings?.startWithSystem ?? false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(settings?.alwaysOnTop ?? false)
  const [closeToTray, setCloseToTray] = useState(settings?.closeToTray ?? true)

  useEffect(() => {
    if (!open || !settings) return
    setToggleHotkey(settings.toggleHotkey)
    setQuickAddHotkey(settings.quickAddHotkey)
    setStartWithSystem(settings.startWithSystem)
    setAlwaysOnTop(settings.alwaysOnTop)
    setCloseToTray(settings.closeToTray)
  }, [open, settings])

  const save = async (): Promise<void> => {
    await update({
      toggleHotkey,
      quickAddHotkey,
      startWithSystem,
      alwaysOnTop,
      closeToTray
    })
    close()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Ayarlar"
      description="Ayarlar bu cihazda saklanır."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Group title="Kısayollar">
          <HotkeyRow
            label="Pencereyi göster / gizle"
            description="Sistem genelinde her yerden çağıracak küresel kısayol"
            value={toggleHotkey}
            onChange={setToggleHotkey}
          />
          <HotkeyRow
            label="Hızlı kayıt ekle"
            description="Pencereyi açıp yeni kayıt formunu gösterir"
            value={quickAddHotkey}
            onChange={setQuickAddHotkey}
          />
        </Group>
        <Group title="Davranış">
          <ToggleRow
            label="Her zaman üstte"
            description="Pencereyi diğer uygulamaların üzerinde tutar"
            value={alwaysOnTop}
            onChange={setAlwaysOnTop}
          />
          <ToggleRow
            label="Sistemle birlikte başlat"
            description="Oturum açtığında Solution Vault'u otomatik başlatır"
            value={startWithSystem}
            onChange={setStartWithSystem}
          />
          <ToggleRow
            label="Bildirim alanına gizle"
            description="Kapat butonu uygulamayı kapatmak yerine bildirim alanına alır"
            value={closeToTray}
            onChange={setCloseToTray}
          />
        </Group>
      </div>
    </Dialog>
  )
}

function Group({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-widest text-text-tertiary font-semibold mb-2">
        {title}
      </h3>
      <div className="rounded-lg border border-border-subtle bg-bg-surface/40 divide-y divide-border-subtle">
        {children}
      </div>
    </section>
  )
}

function HotkeyRow({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
}) {
  const [recording, setRecording] = useState(false)

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    e.preventDefault()
    if (e.key === 'Escape') {
      setRecording(false)
      return
    }
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Control')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')
    const main = normalizeKey(e.key, e.code)
    if (!main) return
    parts.push(main)
    onChange(parts.join('+'))
    setRecording(false)
  }

  return (
    <div className="flex items-center gap-4 px-3.5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        onClick={() => setRecording(true)}
        onBlur={() => setRecording(false)}
        onKeyDown={recording ? onKeyDown : undefined}
        className={cn(
          'min-w-[180px] px-2 h-9 rounded-md text-left text-sm transition-colors',
          recording
            ? 'bg-accent-500/15 border border-accent-500/40 text-accent-200'
            : 'bg-bg-elevated border border-border-default text-text-primary hover:border-border-strong'
        )}
      >
        {recording ? (
          <span className="text-text-tertiary italic">Tuşlara bas… (vazgeçmek için Esc)</span>
        ) : (
          <Kbd keys={value.split('+').map(prettyKey)} />
        )}
      </button>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 px-3.5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          value ? 'bg-accent-500' : 'bg-bg-elevated border border-border-default'
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-soft',
            value ? 'translate-x-[20px]' : 'translate-x-[3px]'
          )}
        />
      </button>
    </div>
  )
}

function normalizeKey(key: string, code: string): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null
  if (key === ' ') return 'Space'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('F') && /^F\d+$/.test(code)) return code
  if (key.length === 1) return key.toUpperCase()
  return key
}

function prettyKey(k: string): string {
  if (k === 'Control') return 'Ctrl'
  if (k === 'Meta') return '⌘'
  return k
}
