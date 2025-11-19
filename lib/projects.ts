'use client'

import type {
  DataState,
  DimensionSettings,
  StylingSettings,
  MapType,
  GeographyKey,
  ProjectionType,
} from '@/app/(studio)/types'

export interface SavedProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  activeMapType: MapType
  selectedGeography: GeographyKey
  selectedProjection: ProjectionType
  clipToCountry: boolean
  columnTypes: Record<string, string>
  columnFormats: Record<string, string>
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  preview?: string // Base64 encoded SVG preview (optional)
}

const STORAGE_KEY = 'mapstudio_projects'
const MAX_PROJECTS = 10 // Reduced limit to prevent quota issues
const THUMBNAIL_MAX_SIZE = 50000 // Max thumbnail size in bytes (50KB)

/**
 * Get all saved projects from localStorage
 */
export function getSavedProjects(): SavedProject[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const projects = JSON.parse(stored) as SavedProject[]
    // Sort by updatedAt descending (most recent first)
    return projects.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (error) {
    console.error('Failed to load saved projects:', error)
    return []
  }
}

/**
 * Save a project to localStorage
 * Handles quota exceeded errors by removing thumbnails if needed
 */
export function saveProject(project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>): SavedProject {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save project: window is undefined')
  }

  const projects = getSavedProjects()
  const now = Date.now()
  
  // Check if project with same name exists (for overwrite)
  const existingIndex = projects.findIndex((p) => p.name === project.name)
  
  let savedProject: SavedProject = {
    ...project,
    id: existingIndex >= 0 ? projects[existingIndex].id : generateId(),
    createdAt: existingIndex >= 0 ? projects[existingIndex].createdAt : now,
    updatedAt: now,
  }

  let projectsToSave: SavedProject[]
  
  if (existingIndex >= 0) {
    // Update existing project
    projects[existingIndex] = savedProject
    projectsToSave = projects
  } else {
    // Add new project
    projects.unshift(savedProject)
    // Keep only the most recent MAX_PROJECTS
    if (projects.length > MAX_PROJECTS) {
      projects.splice(MAX_PROJECTS)
    }
    projectsToSave = projects
  }

  // Try to save with thumbnail first
  try {
    const jsonString = JSON.stringify(projectsToSave)
    window.localStorage.setItem(STORAGE_KEY, jsonString)
    return savedProject
  } catch (error) {
    // Check if it's a quota error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting to save without thumbnails')
      
      // Try saving without thumbnail for this project
      const projectWithoutThumbnail = { ...savedProject, preview: undefined }
      
      if (existingIndex >= 0) {
        projects[existingIndex] = projectWithoutThumbnail
      } else {
        projects[0] = projectWithoutThumbnail
      }
      
        try {
          // Try again without thumbnail
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
          savedProject = projectWithoutThumbnail
          return savedProject
        } catch {
          // Still failing? Try removing thumbnails from all projects
          console.warn('Still failing, removing thumbnails from all projects')
          const projectsWithoutThumbnails = freeUpStorageSpace(projects)
          
          // Update the current project in the cleaned list
          const updatedIndex = projectsWithoutThumbnails.findIndex(p => p.id === savedProject.id)
          if (updatedIndex >= 0) {
            projectsWithoutThumbnails[updatedIndex] = projectWithoutThumbnail
          }
          
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsWithoutThumbnails))
            savedProject = projectWithoutThumbnail
            return savedProject
          } catch {
            // Last resort: reduce number of projects
            console.warn('Storage still full, reducing number of saved projects')
            const reducedProjects = projectsWithoutThumbnails.slice(0, Math.max(1, MAX_PROJECTS - 2))
            const finalIndex = reducedProjects.findIndex(p => p.id === savedProject.id)
            if (finalIndex >= 0) {
              reducedProjects[finalIndex] = projectWithoutThumbnail
            } else {
              reducedProjects.unshift(projectWithoutThumbnail)
            }
            
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedProjects))
              savedProject = projectWithoutThumbnail
              return savedProject
            } catch {
              throw new Error('Storage quota exceeded. Please delete some projects or clear your browser storage.')
            }
          }
        }
    }
    
    // Re-throw if it's not a quota error
    console.error('Failed to save project:', error)
    throw error
  }
}

/**
 * Delete a project by ID
 */
export function deleteProject(projectId: string): void {
  if (typeof window === 'undefined') return

  const projects = getSavedProjects()
  const filtered = projects.filter((p) => p.id !== projectId)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}

/**
 * Get a project by ID
 */
