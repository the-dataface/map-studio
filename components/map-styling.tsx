/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */
'use client';

import { Input } from '@/components/ui/input';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'; // Import Tooltip components
import { toast } from '@/components/ui/use-toast'; // Import toast
import {
	ChevronDown,
	ChevronUp,
	Palette,
	Map,
	Type,
	Trash2,
	Save,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Square,
	Circle,
	ArrowUpLeft,
	ArrowUp,
	ArrowUpRight,
	ArrowLeft,
	Minus,
	ArrowRight,
	ArrowDownLeft,
	ArrowDown,
	ArrowDownRight,
	LandPlot,
	Sparkles,
	Play,
	Diamond,
	Triangle,
	Code,
	CheckCircle,
	Hash,
} from 'lucide-react';
import { ColorInput } from '@/components/color-input';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs for saved styles
import { cn } from '@/lib/utils';
import { getSymbolTextStyling } from '@/lib/symbol-text-content';
import {
	studioPanelClass,
	studioSubPanelClass,
	studioSubPanelHeaderClass,
	studioSubPanelTitleClass,
	studioSubPanelContentClass,
	studioTabBarClass,
	studioTabButtonClass,
	studioTabToggleClass,
	studioToggleGroupClass,
	studioToggleGroupItemClass,
	studioToggleGroupIconItemClass,
	studioAlignmentGroupClass,
	studioAlignmentButtonClass,
	studioAlignmentAutoButtonClass,
	studioAlignmentButtonActiveClass,
	studioPrimaryButtonClass,
	StudioExpandableHeader,
	StudioInspectorBlock,
	StudioInspectorSection,
	type StudioPanelVariant,
} from '@/components/studio-panel';

// Define interfaces for props and internal state
interface StylingSettings {
	activeTab: 'base' | 'symbol' | 'choropleth';
	base: {
		mapBackgroundColor: string;
		nationFillColor: string;
		nationStrokeColor: string;
		nationStrokeWidth: number;
		defaultStateFillColor: string;
		defaultStateStrokeColor: string; // Corrected type to string
		defaultStateStrokeWidth: number;
		savedStyles: Array<{
			id: string;
			name: string;
			type: 'preset' | 'user';
			settings: {
				mapBackgroundColor: string;
				nationFillColor: string;
				nationStrokeColor: string;
				nationStrokeWidth: number;
				defaultStateFillColor: string;
				defaultStateStrokeColor: string; // Corrected type to string
				defaultStateStrokeWidth: number;
			};
		}>;
		settings?: {
			mapBackgroundColor: string;
			nationFillColor: string;
			nationStrokeColor: string;
			nationStrokeWidth: number;
			defaultStateFillColor: string;
			defaultStateStrokeColor: string;
			defaultStateStrokeWidth: number;
		};
	};
	symbol: {
		symbolType: 'symbol' | 'spike' | 'arrow';
		symbolShape:
			| 'circle'
			| 'square'
			| 'diamond'
			| 'triangle'
			| 'triangle-down'
			| 'hexagon'
			| 'map-marker'
			| 'custom-svg';
		symbolFillColor: string;
		symbolStrokeColor: string;
		symbolSize: number;
		symbolStrokeWidth: number;
		symbolFillTransparency?: number;
		symbolStrokeTransparency?: number;
		labelFontFamily: string;
		labelBold: boolean;
		labelItalic: boolean;
		labelUnderline: boolean;
		labelStrikethrough: boolean;
		labelColor: string;
		labelOutlineColor: string;
		labelFontSize: number;
		labelOutlineThickness: number;
		labelOffsetX: number;
		labelOffsetY: number;
		labelAlignment:
			| 'auto'
			| 'top-left'
			| 'top-center'
			| 'top-right'
			| 'middle-left'
			| 'center'
			| 'middle-right'
			| 'bottom-left'
			| 'bottom-center'
			| 'bottom-right';
		customSvgPath?: string; // NEW: Add customSvgPath
		symbolText?: {
			fontFamily: string;
			fontBold: boolean;
			fontItalic: boolean;
			fontSize: number;
			color: string;
			outlineColor: string;
			outlineThickness: number;
			offsetX: number;
			offsetY: number;
			scaleWithSymbol: boolean;
		};
	};
	choropleth: {
		labelFontFamily: string;
		labelBold: boolean;
		labelItalic: boolean;
		labelUnderline: boolean;
		labelStrikethrough: boolean;
		labelColor: string;
		labelOutlineColor: string;
		labelFontSize: number;
		labelOutlineThickness: number;
		labelOffsetX: number;
		labelOffsetY: number;
	};
}

interface DimensionSettings {
	symbol: {
		sizeBy: string;
		colorBy: string;
		symbolTextBy?: string;
	};
	choropleth: {
		colorBy: string;
	};
	selectedGeography: string;
}

interface MapStylingProps {
	stylingSettings: StylingSettings;
	onUpdateStylingSettings: (settings: StylingSettings) => void;
	dimensionSettings: DimensionSettings; // To check if inputs should be disabled
	symbolDataExists: boolean;
	choroplethDataExists: boolean;
	customDataExists: boolean; // NEW
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
	variant?: StudioPanelVariant;
}

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

