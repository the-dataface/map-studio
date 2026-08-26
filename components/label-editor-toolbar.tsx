'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type {
	StylingSettings,
	IndividualLabelOverride,
	SymbolLabelAlignment,
	DimensionSettings,
	ColumnType,
	ColumnFormat,
	DataRow,
	GeocodedRow,
	GeographyKey,
} from '@/app/(studio)/types';
import { labelAlignmentToAnchorBaseline, anchorBaselineToLabelAlignment } from '@/modules/map-preview/labels';
import { applyLabelOverrideUpdate } from '@/lib/label-overrides';
import type { StylingSettingsUpdater } from '@/lib/label-overrides';
import {
	labelHtmlToPlainText,
	resolveLabelDisplayText,
	resolveLabelTemplateText,
} from '@/lib/label-content';
import {
	getSymbolTextStyling,
	resolveSymbolTextDisplayText,
	resolveSymbolTextTemplateValue,
	type LabelMapType,
} from '@/lib/symbol-text-content';
import {
	studioPanelTitleClass,
	studioPanelStickyHeaderClass,
	studioHeaderIconButtonClass,
	studioInspectorSectionContentClass,
	studioToggleGroupClass,
	studioToggleGroupIconItemClass,
	studioAlignmentGroupClass,
	studioAlignmentAutoButtonClass,
	studioAlignmentButtonActiveClass,
} from '@/components/studio-panel';

const googleFontFamilies = [
	'Inter',
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
	onUpdateStylingSettings: (settings: StylingSettingsUpdater) => void;
	mapType: LabelMapType;
	dimensionSettings: DimensionSettings;
	symbolData: (DataRow | GeocodedRow)[];
	choroplethData: (DataRow | GeocodedRow)[];
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
	variant?: 'floating' | 'inspector';
}

