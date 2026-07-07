import { z } from 'zod'

export const RoleSchema = z.enum(['USER', 'ADMIN'])
export type Role = z.infer<typeof RoleSchema>

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: RoleSchema,
  createdAt: z.string(),
})
export type User = z.infer<typeof UserSchema>

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})
export type AuthTokens = z.infer<typeof AuthTokensSchema>
