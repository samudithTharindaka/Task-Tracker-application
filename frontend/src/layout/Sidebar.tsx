import { NavLink } from 'react-router-dom'
import { ChevronsLeftIcon, HomeIcon, ListChecksIcon, MoonIcon, PlusIcon, SparklesIcon, SunIcon, TrophyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { useThemeStore, applyThemeClass } from '@/store/themeStore'

const NAV_ITEMS = [
  { to: '/app/home', label: 'Home', icon: HomeIcon },
  { to: '/app/tasks', label: 'My Tasks', icon: ListChecksIcon },
  { to: '/app/ai-assistant', label: 'Ai Assistant', icon: SparklesIcon },
  { to: '/app/profile', label: 'Profile', icon: TrophyIcon },
]

export function Sidebar() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  function handleToggle(next: 'light' | 'dark') {
    if (next !== theme) {
      toggleTheme()
      applyThemeClass(next)
    }
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
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Workspace</span>
          <button className="text-muted-foreground hover:text-foreground" aria-label="Add workspace">
            <PlusIcon className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-warning" />
          Ongoing board
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
    </aside>
  )
}
