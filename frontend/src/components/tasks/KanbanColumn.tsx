import { useDroppable } from '@dnd-kit/core'
import { MoreHorizontalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from '@/components/tasks/TaskCard'
import type { BoardColumn, MockTask } from '@/types/task'

const COLUMN_ACCENT: Record<BoardColumn, string> = {
  TODO: 'border-foreground',
  IN_WORK: 'border-primary',
  QA: 'border-warning',
  COMPLETED: 'border-success',
}

export function KanbanColumn({
  id,
  label,
  tasks,
  onTaskClick,
}: {
  id: BoardColumn
  label: string
  tasks: MockTask[]
  onTaskClick: (task: MockTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={cn('flex items-center justify-between border-b-2 pb-2', COLUMN_ACCENT[id])}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium">
            {tasks.length}
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
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  )
}
