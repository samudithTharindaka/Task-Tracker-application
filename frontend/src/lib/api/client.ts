import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
      { refreshToken },
    )
    useAuthStore.getState().setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    useAuthStore.getState().logout()
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })

      const newAccessToken = await refreshPromise
      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return apiClient(originalRequest)
      }
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message
    if (message) return message
  }
  return fallback
}
