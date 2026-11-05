import { BrowserWindow, screen, shell } from 'electron'
import path from 'node:path'

/**
 * Window manager — owns the main BrowserWindow lifecycle.
 *
 * The window is intentionally frameless and centered. We do NOT destroy it on
 * close; we hide it. This makes the global toggle hotkey feel instantaneous
 * (no React mount/unmount cost on every invocation).
 */
export class WindowManager {
  private window: BrowserWindow | null = null
  private alwaysOnTop = false

  create(): BrowserWindow {
    if (this.window) return this.window

    const { workArea } = screen.getPrimaryDisplay()
    const width = Math.min(1180, Math.round(workArea.width * 0.82))
    const height = Math.min(740, Math.round(workArea.height * 0.82))

    const win = new BrowserWindow({
      width,
      height,
      minWidth: 880,
      minHeight: 560,
      show: false,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0a0a0f',
      // Smooth resize, no flash of white before the renderer paints
      paintWhenInitiallyHidden: true,
      autoHideMenuBar: true,
      roundedCorners: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        spellcheck: true
      }
    })

    win.once('ready-to-show', () => {
      win.show()
      win.focus()
    })

    // External links open in the default browser, never inside the app
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // Load the renderer
    const isDev = !!process.env['ELECTRON_RENDERER_URL']
    if (isDev) {
      void win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
      // Auto-open DevTools in development so renderer errors are visible
      win.webContents.openDevTools({ mode: 'detach' })
    } else {
      void win.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    // Surface load failures to the main-process console (and as a visible page
    // in the window) instead of leaving the user staring at a blank screen.
    win.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[renderer] did-fail-load (${code}) ${desc} :: ${url}`)
    })
    win.webContents.on('render-process-gone', (_e, details) => {
      console.error('[renderer] render-process-gone', details)
    })

    win.on('closed', () => {
      this.window = null
    })

    this.window = win
    return win
  }

  get(): BrowserWindow | null {
    return this.window
  }

  show(): void {
    const win = this.window ?? this.create()
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  hide(): void {
    this.window?.hide()
  }

  toggle(): void {
    const win = this.window
    if (!win) {
      this.create()
      return
    }
    if (win.isVisible() && win.isFocused()) {
      win.hide()
    } else {
      this.show()
    }
  }

  setAlwaysOnTop(value: boolean): void {
    this.alwaysOnTop = value
    this.window?.setAlwaysOnTop(value, 'normal')
  }

  isAlwaysOnTop(): boolean {
    return this.alwaysOnTop
  }
}