export function MapStyling({
	stylingSettings,
	onUpdateStylingSettings,
	dimensionSettings,
	symbolDataExists,
	choroplethDataExists,
	customDataExists, // NEW
	isExpanded,
	setIsExpanded,
	variant = 'panel',
}: MapStylingProps) {
	const [activeTab, setActiveTab] = useState(stylingSettings.activeTab);
	const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: boolean }>({
		savedStyles: false, // Collapsed by default
		background: false, // Collapsed by default
		nation: false, // Collapsed by default
		states: false, // Collapsed by default
		symbols: false, // Collapsed by default
		symbolLabels: false, // Collapsed by default
		symbolText: false,
		choroplethLabels: false, // Collapsed by default
	});
	const [newStyleName, setNewStyleName] = useState('');
	const [inspectorBlocksExpanded, setInspectorBlocksExpanded] = useState({
		base: false,
		symbol: false,
		choropleth: false,
	});

	useEffect(() => {
		setActiveTab(stylingSettings.activeTab);
	}, [stylingSettings.activeTab]);

	useEffect(() => {
		const handler = () => {
			setExpandedPanels((prev: { [key: string]: boolean }) => {
				const collapsed: { [key: string]: boolean } = {};
				Object.keys(prev).forEach((k) => (collapsed[k] = false));
				return collapsed;
			});
			setInspectorBlocksExpanded({ base: false, symbol: false, choropleth: false });
		};
		window.addEventListener('collapse-all-panels', handler);
		return () => window.removeEventListener('collapse-all-panels', handler);
	}, []);

	const togglePanel = (panelKey: string) => {
		setExpandedPanels((prev) => ({
			...prev,
			[panelKey]: !prev[panelKey],
		}));
	};

	const updateSetting = (tab: 'base' | 'symbol' | 'choropleth', key: string, value: any) => {
		onUpdateStylingSettings({
			...stylingSettings,
			[tab]: {
				...stylingSettings[tab],
				[key]: value,
			},
		});
		console.log(`Updated setting for ${tab}.${key}:`, value);
	};

	const updateSymbolTextSetting = (key: string, value: unknown) => {
		const currentSymbolText = getSymbolTextStyling(stylingSettings as import('@/app/(studio)/types').StylingSettings);
		onUpdateStylingSettings({
			...stylingSettings,
			symbol: {
				...stylingSettings.symbol,
				symbolText: {
					...currentSymbolText,
					[key]: value,
				},
			},
		});
	};

	const symbolTextSettings = getSymbolTextStyling(stylingSettings as import('@/app/(studio)/types').StylingSettings);

	const handleSaveStyle = () => {
		if (!newStyleName.trim()) {
			alert('Please enter a name for your style.');
			return;
		}

		const newStyle = {
			id: uuidv4(),
			name: newStyleName.trim(),
			type: 'user' as const,
			settings: {
				mapBackgroundColor: stylingSettings.base.mapBackgroundColor,
				nationFillColor: stylingSettings.base.nationFillColor,
				nationStrokeColor: stylingSettings.base.nationStrokeColor,
				nationStrokeWidth: stylingSettings.base.nationStrokeWidth,
				defaultStateFillColor: stylingSettings.base.defaultStateFillColor,
				defaultStateStrokeColor: stylingSettings.base.defaultStateStrokeColor,
				defaultStateStrokeWidth: stylingSettings.base.defaultStateStrokeWidth,
			},
		};

		onUpdateStylingSettings({
			...stylingSettings,
			base: {
				...stylingSettings.base,
				savedStyles: [...stylingSettings.base.savedStyles, newStyle],
			},
		});
		setNewStyleName('');
		toast({
			description: `Style "${newStyle.name}" saved.`,
			variant: 'success',
			icon: <CheckCircle className="h-5 w-5" />,
		});
	};

	const handleDeleteStyle = (id: string) => {
		onUpdateStylingSettings({
			...stylingSettings,
			base: {
				...stylingSettings.base,
				savedStyles: stylingSettings.base.savedStyles.filter((style) => style.id !== id),
			},
		});
		toast({ description: 'Style deleted.', variant: 'default', icon: <Trash2 className="h-5 w-5" /> });
	};

	const handleApplyStyle = (styleSettings: StylingSettings['base']['settings'], styleName: string) => {
		onUpdateStylingSettings({
			...stylingSettings,
			base: {
				...stylingSettings.base,
				...styleSettings,
			},
		});
		toast({ description: `Style "${styleName}" applied.`, variant: 'default', icon: <Sparkles className="h-5 w-5" /> });
	};

	const renderSubPanel = (
		key: string,
		title: string,
		icon: React.ReactNode,
		children: React.ReactNode,
		badge?: string
	) => {
		if (variant === 'inspector') {
			return (
				<StudioInspectorSection key={key} title={title} badge={
						badge ? (
							<span className="text-[10px] font-normal text-muted-foreground border border-border px-1.5 py-0.5 ml-1">
								{badge}
							</span>
						) : undefined
					}>
					{children}
				</StudioInspectorSection>
			);
		}

		const isPanelExpanded = expandedPanels[key];
		return (
			<div className={studioSubPanelClass}>
				<div
					className={studioSubPanelHeaderClass}
					onClick={() => togglePanel(key)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							togglePanel(key);
						}
					}}
					role="button"
					tabIndex={0}
					aria-expanded={isPanelExpanded}
					aria-controls={`panel-${key}`}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="text-foreground transform scale-75">{icon}</div>
							<span className={studioSubPanelTitleClass}>{title}</span>
							{badge && (
								<span className="text-[10px] font-normal text-muted-foreground border border-border px-1.5 py-0.5 ml-1">
									{badge}
								</span>
							)}
						</div>
						<div className="transition-transform duration-200">
							{isPanelExpanded ? (
								<ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
							) : (
								<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
							)}
						</div>
					</div>
				</div>
				<div
					className={`transition-all duration-300 ease-in-out overflow-hidden ${
						isPanelExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
					}`}>
					<div className={studioSubPanelContentClass}>{children}</div>
				</div>
			</div>
		);
	};

	const isSymbolFillDisabled = symbolDataExists && !!dimensionSettings.symbol.colorBy;
	const isSymbolSizeDisabled = symbolDataExists && !!dimensionSettings.symbol.sizeBy;
	// Choropleth fill is disabled if choropleth data exists AND color is mapped, OR if custom map exists AND color is mapped
	const isChoroplethFillDisabled =
		(choroplethDataExists && !!dimensionSettings.choropleth.colorBy) ||
		(customDataExists && !!dimensionSettings.choropleth.colorBy);

	const renderStylingTabButton = (
		tab: 'base' | 'symbol' | 'choropleth',
		icon: React.ReactNode,
		label: string,
		isActive: boolean,
		disabled: boolean,
		tooltipContent: string
	) => {
		if (disabled) {
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className={studioTabButtonClass(false, true)}>
							{icon}
							{label}
						</div>
					</TooltipTrigger>
					<TooltipContent side="bottom">{tooltipContent}</TooltipContent>
				</Tooltip>
			);
		}

		return (
			<ToggleGroupItem value={tab} aria-label={`${label} styling`} className={studioTabToggleClass}>
				{icon}
				{label}
			</ToggleGroupItem>
		);
	};

	// Utility to get subnational label based on geography
	const getSubnationalLabel = (geo: string, plural = false) => {
		if (geo === 'usa-states') return plural ? 'States' : 'State';
		if (geo === 'usa-counties') return plural ? 'Counties' : 'County';
		if (geo === 'canada-provinces') return plural ? 'Provinces' : 'Province';
		return plural ? 'Regions' : 'Region';
	};
	const subnationalLabel = getSubnationalLabel(dimensionSettings.selectedGeography, false);
	const subnationalLabelPlural = getSubnationalLabel(dimensionSettings.selectedGeography, true);
	const shouldShowSubnationalPanel = ['usa-states', 'usa-counties', 'canada-provinces'].includes(
		dimensionSettings.selectedGeography
	);

	const isInspector = variant === 'inspector';
	const showBaseContent = isInspector || activeTab === 'base';
	const showSymbolContent = (isInspector && symbolDataExists) || activeTab === 'symbol';
	const showChoroplethContent =
		(isInspector && (choroplethDataExists || customDataExists)) || activeTab === 'choropleth';

	const renderStyleGroup = (title: string, show: boolean, children: React.ReactNode) => {
		if (!show) return null;
		if (isInspector) {
			return <div className="space-y-0">{children}</div>;
		}
		return (
			<div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">{children}</div>
		);
	};

	const renderMapStylingFields = (scope: 'panel' | 'base' | 'symbol' | 'choropleth') => (
		<>
			{scope === 'panel' && !isInspector ? (
						<ToggleGroup
							type="single"
							value={activeTab}
							onValueChange={(value: 'base' | 'symbol' | 'choropleth') => {
								if (value) {
									setActiveTab(value);
									onUpdateStylingSettings({ ...stylingSettings, activeTab: value });
								}
							}}
							className={studioTabBarClass}
							aria-label="Map styling tabs">
							{renderStylingTabButton(
								'base',
								<Map className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
								'Base map',
								activeTab === 'base',
								false, // Base map is always accessible
								''
							)}
							{renderStylingTabButton(
								'symbol',
								<Circle className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
								'Symbol map',
								activeTab === 'symbol',
								!symbolDataExists,
								'Add symbol map data to configure styling.'
							)}
							{renderStylingTabButton(
								'choropleth',
								<Square className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
								'Choropleth',
								activeTab === 'choropleth',
								!(choroplethDataExists || customDataExists), // Enable if choropleth data OR custom map data exists
								'Add choropleth or custom map data to configure styling.'
							)}
						</ToggleGroup>
			) : null}

			{renderStyleGroup(
				'Base map',
				scope === 'panel' ? showBaseContent : scope === 'base',
				<>
								{renderSubPanel(
									'savedStyles',
									'Saved styles', // Sentence case
									<Save className="w-4 h-4" />,
									<div className="space-y-4">
										<div className={cn('flex gap-2', isInspector && 'flex-col')}>
											<Input
												placeholder="New style name"
												value={newStyleName}
												onChange={(e) => setNewStyleName(e.target.value)}
												className="flex-1"
											/>
											<Button onClick={handleSaveStyle} disabled={!newStyleName.trim()} className={cn(studioPrimaryButtonClass, isInspector && 'w-full')}>
												<Save className="w-4 h-4 mr-2" /> Save style
											</Button>
										</div>
										<div className="flex flex-col gap-2">
											{stylingSettings.base.savedStyles.map((style) => (
												<Card
													key={style.id}
													className="flex cursor-pointer items-center justify-between gap-2 border border-border bg-background p-2 shadow-none transition-colors duration-150 hover:bg-muted/20"
													onClick={() => handleApplyStyle(style.settings, style.name)}>
													<div className="flex items-center gap-2 flex-grow">
														<div
															className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0 relative"
															style={{ backgroundColor: style.settings.mapBackgroundColor }}>
															<div
																className="absolute inset-0 rounded-full"
																style={{
																	border: `${style.settings.nationStrokeWidth}px solid ${style.settings.nationStrokeColor}`,
																}}
															/>
														</div>
														<div className="flex flex-col">
															<h4 className="font-medium text-sm">{style.name}</h4>
															<span className="text-xs text-gray-500 dark:text-gray-400">
																{style.type === 'preset' ? 'Default style' : 'User style'}
															</span>
														</div>
													</div>
													{style.type === 'user' && (
														<Button
															variant="ghost"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteStyle(style.id);
															}}
															className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0">
															<Trash2 className="w-3 h-3" />
														</Button>
													)}
												</Card>
											))}
										</div>
									</div>
								)}

								{renderSubPanel(
									'background',
									'Background', // Sentence case
									<Palette className="w-4 h-4" />,
									<div className="space-y-2">
										<Label htmlFor="map-background-color" className="text-sm">
											Map background color
										</Label>
										<ColorInput
											value={stylingSettings.base.mapBackgroundColor}
											onChange={(value) => updateSetting('base', 'mapBackgroundColor', value)}
											showContrastCheck={false}
										/>
									</div>
								)}

								{renderSubPanel(
									'nation',
									'Nation', // Sentence case
									<Map className="w-4 h-4" />,
									<div className="space-y-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="nation-fill-color" className="text-sm">
													Nation fill color
												</Label>
												<ColorInput
													value={stylingSettings.base.nationFillColor}
													onChange={(value) => updateSetting('base', 'nationFillColor', value)}
													showContrastCheck={true}
													backgroundColor={stylingSettings.base.mapBackgroundColor}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="nation-stroke-color" className="text-sm">
													Nation stroke color
												</Label>
												<ColorInput
													value={stylingSettings.base.nationStrokeColor}
													onChange={(value) => updateSetting('base', 'nationStrokeColor', value)}
													showContrastCheck={true}
													backgroundColor={stylingSettings.base.nationFillColor}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="nation-stroke-width" className="text-sm">
												Nation stroke width ({stylingSettings.base.nationStrokeWidth}px)
											</Label>
											<Slider
												id="nation-stroke-width"
												value={[stylingSettings.base.nationStrokeWidth]}
												onValueChange={(value) => updateSetting('base', 'nationStrokeWidth', value[0])}
												min={0}
												max={5}
												step={0.5}
											/>
										</div>
									</div>
								)}

					{isInspector &&
						shouldShowSubnationalPanel &&
						renderSubPanel(
							'subnational',
							subnationalLabelPlural,
							<LandPlot className="w-4 h-4" />,
							<div className="space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="default-subnational-fill-color" className="text-sm">
											Default {subnationalLabel.toLowerCase()} fill color
										</Label>
										<div className={cn(isChoroplethFillDisabled && 'pointer-events-none opacity-50')}>
											<ColorInput
												value={stylingSettings.base.defaultStateFillColor}
												onChange={(value) => updateSetting('base', 'defaultStateFillColor', value)}
												showContrastCheck={true}
												backgroundColor={stylingSettings.base.mapBackgroundColor}
											/>
										</div>
										{isChoroplethFillDisabled && (
											<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												Inactive when Choropleth fill is mapped to data.
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="default-subnational-stroke-color" className="text-sm">
											Default {subnationalLabel.toLowerCase()} stroke color
										</Label>
										<ColorInput
											value={stylingSettings.base.defaultStateStrokeColor}
											onChange={(value) => updateSetting('base', 'defaultStateStrokeColor', value)}
											showContrastCheck={true}
											backgroundColor={stylingSettings.base.defaultStateFillColor}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="default-subnational-stroke-width" className="text-sm">
										Default {subnationalLabel.toLowerCase()} stroke width (
										{stylingSettings.base.defaultStateStrokeWidth}px)
									</Label>
									<Slider
										id="default-subnational-stroke-width"
										value={[stylingSettings.base.defaultStateStrokeWidth]}
										onValueChange={(value) => updateSetting('base', 'defaultStateStrokeWidth', value[0])}
										min={0}
										max={5}
										step={0.5}
									/>
								</div>
							</div>
						)}
				</>
			)}

			{!isInspector &&
				shouldShowSubnationalPanel &&
							renderSubPanel(
								'subnational',
								subnationalLabelPlural, // Dynamic panel title
								<LandPlot className="w-4 h-4" />, // Icon remains
								<div className="space-y-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="default-subnational-fill-color" className="text-sm">
												Default {subnationalLabel.toLowerCase()} fill color
											</Label>
											<div className={cn(isChoroplethFillDisabled && 'pointer-events-none opacity-50')}>
												<ColorInput
													value={stylingSettings.base.defaultStateFillColor}
													onChange={(value) => updateSetting('base', 'defaultStateFillColor', value)}
													showContrastCheck={true}
													backgroundColor={stylingSettings.base.mapBackgroundColor}
												/>
											</div>
											{isChoroplethFillDisabled && (
												<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													Inactive when Choropleth fill is mapped to data.
												</p>
											)}
										</div>
										<div className="space-y-2">
											<Label htmlFor="default-subnational-stroke-color" className="text-sm">
												Default {subnationalLabel.toLowerCase()} stroke color
											</Label>
											<ColorInput
												value={stylingSettings.base.defaultStateStrokeColor}
												onChange={(value) => updateSetting('base', 'defaultStateStrokeColor', value)}
												showContrastCheck={true}
												backgroundColor={stylingSettings.base.defaultStateFillColor}
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="default-subnational-stroke-width" className="text-sm">
											Default {subnationalLabel.toLowerCase()} stroke width (
											{stylingSettings.base.defaultStateStrokeWidth}px)
										</Label>
										<Slider
											id="default-subnational-stroke-width"
											value={[stylingSettings.base.defaultStateStrokeWidth]}
											onValueChange={(value) => updateSetting('base', 'defaultStateStrokeWidth', value[0])}
											min={0}
											max={5}
											step={0.5}
										/>
									</div>
								</div>
							)}

			{renderStyleGroup(
				'Symbol map',
				scope === 'panel' ? showSymbolContent : scope === 'symbol',
				<>
								{renderSubPanel(
									'symbols',
									'Symbols', // Sentence case
									<Circle className="w-4 h-4" />,
									<div className="space-y-4">
										{/* New row for Symbol Type and Shape toggles */}
										<div className={cn('grid grid-cols-1 gap-4', !isInspector && 'sm:grid-cols-2')}>
											<div className="space-y-2 flex flex-col">
												<Label htmlFor="symbol-type" className="text-sm">
													Symbol type
												</Label>
												<ToggleGroup
													type="single"
													value={stylingSettings.symbol.symbolType}
													onValueChange={(value: 'symbol' | 'spike' | 'arrow') => {
														if (value) {
															updateSetting('symbol', 'symbolType', value);
														}
													}}
													className={studioToggleGroupClass}
													aria-label="Symbol type">
													<ToggleGroupItem
														value="symbol"
														aria-label="Symbol"
														className={studioToggleGroupItemClass}>
														<Circle className="w-3 h-3 mr-1.5" />
														Symbol
													</ToggleGroupItem>
													<ToggleGroupItem
														value="spike"
														aria-label="Spike"
														className={studioToggleGroupItemClass}>
														<Play className="w-3 h-3 mr-1.5" />
														Spike
													</ToggleGroupItem>
													<ToggleGroupItem
														value="arrow"
														aria-label="Arrow"
														className={studioToggleGroupItemClass}>
														<ArrowUp className="w-3 h-3 mr-1.5" />
														Arrow
													</ToggleGroupItem>
												</ToggleGroup>
											</div>

											{stylingSettings.symbol.symbolType === 'symbol' && (
												<div className="space-y-2 flex flex-col">
													<Label htmlFor="symbol-shape" className="text-sm">
														Shape
													</Label>
													<ToggleGroup
														type="single"
														value={stylingSettings.symbol.symbolShape}
														onValueChange={(value: StylingSettings['symbol']['symbolShape']) => {
															if (value) {
																updateSetting('symbol', 'symbolShape', value);
																if (value === 'custom-svg' && stylingSettings.symbol.customSvgPath === undefined) {
																	updateSetting('symbol', 'customSvgPath', ''); // Initialize if switching to custom-svg
																}
															}
														}}
														className={studioToggleGroupClass}
														aria-label="Symbol shape">
														<ToggleGroupItem value="circle" aria-label="Circle" className={studioToggleGroupIconItemClass}>
															<Circle className="h-4 w-4" />
														</ToggleGroupItem>
														<ToggleGroupItem value="square" aria-label="Square" className={studioToggleGroupIconItemClass}>
															<Square className="h-4 w-4" />
														</ToggleGroupItem>
														<ToggleGroupItem value="diamond" aria-label="Diamond" className={studioToggleGroupIconItemClass}>
															<Diamond className="h-4 w-4" />
														</ToggleGroupItem>
														<ToggleGroupItem value="triangle" aria-label="Triangle" className={studioToggleGroupIconItemClass}>
															<Triangle className="h-4 w-4" />
														</ToggleGroupItem>
														<ToggleGroupItem value="triangle-down" aria-label="Upside-down Triangle" className={studioToggleGroupIconItemClass}>
															<Triangle className="h-4 w-4 rotate-180" />
														</ToggleGroupItem>
														<ToggleGroupItem value="hexagon" aria-label="Star" className={studioToggleGroupIconItemClass}>
															<svg
																className="h-4 w-4"
																viewBox="0 0 24 24"
																fill="currentColor"
																stroke="currentColor"
																strokeWidth="1"
																strokeLinecap="round"
																strokeLinejoin="round">
																<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
															</svg>
														</ToggleGroupItem>
														<ToggleGroupItem value="map-marker" aria-label="Map Marker" className={studioToggleGroupIconItemClass}>
															<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
																<path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
																<circle cx="12" cy="9" r="3" fill="white" />
															</svg>
														</ToggleGroupItem>
														<ToggleGroupItem value="custom-svg" aria-label="Custom SVG" className={studioToggleGroupIconItemClass}>
															<Code className="h-4 w-4" />
														</ToggleGroupItem>
													</ToggleGroup>
												</div>
											)}
										</div>
										{stylingSettings.symbol.symbolType === 'symbol' &&
											stylingSettings.symbol.symbolShape === 'custom-svg' && (
												<div className="space-y-2">
													<Label htmlFor="custom-svg-path" className="text-sm">
														Custom SVG Path (d attribute)
													</Label>
													<Input
														id="custom-svg-path"
														placeholder="M0,0L10,0L5,10Z"
														value={stylingSettings.symbol.customSvgPath || ''}
														onChange={(e) => updateSetting('symbol', 'customSvgPath', e.target.value)}
													/>
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
														Paste the 'd' attribute value from your SVG path element.
													</p>
												</div>
											)}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="symbol-fill-color" className="text-sm">
													Symbol fill color
												</Label>
												<div className={cn(isSymbolFillDisabled && 'pointer-events-none opacity-50')}>
													<ColorInput
														value={stylingSettings.symbol.symbolFillColor}
														onChange={(value) => updateSetting('symbol', 'symbolFillColor', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.base.mapBackgroundColor}
													/>
												</div>
												{isSymbolFillDisabled && (
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
														Inactive when Symbol color is mapped to data.
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="symbol-stroke-color" className="text-sm">
													Symbol stroke color
												</Label>
												<ColorInput
													value={stylingSettings.symbol.symbolStrokeColor}
													onChange={(value) => updateSetting('symbol', 'symbolStrokeColor', value)}
													showContrastCheck={true}
													backgroundColor={stylingSettings.symbol.symbolFillColor}
												/>
											</div>
										</div>

										{/* New grid for size and stroke width */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="symbol-size" className="text-sm">
													Symbol size ({stylingSettings.symbol.symbolSize}px)
												</Label>
												<div className={cn(isSymbolSizeDisabled && 'pointer-events-none opacity-50')}>
													<Slider
														id="symbol-size"
														value={[stylingSettings.symbol.symbolSize]}
														onValueChange={(value) => updateSetting('symbol', 'symbolSize', value[0])}
														min={1}
														max={50}
														step={1}
														disabled={isSymbolSizeDisabled}
													/>
												</div>
												{isSymbolSizeDisabled && (
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
														Inactive when Symbol size is mapped to data.
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="symbol-stroke-width" className="text-sm">
													Symbol stroke width ({stylingSettings.symbol.symbolStrokeWidth}px)
												</Label>
												<Slider
													id="symbol-stroke-width"
													value={[stylingSettings.symbol.symbolStrokeWidth]}
													onValueChange={(value) => updateSetting('symbol', 'symbolStrokeWidth', value[0])}
													min={0}
													max={5}
													step={0.5}
												/>
											</div>
										</div>

										{/* New grid for transparency sliders */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="symbol-fill-transparency" className="text-sm">
													Fill transparency ({stylingSettings.symbol.symbolFillTransparency ?? 80}%)
												</Label>
												<Slider
													id="symbol-fill-transparency"
													value={[stylingSettings.symbol.symbolFillTransparency ?? 80]}
													onValueChange={(value) => updateSetting('symbol', 'symbolFillTransparency', value[0])}
													min={0}
													max={100}
													step={1}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="symbol-stroke-transparency" className="text-sm">
													Stroke transparency ({stylingSettings.symbol.symbolStrokeTransparency ?? 100}%)
												</Label>
												<Slider
													id="symbol-stroke-transparency"
													value={[stylingSettings.symbol.symbolStrokeTransparency ?? 100]}
													onValueChange={(value) => updateSetting('symbol', 'symbolStrokeTransparency', value[0])}
													min={0}
													max={100}
													step={1}
												/>
											</div>
										</div>
									</div>
								)}

								{renderSubPanel(
									'symbolLabels',
									'Labels', // Sentence case
									<Type className="w-4 h-4" />,
									<div className={cn('grid grid-cols-1 gap-4', !isInspector && 'md:grid-cols-[1fr_auto]')}>
										<div className="space-y-4">
											<div className={cn('flex gap-3', isInspector ? 'flex-col' : 'items-end')}>
												<div className="min-w-0 space-y-2 flex-1">
													<Label htmlFor="symbol-label-font-family" className="text-sm">
														Font family
													</Label>
													<Select
														value={stylingSettings.symbol.labelFontFamily || 'Inter'}
														onValueChange={(value) => updateSetting('symbol', 'labelFontFamily', value)}>
														<SelectTrigger id="symbol-label-font-family">
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
															stylingSettings.symbol.labelBold && 'bold',
															stylingSettings.symbol.labelItalic && 'italic',
															stylingSettings.symbol.labelUnderline && 'underline',
															stylingSettings.symbol.labelStrikethrough && 'strikethrough',
														].filter(Boolean) as string[]
													}
													onValueChange={(values) => {
														console.log('Symbol Label ToggleGroup onValueChange - received values:', values);
														onUpdateStylingSettings({
															...stylingSettings,
															symbol: {
																...stylingSettings.symbol,
																labelBold: values.includes('bold'),
																labelItalic: values.includes('italic'),
																labelUnderline: values.includes('underline'),
																labelStrikethrough: values.includes('strikethrough'),
															},
														});
													}}
													className={studioToggleGroupClass}>
													<ToggleGroupItem value="bold" aria-label="Toggle bold" className={studioToggleGroupIconItemClass}>
														<Bold className="h-3.5 w-3.5" />
													</ToggleGroupItem>
													<ToggleGroupItem value="italic" aria-label="Toggle italic" className={studioToggleGroupIconItemClass}>
														<Italic className="h-3.5 w-3.5" />
													</ToggleGroupItem>
													<ToggleGroupItem value="underline" aria-label="Toggle underline" className={studioToggleGroupIconItemClass}>
														<Underline className="h-3.5 w-3.5" />
													</ToggleGroupItem>
													<ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough" className={studioToggleGroupIconItemClass}>
														<Strikethrough className="h-3.5 w-3.5" />
													</ToggleGroupItem>
												</ToggleGroup>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-label-color" className="text-sm">
														Label color
													</Label>
													<ColorInput
														value={stylingSettings.symbol.labelColor}
														onChange={(value) => updateSetting('symbol', 'labelColor', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.base.mapBackgroundColor}
														isLargeText={stylingSettings.symbol.labelFontSize >= 18}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-label-outline-color" className="text-sm">
														Label outline color
													</Label>
													<ColorInput
														value={stylingSettings.symbol.labelOutlineColor}
														onChange={(value) => updateSetting('symbol', 'labelOutlineColor', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.symbol.labelColor}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-label-font-size" className="text-sm">
														Font size ({stylingSettings.symbol.labelFontSize}px)
													</Label>
													<Slider
														id="symbol-label-font-size"
														value={[stylingSettings.symbol.labelFontSize]}
														onValueChange={(value) => updateSetting('symbol', 'labelFontSize', value[0])}
														min={8}
														max={30}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-label-outline-thickness" className="text-sm">
														Outline thickness ({stylingSettings.symbol.labelOutlineThickness}px)
													</Label>
													<Slider
														id="symbol-label-outline-thickness"
														value={[stylingSettings.symbol.labelOutlineThickness]}
														onValueChange={(value) => updateSetting('symbol', 'labelOutlineThickness', value[0])}
														min={0}
														max={10}
														step={0.5}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-label-offset-x" className="text-sm">
														X offset ({stylingSettings.symbol.labelOffsetX ?? 0}px)
													</Label>
													<Slider
														id="symbol-label-offset-x"
														value={[stylingSettings.symbol.labelOffsetX ?? 0]}
														onValueChange={(value) => updateSetting('symbol', 'labelOffsetX', value[0])}
														min={-50}
														max={50}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-label-offset-y" className="text-sm">
														Y offset ({stylingSettings.symbol.labelOffsetY ?? 0}px)
													</Label>
													<Slider
														id="symbol-label-offset-y"
														value={[stylingSettings.symbol.labelOffsetY ?? 0]}
														onValueChange={(value) => updateSetting('symbol', 'labelOffsetY', value[0])}
														min={-50}
														max={50}
														step={1}
													/>
												</div>
											</div>
										</div>

										<div className="space-y-2">
											<Label className="text-sm">Alignment</Label>
											<div className={studioAlignmentGroupClass}>
												<Button
													variant="ghost"
													size="sm"
													className={cn(
														studioAlignmentAutoButtonClass,
														stylingSettings.symbol.labelAlignment === 'auto'
															? 'bg-muted/60 text-foreground'
															: 'bg-transparent text-muted-foreground'
													)}
													onClick={() => updateSetting('symbol', 'labelAlignment', 'auto')}>
													<Sparkles className="h-4 w-4 mr-2" /> Auto
												</Button>
												{[
													{ value: 'top-left', icon: ArrowUpLeft },
													{ value: 'top-center', icon: ArrowUp },
													{ value: 'top-right', icon: ArrowUpRight },
													{ value: 'middle-left', icon: ArrowLeft },
													{ value: 'center', icon: Minus },
													{ value: 'middle-right', icon: ArrowRight },
													{ value: 'bottom-left', icon: ArrowDownLeft },
													{ value: 'bottom-center', icon: ArrowDown },
													{ value: 'bottom-right', icon: ArrowDownRight },
												].map((item) => (
													<Button
														key={item.value}
														variant="ghost"
														size="icon"
														className={studioAlignmentButtonActiveClass(
															stylingSettings.symbol.labelAlignment === item.value
														)}
														onClick={() => updateSetting('symbol', 'labelAlignment', item.value)}>
														<item.icon className="h-4 w-4" />
													</Button>
												))}
											</div>
										</div>
									</div>
								)}

								{renderSubPanel(
									'symbolText',
									'Symbol text',
									<Hash className="w-4 h-4" />,
									<div className={cn('grid grid-cols-1 gap-4', !isInspector && 'md:grid-cols-[1fr_auto]')}>
										<div className="space-y-4">
											{!dimensionSettings?.symbol?.symbolTextBy && (
												<p className="text-xs text-muted-foreground">
													Map a column or row number in Dimension Mapping to show text inside symbols.
												</p>
											)}
											<div className={cn('flex gap-3', isInspector ? 'flex-col' : 'items-end')}>
												<div className="min-w-0 space-y-2 flex-1">
													<Label htmlFor="symbol-text-font-family" className="text-sm">
														Font family
													</Label>
													<Select
														value={symbolTextSettings.fontFamily || 'Inter'}
														onValueChange={(value) => updateSymbolTextSetting('fontFamily', value)}>
														<SelectTrigger id="symbol-text-font-family">
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
															symbolTextSettings.fontBold && 'bold',
															symbolTextSettings.fontItalic && 'italic',
														].filter(Boolean) as string[]
													}
													onValueChange={(values) => {
														onUpdateStylingSettings({
															...stylingSettings,
															symbol: {
																...stylingSettings.symbol,
																symbolText: {
																	...symbolTextSettings,
																	fontBold: values.includes('bold'),
																	fontItalic: values.includes('italic'),
																},
															},
														});
													}}
													className={studioToggleGroupClass}>
													<ToggleGroupItem value="bold" aria-label="Toggle bold" className={studioToggleGroupIconItemClass}>
														<Bold className="h-3.5 w-3.5" />
													</ToggleGroupItem>
													<ToggleGroupItem value="italic" aria-label="Toggle italic" className={studioToggleGroupIconItemClass}>
														<Italic className="h-3.5 w-3.5" />
													</ToggleGroupItem>
												</ToggleGroup>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-text-color" className="text-sm">
														Text color
													</Label>
													<ColorInput
														value={symbolTextSettings.color}
														onChange={(value) => updateSymbolTextSetting('color', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.symbol.symbolFillColor}
														isLargeText={symbolTextSettings.fontSize >= 18}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-text-outline-color" className="text-sm">
														Outline color
													</Label>
													<ColorInput
														value={symbolTextSettings.outlineColor}
														onChange={(value) => updateSymbolTextSetting('outlineColor', value)}
														showContrastCheck={true}
														backgroundColor={symbolTextSettings.color}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-text-font-size" className="text-sm">
														Font size ({symbolTextSettings.fontSize}px)
													</Label>
													<Slider
														id="symbol-text-font-size"
														value={[symbolTextSettings.fontSize]}
														onValueChange={(value) => updateSymbolTextSetting('fontSize', value[0])}
														min={6}
														max={24}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-text-outline-thickness" className="text-sm">
														Outline thickness ({symbolTextSettings.outlineThickness}px)
													</Label>
													<Slider
														id="symbol-text-outline-thickness"
														value={[symbolTextSettings.outlineThickness]}
														onValueChange={(value) => updateSymbolTextSetting('outlineThickness', value[0])}
														min={0}
														max={10}
														step={0.5}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="symbol-text-offset-x" className="text-sm">
														X offset ({symbolTextSettings.offsetX}px)
													</Label>
													<Slider
														id="symbol-text-offset-x"
														value={[symbolTextSettings.offsetX]}
														onValueChange={(value) => updateSymbolTextSetting('offsetX', value[0])}
														min={-30}
														max={30}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="symbol-text-offset-y" className="text-sm">
														Y offset ({symbolTextSettings.offsetY}px)
													</Label>
													<Slider
														id="symbol-text-offset-y"
														value={[symbolTextSettings.offsetY]}
														onValueChange={(value) => updateSymbolTextSetting('offsetY', value[0])}
														min={-30}
														max={30}
														step={1}
													/>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Button
													type="button"
													variant={symbolTextSettings.scaleWithSymbol ? 'default' : 'outline'}
													size="sm"
													className="h-8"
													onClick={() =>
														updateSymbolTextSetting('scaleWithSymbol', !symbolTextSettings.scaleWithSymbol)
													}>
													Scale with symbol size
												</Button>
											</div>
										</div>
									</div>
								)}

				</>
			)}

			{renderStyleGroup(
				'Choropleth',
				scope === 'panel' ? showChoroplethContent : scope === 'choropleth',
				<>
								{renderSubPanel(
									'choroplethLabels',
									'Labels', // Sentence case
									<Type className="w-4 h-4" />,
									<div className="grid grid-cols-1 gap-4">
										<div className="space-y-4">
											<div className="flex items-end gap-4">
												<div className="space-y-2 flex-1">
													<Label htmlFor="choropleth-label-font-family" className="text-sm">
														Font family
													</Label>
													<Select
														value={stylingSettings.choropleth.labelFontFamily || 'Inter'}
														onValueChange={(value) => updateSetting('choropleth', 'labelFontFamily', value)}>
														<SelectTrigger id="choropleth-label-font-family">
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
															stylingSettings.choropleth.labelBold && 'bold',
															stylingSettings.choropleth.labelItalic && 'italic',
															stylingSettings.choropleth.labelUnderline && 'underline',
															stylingSettings.choropleth.labelStrikethrough && 'strikethrough',
														].filter(Boolean) as string[]
													}
													onValueChange={(values) => {
														console.log('Choropleth Label ToggleGroup onValueChange - received values:', values);
														onUpdateStylingSettings({
															...stylingSettings,
															choropleth: {
																...stylingSettings.choropleth,
																labelBold: values.includes('bold'),
																labelItalic: values.includes('italic'),
																labelUnderline: values.includes('underline'),
																labelStrikethrough: values.includes('strikethrough'),
															},
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
														className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white leading-4 leading-3 leading-4 leading-3 h-full">
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

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-color" className="text-sm">
														Label color
													</Label>
													<ColorInput
														value={stylingSettings.choropleth.labelColor}
														onChange={(value) => updateSetting('choropleth', 'labelColor', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.base.mapBackgroundColor}
														isLargeText={stylingSettings.choropleth.labelFontSize >= 18}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-outline-color" className="text-sm">
														Label outline color
													</Label>
													<ColorInput
														value={stylingSettings.choropleth.labelOutlineColor}
														onChange={(value) => updateSetting('choropleth', 'labelOutlineColor', value)}
														showContrastCheck={true}
														backgroundColor={stylingSettings.choropleth.labelColor}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-font-size" className="text-sm">
														Font size ({stylingSettings.choropleth.labelFontSize}px)
													</Label>
													<Slider
														id="choropleth-label-font-size"
														value={[stylingSettings.choropleth.labelFontSize]}
														onValueChange={(value) => updateSetting('choropleth', 'labelFontSize', value[0])}
														min={8}
														max={30}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-outline-thickness" className="text-sm">
														Outline thickness ({stylingSettings.choropleth.labelOutlineThickness}px)
													</Label>
													<Slider
														id="choropleth-label-outline-thickness"
														value={[stylingSettings.choropleth.labelOutlineThickness]}
														onValueChange={(value) => updateSetting('choropleth', 'labelOutlineThickness', value[0])}
														min={0}
														max={10}
														step={0.5}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-offset-x" className="text-sm">
														X offset ({stylingSettings.choropleth.labelOffsetX ?? 0}px)
													</Label>
													<Slider
														id="choropleth-label-offset-x"
														value={[stylingSettings.choropleth.labelOffsetX ?? 0]}
														onValueChange={(value) => updateSetting('choropleth', 'labelOffsetX', value[0])}
														min={-50}
														max={50}
														step={1}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="choropleth-label-offset-y" className="text-sm">
														Y offset ({stylingSettings.choropleth.labelOffsetY ?? 0}px)
													</Label>
													<Slider
														id="choropleth-label-offset-y"
														value={[stylingSettings.choropleth.labelOffsetY ?? 0]}
														onValueChange={(value) => updateSetting('choropleth', 'labelOffsetY', value[0])}
														min={-50}
														max={50}
														step={1}
													/>
												</div>
											</div>
										</div>
									</div>
								)}
				</>
			)}
		</>
	);

	return (
		<TooltipProvider>
			{isInspector ? (
				<>
					<StudioInspectorBlock
						title="Base map"
						isExpanded={inspectorBlocksExpanded.base}
						onToggle={() =>
							setInspectorBlocksExpanded((prev) => ({ ...prev, base: !prev.base }))
						}>
						{renderMapStylingFields('base')}
					</StudioInspectorBlock>
					{symbolDataExists ? (
						<StudioInspectorBlock
							title="Symbol map"
							isExpanded={inspectorBlocksExpanded.symbol}
							onToggle={() =>
								setInspectorBlocksExpanded((prev) => ({ ...prev, symbol: !prev.symbol }))
							}>
							{renderMapStylingFields('symbol')}
						</StudioInspectorBlock>
					) : null}
					{choroplethDataExists || customDataExists ? (
						<StudioInspectorBlock
							title="Choropleth"
							isExpanded={inspectorBlocksExpanded.choropleth}
							onToggle={() =>
								setInspectorBlocksExpanded((prev) => ({ ...prev, choropleth: !prev.choropleth }))
							}>
							{renderMapStylingFields('choropleth')}
						</StudioInspectorBlock>
					) : null}
				</>
			) : (
				<Card className={cn(studioPanelClass, 'overflow-hidden')}>
					<StudioExpandableHeader
						title="Map styling"
						isExpanded={isExpanded}
						onToggle={() => setIsExpanded(!isExpanded)}
					/>
					<div
						className={`studio-panel-expand-body transition-all duration-300 ease-in-out overflow-hidden ${
							isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
						}`}>
						<CardContent className="space-y-4 px-4 pb-4 pt-2">{renderMapStylingFields('panel')}</CardContent>
					</div>
				</Card>
			)}
		</TooltipProvider>
	);
}
