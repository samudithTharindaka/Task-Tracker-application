import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronsLeftIcon,
  HomeIcon,
  ListChecksIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  SunIcon,
  Trash2Icon,
  TrophyIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { useThemeStore, applyThemeClass } from '@/store/themeStore'
import { useProjectsStore } from '@/store/projectsStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { confirmAction, notifyError, notifySuccess } from '@/lib/toast'
import { ProjectDialog } from '@/components/projects/ProjectDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Project } from '@/types/task'

const NAV_ITEMS = [
  { to: '/app/home', label: 'Home', icon: HomeIcon },
  { to: '/app/list', label: 'My Tasks', icon: ListChecksIcon },
  { to: '/app/ai-assistant', label: 'Ai Assistant', icon: SparklesIcon },
  { to: '/app/profile', label: 'Profile', icon: TrophyIcon },
]

export function Sidebar() {
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const projects = useProjectsStore((s) => s.projects)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const setCurrentProject = useProjectsStore((s) => s.setCurrentProject)
  const createProject = useProjectsStore((s) => s.createProject)
  const renameProject = useProjectsStore((s) => s.renameProject)
  const deleteProject = useProjectsStore((s) => s.deleteProject)

  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Project | null>(null)

  function handleSelectProject(projectId: string) {
    setCurrentProject(projectId)
    navigate('/app/list')
  }

  function handleToggle(next: 'light' | 'dark') {
    if (next !== theme) {
      toggleTheme()
      applyThemeClass(next)
    }
  }

  async function handleCreate(name: string) {
    try {
      await createProject(name)
      notifySuccess('Project created', `"${name}" is ready`)
    } catch (error) {
      notifyError('Could not create project', getApiErrorMessage(error))
    }
  }

  async function handleRename(name: string) {
    if (!renameTarget) return
    try {
      await renameProject(renameTarget.id, name)
      notifySuccess('Project renamed')
    } catch (error) {
      notifyError('Could not rename project', getApiErrorMessage(error))
    }
  }

  function handleDelete(project: Project) {
    confirmAction({
      description: `Delete "${project.name}"? Its tasks will be deleted too.`,
      onConfirm: async () => {
        try {
          await deleteProject(project.id)
          notifySuccess('Project deleted', `"${project.name}" was removed`)
        } catch (error) {
          notifyError('Could not delete project', getApiErrorMessage(error))
        }
      },
    })
  }

  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col border-r bg-card px-3 py-4">
      <div className="flex items-center justify-between px-1">
        <Logo />
        <button className="text-muted-foreground hover:text-foreground" aria-label="Collapse sidebar">
          <ChevronsLeftIcon className="size-4" />
        </button>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                isActive && 'bg-secondary text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Projects</span>
          <button
            className="text-muted-foreground hover:text-foreground"
            aria-label="Add project"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg pr-1 pl-3 text-sm font-medium transition-colors',
                project.id === currentProjectId ? 'bg-secondary' : 'hover:bg-secondary/60',
              )}
            >
              <button onClick={() => handleSelectProject(project.id)} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left">
                <span className="size-2 shrink-0 rounded-full bg-warning" />
                <span className="truncate">{project.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded p-1 text-muted-foreground opacity-0 hover:bg-secondary hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                    aria-label="Project options"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRenameTarget(project)}>
                    <PencilIcon /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => handleDelete(project)}>
                    <Trash2Icon /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1 rounded-full border p-1">
        <button
          onClick={() => handleToggle('dark')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors',
            theme === 'dark' ? 'bg-secondary text-foreground' : 'text-muted-foreground',
          )}
        >
          <MoonIcon className="size-3.5" />
          Dark
        </button>
        <button
          onClick={() => handleToggle('light')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors',
            theme === 'light' ? 'bg-secondary text-foreground shadow-xs' : 'text-muted-foreground',
          )}
        >
          <SunIcon className="size-3.5" />
          Light
        </button>
      </div>

      <ProjectDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" onSubmit={handleCreate} />
      <ProjectDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        mode="rename"
        initialName={renameTarget?.name ?? ''}
        onSubmit={handleRename}
      />
    </aside>
  )
}
