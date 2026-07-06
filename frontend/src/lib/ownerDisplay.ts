import type { Task } from '@/types/task'
import type { User } from '@/types/user'

const AVATAR_COLORS = ['#7c3aed', '#0f172a', '#f59e0b', '#2f4fd4', '#0d9488', '#be185d']

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

// A task's owner is always real now (embedded by the API — see
// tasks.service.js's OWNER_INCLUDE) — no more falling back to decorative
// mock identities for tasks the viewer doesn't own themselves.
export function ownerDisplayName(task: Task, currentUser: User | null): string {
  return task.ownerId === currentUser?.id ? (currentUser?.email ?? 'You') : task.owner.email
}

export function ownerAvatarColor(ownerId: string): string {
  return AVATAR_COLORS[hashString(ownerId) % AVATAR_COLORS.length]
}
