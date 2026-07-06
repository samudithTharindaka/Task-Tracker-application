import { useEffect } from 'react'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { useProjectsStore } from '@/store/projectsStore'
import { useTasksStore } from '@/store/tasksStore'
import type { Task } from '@/types/task'

// Keyed on whether a token exists (not the token's value) so a silent
// access-token refresh doesn't tear down and reopen the socket — the server
// only checks the token at handshake time, not per event.
export function useRealtimeTasks() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken))

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket()
      return
    }

    const socket = connectSocket()

    function handleUpsert(task: Task) {
      if (task.projectId === useProjectsStore.getState().currentProjectId) {
        useTasksStore.getState().upsertTask(task)
      }
    }

    function handleDelete(task: Task) {
      useTasksStore.getState().removeTask(task.id)
    }

    socket.on('task:created', handleUpsert)
    socket.on('task:updated', handleUpsert)
    socket.on('task:deleted', handleDelete)

    return () => {
      socket.off('task:created', handleUpsert)
      socket.off('task:updated', handleUpsert)
      socket.off('task:deleted', handleDelete)
    }
  }, [isAuthenticated])
}
