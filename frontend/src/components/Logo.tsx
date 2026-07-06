import { cn } from '@/lib/utils'

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-white shadow-sm">
        <img src="/logo.png" alt="Newnop logo" className="size-5" />
      </span>
      {!mark && <span className="text-xl font-bold tracking-tight">Newnop</span>}
    </div>
  )
}
