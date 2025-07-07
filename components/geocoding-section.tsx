'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	ChevronDown,
	ChevronUp,
	Search,
	Trash2,
	Database,
	Check,
	X,
	Loader2,
	AlertCircle,
	HardDrive,
} from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogOverlay,
} from '@/components/ui/dialog';
import type { DataRow, GeocodedRow } from '@/app/page';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface GeocodingSectionProps {
	columns: string[];
	parsedData: DataRow[];
	setGeocodedData: (data: GeocodedRow[]) => void;
	isGeocoding: boolean;
	setIsGeocoding: (loading: boolean) => void;
}

interface GeocodingStatus {
	cached: number;
	success: number;
	failed: number;
	processing: number;
	total: number;
}

interface CachedLocation {
	lat: number;
	lng: number;
	timestamp: number;
	source: string;
}

// Cache for geocoded addresses (in-memory for current session)
const sessionCache: Record<string, { lat: number; lng: number }> = {};

// Local storage keys
const CACHE_KEY = 'mapstudio_geocode_cache';
const CACHE_CONSENT_KEY = 'mapstudio_cache_consent';
const PERMISSION_ASKED_KEY = 'mapstudio_permission_asked';

// State name mappings for normalization
const stateAbbreviations: Record<string, string> = {
	alabama: 'AL',
	alaska: 'AK',
	arizona: 'AZ',
	arkansas: 'AR',
	california: 'CA',
	colorado: 'CO',
	connecticut: 'CT',
	delaware: 'DE',
	florida: 'FL',
	georgia: 'GA',
	hawaii: 'HI',
	idaho: 'ID',
	illinois: 'IL',
	indiana: 'IN',
	iowa: 'IA',
	kansas: 'KS',
	kentucky: 'KY',
	louisiana: 'LA',
	maine: 'ME',
	maryland: 'MD',
	massachusetts: 'MA',
	michigan: 'MI',
	minnesota: 'MN',
	mississippi: 'MS',
	missouri: 'MO',
	montana: 'MT',
	nebraska: 'NE',
	nevada: 'NV',
	'new hampshire': 'NH',
	'new jersey': 'NJ',
	'new mexico': 'NM',
	'new york': 'NY',
	'north carolina': 'NC',
	'north dakota': 'ND',
	ohio: 'OH',
	oklahoma: 'OK',
	oregon: 'OR',
	pennsylvania: 'PA',
	'rhode island': 'RI',
	'south carolina': 'SC',
	'south dakota': 'SD',
	tennessee: 'TN',
	texas: 'TX',
	utah: 'UT',
	vermont: 'VT',
	virginia: 'VA',
	washington: 'WA',
	'west virginia': 'WV',
	wisconsin: 'WI',
	wyoming: 'WY',
};

