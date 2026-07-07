import { useEffect, useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { BoardPageHeader } from '@/components/tasks/BoardPageHeader'
import { KanbanColumn } from '@/components/tasks/KanbanColumn'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { useTasksStore } from '@/store/tasksStore'
import { useProjectsStore } from '@/store/projectsStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/toast'
import { BOARD_COLUMNS, type TaskStatus } from '@/types/task'

export function BoardPage() {
  const columns = useTasksStore((s) => s.columns)
  const moveTask = useTasksStore((s) => s.moveTask)
  const fetchColumn = useTasksStore((s) => s.fetchColumn)
  const loadMoreColumn = useTasksStore((s) => s.loadMoreColumn)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const allTasks = Object.values(columns).flatMap((c) => c.tasks)
  const activeTask = allTasks.find((t) => t.id === activeTaskId) ?? null

  useEffect(() => {
    if (!currentProjectId) return
    BOARD_COLUMNS.forEach(({ id }) => {
      fetchColumn(currentProjectId, id).catch((error) => notifyError('Could not load tasks', getApiErrorMessage(error)))
    })
  }, [currentProjectId, fetchColumn])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const status = over.id as TaskStatus
    const task = allTasks.find((t) => t.id === active.id)
    if (!task || task.status === status) return

    moveTask(task.id, status)
      .then(() => notifySuccess('Task moved', `Moved to ${BOARD_COLUMNS.find((c) => c.id === status)?.label}`))
      .catch((error) => notifyError('Could not move task', getApiErrorMessage(error)))
  }

  return (
    <div className="p-6">
      <BoardPageHeader crumb="Board" />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {BOARD_COLUMNS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              id={id}
              label={label}
              tasks={columns[id].tasks}
              pagination={columns[id].pagination}
              isLoadingMore={columns[id].isLoadingMore}
              onLoadMore={() => {
                if (currentProjectId) {
                  loadMoreColumn(currentProjectId, id).catch((error) =>
                    notifyError('Could not load more tasks', getApiErrorMessage(error)),
                  )
                }
              }}
              onTaskClick={(task) => setActiveTaskId(task.id)}
            />
          ))}
        </div>
      </DndContext>

      <AddTaskDialog />
      <TaskDetailSheet task={activeTask} onClose={() => setActiveTaskId(null)} />
    </div>
  )
}
