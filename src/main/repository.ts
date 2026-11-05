import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { app } from 'electron'
import type {
  Entry,
  ExportPayload,
  NewEntryInput,
  UpdateEntryInput
} from '@shared/types'

/**
 * 12-char URL-safe identifier. We previously used `nanoid` but it is
 * ESM-only in v5 while the Electron main process is bundled as CommonJS,
 * which caused `ERR_REQUIRE_ESM` at startup. `crypto.randomBytes` ships
 * with Node, has equivalent entropy, and removes a dependency.
 */
function shortId(): string {
  return randomBytes(9).toString('base64url')
}

/**
 * Repository: JSON-backed persistence for entries.
 *
 * Design goals:
 *  - Zero native dependencies (works on every platform out of the box).
 *  - Atomic writes via temp file + rename to avoid corruption on crash/power loss.
 *  - In-memory cache: all reads are O(1) RAM lookups; renderer fuzzy search is instant.
 *  - Daily backups (rolling, last 10) into ./backups for disaster recovery.
 *
 * If the dataset ever exceeds ~5–10K entries, swap this implementation for a
 * SQLite-backed one (FTS5). The IPC surface stays unchanged.
 */
export class Repository {
  // Resolved during init(), not constructor — `app.getPath('userData')` throws
  // if called before the `ready` event has fired.
  private dataDir = ''
  private dataFile = ''
  private backupDir = ''
  private cache: Entry[] = []
  private writeQueue: Promise<void> = Promise.resolve()
  private lastBackupDay = 0

