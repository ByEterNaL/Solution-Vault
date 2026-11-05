import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js'
import type { Entry } from '@shared/types'

/**
 * Search engine — Fuse.js fuzzy matching with field weighting + relevance boost.
 *
 * Why fuzzy?  IT specialists rarely remember exact wording. Typos in error
 * codes ("0x800CCC0E" vs "800ccc0e") and partial recall ("smtp timeout") must
 * still resolve. Fuse handles both.
 *
 * Weighting choices:
 *   - title is the strongest signal (people remember the headline)
 *   - tags second (intentional human-curated keywords)
 *   - solution / problem provide context but rank lower
 */
const FUSE_OPTIONS: IFuseOptions<Entry> = {
  includeScore: true,
  threshold: 0.38, // 0 = exact match, 1 = match anything; 0.38 is forgiving but precise
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 },
    { name: 'problem', weight: 0.15 },
    { name: 'solution', weight: 0.15 }
  ]
}

export interface SearchOptions {
  query: string
  category?: string | null
  tag?: string | null
  view: 'all' | 'pinned' | 'recent'
}

export class SearchEngine {
  private fuse: Fuse<Entry>
  private entries: Entry[]

  constructor(entries: Entry[]) {
    this.entries = entries
    this.fuse = new Fuse(entries, FUSE_OPTIONS)
  }

  setEntries(entries: Entry[]): void {
    this.entries = entries
    this.fuse.setCollection(entries)
  }

  /**
   * Returns entries filtered by the requested view + facet, optionally
   * narrowed by a fuzzy text query, sorted by a composite relevance score.
   */
  search(opts: SearchOptions): Entry[] {
    const filtered = this.applyFacets(this.entries, opts)

    if (!opts.query.trim()) {
      // No query → custom relevance sort (pinned, recent, frequent)
      return [...filtered].sort(this.compareByRelevance)
    }

    const queryEntries = new Set(filtered.map((e) => e.id))
    const results: FuseResult<Entry>[] = this.fuse
      .search(opts.query.trim())
      .filter((r) => queryEntries.has(r.item.id))

    return results
      .map((r) => ({
        entry: r.item,
        score: this.boost(r.item, r.score ?? 1)
      }))
      .sort((a, b) => a.score - b.score)
      .map((r) => r.entry)
  }

  private applyFacets(entries: Entry[], opts: SearchOptions): Entry[] {
    let out = entries
    if (opts.view === 'pinned') out = out.filter((e) => e.isPinned)
    if (opts.view === 'recent') out = out.filter((e) => e.lastUsedAt)
    if (opts.category) out = out.filter((e) => e.category === opts.category)
    if (opts.tag) out = out.filter((e) => e.tags.includes(opts.tag!))
    return out
  }

  /**
   * Boost the raw Fuse score (lower is better) using engagement signals so
   * frequently-used and pinned entries surface earlier in tied matches.
   */
  private boost(entry: Entry, score: number): number {
    let boosted = score
    if (entry.isPinned) boosted -= 0.08
    if (entry.useCount > 0) boosted -= Math.min(0.12, Math.log10(entry.useCount + 1) * 0.06)
    if (entry.lastUsedAt) {
      const days = (Date.now() - entry.lastUsedAt) / (1000 * 60 * 60 * 24)
      if (days < 7) boosted -= 0.04
      else if (days < 30) boosted -= 0.02
    }
    return boosted
  }

  private compareByRelevance = (a: Entry, b: Entry): number => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const aRecent = a.lastUsedAt ?? 0
    const bRecent = b.lastUsedAt ?? 0
    if (aRecent !== bRecent) return bRecent - aRecent
    if (a.useCount !== b.useCount) return b.useCount - a.useCount
    return b.updatedAt - a.updatedAt
  }
}
