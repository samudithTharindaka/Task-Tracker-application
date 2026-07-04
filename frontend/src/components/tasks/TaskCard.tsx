import { useDraggable } from '@dnd-kit/core'
import { CalendarIcon, CheckCheckIcon, MessageCircleIcon, ThumbsUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { MockTask } from '@/types/task'

export function TaskCard({ task, onClick }: { task: MockTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <h3 className="text-sm font-semibold">{task.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {task.label}
        </Badge>
        <Avatar className="size-6">
          <AvatarFallback style={{ backgroundColor: task.assignee.avatarColor }} className="text-[10px] text-white">
            {task.assignee.name
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageCircleIcon className="size-3.5" />
          {task.comments.length}
        </span>
        {task.dueDate === 'Done' ? (
          <span className="flex items-center gap-1 font-medium text-success">
            <CheckCheckIcon className="size-3.5" /> Done
          </span>
        ) : task.dueDate ? (
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3.5" /> {task.dueDate}
          </span>
        ) : task.column === 'QA' ? (
          <ThumbsUpIcon className="size-3.5" />
        ) : null}
      </div>
    </div>
  )
}
