import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import { useProjectsStore } from '@/store/projectsStore'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError } from '@/lib/toast'

export function AppShell() {
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)

  useEffect(() => {
    fetchProjects().catch((error) => notifyError('Could not load projects', getApiErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {currentProjectId ? (
            <Outlet />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>
          )}
        </main>
      </div>
    </div>
  )
}
