import { create } from 'zustand'
import * as tasksApi from '@/lib/api/tasks'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks'
import { BOARD_COLUMNS, type Pagination, type Task, type TaskStatus } from '@/types/task'

const DEFAULT_COLUMN_LIMIT = 20

interface ColumnState {
  tasks: Task[]
  pagination: Pagination | null
  isLoading: boolean
  isLoadingMore: boolean
}

function emptyColumn(): ColumnState {
  return { tasks: [], pagination: null, isLoading: false, isLoadingMore: false }
}

function emptyColumns(): Record<TaskStatus, ColumnState> {
  return Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, emptyColumn()])) as Record<TaskStatus, ColumnState>
}

function findStatusInColumns(columns: Record<TaskStatus, ColumnState>, taskId: string): TaskStatus | null {
  for (const status of Object.keys(columns) as TaskStatus[]) {
    if (columns[status].tasks.some((t) => t.id === taskId)) return status
  }
  return null
}

// Single place that encodes "how a task update affects the per-column
// board state" — used by create/update/move and realtime upsert alike.
// `prevStatus` is looked up by the caller (findStatusInColumns) since the
// event/API response only ever carries the task's *new* status.
function upsertTaskInColumns(
  columns: Record<TaskStatus, ColumnState>,
  task: Task,
  prevStatus: TaskStatus | null,
): Record<TaskStatus, ColumnState> {
  const newStatus = task.status

  if (prevStatus === newStatus) {
    // No column change — replace in place so position within the column
    // isn't disturbed by an unrelated edit (e.g. description, label).
    const col = columns[newStatus]
    const idx = col.tasks.findIndex((t) => t.id === task.id)
    const tasks = idx === -1 ? [...col.tasks, task] : col.tasks.map((t, i) => (i === idx ? task : t))
    return { ...columns, [newStatus]: { ...col, tasks } }
  }

  const next = { ...columns }

  if (prevStatus) {
    const oldCol = next[prevStatus]
    const hadIt = oldCol.tasks.some((t) => t.id === task.id)
    next[prevStatus] = {
      ...oldCol,
      tasks: oldCol.tasks.filter((t) => t.id !== task.id),
      pagination: hadIt && oldCol.pagination ? { ...oldCol.pagination, totalItems: Math.max(0, oldCol.pagination.totalItems - 1) } : oldCol.pagination,
    }
  }

  const newCol = next[newStatus]
  const alreadyInNew = newCol.tasks.some((t) => t.id === task.id)
  next[newStatus] = {
    ...newCol,
    tasks: alreadyInNew ? newCol.tasks.map((t) => (t.id === task.id ? task : t)) : [...newCol.tasks, task],
    pagination: !alreadyInNew && newCol.pagination ? { ...newCol.pagination, totalItems: newCol.pagination.totalItems + 1 } : newCol.pagination,
  }

  return next
}

function removeFromColumns(columns: Record<TaskStatus, ColumnState>, taskId: string): Record<TaskStatus, ColumnState> {
  const next = {} as Record<TaskStatus, ColumnState>
  for (const status of Object.keys(columns) as TaskStatus[]) {
    const col = columns[status]
    const hadIt = col.tasks.some((t) => t.id === taskId)
    next[status] = {
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
      pagination: hadIt && col.pagination ? { ...col.pagination, totalItems: Math.max(0, col.pagination.totalItems - 1) } : col.pagination,
    }
  }
  return next
}

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  // Bumped on every successful mutation (local or realtime) so independent
  // consumers (e.g. ListPage's own paginated fetch) can react to "something
  // about tasks changed" without needing to read this flat array directly.
  revision: number
  fetchTasks: (projectId: string) => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>
  moveTask: (id: string, status: TaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  // Applied from realtime socket events (see lib/socket.ts) — inserts or
  // replaces by id, rather than assuming the task is already loaded.
  upsertTask: (task: Task) => void
  removeTask: (id: string) => void

  // Per-status paginated board columns (Board page) — independent of `tasks`
  // above, which stays a full-project fetch for Home's stats/table.
  columns: Record<TaskStatus, ColumnState>
  fetchColumn: (projectId: string, status: TaskStatus, limit?: number) => Promise<void>
  loadMoreColumn: (projectId: string, status: TaskStatus) => Promise<void>
}

