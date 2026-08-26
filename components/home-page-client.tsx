'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { AppProviders } from '@/components/app-providers'
import { HubHeader } from '@/components/hub-header'
import { HubHero } from '@/components/hub-hero'
import { ProjectList } from '@/components/project-list'
import { useToast } from '@/hooks/use-toast'
import { deleteProject, getSavedProjects, importProject, saveProject, type SavedProject } from '@/lib/projects'

export function HomePageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setProjects(getSavedProjects())
    setIsLoading(false)
  }, [])

  const handleNewMap = () => {
    router.push('/studio')
  }

  const handleOpenProject = (projectId: string) => {
    router.push(`/studio?project=${projectId}`)
  }

  const handleOpenFromFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a valid JSON project file.',
        variant: 'destructive',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Project file must be less than 10MB.',
        variant: 'destructive',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('File is empty.')

      const project = importProject(text)
      const saved = saveProject(project)
      setProjects(getSavedProjects())

      toast({ description: `Project "${saved.name}" imported successfully.` })
      router.push(`/studio?project=${saved.id}`)
    } catch (error) {
      console.error('Failed to import project:', error)
      let errorMessage = 'Failed to import project file. Please ensure it is a valid Map Studio project file.'
      if (error instanceof Error) {
        if (error.message.includes('QuotaExceededError') || error.message.includes('quota')) {
          errorMessage =
            'Storage quota exceeded. Please delete some projects or clear your browser storage before importing.'
        } else {
          errorMessage = error.message
        }
      }
      toast({ title: 'Import failed', description: errorMessage, variant: 'destructive', duration: 6000 })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
      deleteProject(projectId)
      setProjects(getSavedProjects())
      toast({ description: 'Project deleted.' })
    }
  }

  return (
    <AppProviders>
      <div className="min-h-screen bg-background">
        <HubHeader />
        <HubHero onNewMap={handleNewMap} onOpenFromFile={handleOpenFromFile} />
        <ProjectList
          projects={projects}
          isLoading={isLoading}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onNewMap={handleNewMap}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload project file"
        />
      </div>
    </AppProviders>
  )
}
