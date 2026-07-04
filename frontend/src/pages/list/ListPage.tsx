import { useMemo, useState } from 'react'
import { ChevronDownIcon, ClockIcon, InfoIcon, Trash2Icon, UserIcon } from 'lucide-react'
import { BoardPageHeader } from '@/components/tasks/BoardPageHeader'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { StatusDot } from '@/components/tasks/StatusBadge'
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
import { useTasksStore } from '@/lib/mock/tasksStore'
import type { Assignee } from '@/types/task'

const PAGE_SIZE = 8
const STATUS_OPTIONS: Assignee['status'][] = ['Active', 'Offline', 'Wait']

export function ListPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Assignee['status'] | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  const authors = useMemo(() => Array.from(new Set(tasks.map((t) => t.assignee.name))), [tasks])

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!statusFilter || t.assignee.status === statusFilter) &&
          (!authorFilter || t.assignee.name === authorFilter),
      ),
    [tasks, statusFilter, authorFilter],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === paged.length ? new Set() : new Set(paged.map((t) => t.id))))
  }

  return (
    <div className="p-6">
      <BoardPageHeader crumb="Board" />

      <div className="mb-4 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <UserIcon /> {authorFilter ?? 'Author'} <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setAuthorFilter(null)}>All authors</DropdownMenuItem>
            {authors.map((a) => (
              <DropdownMenuItem key={a} onClick={() => setAuthorFilter(a)}>
                {a}
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
              <UserIcon /> {statusFilter ?? 'Status'} <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>All statuses</DropdownMenuItem>
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                {s}
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
                <Checkbox checked={selected.size > 0 && selected.size === paged.length} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((task) => (
              <TableRow key={task.id} className="cursor-pointer" onClick={() => setActiveTaskId(task.id)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(task.id)} onCheckedChange={() => toggleSelected(task.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback style={{ backgroundColor: task.assignee.avatarColor }} className="text-white">
                        {task.assignee.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{task.assignee.name}</p>
                      <p className="text-xs text-muted-foreground">{task.assignee.handle}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={task.assignee.status} />
                    {task.assignee.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.assignee.email}</TableCell>
                <TableCell className="text-muted-foreground">{task.dueDate ?? '—'}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setActiveTaskId(task.id)} aria-label="View task">
                      <InfoIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center gap-1">
        {Array.from({ length: pageCount }).map((_, i) => (
          <Button
            key={i}
            size="sm"
            variant={page === i + 1 ? 'default' : 'outline'}
            onClick={() => setPage(i + 1)}
          >
            {String(i + 1).padStart(2, '0')}
          </Button>
        ))}
      </div>

      <AddTaskDialog />
      <TaskDetailSheet task={activeTask} onClose={() => setActiveTaskId(null)} />
    </div>
  )
}
