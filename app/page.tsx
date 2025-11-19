'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Plus, FolderOpen, Map, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { getSavedProjects, deleteProject, importProject, saveProject, type SavedProject } from '@/lib/projects'

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects on mount
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

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a valid JSON project file.',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Project file must be less than 10MB.',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      const text = await file.text()
      
      // Validate JSON
      if (!text.trim()) {
        throw new Error('File is empty.')
      }

      const project = importProject(text)
      
      // Save the imported project (thumbnail will be generated when map renders in studio)
      const saved = saveProject(project)
      
      // Reload projects list
      setProjects(getSavedProjects())
      
      toast({
        description: `Project "${saved.name}" imported successfully.`,
      })
      
      // Navigate to studio with the imported project
      router.push(`/studio?project=${saved.id}`)
    } catch (error) {
      console.error('Failed to import project:', error)
      let errorMessage = 'Failed to import project file. Please ensure it is a valid Map Studio project file.'
      
      if (error instanceof Error) {
        if (error.message.includes('QuotaExceededError') || error.message.includes('quota')) {
          errorMessage = 'Storage quota exceeded. Please delete some projects or clear your browser storage before importing.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: 'Import failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000,
      })
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
      deleteProject(projectId)
      setProjects(getSavedProjects())
      toast({
        description: 'Project deleted.',
      })
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <h1 className="text-xl font-semibold tracking-tight text-foreground transition-colors duration-200 hover:opacity-80 cursor-pointer">
                  Map Studio
                </h1>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

      <main>
      {/* Hero Section */}
      <section className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-start justify-center gap-6 px-6 py-16">
        <div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-foreground/70">
            Map Studio
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Create data-rich maps without leaving your browser.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Import your dataset, geocode locations, style choropleths or symbol maps, and export production-ready visuals in
            minutes. Built for editorial teams and designers who care about quality and speed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleNewMap} size="lg" className="h-11 px-5">
            <Plus className="mr-2 h-4 w-4" />
            New Map
          </Button>
          <Button onClick={handleOpenFromFile} variant="outline" size="lg" className="h-11 px-5">
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Project from File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload project file"
          />
        </div>
      </section>

      {/* Recent Projects Section */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Recent Projects</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Continue working on your saved projects or start a new map.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite" aria-label="Loading projects">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse" aria-hidden="true">
                <CardHeader>
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Empty state - show placeholder
          <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
            <Map className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
            <p>No saved projects yet.</p>
            <p className="text-sm mt-2">Create your first map to get started!</p>
          </div>
        ) : (
          // Projects grid - only show when there are projects
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {/* Recent Projects */}
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group relative flex flex-col h-full"
                onClick={() => handleOpenProject(project.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleOpenProject(project.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open project ${project.name}`}
              >
                {/* Thumbnail - always show placeholder area */}
                <div className="w-full h-32 bg-muted/50 border-b overflow-hidden flex items-center justify-center">
                  {project.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.preview}
                      alt={`Preview of ${project.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Map className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <CardHeader className="flex-1 pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <CardDescription className="mt-0.5 flex items-center gap-2">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        <span className="text-xs">{formatDate(project.updatedAt)}</span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                      aria-label={`Delete project ${project.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Map className="h-3 w-3" aria-hidden="true" />
                    <span className="capitalize">{project.activeMapType}</span>
                    {project.symbolData.parsedData.length > 0 && (
                      <span className="ml-2">
                        {project.symbolData.parsedData.length} {project.symbolData.parsedData.length === 1 ? 'row' : 'rows'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      </main>
      <Toaster />
    </div>
    </ThemeProvider>
  )
}

