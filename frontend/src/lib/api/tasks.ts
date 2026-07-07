import { apiClient } from '@/lib/api/client'
import { TaskListResponseSchema } from '@/lib/api/schemas'
import { TaskSchema, type Pagination, type Task, type TaskLabel, type TaskStatus } from '@/types/task'

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
  const { data } = await apiClient.get('/api/tasks', {
    params: { $filter: `projectId eq '${projectId}'`, limit: 100 },
  })
  return TaskListResponseSchema.parse(data).value
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

  const { data } = await apiClient.get('/api/tasks', {
    params: { $filter: clauses.join(' and '), page, limit },
  })
  const parsed = TaskListResponseSchema.parse(data)
  return { tasks: parsed.value, pagination: parsed.pagination }
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await apiClient.post('/api/tasks', input)
  return TaskSchema.parse(data)
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  const { data } = await apiClient.put(`/api/tasks/${id}`, patch)
  return TaskSchema.parse(data)
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`)
}
