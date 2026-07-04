import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assignee, BoardColumn, Comment, MockTask } from '@/types/task'

const ASSIGNEES: Assignee[] = [
  { name: 'Jane Cooper', handle: '@jane', email: 'jessica.hanson@example.com', status: 'Active', avatarColor: '#7c3aed' },
  { name: 'Wade Warren', handle: '@wade456', email: 'willie.jennings@example.com', status: 'Active', avatarColor: '#0f172a' },
  { name: 'Esther Howard', handle: '@esther', email: 'd.chambers@example.com', status: 'Offline', avatarColor: '#7c3aed' },
  { name: 'Jenny Wilson', handle: '@jenny', email: 'willie.jennings@example.com', status: 'Offline', avatarColor: '#7c3aed' },
  { name: 'Guy Hawkins', handle: '@guy', email: 'michael.mitc@example.com', status: 'Wait', avatarColor: '#f59e0b' },
  { name: 'Jacob Jones', handle: '@jacob', email: 'michael.mitc@example.com', status: 'Offline', avatarColor: '#0f172a' },
  { name: 'Ronald Richards', handle: '@ronald', email: 'deanna.curtis@example.com', status: 'Active', avatarColor: '#7c3aed' },
  { name: 'Devon Lane', handle: '@devon', email: 'alma.lawson@example.com', status: 'Wait', avatarColor: '#7c3aed' },
]

function makeComments(count: number): Comment[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `c-${i}-${Math.random().toString(36).slice(2, 8)}`,
    author: ASSIGNEES[i % ASSIGNEES.length].name,
    avatarColor: ASSIGNEES[i % ASSIGNEES.length].avatarColor,
    body: 'This is the task description which will help user to identify the task',
    createdAt: new Date().toISOString(),
  }))
}

const SEED_TASKS: MockTask[] = [
  { id: 't-1', title: 'Teams Configuration', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'TODO', dueDate: null, assignee: ASSIGNEES[0], comments: makeComments(8) },
  { id: 't-2', title: 'Design onboarding flow', description: 'This is the task description which will help user to identify the task', label: 'Design', project: 'Ongoing board', column: 'TODO', dueDate: 'Tomorrow', assignee: ASSIGNEES[1], comments: makeComments(3) },
  { id: 't-3', title: 'Teams Configuration', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'IN_WORK', dueDate: 'Tomorrow', assignee: ASSIGNEES[2], comments: makeComments(8) },
  { id: 't-4', title: 'API rate limiting', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'IN_WORK', dueDate: 'Tomorrow', assignee: ASSIGNEES[3], comments: makeComments(2) },
  { id: 't-5', title: 'Update landing page copy', description: 'This is the task description which will help user to identify the task', label: 'Marketing', project: 'Ongoing board', column: 'IN_WORK', dueDate: null, assignee: ASSIGNEES[4], comments: makeComments(1) },
  { id: 't-6', title: 'Fix Safari layout bug', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'IN_WORK', dueDate: 'Tomorrow', assignee: ASSIGNEES[5], comments: makeComments(4) },
  { id: 't-7', title: 'Teams Configuration', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[6], comments: makeComments(8) },
  { id: 't-8', title: 'Regression test suite', description: 'This is the task description which will help user to identify the task', label: 'QA', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[7], comments: makeComments(5) },
  { id: 't-9', title: 'Accessibility audit', description: 'This is the task description which will help user to identify the task', label: 'QA', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[0], comments: makeComments(2) },
  { id: 't-10', title: 'Cross-browser check', description: 'This is the task description which will help user to identify the task', label: 'QA', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[1], comments: [] },
  { id: 't-11', title: 'Load testing', description: 'This is the task description which will help user to identify the task', label: 'QA', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[2], comments: [] },
  { id: 't-12', title: 'Security review', description: 'This is the task description which will help user to identify the task', label: 'QA', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[3], comments: [] },
  { id: 't-13', title: 'API docs review', description: 'This is the task description which will help user to identify the task', label: 'Documentation', project: 'Ongoing board', column: 'QA', dueDate: null, assignee: ASSIGNEES[4], comments: [] },
  { id: 't-14', title: 'Teams Configuration', description: 'This is the task description which will help user to identify the task', label: 'Development', project: 'Ongoing board', column: 'COMPLETED', dueDate: 'Done', assignee: ASSIGNEES[5], comments: makeComments(8) },
  { id: 't-15', title: 'Set up CI pipeline', description: 'This is the task description which will help user to identify the task', label: 'DevOps', project: 'Ongoing board', column: 'COMPLETED', dueDate: 'Done', assignee: ASSIGNEES[6], comments: makeComments(6) },
  { id: 't-16', title: 'Write release notes', description: 'This is the task description which will help user to identify the task', label: 'Documentation', project: 'Ongoing board', column: 'COMPLETED', dueDate: 'Done', assignee: ASSIGNEES[7], comments: makeComments(1) },
]

interface TasksState {
  tasks: MockTask[]
  moveTask: (id: string, column: BoardColumn) => void
  addTask: (task: Omit<MockTask, 'id' | 'comments'>) => void
  updateTask: (id: string, patch: Partial<Omit<MockTask, 'id' | 'comments'>>) => void
  deleteTask: (id: string) => void
  addComment: (taskId: string, body: string, author: string) => void
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: SEED_TASKS,
      moveTask: (id, column) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, column } : t)),
        })),
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: `t-${Date.now()}`, comments: [] }],
        })),
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      addComment: (taskId, body, author) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: [
                    ...t.comments,
                    {
                      id: `c-${Date.now()}`,
                      author,
                      avatarColor: '#2f4fd4',
                      body,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : t,
          ),
        })),
    }),
    { name: 'newnop-mock-tasks' },
  ),
)
