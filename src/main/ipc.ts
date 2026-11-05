import { ipcMain, clipboard, BrowserWindow, app, dialog } from 'electron'
import { promises as fs } from 'node:fs'
import { IPC, type AppSettings, type ExportPayload } from '@shared/types'
import type { Repository } from './repository'
import type { SettingsStore } from './settingsStore'
import type { WindowManager } from './window'
import type { ShortcutManager } from './shortcuts'

interface RegisterArgs {
  repository: Repository
  settingsStore: SettingsStore
  windowManager: WindowManager
  shortcutManager: ShortcutManager
}

/**
 * Wire IPC channels. All renderer ↔ main communication flows through these
 * named channels, defined once in @shared/types#IPC.
 *
 * Validation lives here: we never trust raw payloads from the renderer.
 */
export function registerIpc({
  repository,
  settingsStore,
  windowManager,
  shortcutManager
}: RegisterArgs): void {
  // ── Entries ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.EntryList, () => repository.list())

  ipcMain.handle(IPC.EntryCreate, (_e, input: unknown) => {
    if (!isPlainObject(input) || typeof input.title !== 'string')
      throw new Error('Invalid entry payload')
    return repository.create({
      title: input.title,
      problem: typeof input.problem === 'string' ? input.problem : '',
      solution: typeof input.solution === 'string' ? input.solution : '',
      category: typeof input.category === 'string' ? input.category : undefined,
      tags: Array.isArray(input.tags) ? input.tags.filter((t) => typeof t === 'string') : [],
      isPinned: input.isPinned === true
    })
  })

  ipcMain.handle(IPC.EntryUpdate, (_e, id: unknown, patch: unknown) => {
    if (typeof id !== 'string' || !isPlainObject(patch))
      throw new Error('Invalid update payload')
    const safe: Record<string, unknown> = {}
    for (const k of ['title', 'problem', 'solution', 'category', 'isPinned'] as const) {
      if (k in patch) safe[k] = patch[k]
    }
    if (Array.isArray(patch.tags))
      safe.tags = patch.tags.filter((t) => typeof t === 'string')
    return repository.update(id, safe as never)
  })

  ipcMain.handle(IPC.EntryDelete, (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return repository.delete(id)
  })

  ipcMain.handle(IPC.EntryTouch, (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return repository.touch(id)
  })

  ipcMain.handle(IPC.EntryTogglePin, (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return repository.togglePin(id)
  })

  ipcMain.handle(IPC.EntryExport, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
    const payload = repository.exportAll()
    const result = await dialog.showSaveDialog(win!, {
      title: 'Solution Vault’ı Dışa Aktar',
      defaultPath: `solution-vault-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { exported: false }
    await fs.writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')
    return { exported: true, path: result.filePath, count: payload.entries.length }
  })

  ipcMain.handle(IPC.EntryImport, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
    const result = await dialog.showOpenDialog(win!, {
      title: 'Solution Vault’a İçe Aktar',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return { imported: false }
    const raw = await fs.readFile(result.filePaths[0], 'utf-8')
    const parsed = JSON.parse(raw) as ExportPayload
    const stats = repository.importAll(parsed)
    return { imported: true, ...stats }
  })

  // ── Settings ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SettingsGet, () => settingsStore.get())

  ipcMain.handle(IPC.SettingsSet, async (_e, patch: unknown) => {
    if (!isPlainObject(patch)) throw new Error('Invalid settings payload')
    const next = await settingsStore.set(patch as Partial<AppSettings>)
    shortcutManager.register(next)
    windowManager.setAlwaysOnTop(next.alwaysOnTop)
    if (process.platform === 'win32' || process.platform === 'darwin') {
      app.setLoginItemSettings({ openAtLogin: next.startWithSystem })
    }
    return next
  })

  // ── Window controls (custom title bar) ─────────────────────────────────────
  ipcMain.on(IPC.WindowMinimize, (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on(IPC.WindowMaximize, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on(IPC.WindowClose, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const settings = settingsStore.get()
    if (settings.closeToTray && win) {
      win.hide()
    } else {
      win?.close()
    }
  })
  ipcMain.on(IPC.WindowHide, (e) => BrowserWindow.fromWebContents(e.sender)?.hide())

  // ── Clipboard ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.ClipboardWrite, (_e, text: unknown) => {
    if (typeof text !== 'string') throw new Error('Invalid clipboard payload')
    clipboard.writeText(text)
    return true
  })
  ipcMain.handle(IPC.ClipboardRead, () => clipboard.readText())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
