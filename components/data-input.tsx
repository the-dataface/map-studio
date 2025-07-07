'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, MapPin, BarChart3, MapIcon, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import type { DataRow } from '@/app/page';
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

	const ensurePathsClosedAndFormatSVG = (svgString: string): { formattedSvg: string; closedPathCount: number } => {
		let closedCount = 0;
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgString, 'image/svg+xml');
			const paths = doc.querySelectorAll('path');

			paths.forEach((path) => {
				const d = path.getAttribute('d');
				if (d && !d.trim().endsWith('Z') && !d.trim().endsWith('z')) {
					path.setAttribute('d', d.trim() + 'Z');
					closedCount++;
				}
			});

			const serializer = new XMLSerializer();
			const modifiedSvgString = serializer.serializeToString(doc);

			// Apply the existing formatting logic
			let formatted = modifiedSvgString.trim().replace(/\s+/g, ' ');
			formatted = formatted
				.replace(/(<[^/][^>]*>)(?!<)/g, '$1\n')
				.replace(/(<\/[^>]+>)/g, '\n$1\n')
				.replace(/(<[^>]*\/>)/g, '$1\n')
				.replace(/\n\s*\n/g, '\n')
				.split('\n')
				.map((line, index) => {
					const trimmed = line.trim();
					if (!trimmed) return '';

					const openTags = (
						modifiedSvgString.substring(0, modifiedSvgString.indexOf(trimmed)).match(/<[^/][^>]*>/g) || []
					).length;
					const closeTags = (
						modifiedSvgString.substring(0, modifiedSvgString.indexOf(trimmed)).match(/<\/[^>]+>/g) || []
					).length;
					const selfClosing = (
						modifiedSvgString.substring(0, modifiedSvgString.indexOf(trimmed)).match(/<[^>]*\/>/g) || []
					).length;

					let indent = Math.max(0, openTags - closeTags - selfClosing);

					if (trimmed.startsWith('</')) {
						indent = Math.max(0, indent - 1);
					}

					return '  '.repeat(indent) + trimmed;
				})
				.filter((line) => line.trim())
				.join('\n');

			return { formattedSvg: formatted, closedPathCount: closedCount };
		} catch (e) {
			console.error('Error in ensurePathsClosedAndFormatSVG:', e);
			return {
				formattedSvg: svgString
					.replace(/></g, '>\n<')
					.replace(/^\s+|\s+$/gm, '')
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line)
					.join('\n'),
				closedPathCount: 0,
			};
		}
	};

	const parseCSVData = (csvText: string): { data: DataRow[]; columns: string[] } => {
		if (!csvText.trim()) return { data: [], columns: [] };

		const lines = csvText.trim().split('\n');
		// Detect delimiter: if header contains tab, use tab; else use comma
		const delimiter = lines[0].includes('\t') ? '\t' : ',';

		// Helper for CSV: split line by comma, respecting quoted fields
		function splitCSV(line: string): string[] {
			const result: string[] = [];
			let current = '';
			let inQuotes = false;
			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '"') {
					if (inQuotes && line[i + 1] === '"') {
						current += '"';
						i++; // Escaped quote
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === ',' && !inQuotes) {
					result.push(current);
					current = '';
				} else {
					current += char;
				}
			}
			result.push(current);
			return result;
		}

		// Split headers
		const headers =
			delimiter === '\t'
				? lines[0].split('\t').map((h) => h.trim().replace(/"/g, ''))
				: splitCSV(lines[0]).map((h) => h.trim().replace(/"/g, ''));

		// Split data lines
		const data = lines.slice(1).map((line) => {
			const values =
				delimiter === '\t'
					? line.split('\t').map((v) => v.trim().replace(/"/g, ''))
					: splitCSV(line).map((v) => v.trim().replace(/"/g, ''));
			const row: DataRow = {};
			headers.forEach((header, index) => {
				row[header] = values[index] || '';
			});
			return row;
		});

		return { data, columns: headers };
	};

	const loadSampleData = () => {
		const sampleData = `Company,City,State,Employees,Revenue
Tech Corp,San Francisco,CA,1200,45M
Data Inc,New York,NY,800,32M
Cloud Co,Seattle,WA,1500,67M
AI Systems,Austin,TX,600,28M
Web Solutions,Boston,MA,900,41M`;

		if (activeTab === 'symbol') {
			setSymbolRawData(sampleData);
		}
	};

	const loadChoroplethSampleData = () => {
		const sampleData = `State,Population_Density,Median_Income,Education_Rate,Region
AL,97.9,52078,85.3,South
AK,1.3,77640,92.1,West
AZ,64.9,62055,87.5,West
AR,58.4,48952,84.8,South
CA,253.9,80440,83.6,West
CO,56.4,77127,91.7,West
CT,735.8,78444,90.8,Northeast
DE,504.3,70176,90.1,South
FL,397.2,59227,88.5,South
GA,186.6,61980,86.7,South
HI,219.9,83102,91.3,West
ID,22.3,60999,90.2,West
IL,230.8,65886,88.5,Midwest
IN,188.1,57603,88.1,Midwest
IA,56.9,61691,91.7,Midwest
KS,35.9,62087,90.2,Midwest
KY,113.0,50589,85.1,South
LA,107.5,51073,84.0,South
ME,43.6,58924,91.8,Northeast
MD,626.6,86738,90.2,South
MA,894.4,85843,91.2,Northeast
MI,177.6,59584,90.1,Midwest
MN,71.5,74593,93.0,Midwest
MS,63.7,45792,83.4,South
MO,89.5,57409,89.0,Midwest
MT,7.4,57153,93.1,West
NE,25.4,63229,91.4,Midwest
NV,28.5,63276,86.1,West
NH,153.8,77933,92.8,Northeast
NJ,1263.0,85751,90.1,Northeast
NM,17.5,51945,85.7,West
NY,421.0,71117,86.7,Northeast
NC,218.5,56642,87.7,South
ND,11.0,63837,92.9,Midwest
OH,287.5,58642,89.5,Midwest
OK,57.7,54449,87.2,South
OR,44.0,67058,91.1,West
PA,290.5,63463,90.6,Northeast
RI,1061.4,71169,85.7,Northeast
SC,173.3,56227,87.3,South
SD,11.9,59533,92.0,Midwest
TN,167.2,56071,86.6,South
TX,112.8,64034,84.7,South
UT,39.9,75780,92.3,West
VT,68.1,63001,92.6,Northeast
VA,218.4,76456,88.9,South
WA,117.4,78687,91.8,West
WV,74.6,48850,86.0,South
WI,108.0,64168,91.7,Midwest
WY,6.0,65003,93.3,West`;

		setChoroplethRawData(sampleData);
	};

	// Add a validation function
	const validateCustomSVG = (svgString: string): { isValid: boolean; message: string } => {
		if (!svgString.trim()) {
			return { isValid: false, message: 'SVG code cannot be empty.' };
		}
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgString, 'image/svg+xml');

			// Check for parsing errors
			const errorNode = doc.querySelector('parsererror');
			if (errorNode) {
				return { isValid: false, message: `Invalid SVG format: ${errorNode.textContent}` };
			}

			const svgElement = doc.documentElement;
			if (svgElement.tagName.toLowerCase() !== 'svg') {
				return { isValid: false, message: 'Root element must be <svg>.' };
			}

			// Check for g#Map
			const mapGroup = svgElement.querySelector('g#Map');
			if (!mapGroup) {
				return { isValid: false, message: "Missing required <g id='Map'> group." };
			}

			// Check for g#Nations or g#Countries
			const nationsGroup = mapGroup.querySelector('g#Nations, g#Countries');
			if (!nationsGroup) {
				return {
					isValid: false,
					message: "Missing required <g id='Nations'> or <g id='Countries'> group inside #Map.",
				};
			}

			// Check for g#States, g#Provinces, or g#Regions
			const statesGroup = mapGroup.querySelector('g#States, g#Provinces, g#Regions');
			if (!statesGroup) {
				return {
					isValid: false,
					message: "Missing required <g id='States'>, <g id='Provinces'>, or <g id='Regions'> group inside #Map.",
				};
			}

			// Check for Country-US or Nation-US path in Nations/Countries group
			const countryUSPath = nationsGroup.querySelector('path#Country-US, path#Nation-US');
			if (!countryUSPath) {
				return {
					isValid: false,
					message: "Missing required <path id='Country-US'> or <path id='Nation-US'> inside Nations/Countries group.",
				};
			}

			// Check for State-XX, Nation-XX, Country-XX, Province-XX, or Region-XX paths in States/Provinces/Regions group (at least one)
			const statePaths = statesGroup.querySelectorAll(
				"path[id^='State-'], path[id^='Nation-'], path[id^='Country-'], path[id^='Province-'], path[id^='Region-']"
			);
			if (statePaths.length === 0) {
				return {
					isValid: false,
					message:
						"No <path id='State-XX'>, <path id='Nation-XX'>, <path id='Country-XX'>, <path id='Province-XX'>, or <path id='Region-XX'> elements found inside States/Provinces/Regions group.",
				};
			}

			return { isValid: true, message: 'SVG is valid.' };
		} catch (e: any) {
			return { isValid: false, message: `Error parsing SVG: ${e.message}` };
		}
	};

	const handleLoadData = () => {
		if (activeTab === 'symbol') {
			const { data, columns } = parseCSVData(symbolRawData);
			if (data.length > 0) {
				onDataLoad('symbol', data, columns, symbolRawData);
				toast({
					description: `${data.length} rows of symbol data loaded successfully.`,
					variant: 'success',
					icon: <CheckCircle className="h-5 w-5" />,
				});
			}
		} else if (activeTab === 'choropleth') {
			const { data, columns } = parseCSVData(choroplethRawData);
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
					const parsed = parseCSVData(text);
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
											<label className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
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
											<label className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
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
											<label className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
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
