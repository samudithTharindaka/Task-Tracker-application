import { useDroppable } from '@dnd-kit/core'
import { Loader2Icon, MoreHorizontalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskExtrasStore } from '@/lib/mock/taskExtrasStore'
import type { Pagination, Task, TaskStatus } from '@/types/task'

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  TODO: 'border-foreground',
  IN_PROGRESS: 'border-primary',
  TEST: 'border-warning',
  DONE: 'border-success',
}

export function KanbanColumn({
  id,
  label,
  tasks,
  pagination,
  isLoadingMore,
  onLoadMore,
  onTaskClick,
}: {
  id: TaskStatus
  label: string
  tasks: Task[]
  pagination: Pagination | null
  isLoadingMore: boolean
  onLoadMore: () => void
  onTaskClick: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const getExtras = useTaskExtrasStore((s) => s.getExtras)

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={cn('flex items-center justify-between border-b-2 pb-2', COLUMN_ACCENT[id])}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium">
            {pagination?.totalItems ?? tasks.length}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground" aria-label="Column options">
          <MoreHorizontalIcon className="size-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'mt-4 flex min-h-24 flex-1 flex-col gap-3 rounded-lg transition-colors',
          isOver && 'bg-secondary/60 outline-2 outline-dashed outline-border',
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} extras={getExtras(task.id)} onClick={() => onTaskClick(task)} />
        ))}
      </div>

      {pagination?.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={isLoadingMore}
          onClick={onLoadMore}
        >
          {isLoadingMore ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" /> Loading…
            </>
          ) : (
            `Load more (${pagination.totalItems - tasks.length} left)`
          )}
        </Button>
      )}
    </div>
  )
}
