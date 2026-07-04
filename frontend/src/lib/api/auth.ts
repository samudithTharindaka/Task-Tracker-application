import { apiClient } from '@/lib/api/client'
import type { AuthTokens, User } from '@/types/user'

export async function registerRequest(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>('/api/auth/register', { email, password })
  return data.user
}

export async function loginRequest(email: string, password: string): Promise<AuthTokens & { user: User }> {
  const { data } = await apiClient.post<AuthTokens & { user: User }>('/api/auth/login', { email, password })
  return data
}
