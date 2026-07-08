import { type FormEvent, useEffect, useState } from 'react'
import { SendIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownMessage } from '@/components/ai/MarkdownMessage'
import { confirmAction } from '@/lib/toast'
import { useAiStore } from '@/store/aiStore'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  "What's due this week?",
  "Create a task called 'Fix login bug' due Friday",
  'Show my TEST tasks',
]

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-aurora-1 absolute top-[-10%] left-1/4 size-[36rem] rounded-full bg-sky-300/50 blur-3xl dark:bg-sky-500/20" />
      <div className="animate-aurora-2 absolute top-1/4 right-[10%] size-[32rem] rounded-full bg-violet-300/45 blur-3xl dark:bg-violet-500/20" />
      <div className="animate-aurora-3 absolute bottom-[-15%] left-1/3 size-[34rem] rounded-full bg-teal-300/45 blur-3xl dark:bg-teal-500/20" />
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-xs">
      <SparklesIcon className="size-3.5 animate-pulse text-primary" />
      <div className="flex items-center gap-1">
        <span className="[animation-delay:-0.3s] size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        <span className="[animation-delay:-0.15s] size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}

export function AiAssistantPage() {
  const messages = useAiStore((s) => s.messages)
  const isThinking = useAiStore((s) => s.isThinking)
  const sendMessage = useAiStore((s) => s.sendMessage)
  const pendingDelete = useAiStore((s) => s.pendingDelete)
  const confirmDelete = useAiStore((s) => s.confirmDelete)
  const dismissDelete = useAiStore((s) => s.dismissDelete)
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!pendingDelete) return
    const { taskId, title } = pendingDelete
    confirmAction({
      title: 'Delete this task?',
      description: `The assistant wants to delete "${title}". This can't be undone.`,
      onConfirm: () => confirmDelete(taskId),
    })
    dismissDelete()
  }, [pendingDelete, confirmDelete, dismissDelete])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const hasMessages = messages.length > 0

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-white to-sky-50 dark:from-background dark:to-slate-950">
      <AuroraBackground />

      <div className="relative flex flex-1 flex-col overflow-y-auto px-6 py-10">
        {!hasMessages ? (
          <div className="m-auto flex max-w-lg flex-col items-center text-center">
            <SparklesIcon className="size-8 text-foreground" />
            <h1 className="mt-4 text-2xl font-medium">Ask our AI anything</h1>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-md rounded-2xl px-4 py-3 text-sm',
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto bg-card shadow-xs',
                )}
              >
                {m.role === 'assistant' ? <MarkdownMessage content={m.content} /> : m.content}
              </div>
            ))}
            {isThinking && <ThinkingIndicator />}
          </div>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-6 pb-8">
        {!hasMessages && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Suggestions on what to ask Our AI</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border bg-card/80 px-4 py-2 text-left text-sm shadow-xs backdrop-blur-sm hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full border bg-card/90 px-4 py-2 shadow-xs backdrop-blur-sm">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your Tasks"
            className="border-none shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!input.trim()}>
            <SendIcon />
          </Button>
        </form>
      </div>
    </div>
  )
}
