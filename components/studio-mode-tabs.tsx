'use client'

import { studioTabBarClass, studioTabButtonClass } from '@/components/studio-panel'
import type { StudioMode } from '@/lib/studio-chrome-context'

interface StudioModeTabsProps {
  mode: StudioMode
  onModeChange: (mode: StudioMode) => void
  mapSetupEnabled: boolean
  designEnabled: boolean
}

export function StudioModeTabs({
  mode,
  onModeChange,
  mapSetupEnabled,
  designEnabled,
}: StudioModeTabsProps) {
  return (
    <div className={studioTabBarClass} role="tablist" aria-label="Studio mode">
      <button
        type="button"
        role="tab"
        id="studio-tab-data"
        aria-selected={mode === 'data'}
        aria-controls="studio-panel-data"
        title="Data mode (1)"
        className={studioTabButtonClass(mode === 'data')}
        onClick={() => onModeChange('data')}>
        Data
      </button>
      <button
        type="button"
        role="tab"
        id="studio-tab-map-setup"
        aria-selected={mode === 'map-setup'}
        aria-controls="studio-panel-map-setup"
        aria-disabled={!mapSetupEnabled}
        disabled={!mapSetupEnabled}
        title={mapSetupEnabled ? 'Setup mode (2)' : 'Load data to enable setup'}
        className={studioTabButtonClass(mode === 'map-setup', !mapSetupEnabled)}
        onClick={() => onModeChange('map-setup')}>
        Setup
      </button>
      <button
        type="button"
        role="tab"
        id="studio-tab-design"
        aria-selected={mode === 'design'}
        aria-controls="studio-panel-design"
        aria-disabled={!designEnabled}
        disabled={!designEnabled}
        title={designEnabled ? 'Design mode (3)' : 'Load data to enable design mode'}
        className={studioTabButtonClass(mode === 'design', !designEnabled)}
        onClick={() => onModeChange('design')}>
        Design
      </button>
    </div>
  )
}
