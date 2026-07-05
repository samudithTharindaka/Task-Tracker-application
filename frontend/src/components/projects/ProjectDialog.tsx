import { useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ProjectDialog({
  open,
  onOpenChange,
  mode,
  initialName = '',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'rename'
  initialName?: string
  onSubmit: (name: string) => Promise<void> | void
}) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  async function handleSubmit() {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await onSubmit(name.trim())
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === 'create' ? 'Create new project' : 'Rename project'}
          </DialogTitle>
        </DialogHeader>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Project name"
          autoFocus
          className="h-12 text-base"
        />

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>
            <PlusIcon /> {isSaving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
