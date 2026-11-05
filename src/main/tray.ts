import { Tray, Menu, nativeImage, app } from 'electron'
import path from 'node:path'
import type { WindowManager } from './window'
import { IPC } from '@shared/types'

/**
 * System tray entry — keeps the app running in the background and offers
 * quick toggle / quick-add / quit actions without opening the main window.
 */
export class TrayManager {
  private tray: Tray | null = null

  constructor(private windowManager: WindowManager) {}

  build(): void {
    if (this.tray) return

    // Use bundled icon if present, otherwise a tiny generated fallback.
    const iconPath = path.join(process.resourcesPath, 'icon.png')
    let image = nativeImage.createFromPath(iconPath)
    if (image.isEmpty()) {
      // 16x16 transparent PNG so the tray still works in dev without an asset.
      image = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVR42mNgGAWjYBSMglEwCkbBKBgFo2AUjAIYAAALwAABnH8U9wAAAABJRU5ErkJggg=='
      )
    }
    this.tray = new Tray(image)
    this.tray.setToolTip('Solution Vault')
    this.refreshMenu()
    this.tray.on('click', () => this.windowManager.toggle())
    this.tray.on('double-click', () => this.windowManager.show())
  }

  refreshMenu(): void {
    if (!this.tray) return
    const menu = Menu.buildFromTemplate([
      {
        label: "Solution Vault'u Göster",
        click: () => this.windowManager.show()
      },
      {
        label: 'Hızlı Kayıt Ekle',
        click: () => {
          this.windowManager.show()
          this.windowManager.get()?.webContents.send(IPC.AppOpenQuickAdd)
        }
      },
      { type: 'separator' },
      {
        label: 'Uygulamadan Çık',
        click: () => {
          app.quit()
        }
      }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
