import { cn } from '@/lib/utils'
import { STATUS_BADGE_STYLES, type TaskStatus } from '@/types/task'

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const style = STATUS_BADGE_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  )
}
