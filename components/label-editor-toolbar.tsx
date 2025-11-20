'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ColorInput } from '@/components/color-input';
import {
	X,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	RotateCcw,
	Sparkles,
	ArrowUpLeft,
	ArrowUp,
	ArrowUpRight,
	ArrowLeft,
	Minus,
	ArrowRight,
	ArrowDownLeft,
	ArrowDown,
	ArrowDownRight,
	AlignLeft,
	AlignCenter,
	AlignRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StylingSettings, IndividualLabelOverride } from '@/app/(studio)/types';

const googleFontFamilies = [
	'Inter', // Default
	'Roboto',
	'Open Sans',
	'Lato',
	'Montserrat',
	'Oswald',
	'Playfair Display',
	'Merriweather',
	'Raleway',
	'Poppins',
	'Source Sans Pro',
];

interface LabelEditorToolbarProps {
	labelId: string | null;
	onClose: () => void;
	stylingSettings: StylingSettings;
	onUpdateStylingSettings: (settings: StylingSettings) => void;
	mapType: 'symbol' | 'choropleth';
}

export const LabelEditorToolbar: React.FC<LabelEditorToolbarProps> = ({
	labelId,
	onClose,
	stylingSettings,
	onUpdateStylingSettings,
	mapType,
}) => {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
		}, 300); // Match animation duration
	}, [onClose]);

	// Handle ESC key to close panel
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleClose]);

	if (!labelId) return null;

	// Get current override or create empty one
	const currentOverride = stylingSettings.individualLabelOverrides?.[labelId] || { id: labelId };

	// Determine which default settings to use based on map type
	const defaultSettings = mapType === 'symbol' ? stylingSettings.symbol : stylingSettings.choropleth;

	// Get current values (override if exists, otherwise use defaults)
	// Ensure fontFamily is a valid value from googleFontFamilies
	const defaultFontFamily = defaultSettings.labelFontFamily || 'Inter';
	const overrideFontFamily = currentOverride.fontFamily;
	const fontFamily =
		overrideFontFamily && googleFontFamilies.includes(overrideFontFamily)
			? overrideFontFamily
			: googleFontFamilies.includes(defaultFontFamily)
			? defaultFontFamily
			: 'Inter';
	const fontWeight = currentOverride.fontWeight ?? (defaultSettings.labelBold ? 'bold' : 'normal');
	const fontStyle = currentOverride.fontStyle ?? (defaultSettings.labelItalic ? 'italic' : 'normal');
	const fontSize = currentOverride.fontSize ?? defaultSettings.labelFontSize;
	const fill = currentOverride.fill ?? defaultSettings.labelColor;
	const stroke = currentOverride.stroke ?? defaultSettings.labelOutlineColor;
	const strokeWidth = currentOverride.strokeWidth ?? defaultSettings.labelOutlineThickness;

	// Parse textDecoration from override or defaults
	const getTextDecoration = () => {
		if (currentOverride.textDecoration !== undefined) {
			return currentOverride.textDecoration;
		}
		const values: string[] = [];
		if (defaultSettings.labelUnderline) values.push('underline');
		if (defaultSettings.labelStrikethrough) values.push('line-through');
		return values.join(' ');
	};
	const textDecoration = getTextDecoration();
	const hasUnderline = textDecoration.includes('underline');
	const hasStrikethrough = textDecoration.includes('line-through');

	// For alignment, we need to convert from labelAlignment to textAnchor/dominantBaseline
	const getAlignmentFromOverride = () => {
		if (currentOverride.textAnchor && currentOverride.dominantBaseline) {
			return {
				textAnchor: currentOverride.textAnchor,
				dominantBaseline: currentOverride.dominantBaseline,
			};
		}
		// Convert from labelAlignment if it's a symbol label
		if (mapType === 'symbol' && 'labelAlignment' in defaultSettings) {
			const alignment = (defaultSettings as any).labelAlignment;
			if (!alignment || alignment === 'auto')
				return { textAnchor: 'start' as const, dominantBaseline: 'middle' as const };
			const parts = String(alignment).split('-');
			const vertical = parts[0]; // top, middle, bottom
			const horizontal = parts[1]; // left, center, right

			let textAnchor: 'start' | 'middle' | 'end' = 'start';
			let dominantBaseline: 'baseline' | 'middle' | 'hanging' = 'middle';

			if (horizontal === 'left') textAnchor = 'end';
			else if (horizontal === 'center') textAnchor = 'middle';
			else if (horizontal === 'right') textAnchor = 'start';

			if (vertical === 'top') dominantBaseline = 'baseline';
			else if (vertical === 'middle') dominantBaseline = 'middle';
			else if (vertical === 'bottom') dominantBaseline = 'hanging';

			return { textAnchor, dominantBaseline };
		}
		return { textAnchor: 'middle' as const, dominantBaseline: 'middle' as const };
	};

	const alignment = getAlignmentFromOverride();

	const updateOverride = (updates: Partial<IndividualLabelOverride>) => {
		const currentOverrides = stylingSettings.individualLabelOverrides || {};
		const updatedOverrides = {
			...currentOverrides,
			[labelId]: {
				...currentOverrides[labelId],
				id: labelId,
				...updates,
			},
		};

		onUpdateStylingSettings({
			...stylingSettings,
			individualLabelOverrides: updatedOverrides,
		});
	};

	const resetToDefaults = () => {
		const currentOverrides = stylingSettings.individualLabelOverrides || {};
		const updatedOverrides = { ...currentOverrides };
		delete updatedOverrides[labelId];

		onUpdateStylingSettings({
			...stylingSettings,
			individualLabelOverrides: updatedOverrides,
		});
	};

	const handleAlignmentChange = (
		textAnchor: 'start' | 'middle' | 'end',
		dominantBaseline: 'baseline' | 'middle' | 'hanging'
	) => {
		updateOverride({ textAnchor, dominantBaseline });
	};

	return (
		<Card
			className={cn(
				'fixed left-4 top-4 bottom-4 z-50 shadow-xl border border-border bg-background/95 backdrop-blur',
				'w-[380px] rounded-xl overflow-visible flex flex-col transition-all duration-300',
				isClosing
					? 'translate-x-[-100%] opacity-0'
					: 'translate-x-0 opacity-100 animate-in slide-in-from-left fade-in-0'
			)}>
			<CardHeader className="pb-3 flex-shrink-0 border-b">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">Label Editor</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							size="icon"
							onClick={resetToDefaults}
							className="h-8 w-8 rounded-full"
							title="Reset to defaults">
							<RotateCcw className="h-4 w-4" />
						</Button>
						<Button
							variant="secondary"
							size="icon"
							onClick={handleClose}
							className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80">
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div className="text-xs text-muted-foreground mt-1">
					Editing: <span className="font-medium text-foreground">{labelId}</span>
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto pt-4 space-y-6">
				{/* Font Family */}
				<div className="space-y-2">
					<Label htmlFor="label-font-family" className="text-sm">
						Font family
					</Label>
					<Select value={fontFamily || 'Inter'} onValueChange={(value) => updateOverride({ fontFamily: value })}>
						<SelectTrigger id="label-font-family">
							<SelectValue placeholder="Inter" />
						</SelectTrigger>
						<SelectContent>
							{googleFontFamilies.map((font) => (
								<SelectItem key={font} value={font} style={{ fontFamily: font }}>
									{font}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Font Style and Alignment */}
				<div className="space-y-4">
					<div>
						<ToggleGroup
							type="multiple"
							value={
								[
									fontWeight === 'bold' && 'bold',
									fontStyle === 'italic' && 'italic',
									hasUnderline && 'underline',
									hasStrikethrough && 'strikethrough',
								].filter(Boolean) as string[]
							}
							onValueChange={(values) => {
								const fontWeight = values.includes('bold') ? 'bold' : 'normal';
								const fontStyle = values.includes('italic') ? 'italic' : 'normal';
								const underline = values.includes('underline');
								const strikethrough = values.includes('strikethrough');

								// Build textDecoration value
								const textDecorationValues: string[] = [];
								if (underline) textDecorationValues.push('underline');
								if (strikethrough) textDecorationValues.push('line-through');
								const textDecoration = textDecorationValues.join(' ') || '';

								// Update all at once to avoid overwriting
								updateOverride({
									fontWeight,
									fontStyle,
									textDecoration,
								});
							}}
							className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
							<ToggleGroupItem
								value="bold"
								aria-label="Toggle bold"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<Bold className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="italic"
								aria-label="Toggle italic"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<Italic className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="underline"
								aria-label="Toggle underline"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<Underline className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="strikethrough"
								aria-label="Toggle strikethrough"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<Strikethrough className="h-4 w-4" />
							</ToggleGroupItem>
						</ToggleGroup>
					</div>

					{/* Horizontal Alignment Toggle */}
					<div>
						<ToggleGroup
							type="single"
							value={alignment.textAnchor}
							onValueChange={(value) => {
								if (value) {
									handleAlignmentChange(value as 'start' | 'middle' | 'end', alignment.dominantBaseline);
								}
							}}
							className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
							<ToggleGroupItem
								value="start"
								aria-label="Align left"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<AlignLeft className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="middle"
								aria-label="Align center"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<AlignCenter className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="end"
								aria-label="Align right"
								className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full">
								<AlignRight className="h-4 w-4" />
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
				</div>

				{/* Colors */}
				<div className="grid grid-cols-1 gap-4">
					<div className="space-y-2">
						<Label htmlFor="label-color" className="text-sm">
							Label color
						</Label>
						<ColorInput
							value={fill}
							onChange={(value) => updateOverride({ fill: value })}
							showContrastCheck={true}
							backgroundColor={stylingSettings.base.mapBackgroundColor}
							isLargeText={fontSize >= 18}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="label-outline-color" className="text-sm">
							Label outline color
						</Label>
						<ColorInput
							value={stroke}
							onChange={(value) => updateOverride({ stroke: value })}
							showContrastCheck={true}
							backgroundColor={fill}
						/>
					</div>
				</div>

				{/* Font Size and Outline Thickness */}
				<div className="grid grid-cols-1 gap-4">
					<div className="space-y-2">
						<Label htmlFor="label-font-size" className="text-sm">
							Font size ({fontSize}px)
						</Label>
						<Slider
							id="label-font-size"
							value={[fontSize]}
							onValueChange={(value) => updateOverride({ fontSize: value[0] })}
							min={8}
							max={30}
							step={1}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="label-outline-thickness" className="text-sm">
							Outline thickness ({strokeWidth}px)
						</Label>
						<Slider
							id="label-outline-thickness"
							value={[strokeWidth]}
							onValueChange={(value) => updateOverride({ strokeWidth: value[0] })}
							min={0}
							max={10}
							step={0.5}
						/>
					</div>
				</div>

				{/* Full Alignment Grid - only for symbol labels */}
				{mapType === 'symbol' && (
					<div className="space-y-2">
						<Label className="text-sm">Full Alignment</Label>
						<div className="grid grid-cols-3 gap-1 w-fit rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
							<Button
								className={cn(
									'h-8 col-span-3 rounded-md transition-all duration-200',
									alignment.textAnchor === 'start' && alignment.dominantBaseline === 'middle'
										? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
										: 'bg-transparent text-muted-foreground',
									'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white'
								)}
								onClick={() => handleAlignmentChange('start', 'middle')}>
								<Sparkles className="h-4 w-4 mr-2" /> Auto
							</Button>
							{[
								{ textAnchor: 'end' as const, dominantBaseline: 'baseline' as const, icon: ArrowUpLeft },
								{ textAnchor: 'middle' as const, dominantBaseline: 'baseline' as const, icon: ArrowUp },
								{ textAnchor: 'start' as const, dominantBaseline: 'baseline' as const, icon: ArrowUpRight },
								{ textAnchor: 'end' as const, dominantBaseline: 'middle' as const, icon: ArrowLeft },
								{ textAnchor: 'middle' as const, dominantBaseline: 'middle' as const, icon: Minus },
								{ textAnchor: 'start' as const, dominantBaseline: 'middle' as const, icon: ArrowRight },
								{ textAnchor: 'end' as const, dominantBaseline: 'hanging' as const, icon: ArrowDownLeft },
								{ textAnchor: 'middle' as const, dominantBaseline: 'hanging' as const, icon: ArrowDown },
								{ textAnchor: 'start' as const, dominantBaseline: 'hanging' as const, icon: ArrowDownRight },
							].map((item, index) => (
								<Button
									key={index}
									className={cn(
										'h-8 w-8 p-2 rounded-md transition-all duration-200',
										alignment.textAnchor === item.textAnchor && alignment.dominantBaseline === item.dominantBaseline
											? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
											: 'bg-transparent text-muted-foreground',
										'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white'
									)}
									onClick={() => handleAlignmentChange(item.textAnchor, item.dominantBaseline)}>
									<item.icon className="h-4 w-4" />
								</Button>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
