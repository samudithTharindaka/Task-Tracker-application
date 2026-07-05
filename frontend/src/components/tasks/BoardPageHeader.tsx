import { ShareIcon, StarIcon, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectsStore } from '@/store/projectsStore'

export function BoardPageHeader({ crumb }: { crumb: string }) {
  const projects = useProjectsStore((s) => s.projects)
  const currentProjectId = useProjectsStore((s) => s.currentProjectId)
  const projectName = projects.find((p) => p.id === currentProjectId)?.name ?? 'Workspace'

  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">
          Workspace <span className="mx-1">/</span> {projectName} <span className="mx-1">/</span> {crumb}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{projectName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon">
          <ZapIcon />
        </Button>
        <Button variant="outline" size="icon">
          <StarIcon />
        </Button>
        <Button variant="outline">
          <ShareIcon /> Share
        </Button>
      </div>
    </div>
  )
}