export const LabelEditorToolbar: React.FC<LabelEditorToolbarProps> = ({
	labelId,
	onClose,
	stylingSettings,
	onUpdateStylingSettings,
	mapType,
	dimensionSettings,
	symbolData,
	choroplethData,
	columnTypes,
	columnFormats,
	selectedGeography,
	variant = 'inspector',
}) => {
	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleClose]);

	const isSymbolText = mapType === 'symbol-text';
	const symbolTextSettings = getSymbolTextStyling(stylingSettings);

	const symbolTextContentParams = useMemo(
		() => ({
			labelId: labelId ?? '',
			stylingSettings,
			symbolData,
			dimensionSettings,
			columnTypes,
			columnFormats,
			selectedGeography,
		}),
		[labelId, stylingSettings, symbolData, dimensionSettings, columnTypes, columnFormats, selectedGeography]
	);

	const labelContentParams = useMemo(
		() => ({
			labelId: labelId ?? '',
			mapType: isSymbolText ? ('symbol' as const) : mapType,
			dimensionSettings,
			stylingSettings,
			symbolData,
			choroplethData,
			columnTypes,
			columnFormats,
			selectedGeography,
		}),
		[
			labelId,
			mapType,
			isSymbolText,
			dimensionSettings,
			stylingSettings,
			symbolData,
			choroplethData,
			columnTypes,
			columnFormats,
			selectedGeography,
		]
	);

	const templatePlainText = useMemo(() => {
		if (!labelId) return '';
		if (isSymbolText) {
			return resolveSymbolTextTemplateValue(symbolTextContentParams);
		}
		return labelHtmlToPlainText(
			resolveLabelTemplateText({
				...labelContentParams,
				mapType: mapType === 'choropleth' ? 'choropleth' : 'symbol',
			})
		);
	}, [labelId, isSymbolText, symbolTextContentParams, labelContentParams, mapType]);

	const displayText = useMemo(() => {
		if (!labelId) return '';
		if (isSymbolText) {
			return resolveSymbolTextDisplayText(symbolTextContentParams);
		}
		return resolveLabelDisplayText({
			...labelContentParams,
			mapType: mapType === 'choropleth' ? 'choropleth' : 'symbol',
		});
	}, [labelId, isSymbolText, symbolTextContentParams, labelContentParams, mapType]);

	const [draftText, setDraftText] = useState('');

	useEffect(() => {
		setDraftText(displayText);
	}, [labelId, displayText]);

	if (!labelId) return null;

	const currentOverride = stylingSettings.individualLabelOverrides?.[labelId] || { id: labelId };
	const externalLabelDefaults = mapType === 'choropleth' ? stylingSettings.choropleth : stylingSettings.symbol;

	const defaultFontFamily = isSymbolText
		? symbolTextSettings.fontFamily
		: externalLabelDefaults.labelFontFamily || 'Inter';
	const overrideFontFamily = currentOverride.fontFamily;
	const fontFamily =
		overrideFontFamily && googleFontFamilies.includes(overrideFontFamily)
			? overrideFontFamily
			: googleFontFamilies.includes(defaultFontFamily)
				? defaultFontFamily
				: 'Inter';
	const fontWeight =
		currentOverride.fontWeight ??
		(isSymbolText ? (symbolTextSettings.fontBold ? 'bold' : 'normal') : externalLabelDefaults.labelBold ? 'bold' : 'normal');
	const fontStyle =
		currentOverride.fontStyle ??
		(isSymbolText
			? symbolTextSettings.fontItalic
				? 'italic'
				: 'normal'
			: externalLabelDefaults.labelItalic
				? 'italic'
				: 'normal');
	const fontSize =
		currentOverride.fontSize ??
		(isSymbolText ? symbolTextSettings.fontSize : externalLabelDefaults.labelFontSize);
	const fill =
		currentOverride.fill ??
		(isSymbolText ? symbolTextSettings.color : externalLabelDefaults.labelColor);
	const stroke =
		currentOverride.stroke ??
		(isSymbolText ? symbolTextSettings.outlineColor : externalLabelDefaults.labelOutlineColor);
	const strokeWidth =
		currentOverride.strokeWidth ??
		(isSymbolText ? symbolTextSettings.outlineThickness : externalLabelDefaults.labelOutlineThickness);

	const getTextDecoration = () => {
		if (currentOverride.textDecoration !== undefined) {
			return currentOverride.textDecoration;
		}
		if (isSymbolText) {
			return '';
		}
		const values: string[] = [];
		if (externalLabelDefaults.labelUnderline) values.push('underline');
		if (externalLabelDefaults.labelStrikethrough) values.push('line-through');
		return values.join(' ');
	};
	const textDecoration = getTextDecoration();
	const hasUnderline = textDecoration.includes('underline');
	const hasStrikethrough = textDecoration.includes('line-through');

	const getEffectiveLabelAlignment = (): SymbolLabelAlignment => {
		if (currentOverride.labelAlignment !== undefined) {
			return currentOverride.labelAlignment;
		}
		if (mapType === 'symbol' && 'labelAlignment' in externalLabelDefaults) {
			return (externalLabelDefaults as { labelAlignment: SymbolLabelAlignment }).labelAlignment;
		}
		return 'center';
	};

	const effectiveLabelAlignment = getEffectiveLabelAlignment();
	const alignment =
		currentOverride.textAnchor && currentOverride.dominantBaseline
			? {
					textAnchor: currentOverride.textAnchor,
					dominantBaseline: currentOverride.dominantBaseline,
				}
			: labelAlignmentToAnchorBaseline(
					effectiveLabelAlignment === 'auto' ? 'middle-right' : effectiveLabelAlignment
				);
	const offsetX = currentOverride.offsetX ?? 0;
	const offsetY = currentOverride.offsetY ?? 0;
	const isAutoAlignment = effectiveLabelAlignment === 'auto';

	const updateOverride = (updates: Partial<IndividualLabelOverride>) => {
		onUpdateStylingSettings((prev) => applyLabelOverrideUpdate(prev, labelId, updates));
	};

	const handleContentBlur = () => {
		if (draftText === templatePlainText) {
			updateOverride({ text: undefined });
			return;
		}
		updateOverride({ text: draftText });
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
		const inferredAlignment = anchorBaselineToLabelAlignment(textAnchor, dominantBaseline);
		updateOverride({
			textAnchor,
			dominantBaseline,
			labelAlignment: inferredAlignment,
			x: undefined,
			y: undefined,
		});
	};

	const handlePositionalAlignmentChange = (labelAlignment: SymbolLabelAlignment) => {
		if (labelAlignment === 'auto') {
			updateOverride({
				labelAlignment: 'auto',
				textAnchor: undefined,
				dominantBaseline: undefined,
				x: undefined,
				y: undefined,
			});
			return;
		}

		const { textAnchor, dominantBaseline } = labelAlignmentToAnchorBaseline(labelAlignment);
		updateOverride({
			labelAlignment,
			textAnchor,
			dominantBaseline,
			x: undefined,
			y: undefined,
		});
	};

	const editorTitle = isSymbolText ? 'Symbol text editor' : 'Label editor';
	const contentLabel = isSymbolText ? 'Symbol text content' : 'Label content';

	const formContent = (
		<>
			<div className="space-y-2">
				<Label htmlFor="label-content" className="text-xs">
					{contentLabel}
				</Label>
				<Textarea
					id="label-content"
					value={draftText}
					onChange={(e) => setDraftText(e.target.value)}
					onBlur={handleContentBlur}
					rows={3}
					className="min-h-[4.5rem] resize-y text-sm"
					placeholder="Enter label text…"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="label-font-family" className="text-xs">
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

			<ToggleGroup
				type="multiple"
				value={
					[
						fontWeight === 'bold' && 'bold',
						fontStyle === 'italic' && 'italic',
						!isSymbolText && hasUnderline && 'underline',
						!isSymbolText && hasStrikethrough && 'strikethrough',
					].filter(Boolean) as string[]
				}
				onValueChange={(values) => {
					const nextWeight = values.includes('bold') ? 'bold' : 'normal';
					const nextStyle = values.includes('italic') ? 'italic' : 'normal';
					const underline = values.includes('underline');
					const strikethrough = values.includes('strikethrough');
					const textDecorationValues: string[] = [];
					if (underline) textDecorationValues.push('underline');
					if (strikethrough) textDecorationValues.push('line-through');
					updateOverride({
						fontWeight: nextWeight,
						fontStyle: nextStyle,
						textDecoration: isSymbolText ? '' : textDecorationValues.join(' ') || '',
					});
				}}
				className={studioToggleGroupClass}>
				<ToggleGroupItem value="bold" aria-label="Toggle bold" className={studioToggleGroupIconItemClass}>
					<Bold className="h-3.5 w-3.5" />
				</ToggleGroupItem>
				<ToggleGroupItem value="italic" aria-label="Toggle italic" className={studioToggleGroupIconItemClass}>
					<Italic className="h-3.5 w-3.5" />
				</ToggleGroupItem>
				{!isSymbolText && (
					<>
						<ToggleGroupItem value="underline" aria-label="Toggle underline" className={studioToggleGroupIconItemClass}>
							<Underline className="h-3.5 w-3.5" />
						</ToggleGroupItem>
						<ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough" className={studioToggleGroupIconItemClass}>
							<Strikethrough className="h-3.5 w-3.5" />
						</ToggleGroupItem>
					</>
				)}
			</ToggleGroup>

			{!isSymbolText && (
				<div className="space-y-2">
					<Label className="text-xs">Text alignment</Label>
				<ToggleGroup
					type="single"
					value={alignment.textAnchor}
					onValueChange={(value) => {
						if (value) {
							handleAlignmentChange(value as 'start' | 'middle' | 'end', alignment.dominantBaseline);
						}
					}}
					className={studioToggleGroupClass}>
					<ToggleGroupItem value="start" aria-label="Align left" className={studioToggleGroupIconItemClass}>
						<AlignLeft className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="middle" aria-label="Align center" className={studioToggleGroupIconItemClass}>
						<AlignCenter className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="end" aria-label="Align right" className={studioToggleGroupIconItemClass}>
						<AlignRight className="h-3.5 w-3.5" />
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="label-color" className="text-xs">
					{isSymbolText ? 'Text color' : 'Label color'}
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
				<Label htmlFor="label-outline-color" className="text-xs">
					Label outline color
				</Label>
				<ColorInput
					value={stroke}
					onChange={(value) => updateOverride({ stroke: value })}
					showContrastCheck={true}
					backgroundColor={fill}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="label-font-size" className="text-xs">
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
				<Label htmlFor="label-outline-thickness" className="text-xs">
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

			{mapType === 'symbol' && (
				<div className="space-y-2">
					<Label className="text-xs">Full alignment</Label>
					<div className={studioAlignmentGroupClass}>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								studioAlignmentAutoButtonClass,
								isAutoAlignment ? 'bg-muted/60 text-foreground' : 'bg-transparent text-muted-foreground'
							)}
							onClick={() => handlePositionalAlignmentChange('auto')}>
							<Sparkles className="h-4 w-4 mr-2" /> Auto
						</Button>
						{(
							[
								{ value: 'top-left' as const, icon: ArrowUpLeft },
								{ value: 'top-center' as const, icon: ArrowUp },
								{ value: 'top-right' as const, icon: ArrowUpRight },
								{ value: 'middle-left' as const, icon: ArrowLeft },
								{ value: 'center' as const, icon: Minus },
								{ value: 'middle-right' as const, icon: ArrowRight },
								{ value: 'bottom-left' as const, icon: ArrowDownLeft },
								{ value: 'bottom-center' as const, icon: ArrowDown },
								{ value: 'bottom-right' as const, icon: ArrowDownRight },
							] as const
						).map((item) => (
							<Button
								key={item.value}
								variant="ghost"
								size="icon"
								className={studioAlignmentButtonActiveClass(effectiveLabelAlignment === item.value)}
								onClick={() => handlePositionalAlignmentChange(item.value)}>
								<item.icon className="h-4 w-4" />
							</Button>
						))}
					</div>
				</div>
			)}

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="label-offset-x" className="text-xs">
						X offset ({offsetX}px)
					</Label>
					<Slider
						id="label-offset-x"
						value={[offsetX]}
						onValueChange={(value) => updateOverride({ offsetX: value[0], x: undefined, y: undefined })}
						min={-50}
						max={50}
						step={1}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="label-offset-y" className="text-xs">
						Y offset ({offsetY}px)
					</Label>
					<Slider
						id="label-offset-y"
						value={[offsetY]}
						onValueChange={(value) => updateOverride({ offsetY: value[0], x: undefined, y: undefined })}
						min={-50}
						max={50}
						step={1}
					/>
				</div>
			</div>
		</>
	);

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
			<Button variant="ghost" size="icon" onClick={handleClose} className={studioHeaderIconButtonClass} title="Close">
				<X className="h-4 w-4" />
			</Button>
		</div>
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
						<h2 className={studioPanelTitleClass}>{editorTitle}</h2>
						<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{labelId}</p>
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
					<CardTitle className="text-sm font-medium">{editorTitle}</CardTitle>
					{headerActions}
				</div>
				<div className="mt-1 text-xs text-muted-foreground">
					Editing: <span className="font-medium text-foreground">{labelId}</span>
				</div>
			</CardHeader>
			<CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">{formContent}</CardContent>
		</Card>
	);
};
