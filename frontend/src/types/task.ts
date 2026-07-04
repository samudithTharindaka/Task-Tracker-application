// Real backend task shape (Task model in backend/prisma/schema.prisma)
export type BackendTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'

export interface BackendTask {
  id: string
  title: string
  description: string | null
  status: BackendTaskStatus
  dueDate: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

// Board columns as shown in the design — richer than the backend's 3 statuses.
// Powered by the mock task store; not persisted to the real API.
export type BoardColumn = 'TODO' | 'IN_WORK' | 'QA' | 'COMPLETED'

export const BOARD_COLUMNS: { id: BoardColumn; label: string }[] = [
  { id: 'TODO', label: 'Todo' },
  { id: 'IN_WORK', label: 'In work' },
  { id: 'QA', label: 'QA' },
  { id: 'COMPLETED', label: 'Completed' },
]

export interface Comment {
  id: string
  author: string
  avatarColor: string
  body: string
  createdAt: string
}

export interface Assignee {
  name: string
  handle: string
  email: string
  status: 'Active' | 'Offline' | 'Wait'
  avatarColor: string
  avatarUrl?: string
}

export interface MockTask {
  id: string
  title: string
  description: string
  label: string
  project: string
  column: BoardColumn
  dueDate: string | null
  assignee: Assignee
  comments: Comment[]
}
