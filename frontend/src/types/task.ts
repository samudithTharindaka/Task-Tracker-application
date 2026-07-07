import { z } from 'zod'

// Real backend statuses (backend/prisma/schema.prisma TaskStatus enum) — also
// used as the board's 4 columns, 1:1.
export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'TEST', 'DONE'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const BOARD_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'Todo' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'TEST', label: 'Test' },
  { id: 'DONE', label: 'Done' },
]

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  createdAt: z.string(),
})
export type Project = z.infer<typeof ProjectSchema>

// Predefined label set (colors per Label,toast and status.png).
export const TaskLabelSchema = z.enum(['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'])
export type TaskLabel = z.infer<typeof TaskLabelSchema>

// Real backend task shape (Task model in backend/prisma/schema.prisma).
// Validated at the API boundary (see lib/api/tasks.ts) so a malformed or
// unexpected backend response fails loudly instead of corrupting the UI.
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  label: TaskLabelSchema,
  dueDate: z.string(),
  ownerId: z.string(),
  // Embedded by the API (tasks.service.js's OWNER_INCLUDE) so the real owner
  // can be displayed even for tasks the viewer doesn't own themselves.
  owner: z.object({ id: z.string(), email: z.string() }),
  projectId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Task = z.infer<typeof TaskSchema>

// --- Still-mocked decoration (backend has no comments/multi-assignee
// concept — only a single real `ownerId` per task) — never comes from a
// real API response, so no schema/validation needed. ---

export interface Comment {
  id: string
  author: string
  avatarColor: string
  body: string
  createdAt: string
}

export const TASK_LABELS: { id: TaskLabel; className: string }[] = [
  { id: 'Development', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  { id: 'QA', className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
  { id: 'UI/UX', className: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300' },
  { id: 'Planing', className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  { id: 'Other', className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  { id: 'Dev Ops', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
]

// Solid status pill colors (per Label,toast and status.png).
export const STATUS_BADGE_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'TODO', className: 'bg-neutral-900 text-white' },
  IN_PROGRESS: { label: 'INPROGRESS', className: 'bg-amber-400 text-neutral-900' },
  TEST: { label: 'TESTING', className: 'bg-sky-500 text-white' },
  DONE: { label: 'DONE', className: 'bg-emerald-500 text-white' },
}

export interface TaskExtras {
  comments: Comment[]
}

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
})
export type Pagination = z.infer<typeof PaginationSchema>
