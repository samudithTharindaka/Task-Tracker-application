import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

let socket: Socket | null = null

// `auth` as a function (not a plain object) so it's re-evaluated on every
// (re)connection attempt, reading whatever access token is current at that
// moment rather than the one captured when connectSocket() was first called.
export function connectSocket(): Socket {
  if (socket) return socket

  socket = io(import.meta.env.VITE_API_URL, {
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
