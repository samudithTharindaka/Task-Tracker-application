import { create } from 'zustand'
import * as projectsApi from '@/lib/api/projects'
import type { Project } from '@/types/task'

interface ProjectsState {
  projects: Project[]
  currentProjectId: string | null
  isLoading: boolean
  fetchProjects: () => Promise<void>
  createProject: (name: string) => Promise<Project>
  renameProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (id: string) => void
}

// Module-scoped (not store state) so concurrent callers — e.g. React 18
// StrictMode's double-invoked effects — share one in-flight request instead
// of each racing to see an empty project list and creating their own
// duplicate default project.
let inFlightFetch: Promise<void> | null = null

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: false,
  fetchProjects: () => {
    if (inFlightFetch) return inFlightFetch

    set({ isLoading: true })
    inFlightFetch = (async () => {
      let projects = await projectsApi.listProjects()

      if (projects.length === 0) {
        const defaultProject = await projectsApi.createProject('My Board')
        projects = [defaultProject]
      }

      const current = get().currentProjectId
      set({
        projects,
        isLoading: false,
        currentProjectId: current && projects.some((p) => p.id === current) ? current : projects[0].id,
      })
    })().finally(() => {
      inFlightFetch = null
    })

    return inFlightFetch
  },
  createProject: async (name) => {
    const project = await projectsApi.createProject(name)
    set({ projects: [...get().projects, project], currentProjectId: project.id })
    return project
  },
  renameProject: async (id, name) => {
    const updated = await projectsApi.updateProject(id, name)
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) })
  },
  deleteProject: async (id) => {
    await projectsApi.deleteProject(id)
    const remaining = get().projects.filter((p) => p.id !== id)

    if (remaining.length === 0) {
      const defaultProject = await projectsApi.createProject('My Board')
      remaining.push(defaultProject)
    }

    const current = get().currentProjectId
    set({
      projects: remaining,
      currentProjectId: current === id ? remaining[0].id : current,
    })
  },
  setCurrentProject: (id) => set({ currentProjectId: id }),
}))
