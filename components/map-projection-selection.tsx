/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { studioPanelClass, StudioExpandableHeader } from '@/components/studio-panel';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import type { BoundaryConfig, RenderTarget } from '@/app/(studio)/types';
import { BoundaryPicker } from '@/components/boundary-picker';

interface MapProjectionSelectionProps {
	geography: 'usa-states' | 'usa-counties' | 'usa-nation' | 'canada-provinces' | 'canada-nation' | 'world';
	projection: 'albersUsa' | 'mercator' | 'equalEarth' | 'albers'; // Added "albers"
	onGeographyChange: (
		geography: 'usa-states' | 'usa-counties' | 'usa-nation' | 'canada-provinces' | 'canada-nation' | 'world'
	) => void;
	onProjectionChange: (projection: 'albersUsa' | 'mercator' | 'equalEarth' | 'albers') => void; // Added "albers"
	columns: string[];
	sampleRows: (string | number)[][];
	clipToCountry: boolean; // New prop
	onClipToCountryChange: (clip: boolean) => void; // New prop
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
	boundaryConfig?: BoundaryConfig;
	onBoundaryChange?: (config: BoundaryConfig) => void;
	renderTarget?: RenderTarget;
}

const geographies = [
	{ value: 'canada-nation', label: 'Canada' },
	{ value: 'canada-provinces', label: 'Canada (provinces)' },
	{ value: 'usa-nation', label: 'United States' },
	{ value: 'usa-states', label: 'United States (states)' },
	{ value: 'usa-counties', label: 'United States (counties)' },
	{ value: 'world', label: 'World' },
];

const projections = [
	{ value: 'albersUsa', label: 'Albers USA' },
	{ value: 'albers', label: 'Albers' }, // Added Albers
	{ value: 'mercator', label: 'Mercator' },
	{ value: 'equalEarth', label: 'Equal Earth' },
];

export function MapProjectionSelection({
	geography,
	projection,
	onGeographyChange,
	onProjectionChange,
	columns,
	sampleRows,
	clipToCountry, // Destructure new prop
	onClipToCountryChange, // Destructure new prop
	isExpanded,
	setIsExpanded,
	boundaryConfig,
	onBoundaryChange,
	renderTarget = 'svg',
}: MapProjectionSelectionProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()));

	// Determine if Albers projections should be enabled
	const isUSGeography = geography === 'usa-states' || geography === 'usa-counties' || geography === 'usa-nation';

	// Determine if clipping should be enabled
	const isSingleCountryGeography = geography === 'usa-nation' || geography === 'canada-nation' || geography === 'world';
	const isProjectionClippable = projection !== 'albersUsa'; // Albers USA is already clipped

	const isClipCheckboxDisabled = !isSingleCountryGeography || !isProjectionClippable;

	const clipTooltipContent = isClipCheckboxDisabled
		? 'Clipping is only available for single-country geographies (USA, Canada, World) and non-Albers USA projections.'
		: 'Clip the map to the boundaries of the selected country.';

	return (
		<Card className={cn(studioPanelClass, 'overflow-hidden')}>
			<StudioExpandableHeader
				title="Geography, boundaries, and projection"
				isExpanded={isExpanded}
				onToggle={() => setIsExpanded(!isExpanded)}
			/>
			<CardContent className={cn('studio-panel-expand-body transition-all duration-200', isExpanded ? 'pb-6 pt-2 max-h-none opacity-100' : 'pb-0 h-0 max-h-0 overflow-hidden opacity-0')}>
				<div className="flex flex-col gap-4">
					{boundaryConfig && onBoundaryChange ? (
						<BoundaryPicker
							boundaryConfig={boundaryConfig}
							onBoundaryChange={onBoundaryChange}
							renderTarget={renderTarget}
						/>
					) : null}
					<div>
						<Label htmlFor="geography-search" className="mb-2 block">
							Select geography
						</Label>
						<ScrollArea className="h-[200px] w-full rounded-md border p-2">
							<ToggleGroup
								type="single"
								value={geography}
								onValueChange={(
									value: 'usa-states' | 'usa-counties' | 'usa-nation' | 'canada-provinces' | 'canada-nation' | 'world'
								) => {
									if (value) onGeographyChange(value);
								}}
								orientation="vertical"
								className="flex flex-col items-start">
								{filteredGeographies.map((g) => (
									<ToggleGroupItem
										key={g.value}
										value={g.value}
										aria-label={`Select ${g.label}`}
										className="w-full justify-start">
										{g.label}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</ScrollArea>
					</div>
					<div>
						<Label htmlFor="projection-select" className="mb-2 block">
							Select projection
						</Label>
						<ScrollArea className="h-[200px] w-full rounded-md border p-2">
							<ToggleGroup
								type="single"
								value={projection}
								onValueChange={(value: 'albersUsa' | 'mercator' | 'equalEarth' | 'albers') => {
									if (value) onProjectionChange(value);
								}}
								orientation="vertical"
								className="flex flex-col items-start">
								{projections.map((p) => (
									<ToggleGroupItem
										key={p.value}
										value={p.value}
										aria-label={`Select ${p.label}`}
										className="w-full justify-start"
										disabled={(p.value === 'albersUsa' || p.value === 'albers') && !isUSGeography}>
										{p.label}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</ScrollArea>
					</div>
				</div>
				{/* Clip to Country Checkbox with Tooltip */}
				{/*
        <div className="flex items-center space-x-2 mt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Checkbox
                    id="clip-to-country"
                    checked={clipToCountry}
                    onCheckedChange={onClipToCountryChange}
                    disabled={isClipCheckboxDisabled}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{clipTooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Label htmlFor="clip-to-country">Clip map to selected country</Label>
        </div>
        */}
			</CardContent>
		</Card>
	);
}
