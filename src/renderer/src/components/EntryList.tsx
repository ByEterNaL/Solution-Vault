import { useEffect, useMemo, useRef } from 'react'
import { Pin, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import { useDebounce } from '@/hooks/useDebounce'
import { excerpt } from '@/lib/markdown'
import { relativeTime } from '@/lib/format'
import { TagPill } from './TagPill'
import type { Entry } from '@shared/types'

/**
 * Middle column — the list of matching entries.
 * Auto-scrolls the selected item into view (keyboard navigation friendliness).
 */
export function EntryList() {
  const rawQuery = useAppStore((s) => s.query)
  const query = useDebounce(rawQuery, 80)
  const view = useAppStore((s) => s.view)
  const category = useAppStore((s) => s.category)
  const tag = useAppStore((s) => s.tag)
  const engine = useAppStore((s) => s.engine)
  const entries = useAppStore((s) => s.entries)
  const selectedId = useAppStore((s) => s.selectedId)
  const setSelected = useAppStore((s) => s.setSelected)

  // Re-run search whenever any dependency changes. `entries` reference change
  // means the engine has been updated already by the store.
  const list = useMemo(
    () => engine.search({ query, view, category, tag }),
    [engine, query, view, category, tag, entries]
  )

  // Keep the selected item in sync with the visible list
  useEffect(() => {
    if (list.length === 0) {
      if (selectedId !== null) setSelected(null)
      return
    }
    if (!selectedId || !list.some((e) => e.id === selectedId)) {
      setSelected(list[0].id)
    }
  }, [list, selectedId, setSelected])

  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view (for keyboard nav)
  useEffect(() => {
    if (!selectedId || !containerRef.current) return
    const el = containerRef.current.querySelector<HTMLElement>(`[data-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1.5"
    >
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary font-semibold px-2 py-1.5 sticky top-0 bg-bg-base/80 backdrop-blur-sm z-10">
        {query ? `"${query}" için ` : ''}{list.length} sonuç
      </div>
      {list.map((entry) => (
        <EntryListItem
          key={entry.id}
          entry={entry}
          active={entry.id === selectedId}
          onClick={() => setSelected(entry.id)}
        />
      ))}
      {list.length === 0 ? (
        <div className="px-3 py-12 text-center text-sm text-text-tertiary">
          Eşleşme yok. Farklı bir anahtar kelime dene veya filtreleri temizle.
        </div>
      ) : null}
    </div>
  )
}

function EntryListItem({
  entry,
  active,
  onClick
}: {
  entry: Entry
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      data-id={entry.id}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg px-3 py-2.5 border transition-all duration-150',
        active
          ? 'bg-accent-500/12 border-accent-500/40 shadow-soft'
          : 'bg-bg-surface/40 border-border-subtle hover:bg-bg-surface hover:border-border-default'
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        {entry.isPinned ? (
          <Pin
            size={12}
            className={cn('mt-1 shrink-0', active ? 'text-accent-300' : 'text-accent-400/70')}
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-sm font-medium truncate',
                active ? 'text-text-primary' : 'text-text-primary'
              )}
            >
              {entry.title}
            </span>
            {entry.lastUsedAt ? (
              <span className="text-[10px] text-text-tertiary flex items-center gap-1 shrink-0">
                <Clock size={9} />
                {relativeTime(entry.lastUsedAt)}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
            {excerpt(entry.problem || entry.solution, 110)}
          </p>
          {entry.tags.length > 0 || entry.category ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {entry.category ? (
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-bg-elevated">
                  {entry.category}
                </span>
              ) : null}
              {entry.tags.slice(0, 4).map((t) => (
                <TagPill key={t} name={t} size="xs" />
              ))}
              {entry.tags.length > 4 ? (
                <span className="text-[10px] text-text-tertiary">+{entry.tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}
