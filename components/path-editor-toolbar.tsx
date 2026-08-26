'use client';

import React, { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorInput } from '@/components/color-input';
import { X, RotateCcw, ArrowRight, ArrowLeft, Square, Circle, ArrowUpDown, Copy, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StylingSettings, DrawnPath, PathMarkerType } from '@/app/(studio)/types';
import {
	studioPanelTitleClass,
	studioPanelStickyHeaderClass,
	studioHeaderIconButtonClass,
	studioInspectorSectionContentClass,
	studioOutlineButtonClass,
} from '@/components/studio-panel';

interface PathEditorToolbarProps {
	pathId: string | null;
	onClose: () => void;
	stylingSettings: StylingSettings;
	onUpdateStylingSettings: (settings: StylingSettings) => void;
	variant?: 'floating' | 'inspector';
}

export const PathEditorToolbar: React.FC<PathEditorToolbarProps> = ({
	pathId,
	onClose,
	stylingSettings,
	onUpdateStylingSettings,
	variant = 'inspector',
}) => {
	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	const handleDelete = useCallback(() => {
		const currentPaths = stylingSettings.drawnPaths || [];
		const updatedPaths = currentPaths.filter((p) => p.id !== pathId);

		onUpdateStylingSettings({
			...stylingSettings,
			drawnPaths: updatedPaths,
		});

		// Close the panel after deletion
		handleClose();
	}, [pathId, stylingSettings, onUpdateStylingSettings, handleClose]);

	// Handle ESC key to close panel and Delete key to delete path
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in an input, textarea, or contenteditable element
			const target = e.target as HTMLElement;
			const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

			if (isInputElement) return;

			if (e.key === 'Escape') {
				handleClose();
			} else if (e.key === 'Delete' || e.key === 'Backspace') {
				handleDelete();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleClose, handleDelete]);

	if (!pathId) return null;

	// Find the selected path
	const currentPath = stylingSettings.drawnPaths?.find((p) => p.id === pathId);
	if (!currentPath) return null;

	// Get default styles
	const defaultStyles = stylingSettings.defaultPathStyles || {
		stroke: '#000000',
		strokeWidth: 2,
		strokeDasharray: '0',
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		fill: 'none',
		opacity: 1,
	};

	// Get current values (use path values if set, otherwise defaults)
	const stroke = currentPath.stroke ?? defaultStyles.stroke ?? '#000000';
	const strokeWidth = currentPath.strokeWidth ?? defaultStyles.strokeWidth ?? 2;
	const strokeDasharray = currentPath.strokeDasharray ?? defaultStyles.strokeDasharray ?? '0';
	const strokeLinejoin = currentPath.strokeLinejoin ?? defaultStyles.strokeLinejoin ?? 'round';
	const strokeOutline = currentPath.strokeOutline ?? 'none';
	const strokeOutlineWidth = currentPath.strokeOutlineWidth ?? 0;
	const startMarker = currentPath.startMarker ?? 'none';
	const endMarker = currentPath.endMarker ?? 'none';
	const borderRadius = currentPath.borderRadius ?? 0;

	// Parse dash array
	const dashArrayValue = strokeDasharray === 'none' || strokeDasharray === '0' ? '0' : strokeDasharray;
	const dashParts = dashArrayValue.split(/[\s,]+/).filter(Boolean);
	const dashOn = dashParts.length > 0 ? parseFloat(dashParts[0]) || 0 : 0;
	const dashOff = dashParts.length > 1 ? parseFloat(dashParts[1]) || dashOn : dashOn;

	const updatePath = (updates: Partial<DrawnPath>) => {
		const currentPaths = stylingSettings.drawnPaths || [];
		const pathIndex = currentPaths.findIndex((p) => p.id === pathId);
		if (pathIndex === -1) return;

		const updatedPaths = [...currentPaths];
		updatedPaths[pathIndex] = {
			...updatedPaths[pathIndex],
			...updates,
		};

		onUpdateStylingSettings({
			...stylingSettings,
			drawnPaths: updatedPaths,
		});
	};

	const applyToAll = () => {
		const currentPaths = stylingSettings.drawnPaths || [];
		const pathIndex = currentPaths.findIndex((p) => p.id === pathId);
		if (pathIndex === -1) return;

		const sourcePath = currentPaths[pathIndex];
		const updatedPaths = currentPaths.map((path) => ({
			...path,
			stroke: sourcePath.stroke,
			strokeWidth: sourcePath.strokeWidth,
			strokeDasharray: sourcePath.strokeDasharray,
			strokeLinejoin: sourcePath.strokeLinejoin,
			strokeOutline: sourcePath.strokeOutline,
			strokeOutlineWidth: sourcePath.strokeOutlineWidth,
			startMarker: sourcePath.startMarker,
			endMarker: sourcePath.endMarker,
			borderRadius: sourcePath.borderRadius,
		}));

		onUpdateStylingSettings({
			...stylingSettings,
			drawnPaths: updatedPaths,
		});
	};

	const resetToDefaults = () => {
		const currentPaths = stylingSettings.drawnPaths || [];
		const pathIndex = currentPaths.findIndex((p) => p.id === pathId);
		if (pathIndex === -1) return;

		const updatedPaths = [...currentPaths];
		const path = updatedPaths[pathIndex];
		// Remove style overrides, keep only points
		updatedPaths[pathIndex] = {
			id: path.id,
			points: path.points,
		};

		onUpdateStylingSettings({
			...stylingSettings,
			drawnPaths: updatedPaths,
		});
	};

	const swapMarkers = () => {
		updatePath({
			startMarker: endMarker,
			endMarker: startMarker,
		});
	};

	const renderMarkerIcon = (marker: PathMarkerType, isStart: boolean = false) => {
		switch (marker) {
			case 'line-arrow':
				return isStart ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />;
			case 'triangle-arrow':
				return isStart ? (
					<ArrowLeft className="h-4 w-4 fill-current" />
				) : (
					<ArrowRight className="h-4 w-4 fill-current" />
				);
			case 'open-circle':
				return <Circle className="h-4 w-4" />;
			case 'closed-circle':
				return <Circle className="h-4 w-4 fill-current" />;
			case 'square':
				return <Square className="h-4 w-4 fill-current" />;
			case 'round':
				return <Minus className="h-4 w-4" />;
			default:
				return <X className="h-4 w-4" />;
		}
	};

	const headerActions = (
		<div className="flex shrink-0 items-center gap-1.5">
			<Button
				variant="ghost"
				size="icon"
				onClick={resetToDefaults}
				className={studioHeaderIconButtonClass}
				title="Reset to defaults">
				<RotateCcw className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={handleDelete}
				className={cn(studioHeaderIconButtonClass, 'text-destructive hover:!text-destructive')}
				title="Delete path (Del)">
				<Trash2 className="h-4 w-4" />
			</Button>
			<Button variant="ghost" size="icon" onClick={handleClose} className={studioHeaderIconButtonClass} title="Close">
				<X className="h-4 w-4" />
			</Button>
		</div>
	);

	const formContent = (
		<>
			<Button onClick={applyToAll} variant="outline" className={cn('w-full', studioOutlineButtonClass)}>
				<Copy className="h-4 w-4 mr-2" />
				Apply to all paths
			</Button>

			<div className="space-y-2">
				<Label htmlFor="path-stroke-color" className="text-xs">
					Stroke color
				</Label>
				<ColorInput value={stroke} onChange={(value) => updatePath({ stroke: value })} showContrastCheck={false} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="path-stroke-width" className="text-xs">
					Stroke width ({strokeWidth}px)
				</Label>
				<Slider
					id="path-stroke-width"
					value={[strokeWidth]}
					onValueChange={(value) => updatePath({ strokeWidth: value[0] })}
					min={0.5}
					max={20}
					step={0.5}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="path-stroke-outline-color" className="text-xs">
					Stroke outline color
				</Label>
				<ColorInput
					value={strokeOutline === 'none' ? '#000000' : strokeOutline}
					onChange={(value) => updatePath({ strokeOutline: value === '#000000' ? 'none' : value })}
					showContrastCheck={false}
				/>
			</div>

			{strokeOutline !== 'none' && (
				<div className="space-y-2">
					<Label htmlFor="path-stroke-outline-width" className="text-xs">
						Outline width ({strokeOutlineWidth}px)
					</Label>
					<Slider
						id="path-stroke-outline-width"
						value={[strokeOutlineWidth]}
						onValueChange={(value) => updatePath({ strokeOutlineWidth: value[0] })}
						min={0}
						max={10}
						step={0.5}
					/>
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="path-stroke-join" className="text-xs">
					Stroke join
				</Label>
				<Select
					value={strokeLinejoin}
					onValueChange={(value) => updatePath({ strokeLinejoin: value as 'miter' | 'round' | 'bevel' })}>
					<SelectTrigger id="path-stroke-join">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="miter">Miter</SelectItem>
						<SelectItem value="round">Round</SelectItem>
						<SelectItem value="bevel">Bevel</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="path-dash-on" className="text-xs">
						Dash on ({dashOn}px)
					</Label>
					<Slider
						id="path-dash-on"
						value={[dashOn]}
						onValueChange={(value) => {
							const newDashOn = value[0];
							const newDashArray = newDashOn === 0 ? '0' : `${newDashOn} ${dashOff}`;
							updatePath({ strokeDasharray: newDashArray });
						}}
						min={0}
						max={20}
						step={0.5}
					/>
				</div>
				{dashOn > 0 && (
					<div className="space-y-2">
						<Label htmlFor="path-dash-off" className="text-xs">
							Dash off ({dashOff}px)
						</Label>
						<Slider
							id="path-dash-off"
							value={[dashOff]}
							onValueChange={(value) => {
								const newDashOff = value[0];
								updatePath({ strokeDasharray: `${dashOn} ${newDashOff}` });
							}}
							min={0}
							max={20}
							step={0.5}
						/>
					</div>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="path-start-marker" className="text-xs">
					Start marker
				</Label>
				<Select value={startMarker} onValueChange={(value) => updatePath({ startMarker: value as PathMarkerType })}>
					<SelectTrigger id="path-start-marker" className="flex items-center gap-2">
						<SelectValue>
							<div className="flex items-center gap-2">
								{renderMarkerIcon(startMarker, true)}
								<span className="capitalize">{startMarker.replace('-', ' ')}</span>
							</div>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">
							<div className="flex items-center gap-2">
								<X className="h-4 w-4" />
								<span>None</span>
							</div>
						</SelectItem>
						<SelectItem value="line-arrow">
							<div className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								<span>Line arrow</span>
							</div>
						</SelectItem>
						<SelectItem value="triangle-arrow">
							<div className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4 fill-current" />
								<span>Triangle arrow</span>
							</div>
						</SelectItem>
						<SelectItem value="open-circle">
							<div className="flex items-center gap-2">
								<Circle className="h-4 w-4" />
								<span>Open circle</span>
							</div>
						</SelectItem>
						<SelectItem value="closed-circle">
							<div className="flex items-center gap-2">
								<Circle className="h-4 w-4 fill-current" />
								<span>Closed circle</span>
							</div>
						</SelectItem>
						<SelectItem value="square">
							<div className="flex items-center gap-2">
								<Square className="h-4 w-4 fill-current" />
								<span>Square</span>
							</div>
						</SelectItem>
						<SelectItem value="round">
							<div className="flex items-center gap-2">
								<Minus className="h-4 w-4" />
								<span>Round</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="path-end-marker" className="text-xs">
						End marker
					</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={swapMarkers}
						className="h-7 rounded-none px-2 text-xs shadow-none hover:!shadow-none"
						title="Swap start and end markers">
						<ArrowUpDown className="h-3 w-3 mr-1" />
						Swap
					</Button>
				</div>
				<Select value={endMarker} onValueChange={(value) => updatePath({ endMarker: value as PathMarkerType })}>
					<SelectTrigger id="path-end-marker" className="flex items-center gap-2">
						<SelectValue>
							<div className="flex items-center gap-2">
								{renderMarkerIcon(endMarker, false)}
								<span className="capitalize">{endMarker.replace('-', ' ')}</span>
							</div>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">
							<div className="flex items-center gap-2">
								<X className="h-4 w-4" />
								<span>None</span>
							</div>
						</SelectItem>
						<SelectItem value="line-arrow">
							<div className="flex items-center gap-2">
								<ArrowRight className="h-4 w-4" />
								<span>Line arrow</span>
							</div>
						</SelectItem>
						<SelectItem value="triangle-arrow">
							<div className="flex items-center gap-2">
								<ArrowRight className="h-4 w-4 fill-current" />
								<span>Triangle arrow</span>
							</div>
						</SelectItem>
						<SelectItem value="open-circle">
							<div className="flex items-center gap-2">
								<Circle className="h-4 w-4" />
								<span>Open circle</span>
							</div>
						</SelectItem>
						<SelectItem value="closed-circle">
							<div className="flex items-center gap-2">
								<Circle className="h-4 w-4 fill-current" />
								<span>Closed circle</span>
							</div>
						</SelectItem>
						<SelectItem value="square">
							<div className="flex items-center gap-2">
								<Square className="h-4 w-4 fill-current" />
								<span>Square</span>
							</div>
						</SelectItem>
						<SelectItem value="round">
							<div className="flex items-center gap-2">
								<Minus className="h-4 w-4" />
								<span>Round</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="path-border-radius" className="text-xs">
					Border radius ({borderRadius}px)
				</Label>
				<Slider
					id="path-border-radius"
					value={[borderRadius]}
					onValueChange={(value) => updatePath({ borderRadius: value[0] })}
					min={0}
					max={20}
					step={0.5}
				/>
			</div>
		</>
	);

	if (variant === 'inspector') {
		return (
			<div className="studio-map-editor-panel flex min-h-0 flex-1 flex-col bg-background">
				<div
					className={cn(
						studioPanelStickyHeaderClass,
						'flex min-h-12 items-center justify-between gap-3 border-b border-border/40 px-4'
					)}>
					<div className="min-w-0">
						<h2 className={studioPanelTitleClass}>Path editor</h2>
						<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{pathId}</p>
					</div>
					{headerActions}
				</div>
				<div className={cn(studioInspectorSectionContentClass, 'min-h-0 flex-1 space-y-4 overflow-y-auto')}>
					{formContent}
				</div>
			</div>
		);
	}

	return (
		<Card className="fixed left-4 top-4 bottom-4 z-50 flex w-[380px] flex-col overflow-visible rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur">
			<CardHeader className="flex-shrink-0 border-b pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">Path Editor</CardTitle>
					{headerActions}
				</div>
				<div className="mt-1 text-xs text-muted-foreground">
					Editing: <span className="font-medium text-foreground">{pathId}</span>
				</div>
			</CardHeader>
			<CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">{formContent}</CardContent>
		</Card>
	);
};
