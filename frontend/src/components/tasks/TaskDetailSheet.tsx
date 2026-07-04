import { useEffect, useState } from 'react'
import { PencilIcon, SendIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskFieldsTable, type TaskFieldsValue } from '@/components/tasks/TaskFieldsTable'
import { useTasksStore } from '@/lib/mock/tasksStore'
import { useAuthStore } from '@/store/authStore'
import type { MockTask } from '@/types/task'

export function TaskDetailSheet({ task, onClose }: { task: MockTask | null; onClose: () => void }) {
  const updateTask = useTasksStore((s) => s.updateTask)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const addComment = useTasksStore((s) => s.addComment)
  const currentUserEmail = useAuthStore((s) => s.user?.email)

  const [description, setDescription] = useState(task?.description ?? '')
  const [comment, setComment] = useState('')

  useEffect(() => {
    setDescription(task?.description ?? '')
    setComment('')
  }, [task?.id, task?.description])

  if (!task) return null

  const fields: TaskFieldsValue = {
    label: task.label,
    column: task.column,
    dueDate: task.dueDate ?? '',
    owner: task.assignee.name,
    project: task.project,
  }

  function handleFieldsChange(patch: Partial<TaskFieldsValue>) {
    if (!task) return
    updateTask(task.id, {
      label: patch.label ?? task.label,
      column: patch.column ?? task.column,
      dueDate: patch.dueDate ?? task.dueDate,
      project: patch.project ?? task.project,
      assignee: patch.owner ? { ...task.assignee, name: patch.owner } : task.assignee,
    })
  }

  function handleDelete() {
    if (!task) return
    deleteTask(task.id)
    onClose()
  }

  function handleAddComment() {
    if (!task || !comment.trim()) return
    addComment(task.id, comment.trim(), currentUserEmail ?? 'You')
    setComment('')
  }

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="pb-2">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-2xl">{task.title}</SheetTitle>
            <div className="mr-8 flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Edit task">
                <PencilIcon className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete task">
                <Trash2Icon className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <div>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => updateTask(task.id, { description })}
              rows={2}
              className="w-full resize-none border-none text-sm outline-none"
            />
          </div>

          <TaskFieldsTable value={fields} onChange={handleFieldsChange} />

          <div>
            <h4 className="mb-3 text-sm font-semibold">Comments</h4>
            <div className="space-y-4">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback style={{ backgroundColor: c.avatarColor }} className="text-xs text-white">
                      {c.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm">
                    <p className="font-medium">{c.author}</p>
                    <p className="text-muted-foreground">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {(currentUserEmail ?? 'You').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg bg-secondary p-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comment here"
                  rows={2}
                  className="w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddComment} disabled={!comment.trim()}>
                    Save <SendIcon />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
