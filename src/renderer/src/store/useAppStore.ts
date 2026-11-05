import { create } from 'zustand'
import type { AppSettings, Entry, NewEntryInput, UpdateEntryInput } from '@shared/types'
import { SearchEngine, type SearchOptions } from '@/lib/search'

export type ViewMode = 'all' | 'pinned' | 'recent'

export interface ToastMessage {
  id: number
  kind: 'info' | 'success' | 'error'
  text: string
  /**
   * Optional action button (e.g. "Undo" after delete). When present, clicking
   * it dismisses the toast and calls `onAction`.
   */
  actionLabel?: string
  onAction?: () => void
}

interface AppState {
  // Data
  entries: Entry[]
  settings: AppSettings | null
  loading: boolean
  initialized: boolean

  // Search / facets
  query: string
  view: ViewMode
  category: string | null
  tag: string | null

  // Selection / UI
  selectedId: string | null
  editorOpen: boolean
  editorEntry: Entry | null
  settingsOpen: boolean
  sidebarCollapsed: boolean
  toasts: ToastMessage[]

  // Engine (kept here to avoid recreating on every render)
  engine: SearchEngine

  // Actions
  init: () => Promise<void>
  refresh: () => Promise<void>
  setQuery: (q: string) => void
  setView: (v: ViewMode) => void
  setCategory: (c: string | null) => void
  setTag: (t: string | null) => void
  setSelected: (id: string | null) => void
  openEditor: (entry?: Entry | null) => void
  closeEditor: () => void
  openSettings: () => void
  closeSettings: () => void
  toggleSidebar: () => void

  createEntry: (input: NewEntryInput) => Promise<Entry>
  updateEntry: (id: string, patch: UpdateEntryInput) => Promise<Entry | null>
  deleteEntry: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  touch: (id: string) => Promise<void>
  copySolution: (id: string) => Promise<void>
  setSettings: (patch: Partial<AppSettings>) => Promise<void>
  exportData: () => Promise<void>
  importData: () => Promise<void>

  pushToast: (t: Omit<ToastMessage, 'id'>) => number
  dismissToast: (id: number) => void

  // Derived
  filteredEntries: () => Entry[]
  categories: () => string[]
  allTags: () => string[]
}

let toastCounter = 0

export const useAppStore = create<AppState>((set, get) => ({
  entries: [],
  settings: null,
  loading: false,
  initialized: false,
  query: '',
  view: 'all',
  category: null,
  tag: null,
  selectedId: null,
  editorOpen: false,
  editorEntry: null,
  settingsOpen: false,
  sidebarCollapsed: false,
  toasts: [],

  engine: new SearchEngine([]),

  init: async () => {
    set({ loading: true })
    const [entries, settings] = await Promise.all([
      window.api.listEntries(),
      window.api.getSettings()
    ])
    get().engine.setEntries(entries)
    set({
      entries,
      settings,
      loading: false,
      initialized: true,
      selectedId: entries[0]?.id ?? null
    })
  },

  refresh: async () => {
    const entries = await window.api.listEntries()
    get().engine.setEntries(entries)
    set((s) => ({
      entries,
      selectedId: entries.some((e) => e.id === s.selectedId) ? s.selectedId : entries[0]?.id ?? null
    }))
  },

  setQuery: (q) => set({ query: q }),
  setView: (v) => set({ view: v, category: null, tag: null }),
  setCategory: (c) => set({ category: c, tag: null }),
  setTag: (t) => set({ tag: t, category: null }),
  setSelected: (id) => set({ selectedId: id }),
  openEditor: (entry = null) => set({ editorOpen: true, editorEntry: entry }),
  closeEditor: () => set({ editorOpen: false, editorEntry: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  createEntry: async (input) => {
    const created = await window.api.createEntry(input)
    await get().refresh()
    set({ selectedId: created.id })
    get().pushToast({ kind: 'success', text: 'Kayıt eklendi' })
    return created
  },

  updateEntry: async (id, patch) => {
    const updated = await window.api.updateEntry(id, patch)
    await get().refresh()
    if (updated) set({ selectedId: updated.id })
    get().pushToast({ kind: 'success', text: 'Değişiklikler kaydedildi' })
    return updated
  },

  deleteEntry: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    const ok = await window.api.deleteEntry(id)
    if (!ok) return
    await get().refresh()
    // Soft-delete UX: offer Undo by re-creating the entry within 5 seconds
    get().pushToast({
      kind: 'info',
      text: `"${entry.title}" silindi`,
      actionLabel: 'Geri al',
      onAction: async () => {
        await window.api.createEntry({
          title: entry.title,
          problem: entry.problem,
          solution: entry.solution,
          category: entry.category,
          tags: entry.tags,
          isPinned: entry.isPinned
        })
        await get().refresh()
      }
    })
  },

  togglePin: async (id) => {
    await window.api.togglePin(id)
    await get().refresh()
  },

  touch: async (id) => {
    await window.api.touchEntry(id)
    // No refresh — the use-count change is internal; we can lazily reconcile
    // on next list. This keeps the UI snappy.
  },

  copySolution: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    await window.api.copyText(entry.solution)
    await get().touch(id)
    get().pushToast({ kind: 'success', text: 'Çözüm panoya kopyalandı' })
  },

  setSettings: async (patch) => {
    const next = await window.api.setSettings(patch)
    set({ settings: next })
  },

  exportData: async () => {
    const result = await window.api.exportEntries()
    if (result.exported) {
      get().pushToast({
        kind: 'success',
        text: `${result.count} kayıt dışa aktarıldı`
      })
    }
  },

  importData: async () => {
    const result = await window.api.importEntries()
    if (result.imported) {
      await get().refresh()
      get().pushToast({
        kind: 'success',
        text: `İçe aktarıldı (${result.added} yeni, ${result.updated} güncel)`
      })
    }
  },

  pushToast: (t) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    // Auto-dismiss after 4s (5s if it has an action)
    const ttl = t.actionLabel ? 5000 : 4000
    setTimeout(() => get().dismissToast(id), ttl)
    return id
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  filteredEntries: () => {
    const { engine, query, view, category, tag } = get()
    const opts: SearchOptions = { query, view, category, tag }
    return engine.search(opts)
  },

  categories: () => {
    const set = new Set<string>()
    for (const e of get().entries) if (e.category) set.add(e.category)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  },

  allTags: () => {
    const map = new Map<string, number>()
    for (const e of get().entries) {
      for (const t of e.tags) map.set(t, (map.get(t) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
  }
}))