export function getProject(projectId: string): SavedProject | null {
  const projects = getSavedProjects()
  return projects.find((p) => p.id === projectId) || null
}

/**
 * Export project as JSON file
 */
export function exportProject(project: SavedProject): void {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import project from JSON file
 */
export function importProject(jsonString: string): SavedProject {
  try {
    const project = JSON.parse(jsonString) as SavedProject
    // Validate required fields
    if (!project.name || !project.symbolData || !project.choroplethData || !project.customData) {
      throw new Error('Invalid project format: missing required fields')
    }
    // Generate new ID and timestamps for imported project
    const now = Date.now()
    return {
      ...project,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
  } catch (error) {
    console.error('Failed to import project:', error)
    throw new Error('Failed to parse project file. Please ensure it is a valid Map Studio project JSON file.')
  }
}


/**
 * Generate a thumbnail preview from SVG element
 * Converts SVG to JPEG image using canvas for much smaller file size
 * Returns a Promise that resolves to a data URL (JPEG) or undefined
 */
export function generatePreviewThumbnail(svgElement: SVGSVGElement | null): Promise<string | undefined> | string | undefined {
  if (!svgElement || typeof window === 'undefined') return undefined

  // Thumbnail dimensions
  const thumbnailWidth = 200
  const thumbnailHeight = 130

  try {
    // Clone and prepare SVG for rendering
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
    
    // Get viewBox to maintain aspect ratio
    const viewBox = clonedSvg.getAttribute('viewBox')
    
    // Set thumbnail dimensions
    clonedSvg.setAttribute('width', thumbnailWidth.toString())
    clonedSvg.setAttribute('height', thumbnailHeight.toString())
    if (viewBox) {
      clonedSvg.setAttribute('viewBox', viewBox)
    }
    
    // Remove text elements and labels (not needed for thumbnail)
    const textElements = clonedSvg.querySelectorAll('text, tspan')
    textElements.forEach(el => el.remove())
    
    // Remove legend elements (not needed for thumbnail)
    const legendElements = clonedSvg.querySelectorAll('[id*="legend"], [class*="legend"]')
    legendElements.forEach(el => el.remove())
    
    // Serialize SVG to string
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    // Create image element to load SVG, then convert to canvas
    return new Promise<string | undefined>((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = thumbnailWidth
          canvas.height = thumbnailHeight
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            URL.revokeObjectURL(url)
            resolve(undefined)
            return
          }
          
          // Fill with white background (in case SVG has transparency)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight)
          
          // Draw SVG to canvas
          ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight)
          
          // Convert to JPEG with quality 0.7 (smaller than PNG)
          let dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          
          // If still too large, try lower quality
          if (dataUrl.length > THUMBNAIL_MAX_SIZE) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.5)
            if (dataUrl.length > THUMBNAIL_MAX_SIZE) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.3)
            }
          }
          
          URL.revokeObjectURL(url)
          
          // Final check - if still too large, return undefined
          if (dataUrl.length > THUMBNAIL_MAX_SIZE) {
            console.warn(`Thumbnail still too large (${dataUrl.length} bytes) after compression`)
            resolve(undefined)
          } else {
            resolve(dataUrl)
          }
        } catch (error) {
          console.error('Failed to convert SVG to image:', error)
          URL.revokeObjectURL(url)
          resolve(undefined)
        }
      }
      
      img.onerror = () => {
        console.error('Failed to load SVG for thumbnail generation')
        URL.revokeObjectURL(url)
        resolve(undefined)
      }
      
      img.src = url
    })
  } catch (error) {
    console.error('Failed to generate preview thumbnail:', error)
    return undefined
  }
}

/**
 * Try to free up space by removing thumbnails from old projects
 */
function freeUpStorageSpace(targetProjects: SavedProject[]): SavedProject[] {
  // Remove thumbnails from oldest projects first
  const projectsWithThumbnails = targetProjects.filter(p => p.preview)
  const projectsWithoutThumbnails = targetProjects.filter(p => !p.preview)
  
  // Sort by updatedAt, oldest first
  projectsWithThumbnails.sort((a, b) => a.updatedAt - b.updatedAt)
  
  // Remove thumbnails from oldest projects until we have space
  const projectsToKeep = [...projectsWithoutThumbnails]
  for (const project of projectsWithThumbnails) {
    const projectWithoutThumbnail = { ...project, preview: undefined }
    projectsToKeep.push(projectWithoutThumbnail)
  }
  
  return projectsToKeep.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Generate a unique ID for projects
 */
function generateId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

