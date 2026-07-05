import { useEffect, useState } from 'react'
import { PencilIcon, SendIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskFieldsTable, type TaskFieldsValue } from '@/components/tasks/TaskFieldsTable'
import { useTasksStore } from '@/store/tasksStore'
import { useTaskExtrasStore } from '@/lib/mock/taskExtrasStore'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { confirmAction, notifyError, notifySuccess } from '@/lib/toast'
import type { Task } from '@/types/task'

export function TaskDetailSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const updateTask = useTasksStore((s) => s.updateTask)
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const extras = useTaskExtrasStore((s) => (task ? s.getExtras(task.id) : null))
  const setLabel = useTaskExtrasStore((s) => s.setLabel)
  const addComment = useTaskExtrasStore((s) => s.addComment)
  const removeExtras = useTaskExtrasStore((s) => s.removeExtras)
  const currentUser = useAuthStore((s) => s.user)
  const currentUserEmail = currentUser?.email

  const [description, setDescription] = useState(task?.description ?? '')
  const [comment, setComment] = useState('')

  useEffect(() => {
    setDescription(task?.description ?? '')
    setComment('')
  }, [task?.id, task?.description])

  if (!task || !extras) return null

  // The backend always sets ownerId to whoever created the task and never
  // lets it change (updateTaskSchema has no ownerId field) — and USER-role
  // task listings are always server-scoped to the caller's own tasks, so a
  // visible task's owner is the current user unless we're an admin looking
  // at someone else's (rare; falls back to the decorative mock identity).
  const ownerName = task.ownerId === currentUser?.id ? (currentUserEmail ?? 'You') : extras.assignee.name

  const fields: TaskFieldsValue = {
    label: extras.label,
    status: task.status,
    dueDate: task.dueDate.slice(0, 10),
    ownerName,
    projectId: task.projectId,
  }

  async function handleFieldsChange(patch: Partial<TaskFieldsValue>) {
    if (!task) return
    if (patch.label !== undefined) {
      setLabel(task.id, patch.label)
      notifySuccess('Label updated', `Set to ${patch.label}`)
    }

    const realPatch: { status?: Task['status']; dueDate?: string; projectId?: string } = {}
    if (patch.status !== undefined) realPatch.status = patch.status
    if (patch.dueDate !== undefined) realPatch.dueDate = patch.dueDate
    if (patch.projectId !== undefined) realPatch.projectId = patch.projectId

    if (Object.keys(realPatch).length > 0) {
      try {
        await updateTask(task.id, realPatch)
        notifySuccess('Task updated')
      } catch (error) {
        notifyError('Could not update task', getApiErrorMessage(error))
      }
    }
  }

  function handleDelete() {
    if (!task) return
    confirmAction({
      description: `Delete "${task.title}"? This can't be undone.`,
      onConfirm: async () => {
        try {
          await deleteTask(task.id)
          removeExtras(task.id)
          notifySuccess('Task deleted')
          onClose()
        } catch (error) {
          notifyError('Could not delete task', getApiErrorMessage(error))
        }
      },
    })
  }

  async function handleDescriptionBlur() {
    if (!task || description === task.description) return
    try {
      await updateTask(task.id, { description })
      notifySuccess('Description updated')
    } catch (error) {
      notifyError('Could not update description', getApiErrorMessage(error))
    }
  }

  function handleAddComment() {
    if (!task || !comment.trim()) return
    addComment(task.id, comment.trim(), currentUserEmail ?? 'You')
    notifySuccess('Comment added')
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
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={2}
              className="w-full resize-none border-none text-sm outline-none"
            />
          </div>

          <TaskFieldsTable value={fields} onChange={handleFieldsChange} />

          <div>
            <h4 className="mb-3 text-sm font-semibold">Comments</h4>
            <div className="space-y-4">
              {extras.comments.map((c) => (
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
