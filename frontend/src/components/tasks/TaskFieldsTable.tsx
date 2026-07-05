import type { ReactNode } from 'react'
import { BookmarkIcon, CalendarIcon, FileTextIcon, PackageIcon, UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LabelBadge } from '@/components/tasks/LabelBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { useProjectsStore } from '@/store/projectsStore'
import { BOARD_COLUMNS, TASK_LABELS, type TaskLabel, type TaskStatus } from '@/types/task'

export interface TaskFieldsValue {
  label: TaskLabel
  status: TaskStatus
  dueDate: string
  ownerName: string
  projectId: string
}

const ROW_ICON_CLASS = 'size-4 text-muted-foreground'

export function TaskFieldsTable({
  value,
  onChange,
}: {
  value: TaskFieldsValue
  onChange: (patch: Partial<TaskFieldsValue>) => void
}) {
  const projects = useProjectsStore((s) => s.projects)

  return (
    <div className="divide-y rounded-lg border">
      <Row icon={<BookmarkIcon className={ROW_ICON_CLASS} />} label="Label">
        <Select value={value.label} onValueChange={(label) => onChange({ label: label as TaskLabel })}>
          <SelectTrigger className="h-8 w-full border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_LABELS.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                <LabelBadge label={l.id} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row icon={<PackageIcon className={ROW_ICON_CLASS} />} label="Status">
        <Select value={value.status} onValueChange={(status) => onChange({ status: status as TaskStatus })}>
          <SelectTrigger className="h-8 w-full border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOARD_COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <StatusBadge status={c.id} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row icon={<CalendarIcon className={ROW_ICON_CLASS} />} label="Due date">
        <Input
          type="date"
          value={value.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          className="h-8 border-none shadow-none focus-visible:ring-0"
        />
      </Row>
      <Row icon={<UserIcon className={ROW_ICON_CLASS} />} label="Owner">
        <Input
          value={value.ownerName}
          disabled
          className="h-8 border-none shadow-none focus-visible:ring-0 disabled:opacity-100"
        />
      </Row>
      <Row icon={<FileTextIcon className={ROW_ICON_CLASS} />} label="Project">
        <Select value={value.projectId} onValueChange={(projectId) => onChange({ projectId })}>
          <SelectTrigger className="h-8 w-full border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
    </div>
  )
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-center px-4 py-1.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </div>
  )
}
