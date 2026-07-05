import { apiClient } from '@/lib/api/client'
import type { Project } from '@/types/task'

export async function listProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<{ value: Project[] }>('/api/projects')
  return data.value
}

export async function createProject(name: string): Promise<Project> {
  const { data } = await apiClient.post<Project>('/api/projects', { name })
  return data
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const { data } = await apiClient.put<Project>(`/api/projects/${id}`, { name })
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`)
}
