import { type ReactNode, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TaskFieldsTable, type TaskFieldsValue } from '@/components/tasks/TaskFieldsTable'
import { useTasksStore } from '@/store/tasksStore'
import { useProjectsStore } from '@/store/projectsStore'
import { useAuthStore } from '@/store/authStore'
import { useTaskExtrasStore } from '@/lib/mock/taskExtrasStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/toast'
import type { TaskStatus } from '@/types/task'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddTaskDialog({ defaultStatus, trigger }: { defaultStatus?: TaskStatus; trigger?: ReactNode }) {
  const createTask = useTasksStore((s) => s.createTask)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const currentUserEmail = useAuthStore((s) => s.user?.email)
  const setLabel = useTaskExtrasStore((s) => s.setLabel)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [fields, setFields] = useState<TaskFieldsValue>({
    label: 'Development',
    status: defaultStatus ?? 'TODO',
    dueDate: todayIsoDate(),
    ownerName: currentUserEmail ?? '',
    projectId: currentProjectId ?? '',
  })

  function reset() {
    setTitle('')
    setDescription('')
    setFields({
      label: 'Development',
      status: defaultStatus ?? 'TODO',
      dueDate: todayIsoDate(),
      ownerName: currentUserEmail ?? '',
      projectId: currentProjectId ?? '',
    })
  }

  async function handleSave() {
    if (!title.trim() || !fields.dueDate || !fields.projectId) return
    setIsSaving(true)
    try {
      const task = await createTask({
        title: title.trim(),
        description: description || null,
        status: fields.status,
        dueDate: fields.dueDate,
        projectId: fields.projectId,
      })
      setLabel(task.id, fields.label)
      notifySuccess('Task created', `"${task.title}" was added`)
      setOpen(false)
      reset()
    } catch (error) {
      notifyError('Could not create task', getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next)
          setFields((f) => ({
            ...f,
            status: defaultStatus ?? f.status,
            projectId: currentProjectId ?? f.projectId,
            ownerName: currentUserEmail ?? f.ownerName,
          }))
        else reset()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="fixed right-8 bottom-8 rounded-full shadow-lg">
            <PlusIcon /> New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of the task"
          className="border-none px-0 text-2xl font-semibold shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add the description here..."
          rows={2}
          className="w-full resize-none border-none text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
        />

        <TaskFieldsTable value={fields} onChange={(patch) => setFields((f) => ({ ...f, ...patch }))} />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!title.trim() || !fields.dueDate || isSaving}>
            <PlusIcon /> {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
