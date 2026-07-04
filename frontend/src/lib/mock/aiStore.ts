import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const CANNED_RESPONSES: Record<string, string> = {
  'what can i ask you to do?':
    "I can help you find tasks, summarize project status, flag overdue work, and suggest priorities across your boards. Try asking about a specific project or task.",
  'which one of my projects is performing the best?':
    "\"Ongoing board\" is trending well — most cards in QA and Completed, low overdue count, and steady throughput this week.",
  'what projects should i be concerned about right now?':
    "Nothing critical right now, but a few tasks in the QA column have been sitting for a while — worth a quick check-in with the owners.",
}

function getCannedResponse(message: string): string {
  const key = message.trim().toLowerCase()
  return (
    CANNED_RESPONSES[key] ??
    "I'm a demo AI assistant — I don't have a live model connected yet, but once wired up I'll be able to answer questions about your real tasks and projects."
  )
}

interface AiState {
  messages: ChatMessage[]
  isThinking: boolean
  sendMessage: (content: string) => void
}

export const useAiStore = create<AiState>((set, get) => ({
  messages: [],
  isThinking: false,
  sendMessage: (content) => {
    const userMessage: ChatMessage = { id: `m-${Date.now()}`, role: 'user', content }
    set((state) => ({ messages: [...state.messages, userMessage], isThinking: true }))

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m-${Date.now()}-r`,
        role: 'assistant',
        content: getCannedResponse(content),
      }
      set({ messages: [...get().messages, reply], isThinking: false })
    }, 900)
  },
}))
