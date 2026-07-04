import { NavLink, useNavigate } from 'react-router-dom'
import { BellIcon, CalendarIcon, LayoutGridIcon, LogOutIcon, MessageCircleIcon, RowsIcon, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/authStore'

const VIEW_TABS = [
  { to: '/app/list', label: 'List', icon: RowsIcon },
  { to: '/app/board', label: 'Board', icon: LayoutGridIcon },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarIcon },
]

export function Topbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      <nav className="flex items-center gap-6">
        {VIEW_TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 border-b-2 border-transparent py-4 text-sm font-medium text-muted-foreground transition-colors',
                isActive && 'border-primary text-primary',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-56 pl-9" />
        </div>
        <button className="relative text-muted-foreground hover:text-foreground" aria-label="Messages">
          <MessageCircleIcon className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
        </button>
        <button className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <BellIcon className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="opacity-100">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOutIcon /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
