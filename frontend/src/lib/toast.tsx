import { toast } from 'sonner'
import { CircleAlertIcon, CircleCheckIcon, CircleXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function ToastCard({
  variant,
  title,
  description,
  onClose,
}: {
  variant: 'success' | 'error'
  title: string
  description?: string
  onClose: () => void
}) {
  const Icon = variant === 'success' ? CircleCheckIcon : CircleXIcon

  return (
    <div className="flex w-full overflow-hidden rounded-xl border bg-card shadow-lg">
      <div className={cn('flex w-16 shrink-0 items-center justify-center', variant === 'success' ? 'bg-success' : 'bg-destructive')}>
        <Icon className="size-7 text-white" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 text-sm font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground">
          Close
        </button>
      </div>
    </div>
  )
}

export function notifySuccess(title: string, description?: string) {
  toast.custom(
    (id) => <ToastCard variant="success" title={title} description={description} onClose={() => toast.dismiss(id)} />,
    { duration: 3500 },
  )
}

export function notifyError(title: string, description?: string) {
  toast.custom(
    (id) => <ToastCard variant="error" title={title} description={description} onClose={() => toast.dismiss(id)} />,
    { duration: 4500 },
  )
}

// Toast-based confirm/decline prompt for destructive actions, replacing
// window.confirm. "Confirm" is a plain text link and "Decline" is the
// solid emphasized button — deliberately making the safe/cancel option the
// visually prominent one to reduce accidental destructive clicks.
export function confirmAction({
  title = 'Warning',
  description,
  onConfirm,
}: {
  title?: string
  description: string
  onConfirm: () => void
}) {
  toast.custom(
    (id) => (
      <div className="flex w-full overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="flex w-16 shrink-0 items-center justify-center bg-warning">
          <CircleAlertIcon className="size-7 text-white" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => {
                toast.dismiss(id)
                onConfirm()
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Confirm
            </button>
            <Button size="sm" onClick={() => toast.dismiss(id)}>
              Decline
            </Button>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity },
  )
}
