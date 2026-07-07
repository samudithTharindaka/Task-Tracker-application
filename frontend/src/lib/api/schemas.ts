// Response-envelope schemas for the API boundary — validated in lib/api/*.ts
// so a malformed or unexpected backend response fails loudly (a clear
// ZodError) instead of silently propagating bad data into the UI/store.
import { z } from 'zod'
import { PaginationSchema, ProjectSchema, TaskSchema } from '@/types/task'
import { AuthTokensSchema, UserSchema } from '@/types/user'

export const TaskListResponseSchema = z.object({
  value: z.array(TaskSchema),
  pagination: PaginationSchema,
})

export const ProjectListResponseSchema = z.object({
  value: z.array(ProjectSchema),
  pagination: PaginationSchema,
})

export const RegisterResponseSchema = z.object({ user: UserSchema })

export const LoginResponseSchema = AuthTokensSchema.extend({ user: UserSchema })

export const RefreshResponseSchema = z.object({ accessToken: z.string() })

export const PendingDeleteSchema = z.object({ taskId: z.string(), title: z.string() })

export const ChatResponseSchema = z.object({
  reply: z.string(),
  pendingDelete: PendingDeleteSchema.nullish(),
  mutated: z.boolean(),
})
