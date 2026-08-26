'use client'

import { Calendar, Map, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { studioPanelTitleClass } from '@/components/studio-panel'
import type { SavedProject } from '@/lib/projects'
import { cn } from '@/lib/utils'

import { HubEmptyState } from './hub-empty-state'
import { hubFullBleedRowClass, hubInsetClass, hubRowInnerClass } from './hub-layout'

interface ProjectListProps {
  projects: SavedProject[]
  isLoading: boolean
  onOpenProject: (projectId: string) => void
  onDeleteProject: (e: React.MouseEvent, projectId: string, projectName: string) => void
  onNewMap?: () => void
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function ProjectListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={hubFullBleedRowClass} aria-hidden="true">
          <div className={hubRowInnerClass('animate-pulse')}>
            <div className="h-14 w-20 shrink-0 bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-muted" />
              <div className="h-2 w-1/4 bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function ProjectList({
  projects,
  isLoading,
  onOpenProject,
  onDeleteProject,
  onNewMap,
}: ProjectListProps) {
  return (
    <section aria-label="Recent projects">
      <div className={hubFullBleedRowClass}>
        <div className={cn(hubInsetClass, 'py-3')}>
          <h2 className={studioPanelTitleClass}>Recent projects</h2>
        </div>
      </div>

      {isLoading ? (
        <div aria-live="polite" aria-label="Loading projects">
          <ProjectListSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className={hubInsetClass}>
          <HubEmptyState onNewMap={onNewMap} />
        </div>
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={cn(hubFullBleedRowClass, 'block text-left')}
            onClick={() => onOpenProject(project.id)}>
            <span className={hubRowInnerClass('group relative')}>
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted">
                {project.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Map className="h-5 w-5 text-muted-foreground/40" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="truncate text-sm font-medium">{project.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                  {formatDate(project.updatedAt)}
                  <span className="text-border">·</span>
                  <span className="capitalize">{project.activeMapType}</span>
                  {project.symbolData.parsedData.length > 0 ? (
                    <>
                      <span className="text-border">·</span>
                      <span>{project.symbolData.parsedData.length} rows</span>
                    </>
                  ) : null}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100'
                )}
                onClick={(e) => onDeleteProject(e, project.id, project.name)}
                aria-label={`Delete project ${project.name}`}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden />
              </Button>
            </span>
          </button>
        ))
      )}
    </section>
  )
}
