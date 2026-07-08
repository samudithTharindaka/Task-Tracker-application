import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// AI replies come back as markdown (**bold**, lists, code, etc.) — render it
// properly instead of dumping raw markdown syntax into the chat bubble.
export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none
        prose-p:my-1.5 prose-p:leading-relaxed first:prose-p:mt-0 last:prose-p:mb-0
        prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
        prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold
        prose-strong:font-semibold prose-strong:text-foreground
        prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted prose-pre:text-foreground
        prose-a:text-primary prose-a:underline-offset-2"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
