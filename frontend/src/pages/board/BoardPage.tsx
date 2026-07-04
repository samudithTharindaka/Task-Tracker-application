import { useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { BoardPageHeader } from '@/components/tasks/BoardPageHeader'
import { KanbanColumn } from '@/components/tasks/KanbanColumn'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { useTasksStore } from '@/lib/mock/tasksStore'
import { BOARD_COLUMNS, type BoardColumn } from '@/types/task'

export function BoardPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const moveTask = useTasksStore((s) => s.moveTask)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    moveTask(String(active.id), over.id as BoardColumn)
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
              tasks={tasks.filter((t) => t.column === id)}
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