export function GeocodingSection({
	columns,
	parsedData,
	setGeocodedData,
	isGeocoding,
	setIsGeocoding,
}: GeocodingSectionProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [fullAddressColumn, setFullAddressColumn] = useState<string>('none');
	const [cityColumn, setCityColumn] = useState<string>('none');
	const [stateColumn, setStateColumn] = useState<string>('none');
	const [geocodingStatus, setGeocodingStatus] = useState<GeocodingStatus>({
		cached: 0,
		success: 0,
		failed: 0,
		processing: 0,
		total: 0,
	});
	const [cacheSize, setCacheSize] = useState(0);
	const [showConsentModal, setShowConsentModal] = useState(false);
	const [cacheConsent, setCacheConsent] = useState<boolean | null>(null);
	const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
	const [pendingGeocode, setPendingGeocode] = useState(false);

	// Intelligent column matching
	useEffect(() => {
		if (columns.length > 0) {
			// Match full address column
			const addressColumn = columns.find(
				(col) =>
					col.toLowerCase().includes('address') ||
					col.toLowerCase().includes('location') ||
					col.toLowerCase().includes('addr')
			);
			if (addressColumn && fullAddressColumn === 'none') {
				setFullAddressColumn(addressColumn);
			}

			// Match city column
			const cityCol = columns.find((col) => col.toLowerCase().includes('city') || col.toLowerCase().includes('town'));
			if (cityCol && cityColumn === 'none') {
				setCityColumn(cityCol);
			}

			// Match state column
			const stateCol = columns.find(
				(col) =>
					col.toLowerCase().includes('state') ||
					col.toLowerCase().includes('province') ||
					col.toLowerCase().includes('region')
			);
			if (stateCol && stateColumn === 'none') {
				setStateColumn(stateCol);
			}
		}
	}, [columns, fullAddressColumn, cityColumn, stateColumn]);

	// Check for existing preferences on component mount
	useEffect(() => {
		if (typeof window !== 'undefined') {
			// Ensure window is defined for localStorage access
			try {
				const consent = localStorage.getItem(CACHE_CONSENT_KEY);
				const asked = localStorage.getItem(PERMISSION_ASKED_KEY);

				if (consent !== null) {
					setCacheConsent(consent === 'true');
				}

				if (asked !== null) {
					setPermissionAsked(asked === 'true');
				}

				updateCacheSize(); // Initialize cache size on mount
			} catch (error) {
				console.warn('Error reading preferences from localStorage:', error);
			}
		}
	}, []);

	// Normalize state name to abbreviation
	const normalizeState = (state: string): string => {
		const normalized = state.toLowerCase().trim();
		return stateAbbreviations[normalized] || state.toUpperCase();
	};

	// Create a normalized cache key for city/state combinations
	const createCacheKey = (city: string, state: string): string => {
		const normalizedCity = city.toLowerCase().trim();
		const normalizedState = normalizeState(state);
		return `${normalizedCity},${normalizedState}`;
	};

	// Get cached location from localStorage
	const getCachedLocation = (cacheKey: string): CachedLocation | null => {
		if (!cacheConsent || typeof window === 'undefined') return null; // Ensure window is defined

		try {
			const cache = localStorage.getItem(CACHE_KEY);
			if (!cache) return null;

			const parsedCache = JSON.parse(cache);
			const location = parsedCache[cacheKey];

			if (location && location.timestamp) {
				// Check if cache is less than 30 days old
				const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
				if (location.timestamp > thirtyDaysAgo) {
					return location;
				}
			}
		} catch (error) {
			console.warn('Error reading geocode cache:', error);
		}

		return null;
	};

	// Save location to localStorage
	const saveCachedLocation = (cacheKey: string, lat: number, lng: number, source = 'nominatim') => {
		if (!cacheConsent || typeof window === 'undefined') return; // Ensure window is defined

		try {
			const cache = localStorage.getItem(CACHE_KEY);
			const parsedCache = cache ? JSON.parse(cache) : {};

			parsedCache[cacheKey] = {
				lat,
				lng,
				timestamp: Date.now(),
				source,
			};

			localStorage.setItem(CACHE_KEY, JSON.stringify(parsedCache));
			updateCacheSize(); // Update cache size after saving
		} catch (error) {
			console.warn('Error saving to geocode cache:', error);
		}
	};

	// Update cache size counter
	const updateCacheSize = () => {
		if (typeof window === 'undefined') return; // Ensure window is defined
		try {
			const cache = localStorage.getItem(CACHE_KEY);
			if (cache) {
				const parsedCache = JSON.parse(cache);
				setCacheSize(Object.keys(parsedCache).length);
			} else {
				setCacheSize(0);
			}
		} catch (error) {
			setCacheSize(0);
		}
	};

	// Clear all cached data and reset permissions
	const clearAllCache = () => {
		if (typeof window === 'undefined') return; // Ensure window is defined
		try {
			localStorage.removeItem(CACHE_KEY);
			Object.keys(sessionCache).forEach((key) => delete sessionCache[key]);
			setCacheSize(0); // Reset cache size display
			setGeocodingStatus({
				cached: 0,
				success: 0,
				failed: 0,
				processing: 0,
				total: 0,
			});
			toast({
				description: 'Geocoding cache cleared.',
				variant: 'default',
				icon: <Trash2 className="h-5 w-5" />,
			});
		} catch (error) {
			console.warn('Error clearing cache:', error);
		}
	};

	// Function to geocode using cache-first approach
	const geocodeAddress = async (address: string, city?: string, state?: string) => {
		// Create cache key for city/state combinations
		let cacheKey = address.toLowerCase().trim();
		if (city && state) {
			cacheKey = createCacheKey(city, state);
		}

		// 1. Check session cache first (in-memory for current session)
		if (sessionCache[cacheKey]) {
			return {
				lat: sessionCache[cacheKey].lat,
				lng: sessionCache[cacheKey].lng,
				fromCache: true,
				source: 'session',
			};
		}

		// 2. Check persistent cache (localStorage)
		const cachedLocation = getCachedLocation(cacheKey);
		if (cachedLocation) {
			// Also store in session cache for faster access during the current session
			sessionCache[cacheKey] = { lat: cachedLocation.lat, lng: cachedLocation.lng };
			return {
				lat: cachedLocation.lat,
				lng: cachedLocation.lng,
				fromCache: true,
				source: 'persistent',
			};
		}

		try {
			// 3. If not in cache, use Nominatim (OpenStreetMap) geocoding service
			const encodedAddress = encodeURIComponent(address);
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
				{
					headers: {
						'User-Agent': 'MapStudio/1.0 (https://mapstudio.app)',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data && data.length > 0) {
				const result = data[0];
				const coordinates = {
					lat: Number.parseFloat(result.lat),
					lng: Number.parseFloat(result.lon),
				};

				// Cache the result in both session and persistent storage
				sessionCache[cacheKey] = coordinates;
				saveCachedLocation(cacheKey, coordinates.lat, coordinates.lng, 'nominatim');

				return { ...coordinates, fromCache: false, source: 'api' };
			}

			throw new Error('No results found');
		} catch (error) {
			console.warn(`Geocoding failed for address: ${address}`, error);
			throw error;
		}
	};

	// Execute the actual geocoding process
	const executeGeocode = useCallback(async () => {
		if (!parsedData.length) return;

		// Determine the best-matching latitude/longitude column names
		const latNames = ['latitude', 'lat', 'Latitude', 'Lat'];
		const lngNames = ['longitude', 'long', 'lng', 'lon', 'Longitude', 'Long', 'Lng', 'Lon'];
		const latCol =
			columns.find((col) => latNames.includes(col.trim().toLowerCase())) ||
			columns.find((col) => latNames.some((name) => col.trim().toLowerCase() === name.toLowerCase()));
		const lngCol =
			columns.find((col) => lngNames.includes(col.trim().toLowerCase())) ||
			columns.find((col) => lngNames.some((name) => col.trim().toLowerCase() === name.toLowerCase()));
		const chosenLatCol = latCol || 'latitude';
		const chosenLngCol = lngCol || 'longitude';

		setIsGeocoding(true);
		const initialStatus = {
			cached: 0,
			success: 0,
			failed: 0,
			processing: parsedData.length,
			total: parsedData.length,
		};
		setGeocodingStatus(initialStatus);

		// Initialize geocoded results with processing status for all rows
		const geocodedResults: GeocodedRow[] = parsedData.map(
			(row) =>
				({
					...row,
					processing: true as boolean | undefined,
					geocoded: undefined as boolean | undefined,
					source: undefined as string | undefined,
				} as GeocodedRow)
		);

		// Set initial data with processing status
		setGeocodedData([...geocodedResults]);

		for (let i = 0; i < parsedData.length; i++) {
			const row = parsedData[i];
			let address = '';
			let city = '';
			let state = '';

			// Check for existing valid latitude/longitude
			const hasValidLat =
				row.hasOwnProperty(chosenLatCol) &&
				row[chosenLatCol] !== undefined &&
				row[chosenLatCol] !== null &&
				row[chosenLatCol] !== '' &&
				!isNaN(Number(row[chosenLatCol]));
			const hasValidLng =
				row.hasOwnProperty(chosenLngCol) &&
				row[chosenLngCol] !== undefined &&
				row[chosenLngCol] !== null &&
				row[chosenLngCol] !== '' &&
				!isNaN(Number(row[chosenLngCol]));

			if (hasValidLat && hasValidLng) {
				// Already has valid coordinates, skip geocoding
				geocodedResults[i] = {
					...row,
					[chosenLatCol]: Number(row[chosenLatCol]),
					[chosenLngCol]: Number(row[chosenLngCol]),
					geocoded: true,
					source: 'existing',
					processing: false,
				} as GeocodedRow;
				setGeocodedData([...geocodedResults]);
				setGeocodingStatus((prev) => ({
					...prev,
					cached: prev.cached + 1,
					processing: prev.processing - 1,
				}));
				continue;
			}

			// Build address string and extract city/state for caching
			if (fullAddressColumn !== 'none' && row[fullAddressColumn]) {
				address = String(row[fullAddressColumn]);
			} else {
				if (cityColumn !== 'none' && row[cityColumn]) {
					city = String(row[cityColumn]);
				}
				if (stateColumn !== 'none' && row[stateColumn]) {
					state = String(row[stateColumn]);
				}
				address = [city, state].filter(Boolean).join(', ');
			}

			if (address) {
				try {
					const result = await geocodeAddress(address, city, state);

					if (result.fromCache) {
						setGeocodingStatus((prev) => ({
							...prev,
							cached: prev.cached + 1,
							processing: prev.processing - 1,
						}));
					} else {
						setGeocodingStatus((prev) => ({
							...prev,
							success: prev.success + 1,
							processing: prev.processing - 1,
						}));
					}

					// Only fill in missing/invalid lat/lon, do not overwrite existing valid values
					geocodedResults[i] = {
						...row,
						[chosenLatCol]: hasValidLat ? Number(row[chosenLatCol]) : result.lat,
						[chosenLngCol]: hasValidLng ? Number(row[chosenLngCol]) : result.lng,
						geocoded: true,
						source: result.source,
						processing: false,
					} as GeocodedRow;

					setGeocodedData([...geocodedResults]);

					if (!result.fromCache) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
					}
				} catch (error) {
					console.warn(`Failed to geocode: ${address}`, error);

					geocodedResults[i] = {
						...row,
						geocoded: false,
						processing: false,
					} as GeocodedRow;

					setGeocodedData([...geocodedResults]);

					setGeocodingStatus((prev) => ({
						...prev,
						failed: prev.failed + 1,
						processing: prev.processing - 1,
					}));
				}
			} else {
				geocodedResults[i] = {
					...row,
					geocoded: false,
					processing: false,
				} as GeocodedRow;

				setGeocodedData([...geocodedResults]);

				setGeocodingStatus((prev) => ({
					...prev,
					failed: prev.failed + 1,
					processing: prev.processing - 1,
				}));
			}
		}

		const finalCached = geocodedResults.filter((row) => row.geocoded && row.source !== 'api').length;
		const finalSuccess = geocodedResults.filter((row) => row.geocoded && row.source === 'api').length;
		const finalFailed = geocodedResults.filter((row) => row.geocoded === false).length;

		setIsGeocoding(false);
		if (finalFailed === 0) {
			toast({
				description: `${finalSuccess + finalCached} locations geocoded successfully.`,
				variant: 'success',
				icon: <Check className="h-5 w-5" />,
			});
		} else {
			toast({
				description: `${finalSuccess + finalCached} locations geocoded, ${finalFailed} failed.`,
				variant: 'destructive',
				icon: <AlertCircle className="h-5 w-5" />,
			});
		}
		setIsExpanded(false);
	}, [parsedData, fullAddressColumn, cityColumn, stateColumn, setIsGeocoding, setGeocodedData]);

	// Handle cache consent
	const handleCacheConsent = useCallback(
		async (consent: boolean) => {
			if (typeof window === 'undefined') return; // Ensure window is defined
			try {
				setCacheConsent(consent);
				setPermissionAsked(true);
				localStorage.setItem(CACHE_CONSENT_KEY, consent.toString());
				localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
				setShowConsentModal(false);

				if (consent) {
					updateCacheSize();
					toast({
						description: 'Geocoding cache enabled. Future geocoding will be faster.',
						variant: 'success',
						icon: <Database className="h-5 w-5" />,
					});
				} else {
					clearAllCache();
					toast({
						description: 'Geocoding cache disabled. Performance may be slower.',
						variant: 'default',
						icon: <AlertCircle className="h-5 w-5" />,
					});
				}

				// If there was a pending geocode request, execute it now
				if (pendingGeocode) {
					setPendingGeocode(false);
					await executeGeocode();
				}
			} catch (error) {
				console.warn('Error saving consent preference:', error);
				// Fallback: proceed without persistent storage
				setCacheConsent(consent);
				setPermissionAsked(true);
				setShowConsentModal(false);

				if (pendingGeocode) {
					setPendingGeocode(false);
					await executeGeocode();
				}
			}
		},
		[pendingGeocode, executeGeocode]
	);

	// Handle geocode button click
	const handleGeocodeClick = async () => {
		if (!parsedData.length) return;

		// Check if permission has been asked before
		if (!permissionAsked && cacheConsent === null) {
			setPendingGeocode(true);
			setShowConsentModal(true);
			return;
		}

		// If permission was already asked, proceed with the stored preference
		await executeGeocode();
	};

	const canGeocode =
		(fullAddressColumn !== 'none' && columns.includes(fullAddressColumn)) ||
		(cityColumn !== 'none' && stateColumn !== 'none' && columns.includes(cityColumn) && columns.includes(stateColumn));

	const getStatusSummary = () => {
		if (geocodingStatus.total === 0) return '';
		const completed = geocodingStatus.success + geocodingStatus.failed + geocodingStatus.cached;
		return `${completed}/${geocodingStatus.total}`;
	};

	// Keyboard shortcuts for the modal
	useEffect(() => {
		if (showConsentModal) {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					handleCacheConsent(true);
				} else if (event.key === 'Escape') {
					event.preventDefault();
					handleCacheConsent(false);
				}
			};

			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [showConsentModal, handleCacheConsent]);

	return (
		<>
			<Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
				<CardHeader
					className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl relative"
					onClick={() => setIsExpanded(!isExpanded)}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Geocoding</CardTitle>
							{geocodingStatus.total > 0 && (
								<div className="flex items-center gap-3 text-xs animate-in fade-in-50 slide-in-from-left-2 duration-300">
									{geocodingStatus.cached > 0 && (
										<div className="flex items-center gap-1">
											<Database className="h-3 w-3 text-blue-500 transition-transform duration-200 hover:scale-110" />
											<span className="text-blue-700 dark:text-blue-300 transition-colors duration-200">
												{geocodingStatus.cached}
											</span>
										</div>
									)}
									{geocodingStatus.success > 0 && (
										<div className="flex items-center gap-1">
											<Check className="h-3 w-3 text-green-500 transition-transform duration-200 hover:scale-110" />
											<span className="text-green-700 dark:text-green-300 transition-colors duration-200">
												{geocodingStatus.success}
											</span>
										</div>
									)}
									{geocodingStatus.failed > 0 && (
										<div className="flex items-center gap-1">
											<X className="h-3 w-3 text-red-500 transition-transform duration-200 hover:scale-110" />
											<span className="text-red-700 dark:text-red-300 transition-colors duration-200">
												{geocodingStatus.failed}
											</span>
										</div>
									)}
									{geocodingStatus.processing > 0 && (
										<div className="flex items-center gap-1">
											<Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
											<span className="text-orange-700 dark:text-orange-300 transition-colors duration-200">
												{geocodingStatus.processing}
											</span>
										</div>
									)}
								</div>
							)}
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
						isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
					} overflow-hidden`}>
					<CardContent className="space-y-4 px-6 pb-6 pt-2">
						<div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
							<h3 className="font-medium mb-1 text-gray-900 dark:text-white transition-colors duration-200">
								Generate coordinates from location data
							</h3>
							<p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
								Choose either a full address column or separate city and state columns to geocode your data.
							</p>
						</div>

						<div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-75">
							<div>
								<label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white transition-colors duration-200">
									Full address column
								</label>
								<Select value={fullAddressColumn} onValueChange={setFullAddressColumn}>
									<SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-blue-500 focus:border-blue-500">
										<SelectValue placeholder="None" />
									</SelectTrigger>
									<SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700">
										<SelectItem
											value="none"
											className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
											None
										</SelectItem>
										{columns.map((column) => (
											<SelectItem
												key={column}
												value={column}
												className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
												{column}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-gray-200 dark:border-gray-700 transition-colors duration-200" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 transition-colors duration-200">
										OR
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white transition-colors duration-200">
										City column
									</label>
									<Select value={cityColumn} onValueChange={setCityColumn}>
										<SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-blue-500 focus:border-blue-500">
											<SelectValue placeholder="City" />
										</SelectTrigger>
										<SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700">
											<SelectItem
												value="none"
												className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
												None
											</SelectItem>
											{columns.map((column) => (
												<SelectItem
													key={column}
													value={column}
													className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
													{column}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white transition-colors duration-200">
										State column
									</label>
									<Select value={stateColumn} onValueChange={setStateColumn}>
										<SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-blue-500 focus:border-blue-500">
											<SelectValue placeholder="State" />
										</SelectTrigger>
										<SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700">
											<SelectItem
												value="none"
												className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
												None
											</SelectItem>
											{columns.map((column) => (
												<SelectItem
													key={column}
													value={column}
													className="text-gray-900 dark:text-gray-100 transition-colors duration-200">
													{column}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{stateColumn !== 'none' && (
										<p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-1">
											<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
											Abbreviated state names
										</p>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between pt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-150">
							<div className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
								{canGeocode ? 'Ready to generate coordinates' : 'Select address columns to enable geocoding'}
							</div>
							<Button
								onClick={handleGeocodeClick}
								disabled={!canGeocode || isGeocoding || !parsedData.length}
								className={cn(
									'flex items-center gap-2 transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:hover:bg-blue-600',
									'group'
								)}>
								<Search className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
								{isGeocoding ? 'Geocoding...' : 'Geocode'}
							</Button>
						</div>

						{geocodingStatus.total > 0 && (
							<div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2">
								<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
									Geocoding status
								</div>
								<div className="flex items-center gap-4 text-xs">
									{geocodingStatus.cached > 0 && (
										<div className="flex items-center gap-1 animate-in fade-in-50 slide-in-from-left-1 duration-300">
											<Database className="h-3 w-3 text-blue-500" /> {/* Blue database icon for cached hits */}
											<span className="text-blue-700 dark:text-blue-300 transition-colors duration-200">
												{geocodingStatus.cached}
											</span>
										</div>
									)}
									{geocodingStatus.success > 0 && (
										<div className="flex items-center gap-1 animate-in fade-in-50 slide-in-from-left-1 duration-300 delay-75">
											<Check className="h-3 w-3 text-green-500" />
											<span className="text-green-700 dark:text-green-300 transition-colors duration-200">
												{geocodingStatus.success}
											</span>
										</div>
									)}
									{geocodingStatus.failed > 0 && (
										<div className="flex items-center gap-1 animate-in fade-in-50 slide-in-from-left-1 duration-300 delay-150">
											<X className="h-3 w-3 text-red-500" />
											<span className="text-red-700 dark:text-red-300 transition-colors duration-200">
												{geocodingStatus.failed}
											</span>
										</div>
									)}
									{geocodingStatus.processing > 0 && (
										<div className="flex items-center gap-1 animate-in fade-in-50 slide-in-from-left-1 duration-300 delay-200">
											<Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
											<span className="text-orange-700 dark:text-orange-300 transition-colors duration-200">
												{geocodingStatus.processing}
											</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Cache Pane - Displays current cache size */}
						<div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2 delay-200">
							<div className="flex items-center justify-between">
								<div className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">
									{cacheConsent === false ? (
										<span className="flex items-center gap-1">
											<AlertCircle className="h-3 w-3 text-orange-500 animate-pulse" />
											Caching disabled - slower geocoding
										</span>
									) : cacheConsent === true ? (
										<>
											Cache: {cacheSize} locations stored locally ({(cacheSize * 0.1).toFixed(1)} KB)
										</>
									) : (
										<>Cache: Not configured</>
									)}
								</div>
								<div className="flex gap-2">
									{(cacheConsent === false || !permissionAsked) && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowConsentModal(true)}
											className={cn(
												'h-6 px-2 text-xs border-gray-300 dark:border-gray-600 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
												'group'
											)}>
											<Database className="h-3 w-3 mr-1 transition-transform duration-300 group-hover:scale-110" />
											Configure cache
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={clearAllCache}
										className={cn(
											'h-6 px-2 text-xs border-gray-300 dark:border-gray-600 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
											'group'
										)}
										disabled={cacheSize === 0}>
										<Trash2 className="h-3 w-3 mr-1 transition-transform duration-300 group-hover:rotate-3" />
										Clear cache
									</Button>
								</div>
							</div>
						</div>

						{/* How It Works Section */}
						<div className="border-t border-gray-100 dark:border-gray-800 pt-3 transition-colors duration-200 animate-in fade-in-50 slide-in-from-bottom-2 delay-300">
							<p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
								<strong>How it works:</strong> Using OpenStreetMap Nominatim service - free and reliable geocoding with
								no API key required. {cacheConsent && 'Locations are cached locally to improve performance.'}
							</p>
						</div>
					</CardContent>
				</div>
			</Card>

			{/* Cache Consent Modal */}
			<Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
				<DialogOverlay className="fixed inset-0 bg-black/50 z-[99999]" />
				<DialogContent className="sm:max-w-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 transition-all duration-200 animate-in fade-in-50 zoom-in-95 z-[100000]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white transition-colors duration-200">
							Enable local storage for geocoding?
						</DialogTitle>
						<DialogDescription asChild>
							<div className="text-left space-y-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
								<p>
									Map Studio can store geocoded locations locally in your browser to make future geocoding requests much
									faster and reduce API calls.
								</p>
								<div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3">
									<div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">
										<HardDrive className="h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 hover:scale-110" />
										<div>
											<div className="font-medium">Privacy & Storage:</div>
											<div>
												Data is stored only in your browser's local storage and never shared. You can clear it anytime.
												Cache automatically expires after 30 days.
											</div>
										</div>
									</div>
								</div>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => handleCacheConsent(false)}
							className="w-full sm:w-auto transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
							No thanks{' '}
							<span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1.5rem] rounded-[3px] border border-gray-300 border-b-2 px-1 text-[0.65rem] font-mono text-gray-600 shadow-sm dark:border-gray-600 dark:text-gray-300">
								ESC
							</span>
						</Button>
						<Button
							onClick={() => handleCacheConsent(true)}
							className="w-full sm:w-auto transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-600">
							Enable cache{' '}
							<span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1.5rem] rounded-[3px] border border-blue-700 border-b-2 px-1 text-[0.65rem] font-sans text-white shadow-sm dark:border-blue-600">
								⏎
							</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
