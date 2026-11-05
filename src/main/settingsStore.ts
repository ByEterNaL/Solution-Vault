import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types'

/**
 * Tiny JSON-backed settings store.
 * Settings change rarely, so a simple read-on-init / write-on-change is enough.
 */
export class SettingsStore {
  // Resolved during init(); `app.getPath` is unavailable before app `ready`.
  private file = ''
  private cache: AppSettings = DEFAULT_SETTINGS

  async init(): Promise<void> {
    this.file = path.join(app.getPath('userData'), 'settings.json')
    try {
      const raw = await fs.readFile(this.file, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      this.cache = { ...DEFAULT_SETTINGS, ...parsed }
    } catch {
      this.cache = { ...DEFAULT_SETTINGS }
      await this.persist()
    }
  }

  get(): AppSettings {
    return { ...this.cache }
  }

  async set(patch: Partial<AppSettings>): Promise<AppSettings> {
    this.cache = { ...this.cache, ...patch }
    await this.persist()
    return this.get()
  }

  private async persist(): Promise<void> {
    const tmp = this.file + '.tmp'
    await fs.writeFile(tmp, JSON.stringify(this.cache, null, 2), 'utf-8')
    await fs.rename(tmp, this.file)
  }
}