  async init(): Promise<void> {
    this.dataDir = app.getPath('userData')
    this.dataFile = path.join(this.dataDir, 'entries.json')
    this.backupDir = path.join(this.dataDir, 'backups')
    await fs.mkdir(this.dataDir, { recursive: true })
    await fs.mkdir(this.backupDir, { recursive: true })
    try {
      const raw = await fs.readFile(this.dataFile, 'utf-8')
      const parsed = JSON.parse(raw) as { entries: Entry[] }
      this.cache = Array.isArray(parsed.entries) ? parsed.entries : []
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') {
        this.cache = []
        await this.persist()
      } else {
        // Corrupt file — try to load latest backup, otherwise start fresh
        const recovered = await this.tryRecoverFromBackup()
        this.cache = recovered ?? []
        await this.persist()
      }
    }
  }

  list(): Entry[] {
    // Return a shallow clone so renderer can't mutate our cache via reference
    return this.cache.map((e) => ({ ...e, tags: [...e.tags] }))
  }

  create(input: NewEntryInput): Entry {
    const now = Date.now()
    const entry: Entry = {
      id: shortId(),
      title: input.title.trim(),
      problem: input.problem,
      solution: input.solution,
      category: input.category?.trim() || undefined,
      tags: this.normalizeTags(input.tags),
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      isPinned: input.isPinned ?? false
    }
    this.cache.unshift(entry)
    void this.scheduleWrite()
    return { ...entry, tags: [...entry.tags] }
  }

  update(id: string, patch: UpdateEntryInput): Entry | null {
    const idx = this.cache.findIndex((e) => e.id === id)
    if (idx === -1) return null
    const current = this.cache[idx]
    const next: Entry = {
      ...current,
      ...patch,
      title: patch.title?.trim() ?? current.title,
      category:
        patch.category !== undefined
          ? patch.category.trim() || undefined
          : current.category,
      tags: patch.tags ? this.normalizeTags(patch.tags) : current.tags,
      updatedAt: Date.now()
    }
    this.cache[idx] = next
    void this.scheduleWrite()
    return { ...next, tags: [...next.tags] }
  }

  delete(id: string): boolean {
    const before = this.cache.length
    this.cache = this.cache.filter((e) => e.id !== id)
    if (this.cache.length === before) return false
    void this.scheduleWrite()
    return true
  }

  /** Mark an entry as just used (copy / detail view). Increments useCount and lastUsedAt. */
  touch(id: string): Entry | null {
    const idx = this.cache.findIndex((e) => e.id === id)
    if (idx === -1) return null
    this.cache[idx] = {
      ...this.cache[idx],
      useCount: this.cache[idx].useCount + 1,
      lastUsedAt: Date.now()
    }
    void this.scheduleWrite()
    return { ...this.cache[idx], tags: [...this.cache[idx].tags] }
  }

  togglePin(id: string): Entry | null {
    const idx = this.cache.findIndex((e) => e.id === id)
    if (idx === -1) return null
    this.cache[idx] = {
      ...this.cache[idx],
      isPinned: !this.cache[idx].isPinned,
      updatedAt: Date.now()
    }
    void this.scheduleWrite()
    return { ...this.cache[idx], tags: [...this.cache[idx].tags] }
  }

  exportAll(): ExportPayload {
    return {
      version: 1,
      exportedAt: Date.now(),
      entries: this.list()
    }
  }

  /**
   * Import: merges incoming entries with the current dataset.
   * Entries with matching ids are updated only if their updatedAt is newer.
   * New ids are appended.
   */
  importAll(payload: ExportPayload): { added: number; updated: number } {
    if (!payload || !Array.isArray(payload.entries)) {
      throw new Error('Invalid import payload')
    }
    let added = 0
    let updated = 0
    const byId = new Map(this.cache.map((e) => [e.id, e] as const))
    for (const incoming of payload.entries) {
      if (!incoming?.id || typeof incoming.title !== 'string') continue
      const current = byId.get(incoming.id)
      if (!current) {
        this.cache.push({ ...incoming, tags: this.normalizeTags(incoming.tags ?? []) })
        added += 1
      } else if ((incoming.updatedAt ?? 0) > current.updatedAt) {
        const idx = this.cache.findIndex((e) => e.id === incoming.id)
        this.cache[idx] = { ...incoming, tags: this.normalizeTags(incoming.tags ?? []) }
        updated += 1
      }
    }
    void this.scheduleWrite()
    return { added, updated }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────────────────────

  private normalizeTags(tags: string[]): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of tags) {
      const t = raw.trim().toLowerCase().replace(/^#+/, '')
      if (!t || seen.has(t)) continue
      seen.add(t)
      out.push(t)
    }
    return out
  }

  /**
   * Serialize writes so concurrent IPC calls can't corrupt the file.
   * Each write awaits the previous one through a chained promise.
   */
  private scheduleWrite(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this.persist()).catch((err) => {
      console.error('[Repository] persist failed', err)
    })
    return this.writeQueue
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify({ entries: this.cache }, null, 2)
    const tmp = this.dataFile + '.tmp'
    await fs.writeFile(tmp, payload, 'utf-8')
    await fs.rename(tmp, this.dataFile)
    await this.maybeBackup(payload)
  }

  private async maybeBackup(payload: string): Promise<void> {
    const today = new Date()
    const dayKey =
      today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    if (dayKey === this.lastBackupDay) return
    this.lastBackupDay = dayKey
    const stamp = today.toISOString().slice(0, 10)
    const file = path.join(this.backupDir, `entries-${stamp}.json`)
    try {
      await fs.writeFile(file, payload, 'utf-8')
      await this.pruneBackups(10)
    } catch (err) {
      console.warn('[Repository] backup write failed', err)
    }
  }

  private async pruneBackups(keep: number): Promise<void> {
    const files = (await fs.readdir(this.backupDir))
      .filter((f) => f.startsWith('entries-') && f.endsWith('.json'))
      .sort()
    const toDelete = files.slice(0, Math.max(0, files.length - keep))
    await Promise.all(
      toDelete.map((f) =>
        fs.unlink(path.join(this.backupDir, f)).catch(() => undefined)
      )
    )
  }

  private async tryRecoverFromBackup(): Promise<Entry[] | null> {
    try {
      const files = (await fs.readdir(this.backupDir))
        .filter((f) => f.startsWith('entries-') && f.endsWith('.json'))
        .sort()
        .reverse()
      for (const f of files) {
        try {
          const raw = await fs.readFile(path.join(this.backupDir, f), 'utf-8')
          const parsed = JSON.parse(raw) as { entries: Entry[] }
          if (Array.isArray(parsed.entries)) return parsed.entries
        } catch {
          /* try next */
        }
      }
    } catch {
      /* no backup dir */
    }
    return null
  }
}
