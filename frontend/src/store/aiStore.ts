import { create } from 'zustand'
import { sendChatMessage, type PendingDelete } from '@/lib/api/ai'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/toast'
import { useProjectsStore } from '@/store/projectsStore'
import { useTasksStore } from '@/store/tasksStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiState {
  messages: ChatMessage[]
  isThinking: boolean
  pendingDelete: PendingDelete | null
  sendMessage: (content: string) => Promise<void>
  confirmDelete: (taskId: string) => Promise<void>
  dismissDelete: () => void
}

export const useAiStore = create<AiState>((set, get) => ({
  messages: [],
  isThinking: false,
  pendingDelete: null,
  sendMessage: async (content) => {
    const userMessage: ChatMessage = { id: `m-${Date.now()}-u`, role: 'user', content }
    set((state) => ({ messages: [...state.messages, userMessage], isThinking: true }))

    const history = get().messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
    const currentProjectId = useProjectsStore.getState().currentProjectId

    try {
      const response = await sendChatMessage(content, history, currentProjectId)
      const assistantMessage: ChatMessage = { id: `m-${Date.now()}-a`, role: 'assistant', content: response.reply }
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isThinking: false,
        pendingDelete: response.pendingDelete ?? null,
      }))

      if (response.mutated && currentProjectId) {
        useTasksStore.getState().fetchTasks(currentProjectId)
      }
    } catch (error) {
      notifyError('Assistant error', getApiErrorMessage(error))
      set({ isThinking: false })
    }
  },
  confirmDelete: async (taskId) => {
    try {
      await useTasksStore.getState().deleteTask(taskId)
      notifySuccess('Task deleted')
    } catch (error) {
      notifyError('Could not delete task', getApiErrorMessage(error))
    } finally {
      set({ pendingDelete: null })
    }
  },
  dismissDelete: () => set({ pendingDelete: null }),
}))
