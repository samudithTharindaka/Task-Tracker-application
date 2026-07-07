import { apiClient } from '@/lib/api/client'
import { ProjectListResponseSchema } from '@/lib/api/schemas'
import { ProjectSchema, type Project } from '@/types/task'

export async function listProjects(): Promise<Project[]> {
  // The endpoint now paginates (default page size 20) — pass a generous
  // limit explicitly so the sidebar's project list isn't silently truncated
  // for a user with more than the default page size.
  const { data } = await apiClient.get('/api/projects', { params: { limit: 100 } })
  return ProjectListResponseSchema.parse(data).value
}

export async function createProject(name: string): Promise<Project> {
  const { data } = await apiClient.post('/api/projects', { name })
  return ProjectSchema.parse(data)
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const { data } = await apiClient.put(`/api/projects/${id}`, { name })
  return ProjectSchema.parse(data)
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`)
}
