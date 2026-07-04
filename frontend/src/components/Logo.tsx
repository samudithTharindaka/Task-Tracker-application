import { cn } from '@/lib/utils'

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4V20L12 12L4 4Z" fill="#2f4fd4" />
          <path d="M20 20V4L12 12L20 20Z" fill="#4ade80" />
        </svg>
      </span>
      {!mark && <span className="text-xl font-bold tracking-tight">Newnop</span>}
    </div>
  )
}
