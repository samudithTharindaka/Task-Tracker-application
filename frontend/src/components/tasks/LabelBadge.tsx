import { cn } from '@/lib/utils'
import { TASK_LABELS, type TaskLabel } from '@/types/task'

export function LabelBadge({ label, className }: { label: TaskLabel; className?: string }) {
  const style = TASK_LABELS.find((l) => l.id === label)

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        style?.className ?? 'bg-secondary text-secondary-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}
