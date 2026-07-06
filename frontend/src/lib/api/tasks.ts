import { apiClient } from '@/lib/api/client'
import type { Task, TaskLabel, TaskStatus } from '@/types/task'

export interface CreateTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  label?: TaskLabel
  dueDate: string
  projectId: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  label?: TaskLabel
  dueDate?: string
  projectId?: string
}

export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const { data } = await apiClient.get<{ value: Task[] }>('/api/tasks', {
    params: { $filter: `projectId eq '${projectId}'`, $top: 100 },
  })
  return data.value
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await apiClient.post<Task>('/api/tasks', input)
  return data
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  const { data } = await apiClient.put<Task>(`/api/tasks/${id}`, patch)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`)
}
