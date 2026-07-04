import { cn } from '@/lib/utils'
import type { Assignee } from '@/types/task'

const STATUS_STYLES: Record<Assignee['status'], string> = {
  Active: 'bg-success',
  Offline: 'bg-muted-foreground',
  Wait: 'bg-warning',
}

export function StatusDot({ status, className }: { status: Assignee['status']; className?: string }) {
  return <span className={cn('inline-block size-2 rounded-full', STATUS_STYLES[status], className)} />
}
