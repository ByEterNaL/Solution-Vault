/**
 * Shared type definitions used by both main and renderer processes.
 * Keep this file dependency-free.
 */

export interface Entry {
  id: string
  title: string
  problem: string
  solution: string
  category?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  useCount: number
  lastUsedAt?: number
  isPinned: boolean
}

export type NewEntryInput = Omit<
  Entry,
  'id' | 'createdAt' | 'updatedAt' | 'useCount' | 'lastUsedAt' | 'isPinned'
> & {
  isPinned?: boolean
}

export type UpdateEntryInput = Partial<
  Omit<Entry, 'id' | 'createdAt' | 'useCount' | 'lastUsedAt'>
>

export interface AppSettings {
  toggleHotkey: string
  quickAddHotkey: string
  startWithSystem: boolean
  alwaysOnTop: boolean
  closeToTray: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  toggleHotkey: 'Control+Shift+Space',
  quickAddHotkey: 'Control+Shift+N',
  startWithSystem: false,
  alwaysOnTop: false,
  closeToTray: true
}

export interface ExportPayload {
  version: number
  exportedAt: number
  entries: Entry[]
}

/** IPC channel names — single source of truth */
export const IPC = {
  EntryList: 'entry:list',
  EntryCreate: 'entry:create',
  EntryUpdate: 'entry:update',
  EntryDelete: 'entry:delete',
  EntryTouch: 'entry:touch',
  EntryTogglePin: 'entry:togglePin',
  EntryExport: 'entry:export',
  EntryImport: 'entry:import',
  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',
  WindowMinimize: 'window:minimize',
  WindowMaximize: 'window:maximize',
  WindowClose: 'window:close',
  WindowHide: 'window:hide',
  ClipboardWrite: 'clipboard:write',
  ClipboardRead: 'clipboard:read',
  AppOpenQuickAdd: 'app:openQuickAdd',
  AppFocusSearch: 'app:focusSearch'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
