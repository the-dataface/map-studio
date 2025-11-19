'use client'

import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { MapPreview } from './map-preview'
import type { MapPreviewProps } from './map-preview'

function MapPreviewLoading() {
  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
      <CardContent className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading map data...</div>
      </CardContent>
    </Card>
  )
}

export function MapPreviewWithSuspense(props: MapPreviewProps) {
  return (
    <Suspense fallback={<MapPreviewLoading />}>
      <MapPreview {...props} />
    </Suspense>
  )
}

