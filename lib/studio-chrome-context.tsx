'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type StudioMode = 'data' | 'map-setup' | 'design'

export interface StudioChromeState {
  projectName: string
  setProjectName: (name: string) => void
  onSave: () => void
  onExport: () => void
  isSaving: boolean
  isExporting: boolean
  showProjectControls: boolean
  showModeTabs: boolean
  studioMode: StudioMode
  setStudioMode: (mode: StudioMode) => void
  designModeEnabled: boolean
  mapSetupModeEnabled: boolean
}

interface StudioChromeContextValue {
  chrome: StudioChromeState | null
  setChrome: (chrome: StudioChromeState | null) => void
}

const StudioChromeContext = createContext<StudioChromeContextValue | null>(null)

export function StudioChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<StudioChromeState | null>(null)
  const value = useMemo(() => ({ chrome, setChrome }), [chrome])

  return (
    <StudioChromeContext.Provider value={value}>
      {children}
    </StudioChromeContext.Provider>
  )
}

export function useStudioChrome() {
  const ctx = useContext(StudioChromeContext)
  if (!ctx) throw new Error('useStudioChrome must be used within StudioChromeProvider')
  return ctx
}

/** Register header chrome while the studio page is mounted. */
export function useRegisterStudioChrome(chrome: StudioChromeState | null) {
  const { setChrome } = useStudioChrome()
  const chromeRef = useRef(chrome)
  chromeRef.current = chrome

  const isActive = chrome !== null

  useEffect(() => {
    if (!isActive) {
      setChrome(null)
      return
    }

    // Stable handlers read the latest callbacks via ref — avoids loops when
    // parent re-creates save/export functions each render.
    setChrome({
      projectName: chromeRef.current!.projectName,
      setProjectName: (name) => chromeRef.current?.setProjectName(name),
      onSave: () => chromeRef.current?.onSave(),
      onExport: () => chromeRef.current?.onExport(),
      isSaving: chromeRef.current!.isSaving,
      isExporting: chromeRef.current!.isExporting,
      showProjectControls: chromeRef.current!.showProjectControls,
      showModeTabs: chromeRef.current!.showModeTabs,
      studioMode: chromeRef.current!.studioMode,
      setStudioMode: (mode) => chromeRef.current?.setStudioMode(mode),
      designModeEnabled: chromeRef.current!.designModeEnabled,
      mapSetupModeEnabled: chromeRef.current!.mapSetupModeEnabled,
    })

    return () => setChrome(null)
  }, [
    isActive,
    chrome?.projectName,
    chrome?.isSaving,
    chrome?.isExporting,
    chrome?.showProjectControls,
    chrome?.showModeTabs,
    chrome?.studioMode,
    chrome?.designModeEnabled,
    chrome?.mapSetupModeEnabled,
    setChrome,
  ])
}
