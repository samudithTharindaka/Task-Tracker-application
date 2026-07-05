import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TASK_LABELS, type Assignee, type TaskExtras, type TaskLabel } from '@/types/task'

// The backend has no columns for labels, comments, or multi-assignee
// identity/presence (just a single real `ownerId` per task) — this store
// layers that still-mocked decoration on top of real tasks, keyed by their
// real id, so the board/list keep looking "dressed" like the design.

const ASSIGNEE_ROSTER: Assignee[] = [
  { name: 'Jane Cooper', handle: '@jane', email: 'jessica.hanson@example.com', avatarColor: '#7c3aed' },
  { name: 'Wade Warren', handle: '@wade456', email: 'willie.jennings@example.com', avatarColor: '#0f172a' },
  { name: 'Esther Howard', handle: '@esther', email: 'd.chambers@example.com', avatarColor: '#7c3aed' },
  { name: 'Jenny Wilson', handle: '@jenny', email: 'willie.jennings@example.com', avatarColor: '#7c3aed' },
  { name: 'Guy Hawkins', handle: '@guy', email: 'michael.mitc@example.com', avatarColor: '#f59e0b' },
  { name: 'Jacob Jones', handle: '@jacob', email: 'michael.mitc@example.com', avatarColor: '#0f172a' },
  { name: 'Ronald Richards', handle: '@ronald', email: 'deanna.curtis@example.com', avatarColor: '#7c3aed' },
  { name: 'Devon Lane', handle: '@devon', email: 'alma.lawson@example.com', avatarColor: '#7c3aed' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function defaultExtrasFor(taskId: string): TaskExtras {
  const hash = hashString(taskId)
  return {
    label: TASK_LABELS[hash % TASK_LABELS.length].id,
    assignee: ASSIGNEE_ROSTER[hash % ASSIGNEE_ROSTER.length],
    comments: [],
  }
}

interface TaskExtrasState {
  extras: Record<string, TaskExtras>
  getExtras: (taskId: string) => TaskExtras
  setLabel: (taskId: string, label: TaskLabel) => void
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
        const created = defaultExtrasFor(taskId)
        set((state) => ({ extras: { ...state.extras, [taskId]: created } }))
        return created
      },
      setLabel: (taskId, label) =>
        set((state) => ({
          extras: {
            ...state.extras,
            [taskId]: { ...(state.extras[taskId] ?? defaultExtrasFor(taskId)), label },
          },
        })),
      addComment: (taskId, body, author) =>
        set((state) => {
          const current = state.extras[taskId] ?? defaultExtrasFor(taskId)
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
