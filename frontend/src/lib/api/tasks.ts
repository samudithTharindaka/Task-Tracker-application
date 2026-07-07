import { apiClient } from '@/lib/api/client'
import type { Pagination, Task, TaskLabel, TaskStatus } from '@/types/task'

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
    params: { $filter: `projectId eq '${projectId}'`, limit: 100 },
  })
  return data.value
}

export interface ListTasksPageParams {
  page: number
  limit: number
  status?: TaskStatus
  label?: TaskLabel
}

export async function listTasksPage(
  projectId: string,
  { page, limit, status, label }: ListTasksPageParams,
): Promise<{ tasks: Task[]; pagination: Pagination }> {
  const clauses = [`projectId eq '${projectId}'`]
  if (status) clauses.push(`status eq '${status}'`)
  if (label) clauses.push(`label eq '${label}'`)

  const { data } = await apiClient.get<{ value: Task[]; pagination: Pagination }>('/api/tasks', {
    params: { $filter: clauses.join(' and '), page, limit },
  })
  return { tasks: data.value, pagination: data.pagination }
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
