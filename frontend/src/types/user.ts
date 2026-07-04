export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
