import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Markdown → safe HTML.
 *
 * - `marked` parses GFM (lists, code fences, tables).
 * - `DOMPurify` strips anything dangerous (scripts, on* handlers, javascript: URLs).
 * - We mark code blocks with a sentinel class so React can hydrate them with a
 *   syntax-aware <CodeBlock /> via post-processing in <MarkdownView />.
 */
marked.setOptions({
  gfm: true,
  breaks: false
})

export function renderMarkdown(input: string): string {
  if (!input) return ''
  const raw = marked.parse(input, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'iframe', 'form', 'script'],
    FORBID_ATTR: ['style']
  })
}

/**
 * Extract the first plain-text excerpt from a markdown source. Used in list
 * cards where we want a one-liner preview without rendering full HTML.
 */
export function excerpt(input: string, maxLen = 120): string {
  if (!input) return ''
  const stripped = input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_\-]/g, ' ')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > maxLen ? stripped.slice(0, maxLen - 1).trimEnd() + '…' : stripped
}
