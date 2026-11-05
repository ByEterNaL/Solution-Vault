import { Copy, Pencil, Pin, PinOff, Trash2, Clock, Layers, Hash } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { MarkdownView } from './MarkdownView'
import { TagPill } from './TagPill'
import { Button } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { Kbd } from './ui/Kbd'
import { formatDateTime, relativeTime } from '@/lib/format'
import { EmptyState } from './EmptyState'

/**
 * Right pane — the chosen entry's full read view.
 *
 * Primary action surfacing:
 *   - "Copy solution" lives top-right with a Kbd hint — the verb the user
 *     actually came here for.
 *   - Edit / pin / delete are de-emphasized icons (Tooltip-labelled).
 */
export function EntryDetail() {
  const selectedId = useAppStore((s) => s.selectedId)
  const entry = useAppStore((s) => s.entries.find((e) => e.id === s.selectedId) ?? null)
  const copySolution = useAppStore((s) => s.copySolution)
  const togglePin = useAppStore((s) => s.togglePin)
  const deleteEntry = useAppStore((s) => s.deleteEntry)
  const openEditor = useAppStore((s) => s.openEditor)
  const setTag = useAppStore((s) => s.setTag)
  const setCategory = useAppStore((s) => s.setCategory)

  if (!entry) {
    return (
      <div className="flex-1 grid place-items-center">
        <EmptyState
          title={selectedId ? 'Kayıt bulunamadı' : 'Okumak için bir kayıt seç'}
          description={
            selectedId
              ? 'Silinmiş olabilir. Listeden başka bir kayıt seçmeyi dene.'
              : 'Detayları görmek için soldaki listeden bir kayıt seç. Yenisini eklemek için Ctrl + N kullanabilirsin.'
          }
        />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border-subtle px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary text-balance selectable">
              {entry.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
              {entry.category ? (
                <button
                  onClick={() => setCategory(entry.category!)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Layers size={11} />
                  {entry.category}
                </button>
              ) : null}
              {entry.lastUsedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {relativeTime(entry.lastUsedAt)} kullanıldı
                </span>
              ) : null}
              <span>•</span>
              <span title={formatDateTime(entry.updatedAt)}>
                {relativeTime(entry.updatedAt)} güncellendi
              </span>
              {entry.useCount > 0 ? (
                <>
                  <span>•</span>
                  <span>{entry.useCount}× açıldı</span>
                </>
              ) : null}
            </div>
            {entry.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <TagPill key={t} name={t} onClick={() => setTag(t)} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Action cluster */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip label={entry.isPinned ? 'Sabitlemeyi kaldır' : 'Üste sabitle'}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePin(entry.id)}
                aria-label="Sabitlemeyi değiştir"
              >
                {entry.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
              </Button>
            </Tooltip>
            <Tooltip label={<span className="flex items-center gap-1.5">Düzenle <Kbd keys={['Ctrl', 'E']} /></span>}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditor(entry)}
                aria-label="Kaydı düzenle"
              >
                <Pencil size={15} />
              </Button>
            </Tooltip>
            <Tooltip label="Sil">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`"${entry.title}" silinsin mi? Hemen geri alabilirsin.`)) {
                    void deleteEntry(entry.id)
                  }
                }}
                aria-label="Kaydı sil"
              >
                <Trash2 size={15} />
              </Button>
            </Tooltip>
            <div className="w-px h-6 bg-border-subtle mx-1" />
            <Button
              variant="primary"
              size="md"
              onClick={() => copySolution(entry.id)}
              leadingIcon={<Copy size={14} />}
            >
              Çözümü kopyala
              <Kbd keys={['Ctrl', 'Shift', 'C']} className="ml-1.5 opacity-80" />
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 selectable">
        {entry.problem ? (
          <section className="mb-6">
            <SectionLabel icon={<Hash size={11} />}>Sorun</SectionLabel>
            <MarkdownView content={entry.problem} />
          </section>
        ) : null}
        <section>
          <SectionLabel icon={<Hash size={11} />}>Çözüm</SectionLabel>
          {entry.solution ? (
            <MarkdownView content={entry.solution} />
          ) : (
            <p className="text-sm text-text-tertiary italic">Henüz çözüm kaydedilmedi.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionLabel({
  children,
  icon
}: {
  children: import('react').ReactNode
  icon?: import('react').ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-tertiary font-semibold mb-2">
      {icon}
      <span>{children}</span>
    </div>
  )
}
