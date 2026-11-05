import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CodeBlockProps {
  code: string
  language?: string
}

/**
 * Premium code block with language label + integrated copy button.
 *
 * We intentionally do not syntax-highlight on the renderer to keep cold-start
 * fast and the bundle slim — IT specialists are copying these snippets, not
 * reading them as literature. The clear monospace + accent label is the
 * focused, ergonomic compromise.
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async (): Promise<void> => {
    await window.api.copyText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="not-prose group relative my-3 overflow-hidden rounded-lg border border-border-subtle bg-[#0d0d14]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-bg-base/60">
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={onCopy}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md transition-all',
            copied
              ? 'text-success bg-success/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          )}
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed font-mono text-accent-100 selectable">
        <code>{code}</code>
      </pre>
    </div>
  )
}
