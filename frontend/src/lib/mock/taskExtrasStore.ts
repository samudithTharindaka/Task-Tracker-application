import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaskExtras } from '@/types/task'

// The backend still has no multi-assignee/comments concept — only labels and
// a single real `ownerId` per task are real now (see types/task.ts). This
// store layers just the still-mocked comments on top of real tasks, keyed by
// their real id.

function defaultExtrasFor(): TaskExtras {
  return { comments: [] }
}

interface TaskExtrasState {
  extras: Record<string, TaskExtras>
  getExtras: (taskId: string) => TaskExtras
  addComment: (taskId: string, body: string, author: string) => void
  removeExtras: (taskId: string) => void
}

export const useTaskExtrasStore = create<TaskExtrasState>()(
  persist(
    (set, get) => ({
      extras: {},
      getExtras: (taskId) => {
        const existing = get().extras[taskId]
        if (existing) return existing
        const created = defaultExtrasFor()
        set((state) => ({ extras: { ...state.extras, [taskId]: created } }))
        return created
      },
      addComment: (taskId, body, author) =>
        set((state) => {
          const current = state.extras[taskId] ?? defaultExtrasFor()
          const comment = {
            id: `c-${Date.now()}`,
            author,
            avatarColor: '#2f4fd4',
            body,
            createdAt: new Date().toISOString(),
          }
          return { extras: { ...state.extras, [taskId]: { ...current, comments: [...current.comments, comment] } } }
        }),
      removeExtras: (taskId) =>
        set((state) => {
          const { [taskId]: _removed, ...rest } = state.extras
          return { extras: rest }
        }),
    }),
    { name: 'newnop-task-extras' },
  ),
)
