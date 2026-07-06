import { create } from 'zustand'
import * as tasksApi from '@/lib/api/tasks'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks'
import type { Task, TaskStatus } from '@/types/task'

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  fetchTasks: (projectId: string) => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>
  moveTask: (id: string, status: TaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  // Applied from realtime socket events (see lib/socket.ts) — inserts or
  // replaces by id, rather than assuming the task is already loaded.
  upsertTask: (task: Task) => void
  removeTask: (id: string) => void
}

// Module-scoped request counter so a slower, superseded fetchTasks response
// (e.g. from rapidly switching projects) can never clobber a newer one.
let latestRequestId = 0

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
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
    set({ tasks: [...get().tasks, task] })
    return task
  },
  updateTask: async (id, patch) => {
    const task = await tasksApi.updateTask(id, patch)
    set({ tasks: get().tasks.map((t) => (t.id === id ? task : t)) })
  },
  moveTask: async (id, status) => {
    const previous = get().tasks
    set({ tasks: previous.map((t) => (t.id === id ? { ...t, status } : t)) })
    try {
      await tasksApi.updateTask(id, { status })
    } catch (err) {
      set({ tasks: previous })
      throw err
    }
  },
  deleteTask: async (id) => {
    const previous = get().tasks
    set({ tasks: previous.filter((t) => t.id !== id) })
    try {
      await tasksApi.deleteTask(id)
    } catch (err) {
      set({ tasks: previous })
      throw err
    }
  },
  upsertTask: (task) => {
    const exists = get().tasks.some((t) => t.id === task.id)
    set({
      tasks: exists ? get().tasks.map((t) => (t.id === task.id ? task : t)) : [...get().tasks, task],
    })
  },
  removeTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
}))
