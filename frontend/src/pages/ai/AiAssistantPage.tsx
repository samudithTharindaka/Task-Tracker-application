import { type FormEvent, useEffect, useState } from 'react'
import { SendIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { confirmAction } from '@/lib/toast'
import { useAiStore } from '@/store/aiStore'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  "What's due this week?",
  "Create a task called 'Fix login bug' due Friday",
  'Show my TEST tasks',
]

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
    <div className="relative flex h-full flex-col bg-gradient-to-br from-sky-100 via-cyan-50 to-white dark:from-sky-950 dark:via-slate-900 dark:to-background">
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-10">
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
                {m.content}
              </div>
            ))}
            {isThinking && <div className="mr-auto rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs">Thinking…</div>}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 pb-8">
        {!hasMessages && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Suggestions on what to ask Our AI</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border bg-card/80 px-4 py-2 text-left text-sm shadow-xs hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-xs">
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