// Module-scoped request counters so a slower, superseded response (e.g. from
// rapidly switching projects) can never clobber a newer one. Tasks/columns
// are keyed separately since 4 columns fetch independently in parallel.
let latestRequestId = 0
const latestColumnRequestId: Partial<Record<TaskStatus, number>> = {}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  revision: 0,
  columns: emptyColumns(),

  fetchTasks: async (projectId) => {
    const requestId = ++latestRequestId
    set({ isLoading: true })
    try {
      const tasks = await tasksApi.listTasksByProject(projectId)
      if (requestId !== latestRequestId) return
      set({ tasks, isLoading: false })
    } catch (err) {
      if (requestId === latestRequestId) set({ isLoading: false })
      throw err
    }
  },

  createTask: async (input) => {
    const task = await tasksApi.createTask(input)
    set((state) => ({
      tasks: [...state.tasks, task],
      columns: upsertTaskInColumns(state.columns, task, null),
      revision: state.revision + 1,
    }))
    return task
  },

  updateTask: async (id, patch) => {
    const prevStatus = findStatusInColumns(get().columns, id)
    const task = await tasksApi.updateTask(id, patch)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
      columns: upsertTaskInColumns(state.columns, task, prevStatus),
      revision: state.revision + 1,
    }))
  },

  moveTask: async (id, status) => {
    const previousTasks = get().tasks
    const previousColumns = get().columns
    const prevStatus = findStatusInColumns(previousColumns, id)
    const current = previousTasks.find((t) => t.id === id) ?? Object.values(previousColumns).flatMap((c) => c.tasks).find((t) => t.id === id)

    if (current) {
      const optimistic = { ...current, status }
      set({
        tasks: previousTasks.map((t) => (t.id === id ? optimistic : t)),
        columns: upsertTaskInColumns(previousColumns, optimistic, prevStatus),
      })
    }

    try {
      const task = await tasksApi.updateTask(id, { status })
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        columns: upsertTaskInColumns(state.columns, task, status),
        revision: state.revision + 1,
      }))
    } catch (err) {
      set({ tasks: previousTasks, columns: previousColumns })
      throw err
    }
  },

  deleteTask: async (id) => {
    const previousTasks = get().tasks
    const previousColumns = get().columns
    set({ tasks: previousTasks.filter((t) => t.id !== id), columns: removeFromColumns(previousColumns, id) })
    try {
      await tasksApi.deleteTask(id)
      set((state) => ({ revision: state.revision + 1 }))
    } catch (err) {
      set({ tasks: previousTasks, columns: previousColumns })
      throw err
    }
  },

  upsertTask: (task) => {
    set((state) => {
      const exists = state.tasks.some((t) => t.id === task.id)
      const prevStatus = findStatusInColumns(state.columns, task.id)
      return {
        tasks: exists ? state.tasks.map((t) => (t.id === task.id ? task : t)) : [...state.tasks, task],
        columns: upsertTaskInColumns(state.columns, task, prevStatus),
        revision: state.revision + 1,
      }
    })
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      columns: removeFromColumns(state.columns, id),
      revision: state.revision + 1,
    }))
  },

  fetchColumn: async (projectId, status, limit = DEFAULT_COLUMN_LIMIT) => {
    const requestId = (latestColumnRequestId[status] ?? 0) + 1
    latestColumnRequestId[status] = requestId

    set((state) => ({ columns: { ...state.columns, [status]: { ...state.columns[status], isLoading: true } } }))

    try {
      const { tasks, pagination } = await tasksApi.listTasksPage(projectId, { page: 1, limit, status })
      if (latestColumnRequestId[status] !== requestId) return
      set((state) => ({
        columns: { ...state.columns, [status]: { tasks, pagination, isLoading: false, isLoadingMore: false } },
      }))
    } catch (err) {
      if (latestColumnRequestId[status] === requestId) {
        set((state) => ({ columns: { ...state.columns, [status]: { ...state.columns[status], isLoading: false } } }))
      }
      throw err
    }
  },

  loadMoreColumn: async (projectId, status) => {
    const col = get().columns[status]
    const nextPage = col.pagination?.nextPage

    if (!col.pagination?.hasNextPage || nextPage == null || col.isLoadingMore) return

    set((state) => ({ columns: { ...state.columns, [status]: { ...state.columns[status], isLoadingMore: true } } }))

    try {
      const { tasks, pagination } = await tasksApi.listTasksPage(projectId, { page: nextPage, limit: col.pagination.limit, status })
      set((state) => ({
        columns: {
          ...state.columns,
          [status]: { tasks: [...state.columns[status].tasks, ...tasks], pagination, isLoading: false, isLoadingMore: false },
        },
      }))
    } catch (err) {
      set((state) => ({ columns: { ...state.columns, [status]: { ...state.columns[status], isLoadingMore: false } } }))
      throw err
    }
  },
}))
