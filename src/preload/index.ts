import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type AppSettings,
  type Entry,
  type ExportPayload,
  type NewEntryInput,
  type UpdateEntryInput
} from '@shared/types'

/**
 * Preload script — the ONLY surface the renderer can use to reach Node/Electron APIs.
 *
 * - `contextIsolation: true` and `nodeIntegration: false` are set on the window.
 * - We expose a small, well-typed `window.api` object via contextBridge.
 * - Every channel name comes from @shared/types#IPC, so renaming a channel is
 *   a single-place change.
 */

const api = {
  // Entries
  listEntries: (): Promise<Entry[]> => ipcRenderer.invoke(IPC.EntryList),
  createEntry: (input: NewEntryInput): Promise<Entry> =>
    ipcRenderer.invoke(IPC.EntryCreate, input),
  updateEntry: (id: string, patch: UpdateEntryInput): Promise<Entry | null> =>
    ipcRenderer.invoke(IPC.EntryUpdate, id, patch),
  deleteEntry: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.EntryDelete, id),
  touchEntry: (id: string): Promise<Entry | null> => ipcRenderer.invoke(IPC.EntryTouch, id),
  togglePin: (id: string): Promise<Entry | null> =>
    ipcRenderer.invoke(IPC.EntryTogglePin, id),
  exportEntries: (): Promise<{ exported: boolean; path?: string; count?: number }> =>
    ipcRenderer.invoke(IPC.EntryExport),
  importEntries: (): Promise<
    { imported: false } | { imported: true; added: number; updated: number }
  > => ipcRenderer.invoke(IPC.EntryImport),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SettingsGet),
  setSettings: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SettingsSet, patch),

  // Window controls
  minimizeWindow: (): void => ipcRenderer.send(IPC.WindowMinimize),
  maximizeWindow: (): void => ipcRenderer.send(IPC.WindowMaximize),
  closeWindow: (): void => ipcRenderer.send(IPC.WindowClose),
  hideWindow: (): void => ipcRenderer.send(IPC.WindowHide),

  // Clipboard
  copyText: (text: string): Promise<boolean> => ipcRenderer.invoke(IPC.ClipboardWrite, text),
  readClipboard: (): Promise<string> => ipcRenderer.invoke(IPC.ClipboardRead),

  // Events from main → renderer
  onOpenQuickAdd: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(IPC.AppOpenQuickAdd, listener)
    return () => ipcRenderer.off(IPC.AppOpenQuickAdd, listener)
  },
  onFocusSearch: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(IPC.AppFocusSearch, listener)
    return () => ipcRenderer.off(IPC.AppFocusSearch, listener)
  }
}

export type Api = typeof api
export type { Entry, AppSettings, NewEntryInput, UpdateEntryInput, ExportPayload }

contextBridge.exposeInMainWorld('api', api)
