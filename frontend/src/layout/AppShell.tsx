import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'

export function AppShell() {
  return (
    <div className="flex h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
