/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const */
'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, MapPin, BarChart3, MapIcon, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import type { DataRow } from '@/app/(studio)/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast'; // Import toast
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { parseDelimitedText } from '@/modules/data-ingest/csv';
import { CHOROPLETH_SAMPLE_DATA, SYMBOL_SAMPLE_DATA } from '@/modules/data-ingest/sample-data';
import { ensurePathsClosedAndFormatSVG, validateCustomSVG } from '@/modules/data-ingest/svg';

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
	const [activeTab, setActiveTab] = useState<'symbol' | 'choropleth' | 'custom'>('symbol');
	const [symbolRawData, setSymbolRawData] = useState('');
	const [choroplethRawData, setChoroplethRawData] = useState('');
	const [customSVG, setCustomSVG] = useState('');
	const [showHelpModal, setShowHelpModal] = useState(false); // New state for controlling the help modal
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
		} else if (activeTab === 'custom') {
			const validationResult = validateCustomSVG(customSVG);
			if (!validationResult.isValid) {
				toast({
					description: validationResult.message,
					variant: 'destructive',
					duration: 5000,
					icon: <AlertCircle className="h-5 w-5" />,
				});
				return; // Prevent loading invalid SVG
			}

			if (customSVG.trim()) {
				const { formattedSvg, closedPathCount } = ensurePathsClosedAndFormatSVG(customSVG);

				onDataLoad('custom', [], [], '', formattedSvg);

				let toastDescription = 'Custom map loaded successfully.';
				if (closedPathCount > 0) {
					toastDescription += ` ${closedPathCount} path${closedPathCount > 1 ? 's' : ''} automatically closed.`;
				}

				toast({
					description: toastDescription,
					variant: 'success',
					icon: <CheckCircle className="h-5 w-5" />,
				});
			}
		}
	};

	const handleCustomSVGChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCustomSVG(e.target.value);
	};

	const getCurrentRawData = () => {
		switch (activeTab) {
			case 'symbol':
				return symbolRawData;
			case 'choropleth':
				return choroplethRawData;
			case 'custom':
				return customSVG;
			default:
				return '';
		}
	};

	const isLoadButtonDisabled = () => {
		switch (activeTab) {
			case 'symbol':
				return !symbolRawData.trim();
			case 'choropleth':
				return !choroplethRawData.trim();
			case 'custom':
				return !customSVG.trim();
			default:
				return true;
		}
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

	return (
		<Card
			className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			style={{ position: 'relative' }}>
			{/* Drag overlay */}
			{isDragActive && (
				<div
					className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/10 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none"
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
				<CardHeader
					className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl relative"
					onClick={() => setIsExpanded(!isExpanded)}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Data input</CardTitle>
						</div>
						<div className="transform transition-transform duration-200 ease-in-out">
							{isExpanded ? (
								<ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
							) : (
								<ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
							)}
						</div>
					</div>
				</CardHeader>

				<div
					className={`transition-all duration-300 ease-in-out ${
						isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
					} overflow-hidden`}>
					<CardContent className="space-y-4 px-6 pb-6 pt-2">
						<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
							<TabsList className="inline-flex h-auto items-center justify-start gap-1 bg-transparent p-0">
								<TabsTrigger
									value="symbol"
									className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-normal ring-offset-background transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50 data-[state=inactive]:bg-transparent w-auto text-gray-700 dark:text-gray-300 group">
									<MapPin className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
									Symbol map
								</TabsTrigger>
								<TabsTrigger
									value="choropleth"
									className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-normal ring-offset-background transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50 data-[state=inactive]:bg-transparent w-auto text-gray-700 dark:text-gray-300 group">
									<BarChart3 className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
									Choropleth
								</TabsTrigger>
								<TabsTrigger
									value="custom"
									className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-normal ring-offset-background transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50 data-[state=inactive]:bg-transparent w-auto text-gray-700 dark:text-gray-300 group">
									<MapIcon className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
									Custom map
								</TabsTrigger>
							</TabsList>

							<div className="mt-4">
								<TabsContent
									value="symbol"
									className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<label htmlFor="symbol-data-input" className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
												Paste CSV or TSV data
											</label>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
															className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
												<Button
													variant="outline"
													size="sm"
													onClick={symbolRawData.trim() ? () => setSymbolRawData('') : undefined}
													className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
													disabled={!symbolRawData.trim()}>
													Clear data
												</Button>
											</div>
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
										<div className="flex items-center justify-between">
											<label htmlFor="choropleth-data-input" className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
												Paste Choropleth data
											</label>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
															className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
												<Button
													variant="outline"
													size="sm"
													onClick={choroplethRawData.trim() ? () => setChoroplethRawData('') : undefined}
													className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
													disabled={!choroplethRawData.trim()}>
													Clear data
												</Button>
											</div>
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

								<TabsContent
									value="custom"
									className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<label htmlFor="custom-svg-input" className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
												Paste SVG code
											</label>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setCustomSVG('');
													onClearData('custom'); // Call onClearData for custom map
												}}
												disabled={!customSVG.trim()}
												className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
												Clear code
											</Button>
										</div>
										<Textarea
											id="custom-svg-input"
											placeholder="Paste your SVG code here..."
											value={customSVG}
											onChange={handleCustomSVGChange}
											className="min-h-[120px] font-mono text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
										/>
									</div>
								</TabsContent>
							</div>
						</Tabs>

						<div className="flex items-center justify-between">
							{activeTab === 'custom' ? (
								<div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
									<span>Paste SVG code for custom map visualization</span>
									<Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
										<DialogTrigger asChild>
											<Button
												variant="link"
												size="sm"
												className="p-0 h-auto ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer inline-flex items-center gap-1 text-xs"
												onClick={() => setShowHelpModal(true)} // Explicitly set state on click
											>
												<HelpCircle className="w-3 h-3" />
												Help
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
											{' '}
											{/* Added max-h and overflow-y-auto */}
											<DialogHeader>
												<DialogTitle>Custom Map SVG Structure</DialogTitle>
												<DialogDescription>
													For the custom map to work correctly, your SVG should follow a specific structure:
												</DialogDescription>
											</DialogHeader>
											<div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 py-2">
												{' '}
												{/* Added py-2 for internal padding */}
												<p>
													Your SVG should contain a main <code className="font-mono">{'<g id="Map">'}</code> group.
													Inside this group, you should have:
												</p>
												<ul className="list-disc list-inside space-y-2 pl-4">
													{' '}
													{/* Added pl-4 for better list indentation */}
													<li>
														A <code className="font-mono">{'<g id="Nations">'}</code> (or{' '}
														<code className="font-mono">{'<g id="Countries">'}</code>) group for national boundaries.
														This group should contain a path for the US, e.g.,{' '}
														<code className="font-mono">{'<path id="Country-US">'}</code>.
													</li>
													<li>
														A <code className="font-mono">{'<g id="States">'}</code> (or{' '}
														<code className="font-mono">{'<g id="Provinces">'}</code>,{' '}
														<code className="font-mono">{'<g id="Regions">'}</code>) group for state/province/region
														boundaries. Paths within this group should have IDs that identify the state, e.g.,{' '}
														<code className="font-mono">{'<path id="State-CA">'}</code> (using 2-letter abbreviation) or{' '}
														<code className="font-mono">{'<path id="State-06">'}</code> (using FIPS code). If a state is
														composed of multiple paths, wrap them in a group with the state ID, e.g.,{' '}
														<code className="font-mono">{'<g id="State-CA"><path/><path/></g>'}</code>.
													</li>
												</ul>
												<p>Example structure:</p>
												<pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs overflow-auto border border-gray-200 dark:border-gray-700">
													{' '}
													{/* Added border for definition */}
													<code>
														{`
<svg width="..." height="..." viewBox="...">
  <g id="Map">
    <g id="Nations">
      <path id="Country-US" d="..." />
    </g>
    <g id="States">
      <path id="State-AL" d="..." />
      <g id="State-AK">
        <path d="..." />
        <path d="..." />
      </g>
      <path id="State-CA" d="..." />
      {/* ... other states ... */}
    </g>
  </g>
</svg>
`}
													</code>
												</pre>
												<p>
													Ensure all path data (<code className="font-mono">d</code> attribute) is valid and closed
													(ends with <code className="font-mono">Z</code> or <code className="font-mono">z</code>).
												</p>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							) : (
								<p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
									Copy and paste data directly from Google Sheet, Excel, or any CSV/TSV source.
								</p>
							)}
							<Button
								onClick={handleLoadData}
								disabled={isLoadButtonDisabled()}
								className="transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:hover:bg-blue-600">
								{activeTab === 'custom' ? 'Load map' : 'Load data'}
							</Button>
						</div>
					</CardContent>
				</div>
			</div>
		</Card>
	);
}
