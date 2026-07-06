import { useDraggable } from '@dnd-kit/core'
import { format } from 'date-fns'
import { CalendarIcon, CheckCheckIcon, MessageCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LabelBadge } from '@/components/tasks/LabelBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ownerAvatarColor, ownerDisplayName } from '@/lib/ownerDisplay'
import { useAuthStore } from '@/store/authStore'
import type { Task, TaskExtras } from '@/types/task'

export function TaskCard({
  task,
  extras,
  onClick,
}: {
  task: Task
  extras: TaskExtras
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  const currentUser = useAuthStore((s) => s.user)

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const ownerName = ownerDisplayName(task, currentUser)

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
        <LabelBadge label={task.label} />
        <Avatar className="size-6">
          <AvatarFallback style={{ backgroundColor: ownerAvatarColor(task.ownerId) }} className="text-[10px] text-white">
            {ownerName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageCircleIcon className="size-3.5" />
          {extras.comments.length}
        </span>
        {task.status === 'DONE' ? (
          <span className="flex items-center gap-1 font-medium text-success">
            <CheckCheckIcon className="size-3.5" /> Done
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3.5" /> {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}
