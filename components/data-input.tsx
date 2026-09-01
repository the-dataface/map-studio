/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin, BarChart3, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import type { DataRow } from '@/app/(studio)/types'
import { parseDelimitedText } from '@/modules/data-ingest/csv'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  studioPanelClass,
  studioOutlineButtonClass,
  StudioExpandableHeader,
} from '@/components/studio-panel'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type LayerLoadType = 'points' | 'areas' | 'auto'

interface DataInputProps {
  onDataLoad: (
    mapType: 'symbol' | 'choropleth',
    parsedData: DataRow[],
    columns: string[],
    rawData: string,
    layerName?: string,
  ) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  pointsLayerCount?: number
  areasLayerCount?: number
}

const LAT_NAMES = ['latitude', 'lat']
const LNG_NAMES = ['longitude', 'long', 'lng', 'lon']

function inferLayerType(columns: string[]): 'symbol' | 'choropleth' {
  const normalized = columns.map((c) => c.trim().toLowerCase())
  const hasLat = normalized.some((c) => LAT_NAMES.includes(c))
  const hasLng = normalized.some((c) => LNG_NAMES.includes(c))
  return hasLat && hasLng ? 'symbol' : 'choropleth'
}

function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  if (!base) return filename
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const sampleDataFiles = [
  { label: 'US companies', file: '/sample-data/symbol-us.csv', type: 'symbol' as const },
  { label: 'Canadian companies', file: '/sample-data/symbol-canada.csv', type: 'symbol' as const },
  { label: 'World cities', file: '/sample-data/symbol-world.csv', type: 'symbol' as const },
  { label: 'US states', file: '/sample-data/choropleth-us.csv', type: 'choropleth' as const },
  { label: 'Canadian provinces', file: '/sample-data/choropleth-canada.csv', type: 'choropleth' as const },
  { label: 'World countries', file: '/sample-data/choropleth-world.csv', type: 'choropleth' as const },
]

export function DataInput({
  onDataLoad,
  isExpanded,
  setIsExpanded,
  pointsLayerCount = 0,
  areasLayerCount = 0,
}: DataInputProps) {
  const [rawData, setRawData] = useState('')
  const [layerName, setLayerName] = useState('')
  const [layerType, setLayerType] = useState<LayerLoadType>('auto')
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const resolveMapType = (columns: string[], forcedType?: 'symbol' | 'choropleth') =>
    forcedType ?? (layerType === 'auto' ? inferLayerType(columns) : layerType === 'points' ? 'symbol' : 'choropleth')

  const namePlaceholder = useMemo(() => {
    if (layerType === 'areas') return `Areas ${areasLayerCount + 1}`
    if (layerType === 'points') return `Points ${pointsLayerCount + 1}`
    return 'Layer name'
  }, [layerType, pointsLayerCount, areasLayerCount])

  const loadParsedData = (
    data: DataRow[],
    columns: string[],
    text: string,
    forcedType?: 'symbol' | 'choropleth',
    name?: string,
  ) => {
    if (data.length === 0) {
      toast({
        description: 'No data found.',
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      })
      return
    }

    const mapType = resolveMapType(columns, forcedType)
    const resolvedName = (name ?? layerName).trim() || undefined
    onDataLoad(mapType, data, columns, text, resolvedName)
    toast({
      description: `${data.length} rows added as ${mapType === 'symbol' ? 'Points' : 'Areas'} layer.`,
      variant: 'success',
      icon: <CheckCircle className="h-5 w-5" />,
    })
    setRawData('')
    setLayerName('')
    setIsExpanded(false)
  }

  const handleLoadData = () => {
    const { data, columns } = parseDelimitedText(rawData)
    loadParsedData(data, columns, rawData)
  }

  const parseFileText = (text: string, fileName: string, autoLoad = true) => {
    let data: DataRow[] = []
    let columns: string[] = []
    let error = ''

    try {
      if (fileName.endsWith('.json')) {
        const json = JSON.parse(text)
        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
          data = json
          columns = Object.keys(json[0])
        } else {
          error = 'JSON file must be an array of objects.'
        }
      } else {
        const parsed = parseDelimitedText(text)
        data = parsed.data
        columns = parsed.columns
      }
    } catch (e: any) {
      error = 'Failed to parse file: ' + (e.message || e.toString())
    }

    if (error) {
      toast({ description: error, variant: 'destructive', icon: <AlertCircle className="h-5 w-5" /> })
      return
    }

    const derivedName = nameFromFilename(fileName)
    setLayerName(derivedName)

    if (autoLoad) {
      loadParsedData(data, columns, text, undefined, derivedName)
    }
  }

  const handleFileFromDrop = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setRawData(text)
      parseFileText(text, file.name)
    }
    reader.readAsText(file)
  }

  const loadSampleDataFile = async (sample: (typeof sampleDataFiles)[number]) => {
    try {
      const res = await fetch(sample.file)
      if (!res.ok) throw new Error('Failed to load sample data')
      const text = await res.text()
      const { data, columns } = parseDelimitedText(text)
      setLayerName(sample.label)
      loadParsedData(data, columns, text, sample.type, sample.label)
    } catch {
      toast({
        description: 'Failed to load sample data.',
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      })
    }
  }

  useEffect(() => {
    const handler = () => setIsExpanded(false)
    window.addEventListener('collapse-all-panels', handler)
    return () => window.removeEventListener('collapse-all-panels', handler)
  }, [setIsExpanded])

  return (
    <Card
      className={cn(studioPanelClass, 'relative overflow-hidden')}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragActive(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsDragActive(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFileFromDrop(file)
      }}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed border-primary/40 bg-background/90">
          <div className="text-center text-sm font-medium text-primary">Drop CSV, TSV, or JSON file here</div>
        </div>
      )}

      <StudioExpandableHeader
        title="Add layer"
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      <div
        className={cn(
          'studio-panel-expand-body transition-all duration-300 overflow-hidden',
          isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <CardContent className="space-y-4 px-4 pb-4 pt-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Layer type</label>
            <ToggleGroup
              type="single"
              value={layerType}
              onValueChange={(v) => {
                if (v === 'points' || v === 'areas' || v === 'auto') setLayerType(v)
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="auto" className="text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Auto
              </ToggleGroupItem>
              <ToggleGroupItem value="points" className="text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                Points
              </ToggleGroupItem>
              <ToggleGroupItem value="areas" className="text-xs">
                <BarChart3 className="mr-1 h-3 w-3" />
                Areas
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <label htmlFor="layer-name" className="mb-2 block text-sm font-medium">
              Layer name
            </label>
            <Input
              id="layer-name"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              placeholder={namePlaceholder}
              className="text-sm"
            />
          </div>

          <div>
            <label htmlFor="paste-data" className="mb-2 block text-sm font-medium">
              Paste data
            </label>
            <Textarea
              id="paste-data"
              placeholder="Paste CSV or TSV data here…"
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>

          <Button type="button" onClick={handleLoadData} disabled={!rawData.trim()} className="w-full">
            Load data
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn('w-full', studioOutlineButtonClass)}
          >
            Upload file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileFromDrop(file)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Load sample data</label>
            <ScrollArea className="h-[140px] rounded-md border border-border">
              <div className="flex flex-col p-1">
                {sampleDataFiles.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    className="rounded px-3 py-2 text-left text-sm hover:bg-muted/60"
                    onClick={() => loadSampleDataFile(sample)}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
