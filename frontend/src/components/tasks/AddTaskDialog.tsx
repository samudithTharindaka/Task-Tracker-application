import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TaskFieldsTable, type TaskFieldsValue } from '@/components/tasks/TaskFieldsTable'
import { useTasksStore } from '@/lib/mock/tasksStore'
import type { BoardColumn } from '@/types/task'

const EMPTY_FIELDS: TaskFieldsValue = {
  label: '',
  column: 'TODO',
  dueDate: '',
  owner: '',
  project: 'Ongoing board',
}

export function AddTaskDialog({ defaultColumn }: { defaultColumn?: BoardColumn }) {
  const addTask = useTasksStore((s) => s.addTask)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<TaskFieldsValue>({
    ...EMPTY_FIELDS,
    column: defaultColumn ?? 'TODO',
  })

  function reset() {
    setTitle('')
    setDescription('')
    setFields({ ...EMPTY_FIELDS, column: defaultColumn ?? 'TODO' })
  }

  function handleSave() {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      description,
      label: fields.label || 'General',
      project: fields.project,
      column: fields.column,
      dueDate: fields.dueDate || null,
      assignee: {
        name: fields.owner || 'Unassigned',
        handle: '',
        email: '',
        status: 'Active',
        avatarColor: '#2f4fd4',
      },
    })
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="fixed right-8 bottom-8 rounded-full shadow-lg">
          <PlusIcon /> New Task
        </Button>
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
          <Button onClick={handleSave} disabled={!title.trim()}>
            <PlusIcon /> Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
