import { app, BrowserWindow, dialog } from 'electron'
import { WindowManager } from './window'
import { TrayManager } from './tray'
import { ShortcutManager } from './shortcuts'
import { Repository } from './repository'
import { SettingsStore } from './settingsStore'
import { registerIpc } from './ipc'

// Surface fatal errors instead of letting the process die silently with a
// blank window. Especially valuable in development.
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException', err)
  if (app.isReady()) {
    dialog.showErrorBox('Solution Vault — Fatal error', String(err?.stack ?? err))
  }
})
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection', reason)
})

/**
 * Solution Vault — Electron main entry point.
 *
 * Lifecycle:
 *   1. Acquire single-instance lock so a second launch focuses the existing window.
 *   2. Init data layer (Repository + SettingsStore) before creating the window.
 *   3. Wire IPC, register global shortcuts, build tray.
 *   4. Create main window (hidden until renderer is ready-to-show).
 *
 * Closing the last window does NOT quit the app — we keep the tray alive so
 * the global hotkey remains responsive. The user explicitly quits from the
 * tray menu, which is the launcher-style UX pattern users expect.
 */

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  const repository = new Repository()
  const settingsStore = new SettingsStore()
  const windowManager = new WindowManager()
  const shortcutManager = new ShortcutManager(windowManager)
  const trayManager = new TrayManager(windowManager)

  app.on('second-instance', () => {
    windowManager.show()
  })

  app.whenReady().then(async () => {
    await repository.init()
    await settingsStore.init()

    registerIpc({ repository, settingsStore, windowManager, shortcutManager })

    const settings = settingsStore.get()
    shortcutManager.register(settings)
    trayManager.build()

    windowManager.create()
    windowManager.setAlwaysOnTop(settings.alwaysOnTop)

    if (process.platform === 'win32' || process.platform === 'darwin') {
      app.setLoginItemSettings({ openAtLogin: settings.startWithSystem })
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) windowManager.create()
      else windowManager.show()
    })
  })

  // We intentionally do NOT quit on window-all-closed. The tray keeps the app
  // alive so the global hotkey stays available. Only the explicit Quit menu
  // entry (or app.quit) ends the process.
  app.on('window-all-closed', () => {
    // no-op: tray + hotkey remain
  })

  app.on('will-quit', () => {
    shortcutManager.unregisterAll()
    trayManager.destroy()
  })
}
