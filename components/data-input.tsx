/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const */
'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, BarChart3, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DataRow } from '@/app/(studio)/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast'; // Import toast
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { parseDelimitedText } from '@/modules/data-ingest/csv';
import { CHOROPLETH_SAMPLE_DATA, SYMBOL_SAMPLE_DATA } from '@/modules/data-ingest/sample-data';
import { cn } from '@/lib/utils';
import { studioPanelClass, studioPanelTitleClass, studioTabBarClass, studioTabTriggerClass, studioOutlineButtonClass, studioPrimaryButtonClass, studioHeaderIconButtonClass, StudioExpandableHeader } from '@/components/studio-panel';

interface DataInputProps {
	onDataLoad: (
		mapType: 'symbol' | 'choropleth' | 'custom',
		parsedData: DataRow[],
		columns: string[],
		rawData: string,
		customMapData?: string
	) => void;
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
	onClearData: (mapType: 'symbol' | 'choropleth' | 'custom') => void; // New prop
}

export function DataInput({ onDataLoad, isExpanded, setIsExpanded, onClearData }: DataInputProps) {
	const [activeTab, setActiveTab] = useState<'symbol' | 'choropleth'>('symbol');
	const [symbolRawData, setSymbolRawData] = useState('');
	const [choroplethRawData, setChoroplethRawData] = useState('');
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const [isDragActive, setIsDragActive] = useState(false);
	const [symbolPopoverOpen, setSymbolPopoverOpen] = useState(false);
	const [choroplethPopoverOpen, setChoroplethPopoverOpen] = useState(false);

	const loadSampleData = () => {
		if (activeTab === 'symbol') {
			setSymbolRawData(SYMBOL_SAMPLE_DATA);
		}
	};

	const loadChoroplethSampleData = () => {
		setChoroplethRawData(CHOROPLETH_SAMPLE_DATA);
	};

	// Add a validation function
	const handleLoadData = () => {
		if (activeTab === 'symbol') {
			const { data, columns } = parseDelimitedText(symbolRawData);
			if (data.length > 0) {
				onDataLoad('symbol', data, columns, symbolRawData);
				toast({
					description: `${data.length} rows of symbol data loaded successfully.`,
					variant: 'success',
					icon: <CheckCircle className="h-5 w-5" />,
				});
			}
		} else if (activeTab === 'choropleth') {
			const { data, columns } = parseDelimitedText(choroplethRawData);
			if (data.length > 0) {
				onDataLoad('choropleth', data, columns, choroplethRawData);
				toast({
					description: `${data.length} rows of choropleth data loaded successfully.`,
					variant: 'success',
					icon: <CheckCircle className="h-5 w-5" />,
				});
			}
		}
	};

	const isLoadButtonDisabled = () => {
		return activeTab === 'symbol' ? !symbolRawData.trim() : !choroplethRawData.trim();
	};

	useEffect(() => {
		const handler = () => setIsExpanded(false);
		window.addEventListener('collapse-all-panels', handler);
		return () => window.removeEventListener('collapse-all-panels', handler);
	}, [setIsExpanded]);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			handleFileFromDrop(file);
		}
	};

	const handleFileFromDrop = (file: File) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			let data: DataRow[] = [];
			let columns: string[] = [];
			let rawData = text;
			let error = '';
			try {
				if (file.name.endsWith('.json')) {
					const json = JSON.parse(text);
					if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
						data = json;
						columns = Object.keys(json[0]);
					} else {
						error = 'JSON file must be an array of objects.';
					}
				} else {
					const parsed = parseDelimitedText(text);
					data = parsed.data;
					columns = parsed.columns;
				}
			} catch (e: any) {
				error = 'Failed to parse file: ' + (e.message || e.toString());
			}
			if (error) {
				toast({
					description: error,
					variant: 'destructive',
					icon: <AlertCircle className="h-5 w-5" />,
				});
				return;
			}
			if (data.length > 0) {
				if (activeTab === 'symbol') {
					onDataLoad('symbol', data, columns, rawData);
					toast({
						description: `${data.length} rows of symbol data loaded from file${file.name ? `: ${file.name}` : ''}.`,
						variant: 'success',
						icon: <CheckCircle className="h-5 w-5" />,
					});
				} else if (activeTab === 'choropleth') {
					onDataLoad('choropleth', data, columns, rawData);
					toast({
						description: `${data.length} rows of choropleth data loaded from file${file.name ? `: ${file.name}` : ''}.`,
						variant: 'success',
						icon: <CheckCircle className="h-5 w-5" />,
					});
				}
			} else {
				toast({
					description: 'No data found in file.',
					variant: 'destructive',
					icon: <AlertCircle className="h-5 w-5" />,
				});
			}
		};
		reader.readAsText(file);
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		handleFileFromDrop(file);
		// Reset file input value so the same file can be uploaded again if needed
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	// Remove old sampleDataSets and add a new config for sample file names
	const sampleDataFiles = {
		symbol: [
			{ label: 'Canadian companies', file: '/sample-data/symbol-canada.csv' },
			{ label: 'US companies', file: '/sample-data/symbol-us.csv' },
			{ label: 'World cities', file: '/sample-data/symbol-world.csv' },
		],
		choropleth: [
			{ label: 'Canadian provinces', file: '/sample-data/choropleth-canada.csv' },
			{ label: 'US states', file: '/sample-data/choropleth-us.csv' },
			{ label: 'World countries', file: '/sample-data/choropleth-world.csv' },
		],
	};

	// Add async loader for sample data
	const loadSampleDataFile = async (
		file: string,
		setRawData: (data: string) => void,
		setPopoverOpen: (open: boolean) => void
	) => {
		try {
			const res = await fetch(file);
			if (!res.ok) throw new Error('Failed to load sample data');
			const text = await res.text();
			setRawData(text);
			setPopoverOpen(false);
		} catch (e) {
			toast({
				description: 'Failed to load sample data.',
				variant: 'destructive',
				icon: <AlertCircle className="h-5 w-5" />,
			});
		}
	};

	const renderClearButton = (onClear: () => void, disabled: boolean, label: string) => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					type="button"
					onClick={onClear}
					disabled={disabled}
					className={cn(
						studioHeaderIconButtonClass,
						'hover:!bg-destructive/10 hover:!text-destructive hover:!border-destructive/30 disabled:hover:!bg-transparent'
					)}
					aria-label={label}>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);

	return (
		<TooltipProvider>
		<Card
			className={cn(studioPanelClass, 'overflow-hidden')}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			style={{ position: 'relative' }}>
			{/* Drag overlay */}
			{isDragActive && (
				<div
					className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary/40 rounded-none pointer-events-none"
					style={{
						borderStyle: 'dashed',
						borderWidth: 2,
						borderColor: '#60a5fa', // blue-400
						background: 'rgba(59,130,246,0.08)', // blue-600/10
					}}>
					<div className="text-lg font-medium text-blue-600 dark:text-blue-300 text-center">
						Drop CSV, TSV, or JSON file here
					</div>
				</div>
			)}
			{/* Fade/dim content when drag overlay is active */}
			<div style={{ filter: isDragActive ? 'opacity(0.2)' : 'none', transition: 'filter 0.2s' }}>
				<StudioExpandableHeader
					title="Data input"
					isExpanded={isExpanded}
					onToggle={() => setIsExpanded(!isExpanded)}
				/>

				<div
					className={cn(
						'studio-panel-expand-body transition-all duration-300 ease-in-out overflow-hidden',
						isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
					)}>
					<CardContent className="space-y-4 px-4 pb-4 pt-2">
						<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'symbol' | 'choropleth')}>
							<TabsList className={studioTabBarClass}>
								<TabsTrigger value="symbol" className={studioTabTriggerClass}>
									<MapPin className="w-3 h-3 mr-1.5" />
									Symbol map
								</TabsTrigger>
								<TabsTrigger value="choropleth" className={studioTabTriggerClass}>
									<BarChart3 className="w-3 h-3 mr-1.5" />
									Choropleth
								</TabsTrigger>
							</TabsList>

							<div className="mt-4">
								<TabsContent
									value="symbol"
									className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
									<div className="space-y-2">
										<label htmlFor="symbol-data-input" className="text-sm font-medium text-foreground">
											Paste CSV or TSV data
										</label>
										<div className="flex flex-nowrap items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className={studioOutlineButtonClass}>
													Upload file
												</Button>
												<input
													ref={fileInputRef}
													type="file"
													accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
													style={{ display: 'none' }}
													onChange={handleFileUpload}
													aria-label="Upload CSV or TSV file"
												/>
												<Popover open={symbolPopoverOpen} onOpenChange={setSymbolPopoverOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															type="button"
															className={studioOutlineButtonClass}>
															Load sample data
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-72 p-2">
														<div className="font-medium mb-2">Choose a sample dataset:</div>
														<div className="space-y-1">
															{sampleDataFiles.symbol.map((sample) => (
																<Button
																	key={sample.label}
																	variant="ghost"
																	size="sm"
																	className="w-full justify-start"
																	onClick={() =>
																		loadSampleDataFile(sample.file, setSymbolRawData, setSymbolPopoverOpen)
																	}>
																	{sample.label}
																</Button>
															))}
														</div>
													</PopoverContent>
												</Popover>
												{renderClearButton(
													() => setSymbolRawData(''),
													!symbolRawData.trim(),
													'Clear data'
												)}
										</div>
										<Textarea
											id="symbol-data-input"
											placeholder={`Paste your data here...\nHeaders should be in the first row.\nSupports both comma-separated (CSV) and tab-separated (TSV) formats.`}
											value={symbolRawData}
											onChange={(e) => setSymbolRawData(e.target.value)}
											className="min-h-[120px] font-mono text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 whitespace-pre-line"
										/>
									</div>
								</TabsContent>

								<TabsContent
									value="choropleth"
									className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
									<div className="space-y-2">
										<label htmlFor="choropleth-data-input" className="text-sm font-medium text-foreground">
											Paste choropleth data
										</label>
										<div className="flex flex-nowrap items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className={studioOutlineButtonClass}>
													Upload file
												</Button>
												<input
													ref={fileInputRef}
													type="file"
													accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
													style={{ display: 'none' }}
													onChange={handleFileUpload}
													aria-label="Upload CSV or TSV file"
												/>
												<Popover open={choroplethPopoverOpen} onOpenChange={setChoroplethPopoverOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															type="button"
															className={studioOutlineButtonClass}>
															Load sample data
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-72 p-2">
														<div className="font-medium mb-2">Choose a sample dataset:</div>
														<div className="space-y-1">
															{sampleDataFiles.choropleth.map((sample) => (
																<Button
																	key={sample.label}
																	variant="ghost"
																	size="sm"
																	className="w-full justify-start"
																	onClick={() =>
																		loadSampleDataFile(sample.file, setChoroplethRawData, setChoroplethPopoverOpen)
																	}>
																	{sample.label}
																</Button>
															))}
														</div>
													</PopoverContent>
												</Popover>
												{renderClearButton(
													() => setChoroplethRawData(''),
													!choroplethRawData.trim(),
													'Clear data'
												)}
										</div>
										<Textarea
											id="choropleth-data-input"
											placeholder={`Paste your choropleth data here...\nHeaders should be in the first row.\nSupports both comma-separated (CSV) and tab-separated (TSV) formats.`}
											value={choroplethRawData}
											onChange={(e) => setChoroplethRawData(e.target.value)}
											className="min-h-[120px] font-mono text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 whitespace-pre-line"
										/>
									</div>
								</TabsContent>
							</div>
						</Tabs>

						<div className="space-y-3 border-t border-border/40 pt-4">
							<p className="text-xs text-muted-foreground">
								Copy and paste data directly from Google Sheet, Excel, or any CSV/TSV source.
							</p>
							<Button
								onClick={handleLoadData}
								disabled={isLoadButtonDisabled()}
								className={cn('w-full sm:w-auto', studioPrimaryButtonClass)}>
								Load data
							</Button>
						</div>
					</CardContent>
				</div>
			</div>
		</Card>
		</TooltipProvider>
	);
}
