import { useMemo } from 'react'
import { BoardPageHeader } from '@/components/tasks/BoardPageHeader'
import { useTasksStore } from '@/lib/mock/tasksStore'
import { cn } from '@/lib/utils'

export function CalendarPage() {
  const tasks = useTasksStore((s) => s.tasks)

  const today = new Date()
  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOffset = firstOfMonth.getDay()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    return Array.from({ length: startOffset + daysInMonth }, (_, i) => {
      const day = i - startOffset + 1
      return day > 0 ? day : null
    })
  }, [today])

  const dueTodayCount = tasks.filter((t) => t.dueDate === 'Tomorrow').length

  return (
    <div className="p-6">
      <BoardPageHeader crumb="Calendar" />

      <div className="rounded-lg border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <p className="text-sm text-muted-foreground">{dueTodayCount} tasks due tomorrow</p>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg text-sm',
                day === today.getDate() ? 'bg-primary text-primary-foreground' : day ? 'bg-secondary/50' : '',
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Calendar view is a placeholder — no calendar design was provided and the backend has no scheduling data yet.
      </p>
    </div>
  )
}
