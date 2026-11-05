import { useEffect, useMemo, useRef, useState } from 'react'
import { Pin, X, Eye, Pencil, Sparkles } from 'lucide-react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Kbd } from './ui/Kbd'
import { MarkdownView } from './MarkdownView'
import { TagPill } from './TagPill'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'

type Mode = 'edit' | 'preview'

/**
 * Create / edit dialog.
 *
 *  - Title is the only required field.
 *  - "Smart paste" suggests using clipboard contents when present and the
 *    problem field is empty (perfect for stack traces / error messages).
 *  - Tabs (Edit / Preview) instead of split view → less visual noise on a
 *    700px-tall window.
 *  - Tag chips accept comma / Enter to commit; existing tags autocomplete
 *    inline.
 *  - Ctrl+Enter saves from anywhere inside the dialog.
 */
export function EntryEditor() {
  const open = useAppStore((s) => s.editorOpen)
  const initial = useAppStore((s) => s.editorEntry)
  const closeEditor = useAppStore((s) => s.closeEditor)
  const createEntry = useAppStore((s) => s.createEntry)
  const updateEntry = useAppStore((s) => s.updateEntry)
  // Derive category / tag lists from `entries` via useMemo. Calling a
  // store-level method that returns a fresh array on every render breaks
  // Zustand's snapshot caching and causes an infinite update loop.
  const entries = useAppStore((s) => s.entries)
  const existingCategories = useMemo<string[]>(
    () =>
      Array.from(
        new Set(entries.map((e) => e.category).filter((c): c is string => !!c))
      ).sort((a, b) => a.localeCompare(b)),
    [entries]
  )
  const existingTags = useMemo<string[]>(() => {
    const counts = new Map<string, number>()
    for (const e of entries) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t)
  }, [entries])

  const isEdit = !!initial

  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [problemMode, setProblemMode] = useState<Mode>('edit')
  const [solutionMode, setSolutionMode] = useState<Mode>('edit')
  const [smartPasteShown, setSmartPasteShown] = useState(false)
  const [smartPasteValue, setSmartPasteValue] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  // Reset state on every open
  useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title)
      setProblem(initial.problem)
      setSolution(initial.solution)
      setCategory(initial.category ?? '')
      setTags(initial.tags)
      setIsPinned(initial.isPinned)
    } else {
      setTitle('')
      setProblem('')
      setSolution('')
      setCategory('')
      setTags([])
      setIsPinned(false)
    }
    setTagInput('')
    setProblemMode('edit')
    setSolutionMode('edit')
    setSmartPasteShown(false)
    // Smart paste: if clipboard has content and we're in create mode, offer it.
    if (!initial) {
      void window.api.readClipboard().then((text) => {
        const t = (text || '').trim()
        if (t && t.length > 10 && t.length < 4000) {
          setSmartPasteValue(t)
          setSmartPasteShown(true)
        }
      })
    }
    // Focus title field on next tick
    setTimeout(() => titleRef.current?.focus(), 30)
  }, [open, initial])

  const canSubmit = title.trim().length > 0
  const dirty = useMemo(() => {
    if (!initial) {
      return Boolean(title || problem || solution || category || tags.length)
    }
    return (
      title !== initial.title ||
      problem !== initial.problem ||
      solution !== initial.solution ||
      (category || undefined) !== initial.category ||
      JSON.stringify(tags) !== JSON.stringify(initial.tags) ||
      isPinned !== initial.isPinned
    )
  }, [initial, title, problem, solution, category, tags, isPinned])

  const handleClose = (): void => {
    if (dirty && !confirm('Kaydedilmemiş değişiklikleri sil?')) return
    closeEditor()
  }

  const commitTag = (raw: string): void => {
    const cleaned = raw.trim().toLowerCase().replace(/^#+/, '')
    if (!cleaned) return
    if (tags.includes(cleaned)) return
    setTags([...tags, cleaned])
  }

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag(tagInput)
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const onSave = async (): Promise<void> => {
    if (!canSubmit) return
    const payload = {
      title: title.trim(),
      problem,
      solution,
      category: category.trim() || undefined,
      tags,
      isPinned
    }
    if (initial) await updateEntry(initial.id, payload)
    else await createEntry(payload)
    closeEditor()
  }

  // Ctrl+Enter to submit
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void onSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const suggestedTags = useMemo(
    () => existingTags.filter((t) => !tags.includes(t)).slice(0, 8),
    [existingTags, tags]
  )

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="3xl"
      dismissOnOverlay={!dirty}
      title={isEdit ? 'Kaydı düzenle' : 'Yeni kayıt'}
      description={
        isEdit
          ? 'Kaydedilmiş sorun ve çözümü güncelle. Kaydetmek için Ctrl + Enter.'
          : 'Sorunu ve çalışan çözümü tazeyken kaydet. Kaydetmek için Ctrl + Enter.'
      }
      footer={
        <>
          <button
            onClick={() => setIsPinned((p) => !p)}
            className={cn(
              'mr-auto inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors',
              isPinned
                ? 'text-accent-300 bg-accent-500/15'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
            )}
          >
            <Pin size={12} />
            {isPinned ? 'Sabit' : 'Sabitle'}
          </button>
          <Button variant="ghost" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={onSave} disabled={!canSubmit}>
            Kaydet
            <Kbd keys={['Ctrl', '⏎']} className="ml-2 opacity-80" />
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Smart paste */}
        {smartPasteShown ? (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-accent-500/30 bg-accent-500/8">
            <Sparkles size={14} className="text-accent-300 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">
                <span className="text-text-primary font-medium">Pano içeriği algılandı.</span> Sorun
                açıklaması olarak kullanılsın mı?
              </p>
              <pre className="mt-1 text-[11px] font-mono text-text-tertiary line-clamp-2 whitespace-pre-wrap break-all">
                {smartPasteValue.slice(0, 240)}
              </pre>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setProblem((p) => (p ? p + '\n\n' + smartPasteValue : smartPasteValue))
                setSmartPasteShown(false)
              }}
            >
              Kullan
            </Button>
            <button
              onClick={() => setSmartPasteShown(false)}
              className="text-text-tertiary hover:text-text-primary p-1"
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {/* Title */}
        <Field label="Başlık" required>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="ör. Outlook SMTP gönderiminde 0x800CCC0E hatası"
            className="w-full h-10 px-3 rounded-md bg-bg-surface border border-border-default focus:border-accent-500/60 focus:outline-none text-text-primary placeholder:text-text-tertiary text-sm"
          />
        </Field>

        {/* Category + Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kategori" hint="Tek seviyeli grup (opsiyonel)">
            <div className="relative">
              <input
                value={category}
                onChange={(e) => setCategory(e.currentTarget.value)}
                placeholder="ör. Outlook"
                list="category-suggestions"
                className="w-full h-10 px-3 rounded-md bg-bg-surface border border-border-default focus:border-accent-500/60 focus:outline-none text-text-primary placeholder:text-text-tertiary text-sm"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </Field>
          <Field label="Etiketler" hint="Eklemek için virgül veya Enter">
            <div className="min-h-10 flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-md bg-bg-surface border border-border-default focus-within:border-accent-500/60">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded bg-bg-elevated text-xs text-text-primary"
                >
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="text-text-tertiary hover:text-danger"
                    aria-label={`${t} etiketini kaldır`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.currentTarget.value)}
                onKeyDown={onTagKeyDown}
                placeholder={tags.length === 0 ? 'smtp, ofis, hata-kodu…' : ''}
                className="flex-1 min-w-[80px] h-7 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary"
              />
            </div>
            {suggestedTags.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-semibold mr-1 self-center">
                  Hızlı ekle:
                </span>
                {suggestedTags.map((t) => (
                  <TagPill key={t} name={t} onClick={() => commitTag(t)} size="xs" />
                ))}
              </div>
            ) : null}
          </Field>
        </div>

        {/* Problem */}
        <Field
          label="Sorun"
          hint="Markdown desteklenir. Hata mesajları, stack trace, ekran görüntüsü linkleri yapıştır…"
          right={
            <ModeToggle mode={problemMode} onChange={setProblemMode} disabledPreview={!problem} />
          }
        >
          {problemMode === 'edit' ? (
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.currentTarget.value)}
              placeholder="Ne yanlış gitti? Tam hata mesajını ve adım adım yeniden üretmeyi açıkla."
              rows={5}
              className="w-full px-3 py-2 rounded-md bg-bg-surface border border-border-default focus:border-accent-500/60 focus:outline-none text-text-primary placeholder:text-text-tertiary text-sm font-mono leading-relaxed resize-y"
            />
          ) : (
            <div className="px-4 py-3 rounded-md bg-bg-surface border border-border-default min-h-[120px] selectable">
              <MarkdownView content={problem} />
            </div>
          )}
        </Field>

        {/* Solution */}
        <Field
          label="Çözüm"
          hint="Komut/yapılandırmayı üçlü backtick (```) içine alırsan kopya dostu kod bloğu olur."
          right={
            <ModeToggle
              mode={solutionMode}
              onChange={setSolutionMode}
              disabledPreview={!solution}
            />
          }
        >
          {solutionMode === 'edit' ? (
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.currentTarget.value)}
              placeholder={'Adım adım çözüm. Örnek:\n\n```powershell\nGet-Service "MSExchangeIS" | Restart-Service\n```'}
              rows={9}
              className="w-full px-3 py-2 rounded-md bg-bg-surface border border-border-default focus:border-accent-500/60 focus:outline-none text-text-primary placeholder:text-text-tertiary text-sm font-mono leading-relaxed resize-y"
            />
          ) : (
            <div className="px-4 py-3 rounded-md bg-bg-surface border border-border-default min-h-[160px] selectable">
              <MarkdownView content={solution} />
            </div>
          )}
        </Field>
      </div>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  required,
  right,
  children
}: {
  label: string
  hint?: string
  required?: boolean
  right?: import('react').ReactNode
  children: import('react').ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-text-secondary tracking-wide">
          {label}
          {required ? <span className="text-danger ml-0.5">*</span> : null}
          {hint ? (
            <span className="ml-2 text-[11px] font-normal text-text-tertiary">{hint}</span>
          ) : null}
        </label>
        {right}
      </div>
      {children}
    </div>
  )
}

function ModeToggle({
  mode,
  onChange,
  disabledPreview
}: {
  mode: Mode
  onChange: (m: Mode) => void
  disabledPreview?: boolean
}) {
  return (
    <div className="inline-flex items-center rounded-md bg-bg-elevated border border-border-subtle p-0.5">
      <ToggleButton active={mode === 'edit'} onClick={() => onChange('edit')}>
        <Pencil size={11} />
        Yaz
      </ToggleButton>
      <ToggleButton
        active={mode === 'preview'}
        onClick={() => !disabledPreview && onChange('preview')}
        disabled={disabledPreview}
      >
        <Eye size={11} />
        Önizle
      </ToggleButton>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  disabled,
  children
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: import('react').ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium transition-colors',
        active
          ? 'bg-bg-surface text-text-primary shadow-soft'
          : 'text-text-tertiary hover:text-text-secondary',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}
