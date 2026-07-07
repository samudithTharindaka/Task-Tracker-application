import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ChevronDownIcon, ClockIcon, InfoIcon, TagIcon, Trash2Icon } from 'lucide-react'
import { BoardPageHeader } from '@/components/tasks/BoardPageHeader'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { LabelBadge } from '@/components/tasks/LabelBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as tasksApi from '@/lib/api/tasks'
import { useTasksStore } from '@/store/tasksStore'
import { useProjectsStore } from '@/store/projectsStore'
import { useAuthStore } from '@/store/authStore'
import { useTaskExtrasStore } from '@/lib/mock/taskExtrasStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { ownerAvatarColor, ownerDisplayName } from '@/lib/ownerDisplay'
import { confirmAction, notifyError, notifySuccess } from '@/lib/toast'
import { BOARD_COLUMNS, TASK_LABELS, type Pagination, type Task, type TaskLabel, type TaskStatus } from '@/types/task'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function ListPage() {
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const revision = useTasksStore((s) => s.revision)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const currentUser = useAuthStore((s) => s.user)
  const removeExtras = useTaskExtrasStore((s) => s.removeExtras)

  const [tasks, setTasks] = useState<Task[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const [labelFilter, setLabelFilter] = useState<TaskLabel | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE_OPTIONS[0])

  const latestRequestId = useRef(0)

  useEffect(() => {
    if (!currentProjectId) return
    const requestId = ++latestRequestId.current
    setIsLoading(true)
    tasksApi
      .listTasksPage(currentProjectId, { page, limit, status: statusFilter ?? undefined, label: labelFilter ?? undefined })
      .then(({ tasks, pagination }) => {
        if (requestId !== latestRequestId.current) return
        setTasks(tasks)
        setPagination(pagination)
        setIsLoading(false)
      })
      .catch((error) => {
        if (requestId !== latestRequestId.current) return
        notifyError('Could not load tasks', getApiErrorMessage(error))
        setIsLoading(false)
      })
  }, [currentProjectId, page, limit, statusFilter, labelFilter, revision])

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id))))
  }

  function handleDelete(id: string, title: string) {
    confirmAction({
      description: `Delete "${title}"? This can't be undone.`,
      onConfirm: async () => {
        try {
          await deleteTask(id)
          removeExtras(id)
          notifySuccess('Task deleted')
        } catch (error) {
          notifyError('Could not delete task', getApiErrorMessage(error))
        }
      },
    })
  }

  return (
    <div className="p-6">
      <BoardPageHeader crumb="Board" />

      <div className="mb-4 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <TagIcon /> {labelFilter ?? 'Label'} <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setLabelFilter(null)
                setPage(1)
              }}
            >
              All labels
            </DropdownMenuItem>
            {TASK_LABELS.map((l) => (
              <DropdownMenuItem
                key={l.id}
                onClick={() => {
                  setLabelFilter(l.id)
                  setPage(1)
                }}
              >
                {l.id}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" className="rounded-full" disabled>
          <ClockIcon /> Due date <ChevronDownIcon className="size-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              {statusFilter ? BOARD_COLUMNS.find((c) => c.id === statusFilter)?.label : 'Status'}{' '}
              <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setStatusFilter(null)
                setPage(1)
              }}
            >
              All statuses
            </DropdownMenuItem>
            {BOARD_COLUMNS.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => {
                  setStatusFilter(c.id)
                  setPage(1)
                }}
              >
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto rounded-full">
              {limit} / page <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => {
                  setLimit(size)
                  setPage(1)
                }}
              >
                {size} / page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={selected.size > 0 && selected.size === tasks.length} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No tasks match these filters.
                </TableCell>
              </TableRow>
            )}
            {tasks.map((task) => {
              const ownerName = ownerDisplayName(task, currentUser)
              return (
                <TableRow key={task.id} className="cursor-pointer" onClick={() => setActiveTaskId(task.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(task.id)} onCheckedChange={() => toggleSelected(task.id)} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{task.description || 'No description'}</p>
                  </TableCell>
                  <TableCell>
                    <LabelBadge label={task.label} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback
                          style={{ backgroundColor: ownerAvatarColor(task.ownerId) }}
                          className="text-xs text-white"
                        >
                          {ownerName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-muted-foreground">{ownerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(task.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setActiveTaskId(task.id)} aria-label="View task">
                        <InfoIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id, task.title)} aria-label="Delete task">
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <Button size="sm" variant="outline" disabled={!pagination.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={pagination.page === i + 1 ? 'default' : 'outline'}
              onClick={() => setPage(i + 1)}
            >
              {String(i + 1).padStart(2, '0')}
            </Button>
          ))}
          <Button size="sm" variant="outline" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <AddTaskDialog />
      <TaskDetailSheet task={activeTask} onClose={() => setActiveTaskId(null)} />
    </div>
  )
}
