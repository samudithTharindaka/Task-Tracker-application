import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-extrabold">Profile</h1>
      <div className="max-w-md rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-lg text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user?.email}</p>
            <Badge variant="secondary" className="mt-1">
              {user?.role}
            </Badge>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
        </p>
      </div>
    </div>
  )
}
