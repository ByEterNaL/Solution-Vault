import { forwardRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Kbd } from './ui/Kbd'
import { useAppStore } from '@/store/useAppStore'

/**
 * The hero of the app — a big, prominently placed search field.
 * Auto-focused on mount and globally focusable via Ctrl+F.
 * The "New" CTA sits adjacent so capturing knowledge is one click away.
 */
export const SearchBar = forwardRef<HTMLInputElement>(function SearchBar(_props, ref) {
  const query = useAppStore((s) => s.query)
  const setQuery = useAppStore((s) => s.setQuery)
  const openEditor = useAppStore((s) => s.openEditor)

  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-3">
      <div className="flex-1">
        <Input
          ref={ref}
          autoFocus
          variant="search"
          placeholder="Sorun, çözüm, kod parçası veya etiket ara…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search size={16} />}
          trailingSlot={
            query ? (
              <button
                onClick={() => setQuery('')}
                aria-label="Aramayı temizle"
                className="text-text-tertiary hover:text-text-primary p-1 rounded transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <Kbd keys={['Ctrl', 'F']} />
            )
          }
        />
      </div>
      <Button
        variant="primary"
        size="lg"
        onClick={() => openEditor(null)}
        leadingIcon={<Plus size={16} />}
      >
        Yeni
        <Kbd keys={['Ctrl', 'N']} className="ml-1 opacity-80" />
      </Button>
    </div>
  )
})
