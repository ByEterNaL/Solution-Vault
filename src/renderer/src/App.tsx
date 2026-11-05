import { useEffect, useMemo, useRef } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { EntryList } from './components/EntryList'
import { EntryDetail } from './components/EntryDetail'
import { EntryEditor } from './components/EntryEditor'
import { SettingsDialog } from './components/SettingsDialog'
import { Toaster } from './components/Toaster'
import { EmptyState } from './components/EmptyState'
import { Button } from './components/ui/Button'
import { Plus, Database } from 'lucide-react'
import { useAppStore } from './store/useAppStore'
import { useShortcuts } from './hooks/useShortcuts'

/**
 * Top-level app shell.
 *
 * Layout:
 *   ┌──────────── TitleBar ────────────┐
 *   │ Sidebar │ SearchBar              │
 *   │         ├─────────────┬──────────┤
 *   │         │ EntryList   │ Detail   │
 *   └─────────┴─────────────┴──────────┘
 *
 * Side-effects:
 *   - First mount → store.init()
 *   - Registers app-level keyboard shortcuts
 *   - Listens for the main process "open quick add" event (triggered by the
 *     global hotkey or tray menu)
 */
export function App() {
  const init = useAppStore((s) => s.init)
  const initialized = useAppStore((s) => s.initialized)
  const entries = useAppStore((s) => s.entries)
  const editorOpen = useAppStore((s) => s.editorOpen)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const openEditor = useAppStore((s) => s.openEditor)
  const openSettings = useAppStore((s) => s.openSettings)
  const setQuery = useAppStore((s) => s.setQuery)
  const selectedId = useAppStore((s) => s.selectedId)
  const setSelected = useAppStore((s) => s.setSelected)
  const filteredEntries = useAppStore((s) => s.filteredEntries)
  const togglePin = useAppStore((s) => s.togglePin)
  const deleteEntry = useAppStore((s) => s.deleteEntry)
  const copySolution = useAppStore((s) => s.copySolution)

  const searchRef = useRef<HTMLInputElement>(null)

  // One-time boot
  useEffect(() => {
    void init()
  }, [init])

  // Wire main → renderer event for global quick-add hotkey / tray
  useEffect(() => {
    const off = window.api.onOpenQuickAdd(() => {
      openEditor(null)
    })
    return off
  }, [openEditor])

  // Disable browser-style behaviors we don't want (drag-n-drop file open, F5
  // refresh inside production builds, right-click default menu).
  useEffect(() => {
    const onDrop = (e: DragEvent): void => e.preventDefault()
    const onDragover = (e: DragEvent): void => e.preventDefault()
    const onContext = (e: MouseEvent): void => {
      // Allow context menu only on editable fields (so users can paste)
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return
      }
      e.preventDefault()
    }
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onDragover)
    window.addEventListener('contextmenu', onContext)
    return () => {
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onDragover)
      window.removeEventListener('contextmenu', onContext)
    }
  }, [])

  // Global app shortcuts. Modal-aware (skipped when a dialog is open).
  const modalOpen = editorOpen || settingsOpen
  const shortcuts = useMemo(
    () => [
      {
        combo: 'escape',
        allowInInput: true,
        handler: () => {
          if (modalOpen) return // dialog handles its own Esc
          // If a query is active, clear it; otherwise hide window.
          const { query } = useAppStore.getState()
          if (query) setQuery('')
          else window.api.hideWindow()
        }
      },
      {
        combo: 'ctrl+f',
        handler: () => searchRef.current?.focus()
      },
      {
        combo: 'ctrl+n',
        handler: () => !modalOpen && openEditor(null)
      },
      {
        combo: 'ctrl+e',
        handler: () => {
          if (modalOpen) return
          const entry = useAppStore.getState().entries.find((e) => e.id === selectedId)
          if (entry) openEditor(entry)
        }
      },
      {
        combo: 'ctrl+p',
        handler: () => {
          if (modalOpen || !selectedId) return
          void togglePin(selectedId)
        }
      },
      {
        combo: 'ctrl+d',
        handler: () => {
          if (modalOpen || !selectedId) return
          const entry = useAppStore.getState().entries.find((e) => e.id === selectedId)
          if (entry && confirm(`"${entry.title}" silinsin mi?`)) void deleteEntry(selectedId)
        }
      },
      {
        combo: 'ctrl+shift+c',
        handler: () => {
          if (modalOpen || !selectedId) return
          void copySolution(selectedId)
        }
      },
      {
        combo: 'ctrl+,',
        handler: () => !modalOpen && openSettings()
      },
      {
        combo: 'arrowdown',
        handler: () => modalOpen ? undefined : moveSelection(1)
      },
      {
        combo: 'arrowup',
        handler: () => modalOpen ? undefined : moveSelection(-1)
      }
    ],
    [modalOpen, openEditor, openSettings, selectedId, setQuery, togglePin, deleteEntry, copySolution]
  )
  useShortcuts(shortcuts)

  function moveSelection(delta: number): void {
    const list = filteredEntries()
    if (list.length === 0) return
    const idx = Math.max(0, list.findIndex((e) => e.id === selectedId))
    const next = (idx + delta + list.length) % list.length
    setSelected(list[next].id)
  }

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex flex-col">
        <TitleBar />
        <div className="flex-1 grid place-items-center">
          <div className="text-text-tertiary text-sm">Kasa yükleniyor…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <TitleBar />
      {entries.length === 0 ? (
        <main className="flex-1 grid place-items-center">
          <EmptyState
            icon={<Database size={22} />}
            title="Kasan henüz boş"
            description={
              <>
                Kişisel çözüm kütüphaneni başlatmak için ilk hata/çözüm çiftini kaydet.
                Her şey bu cihazda kalır.
              </>
            }
            action={
              <Button
                variant="primary"
                size="lg"
                onClick={() => openEditor(null)}
                leadingIcon={<Plus size={16} />}
              >
                İlk kaydı oluştur
              </Button>
            }
          />
        </main>
      ) : (
        <main className="flex-1 min-h-0 flex">
          <Sidebar />
          <section className="flex-1 min-w-0 flex flex-col">
            <SearchBar ref={searchRef} />
            <div className="flex-1 min-h-0 flex">
              <div className="w-[360px] shrink-0 border-r border-border-subtle flex flex-col">
                <EntryList />
              </div>
              <EntryDetail />
            </div>
          </section>
        </main>
      )}
      <EntryEditor />
      <SettingsDialog />
      <Toaster />
    </div>
  )
}
