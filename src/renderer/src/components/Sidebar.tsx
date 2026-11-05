import { type ReactNode, useMemo } from 'react'
import { Pin, Clock, Layers, Tag as TagIcon, Inbox, Download, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import { TagPill } from './TagPill'

/**
 * Left navigation pane. Three sections:
 *   1. Views (All / Pinned / Recent) — fastest filters
 *   2. Categories — single-level taxonomy (derived from entries)
 *   3. Tags — flat, popularity-sorted
 * Plus an Export/Import footer.
 */
export function Sidebar() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const entries = useAppStore((s) => s.entries)
  // IMPORTANT: derive lists with useMemo locally instead of selecting from
  // store-level methods. A selector that returns a fresh array each call
  // makes Zustand's snapshot cache invalidate every render → infinite loop.
  const categories = useMemo<string[]>(
    () =>
      Array.from(
        new Set(entries.map((e) => e.category).filter((c): c is string => !!c))
      ).sort((a, b) => a.localeCompare(b)),
    [entries]
  )
  const allTags = useMemo<string[]>(() => {
    const counts = new Map<string, number>()
    for (const e of entries) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t)
  }, [entries])
  const activeCategory = useAppStore((s) => s.category)
  const activeTag = useAppStore((s) => s.tag)
  const setCategory = useAppStore((s) => s.setCategory)
  const setTag = useAppStore((s) => s.setTag)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)

  const counts = {
    all: entries.length,
    pinned: entries.filter((e) => e.isPinned).length,
    recent: entries.filter((e) => e.lastUsedAt).length
  }

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col border-r border-border-subtle bg-bg-base/40 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-6">
        {/* Views */}
        <section className="space-y-0.5">
          <SectionLabel>Kütüphane</SectionLabel>
          <NavItem
            active={view === 'all' && !activeCategory && !activeTag}
            icon={<Inbox size={14} />}
            label="Tüm kayıtlar"
            count={counts.all}
            onClick={() => setView('all')}
          />
          <NavItem
            active={view === 'pinned'}
            icon={<Pin size={14} />}
            label="Sabitlenenler"
            count={counts.pinned}
            onClick={() => setView('pinned')}
          />
          <NavItem
            active={view === 'recent'}
            icon={<Clock size={14} />}
            label="Son kullanılanlar"
            count={counts.recent}
            onClick={() => setView('recent')}
          />
        </section>

        {/* Categories */}
        {categories.length > 0 ? (
          <section className="space-y-0.5">
            <SectionLabel icon={<Layers size={11} />}>Kategoriler</SectionLabel>
            {categories.map((c) => (
              <NavItem
                key={c}
                active={activeCategory === c}
                label={c}
                count={entries.filter((e) => e.category === c).length}
                onClick={() => setCategory(activeCategory === c ? null : c)}
              />
            ))}
          </section>
        ) : null}

        {/* Tags */}
        {allTags.length > 0 ? (
          <section className="space-y-2">
            <SectionLabel icon={<TagIcon size={11} />}>Etiketler</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {allTags.slice(0, 30).map((t) => (
                <TagPill
                  key={t}
                  name={t}
                  active={activeTag === t}
                  onClick={() => setTag(activeTag === t ? null : t)}
                  size="xs"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border-subtle px-3 py-2.5 flex items-center gap-1">
        <FooterButton onClick={importData} icon={<Upload size={12} />} label="İçe aktar" />
        <FooterButton onClick={exportData} icon={<Download size={12} />} label="Dışa aktar" />
      </div>
    </aside>
  )
}

function SectionLabel({
  children,
  icon
}: {
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-tertiary font-semibold px-2 mb-1">
      {icon}
      <span>{children}</span>
    </div>
  )
}

function NavItem({
  active,
  icon,
  label,
  count,
  onClick
}: {
  active: boolean
  icon?: ReactNode
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
        active
          ? 'bg-accent-500/15 text-accent-200'
          : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
      )}
    >
      {icon ? <span className={cn(active ? 'text-accent-400' : 'text-text-tertiary')}>{icon}</span> : null}
      <span className="flex-1 text-left truncate">{label}</span>
      {typeof count === 'number' ? (
        <span
          className={cn(
            'text-[10px] tabular-nums px-1.5 py-0.5 rounded',
            active ? 'bg-accent-500/20 text-accent-200' : 'bg-bg-elevated text-text-tertiary'
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

function FooterButton({
  onClick,
  icon,
  label
}: {
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-md py-1.5 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
