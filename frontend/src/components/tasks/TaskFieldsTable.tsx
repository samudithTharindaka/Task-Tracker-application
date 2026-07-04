import type { ReactNode } from 'react'
import { BookmarkIcon, CalendarIcon, FileTextIcon, PackageIcon, UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BOARD_COLUMNS, type BoardColumn } from '@/types/task'

export interface TaskFieldsValue {
  label: string
  column: BoardColumn
  dueDate: string
  owner: string
  project: string
}

const ROW_ICON_CLASS = 'size-4 text-muted-foreground'

export function TaskFieldsTable({
  value,
  onChange,
  readOnlyProject = true,
}: {
  value: TaskFieldsValue
  onChange: (patch: Partial<TaskFieldsValue>) => void
  readOnlyProject?: boolean
}) {
  return (
    <div className="divide-y rounded-lg border">
      <Row icon={<BookmarkIcon className={ROW_ICON_CLASS} />} label="Label">
        <Input
          value={value.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. Development"
          className="h-8 border-none shadow-none focus-visible:ring-0"
        />
      </Row>
      <Row icon={<PackageIcon className={ROW_ICON_CLASS} />} label="Status">
        <Select value={value.column} onValueChange={(column) => onChange({ column: column as BoardColumn })}>
          <SelectTrigger className="h-8 w-full border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOARD_COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row icon={<CalendarIcon className={ROW_ICON_CLASS} />} label="Due date">
        <Input
          value={value.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          placeholder="e.g. Tomorrow"
          className="h-8 border-none shadow-none focus-visible:ring-0"
        />
      </Row>
      <Row icon={<UserIcon className={ROW_ICON_CLASS} />} label="Owner">
        <Input
          value={value.owner}
          onChange={(e) => onChange({ owner: e.target.value })}
          placeholder="Assignee name"
          className="h-8 border-none shadow-none focus-visible:ring-0"
        />
      </Row>
      <Row icon={<FileTextIcon className={ROW_ICON_CLASS} />} label="Project">
        <Input
          value={value.project}
          onChange={(e) => onChange({ project: e.target.value })}
          disabled={readOnlyProject}
          className="h-8 border-none shadow-none focus-visible:ring-0 disabled:opacity-100"
        />
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
