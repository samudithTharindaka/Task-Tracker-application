import { apiClient } from '@/lib/api/client'
import { LoginResponseSchema, RegisterResponseSchema } from '@/lib/api/schemas'
import type { AuthTokens, User } from '@/types/user'

export async function registerRequest(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post('/api/auth/register', { email, password })
  return RegisterResponseSchema.parse(data).user
}

export async function loginRequest(email: string, password: string): Promise<AuthTokens & { user: User }> {
  const { data } = await apiClient.post('/api/auth/login', { email, password })
  return LoginResponseSchema.parse(data)
}
