import { create } from 'zustand'
import * as tasksApi from '@/lib/api/tasks'
import type { Project, TaskStatus } from '@/types/task'

export type StatusCounts = Record<TaskStatus, number>

function emptyCounts(): StatusCounts {
  return { TODO: 0, IN_PROGRESS: 0, TEST: 0, DONE: 0 }
}

interface DashboardState {
  breakdownByProject: Record<string, StatusCounts>
  isLoading: boolean
  fetchBreakdown: (projects: Project[]) => Promise<void>
}

// Module-scoped request counter so a slower, superseded fetchBreakdown
// response (e.g. from the projects list changing again mid-fetch) can never
// clobber a newer one — same pattern as tasksStore.fetchTasks.
let latestRequestId = 0

export const useDashboardStore = create<DashboardState>((set) => ({
  breakdownByProject: {},
  isLoading: false,
  fetchBreakdown: async (projects) => {
    const requestId = ++latestRequestId
    set({ isLoading: true })
    try {
      const entries = await Promise.all(
        projects.map(async (project) => {
          const tasks = await tasksApi.listTasksByProject(project.id)
          const counts = emptyCounts()
          tasks.forEach((task) => {
            counts[task.status] += 1
          })
          return [project.id, counts] as const
        }),
      )
      if (requestId !== latestRequestId) return
      set({ breakdownByProject: Object.fromEntries(entries), isLoading: false })
    } catch (error) {
      if (requestId === latestRequestId) set({ isLoading: false })
      throw error
    }
  },
}))
