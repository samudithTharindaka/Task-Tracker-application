import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowRightIcon, ChevronDownIcon, FolderPlusIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LabelBadge } from '@/components/tasks/LabelBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { ProjectDialog } from '@/components/projects/ProjectDialog'
import { StatusPieChart } from '@/components/dashboard/StatusPieChart'
import { ProjectsDonutChart } from '@/components/dashboard/ProjectsDonutChart'
import { StatusStackedBarChart } from '@/components/dashboard/StatusStackedBarChart'
import { useProjectsStore } from '@/store/projectsStore'
import { useTasksStore } from '@/store/tasksStore'
import { useDashboardStore, type StatusCounts } from '@/store/dashboardStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/toast'

export function HomePage() {
  const projects = useProjectsStore((s) => s.projects)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const setCurrentProject = useProjectsStore((s) => s.setCurrentProject)
  const createProject = useProjectsStore((s) => s.createProject)

  const tasks = useTasksStore((s) => s.tasks)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)

  const breakdownByProject = useDashboardStore((s) => s.breakdownByProject)
  const fetchBreakdown = useDashboardStore((s) => s.fetchBreakdown)

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  useEffect(() => {
    if (currentProjectId) {
      fetchTasks(currentProjectId).catch((error) => notifyError('Could not load tasks', getApiErrorMessage(error)))
    }
  }, [currentProjectId, fetchTasks])

  useEffect(() => {
    if (projects.length > 0) {
      fetchBreakdown(projects).catch((error) => notifyError('Could not load project stats', getApiErrorMessage(error)))
    }
  }, [projects, fetchBreakdown])

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  const total = tasks.length
  const doneCount = tasks.filter((t) => t.status === 'DONE').length
  const percentDone = total ? Math.round((doneCount / total) * 100) : 0
  const toBeDone = total - doneCount

  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').slice(0, 5)

  const overviewCounts: StatusCounts = { TODO: 0, IN_PROGRESS: 0, TEST: 0, DONE: 0 }
  tasks.forEach((t) => {
    overviewCounts[t.status] += 1
  })

  const projectDonutData = projects.map((p) => ({
    name: p.name,
    value: Object.values(breakdownByProject[p.id] ?? {}).reduce((sum, n) => sum + n, 0),
  }))

  const stackedBarData = projects.map((p) => ({
    name: p.name,
    ...(breakdownByProject[p.id] ?? { TODO: 0, IN_PROGRESS: 0, TEST: 0, DONE: 0 }),
  }))

  async function handleCreateProject(name: string) {
    try {
      await createProject(name)
      notifySuccess('Project created', `"${name}" is ready`)
    } catch (error) {
      notifyError('Could not create project', getApiErrorMessage(error))
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-extrabold">Home</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Project</span>
            <span className="size-2.5 shrink-0 rounded-full bg-warning" />
          </div>
          <p className="mt-1 truncate text-xl font-bold">{currentProject?.name ?? '—'}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="mt-4 rounded-full">
                <RefreshCwIcon /> Change <ChevronDownIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setCurrentProject(p.id)}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <span className="text-sm text-muted-foreground">Stats</span>
          <p className="mt-1 text-3xl font-extrabold">{percentDone}%</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <span className="text-sm text-muted-foreground">Count</span>
          <p className="mt-1 text-3xl font-extrabold">{toBeDone} Tasks</p>
          <p className="text-sm text-muted-foreground">To be done</p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-primary p-5 text-white">
          <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-6 -bottom-14 size-40 rounded-full bg-white/10" />
          <p className="relative text-sm text-white/80">Try Our Ai Assistant</p>
          <p className="relative mt-1 text-lg leading-snug font-bold">Talk, Ask and get Task done</p>
          <Button asChild size="sm" className="relative mt-4 bg-white text-primary hover:bg-white/90">
            <Link to="/app/ai-assistant">
              Start Assessment <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Inprogress tasks</h2>
          {inProgressTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No in-progress tasks right now.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inProgressTasks.map((task) => {
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate font-medium">{task.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{task.description || 'No description'}</p>
                      </TableCell>
                      <TableCell>
                        <LabelBadge label={task.label} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(task.dueDate), 'M/d/yy')}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTaskId(task.id)}>
                          view
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Overview</h2>
          <div className="h-64">
            <StatusPieChart counts={overviewCounts} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Projects</h2>
          <div className="h-64">
            <ProjectsDonutChart data={projectDonutData} />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Detailed summary</h2>
          <div className="h-64">
            <StatusStackedBarChart data={stackedBarData} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-primary p-6 text-white">
        <p className="text-lg font-bold">Quick Actions</p>
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <AddTaskDialog
            trigger={
              <button className="flex items-center gap-3 text-left">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
                  <PlusIcon className="size-4" />
                </span>
                <span className="font-medium">Create a task</span>
              </button>
            }
          />

          <button className="flex items-center gap-3 text-left" onClick={() => setCreateProjectOpen(true)}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
              <FolderPlusIcon className="size-4" />
            </span>
            <span className="font-medium">Add a project</span>
          </button>

          <Link to="/app/board" className="flex items-center gap-3 text-left">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
              <ArrowRightIcon className="size-4" />
            </span>
            <span className="font-medium">Go to board</span>
          </Link>
        </div>
      </div>

      <TaskDetailSheet task={activeTask} onClose={() => setActiveTaskId(null)} />
      <ProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} mode="create" onSubmit={handleCreateProject} />
    </div>
  )
}
