import { globalShortcut } from 'electron'
import type { WindowManager } from './window'
import { IPC, type AppSettings } from '@shared/types'

/**
 * Global shortcut registry.
 *
 * - toggleHotkey: show/hide window from anywhere on the OS.
 * - quickAddHotkey: show window AND tell renderer to open the New Entry dialog.
 *
 * Re-registers cleanly on settings changes; logs (without crashing) if the
 * combo is already taken by another app.
 */
export class ShortcutManager {
  constructor(private windowManager: WindowManager) {}

  register(settings: AppSettings): void {
    this.unregisterAll()

    if (settings.toggleHotkey) {
      const ok = globalShortcut.register(settings.toggleHotkey, () => {
        this.windowManager.toggle()
      })
      if (!ok) console.warn('[Shortcuts] Failed to register toggle:', settings.toggleHotkey)
    }

    if (settings.quickAddHotkey) {
      const ok = globalShortcut.register(settings.quickAddHotkey, () => {
        this.windowManager.show()
        const win = this.windowManager.get()
        win?.webContents.send(IPC.AppOpenQuickAdd)
      })
      if (!ok)
        console.warn('[Shortcuts] Failed to register quick-add:', settings.quickAddHotkey)
    }
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll()
  }
}
