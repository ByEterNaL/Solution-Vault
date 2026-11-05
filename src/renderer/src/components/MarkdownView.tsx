import { useMemo, type ReactNode } from 'react'
import { renderMarkdown } from '@/lib/markdown'
import { CodeBlock } from './CodeBlock'

interface MarkdownViewProps {
  content: string
  className?: string
}

/**
 * Renders a sanitized markdown string and replaces native <pre><code> blocks
 * with our <CodeBlock /> component (which carries language label + copy
 * button). We do this in JavaScript rather than via a marked renderer
 * extension because:
 *
 *  1. Keeps marked's pipeline simple and DOMPurify trustworthy.
 *  2. Lets the code-block UI live in React land — easier to style and reason.
 *
 * The replacement walks the DOM once after dangerouslySetInnerHTML, scanning
 * for <pre><code>. Heavy entries will still parse in microseconds.
 */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  const { html, blocks } = useMemo(() => extract(content), [content])

  // Render markdown HTML, then replace each <pre>-placeholder with the React
  // CodeBlock at the same DOM index. We achieve this by splitting the HTML
  // string on the sentinel and interleaving with our React nodes.
  const parts: ReactNode[] = []
  let cursor = 0
  for (let i = 0; i < blocks.length; i++) {
    const idx = html.indexOf(SENTINEL, cursor)
    if (idx === -1) break
    if (idx > cursor) {
      parts.push(
        <span key={`h-${i}`} dangerouslySetInnerHTML={{ __html: html.slice(cursor, idx) }} />
      )
    }
    parts.push(<CodeBlock key={`c-${i}`} code={blocks[i].code} language={blocks[i].lang} />)
    cursor = idx + SENTINEL.length
  }
  if (cursor < html.length) {
    parts.push(<span key="h-end" dangerouslySetInnerHTML={{ __html: html.slice(cursor) }} />)
  }

  return <div className={['markdown', className].filter(Boolean).join(' ')}>{parts}</div>
}

const SENTINEL = '__CODEBLOCK_PLACEHOLDER__'

interface ExtractedBlock {
  code: string
  lang?: string
}

/**
 * Pull fenced code blocks out of the source before markdown rendering, so we
 * can later inject our React components in their exact positions.
 */
function extract(source: string): { html: string; blocks: ExtractedBlock[] } {
  const blocks: ExtractedBlock[] = []
  const stripped = source.replace(/```([\w+\-.#]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    blocks.push({ code: code.replace(/\n$/, ''), lang: lang || undefined })
    return SENTINEL
  })
  const html = renderMarkdown(stripped)
  return { html, blocks }
}
