/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Download, Copy, Trash2 } from 'lucide-react';
import type { DataRow, GeocodedRow } from '@/app/(studio)/types';
import { MapPin, BarChart3, Hash, Type, Calendar, Flag, XCircle, Database, Loader2, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface DataPreviewProps {
	data: (DataRow | GeocodedRow)[];
	columns: string[];
	mapType: 'symbol' | 'choropleth' | 'custom';
	onClearData: (mapType: 'symbol' | 'choropleth' | 'custom') => void;
	symbolDataExists: boolean;
	choroplethDataExists: boolean;
	customDataExists: boolean;
	columnTypes: ColumnType;
	onUpdateColumnTypes: (types: ColumnType) => void;
	onUpdateColumnFormats: (formats: ColumnFormat) => void;
	symbolDataLength: number;
	choroplethDataLength: number;
	customDataLoaded: boolean;
	onMapTypeChange: (mapType: 'symbol' | 'choropleth' | 'custom') => void;
	columnFormats: ColumnFormat;
	selectedGeography: string;
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
}

interface ColumnType {
	[key: string]: 'text' | 'number' | 'date' | 'coordinate' | 'state' | 'country';
}

interface ColumnFormat {
	[key: string]: string;
}

const stateMap: Record<string, string> = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NJ: 'New Jersey',
	NM: 'New Mexico',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
};

const reverseStateMap: Record<string, string> = Object.fromEntries(
	Object.entries(stateMap).map(([abbr, full]) => [full.toLowerCase(), abbr])
);

// Canadian Province Map
const canadaProvinceMap: Record<string, string> = {
	AB: 'Alberta',
	BC: 'British Columbia',
	MB: 'Manitoba',
	NB: 'New Brunswick',
	NL: 'Newfoundland and Labrador',
	NS: 'Nova Scotia',
	ON: 'Ontario',
	PE: 'Prince Edward Island',
	QC: 'Quebec',
	SK: 'Saskatchewan',
	NT: 'Northwest Territories',
	NU: 'Nunavut',
	YT: 'Yukon',
};

const reverseCanadaProvinceMap: Record<string, string> = Object.fromEntries(
	Object.entries(canadaProvinceMap).map(([abbr, full]) => [full.toLowerCase(), abbr])
);

// SGC (Standard Geographical Classification) codes for Canadian provinces
const sgcToProvinceMap: Record<string, string> = {
	'10': 'NL', // Newfoundland and Labrador
	'11': 'PE', // Prince Edward Island
	'12': 'NS', // Nova Scotia
	'13': 'NB', // New Brunswick
	'24': 'QC', // Quebec
	'35': 'ON', // Ontario
	'46': 'MB', // Manitoba
	'47': 'SK', // Saskatchewan
	'48': 'AB', // Alberta
	'59': 'BC', // British Columbia
	'60': 'YT', // Yukon
	'61': 'NT', // Northwest Territories
	'62': 'NU', // Nunavut
};

const parseCompactNumber = (value: string): number | null => {
	const match = value.match(/^(\d+(\.\d+)?)([KMB])$/i);
	if (!match) return null;

	let num = Number.parseFloat(match[1]);
	const suffix = match[3].toUpperCase();

	switch (suffix) {
		case 'K':
			num *= 1_000;
			break;
		case 'M':
			num *= 1_000_000;
			break;
		case 'B':
			num *= 1_000_000_000;
			break;
	}
	return num;
};

const isCoordinateColumn = (column: string): boolean => {
	const lowerCol = column.toLowerCase();
	return lowerCol === 'latitude' || lowerCol === 'longitude';
};

const isDateColumn = (column: string, data: (DataRow | GeocodedRow)[]): boolean => {
	if (/(date|time|day|month|year)/i.test(column)) return true;

	if (data.length === 0) return false;

	let dateCount = 0;
	const sampleSize = Math.min(data.length, 50);

	for (let i = 0; i < sampleSize; i++) {
		const value = data[i][column];
		if (value === null || value === undefined || value === '') continue;

		const strValue = String(value).trim();

		if (
			/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(strValue) ||
			/^\d{2}\/\d{2}\/\d{4}$/.test(strValue) ||
			/^\d{2}\/\d{2}\/\d{2}$/.test(strValue) ||
			/^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i.test(strValue)
		) {
			const date = new Date(strValue);
			if (!isNaN(date.getTime())) {
				dateCount++;
				continue;
			}
		}

		const numValue = Number(strValue);
		if (!isNaN(numValue) && numValue > 100000000000 && numValue < 3000000000000) {
			const date = new Date(numValue);
			if (!isNaN(date.getTime())) {
				dateCount++;
			}
		}
	}
	return dateCount / sampleSize > 0.7;
};

const isNumericColumn = (column: string, data: (DataRow | GeocodedRow)[]): boolean => {
	if (/(number|value|amount|count|id|price|qty|quantity|size|total|revenue|employees)/i.test(column)) return true;

	if (data.length === 0) return false;

	let numericCount = 0;
	const sampleSize = Math.min(data.length, 50);

	for (let i = 0; i < sampleSize; i++) {
		const value = data[i][column];
		if (value === null || value === undefined || value === '') continue;

		const strValue = String(value).trim();

		if (parseCompactNumber(strValue) !== null) {
			numericCount++;
			continue;
		}

		const cleanedValue = strValue.replace(/[,$%]/g, '');
		if (!isNaN(Number(cleanedValue)) && cleanedValue !== '') {
			numericCount++;
		}
	}
	return numericCount / sampleSize > 0.7;
};

const isStateColumn = (column: string, data: (DataRow | GeocodedRow)[]): boolean => {
	const colName = column.trim().toLowerCase();
	return colName === 'state' || colName === 'province' || colName === 'county';
};

const isCountryColumn = (column: string): boolean => {
	const colName = column.trim().toLowerCase();
	return colName === 'country';
};

const initializeColumnFormats = () => {
	console.log('Initializing column formats');
};

// Replace the partial countryNameToIso3 and iso3ToCountryName maps with a comprehensive mapping for all countries
// (Below is a representative sample; in production, use a full list. For demo, include all countries in the sample data and common alternates.)
const countryNameToIso3: Record<string, string> = {
	Afghanistan: 'AFG',
	Albania: 'ALB',
	Algeria: 'DZA',
	Andorra: 'AND',
	Angola: 'AGO',
	Argentina: 'ARG',
	Armenia: 'ARM',
	Australia: 'AUS',
	Austria: 'AUT',
	Azerbaijan: 'AZE',
	Bahamas: 'BHS',
	Bahrain: 'BHR',
	Bangladesh: 'BGD',
	Barbados: 'BRB',
	Belarus: 'BLR',
	Belgium: 'BEL',
	Belize: 'BLZ',
	Benin: 'BEN',
	Bhutan: 'BTN',
	Bolivia: 'BOL',
	'Bosnia and Herzegovina': 'BIH',
	Botswana: 'BWA',
	Brazil: 'BRA',
	Brunei: 'BRN',
	Bulgaria: 'BGR',
	'Burkina Faso': 'BFA',
	Burundi: 'BDI',
	'Cabo Verde': 'CPV',
	Cambodia: 'KHM',
	Cameroon: 'CMR',
	Canada: 'CAN',
	'Central African Republic': 'CAF',
	Chad: 'TCD',
	Chile: 'CHL',
	China: 'CHN',
	Colombia: 'COL',
	Comoros: 'COM',
	'Congo (Congo-Brazzaville)': 'COG',
	'Congo (Democratic Republic)': 'COD',
	'Costa Rica': 'CRI',
	Croatia: 'HRV',
	Cuba: 'CUB',
	Cyprus: 'CYP',
	Czechia: 'CZE',
	Denmark: 'DNK',
	Djibouti: 'DJI',
	Dominica: 'DMA',
	'Dominican Republic': 'DOM',
	Ecuador: 'ECU',
	Egypt: 'EGY',
	'El Salvador': 'SLV',
	'Equatorial Guinea': 'GNQ',
	Eritrea: 'ERI',
	Estonia: 'EST',
	Eswatini: 'SWZ',
	Ethiopia: 'ETH',
	Fiji: 'FJI',
	Finland: 'FIN',
	France: 'FRA',
	Gabon: 'GAB',
	Gambia: 'GMB',
	Georgia: 'GEO',
	Germany: 'DEU',
	Ghana: 'GHA',
	Greece: 'GRC',
	Grenada: 'GRD',
	Guatemala: 'GTM',
	Guinea: 'GIN',
	'Guinea-Bissau': 'GNB',
	Guyana: 'GUY',
	Haiti: 'HTI',
	Honduras: 'HND',
	Hungary: 'HUN',
	Iceland: 'ISL',
	India: 'IND',
	Indonesia: 'IDN',
	Iran: 'IRN',
	Iraq: 'IRQ',
	Ireland: 'IRL',
	Israel: 'ISR',
	Italy: 'ITA',
	Jamaica: 'JAM',
	Japan: 'JPN',
	Jordan: 'JOR',
	Kazakhstan: 'KAZ',
	Kenya: 'KEN',
	Kiribati: 'KIR',
	Kuwait: 'KWT',
	Kyrgyzstan: 'KGZ',
	Laos: 'LAO',
	Latvia: 'LVA',
	Lebanon: 'LBN',
	Lesotho: 'LSO',
	Liberia: 'LBR',
	Libya: 'LBY',
	Liechtenstein: 'LIE',
	Lithuania: 'LTU',
	Luxembourg: 'LUX',
	Madagascar: 'MDG',
	Malawi: 'MWI',
	Malaysia: 'MYS',
	Maldives: 'MDV',
	Mali: 'MLI',
	Malta: 'MLT',
	'Marshall Islands': 'MHL',
	Mauritania: 'MRT',
	Mauritius: 'MUS',
	Mexico: 'MEX',
	Micronesia: 'FSM',
	Moldova: 'MDA',
	Monaco: 'MCO',
	Mongolia: 'MNG',
	Montenegro: 'MNE',
	Morocco: 'MAR',
	Mozambique: 'MOZ',
	Myanmar: 'MMR',
	Namibia: 'NAM',
	Nauru: 'NRU',
	Nepal: 'NPL',
	Netherlands: 'NLD',
	'New Zealand': 'NZL',
	Nicaragua: 'NIC',
	Niger: 'NER',
	Nigeria: 'NGA',
	'North Korea': 'PRK',
	'North Macedonia': 'MKD',
	Norway: 'NOR',
	Oman: 'OMN',
	Pakistan: 'PAK',
	Palau: 'PLW',
	Palestine: 'PSE',
	Panama: 'PAN',
	'Papua New Guinea': 'PNG',
	Paraguay: 'PRY',
	Peru: 'PER',
	Philippines: 'PHL',
	Poland: 'POL',
	Portugal: 'PRT',
	Qatar: 'QAT',
	Romania: 'ROU',
	Russia: 'RUS',
	Rwanda: 'RWA',
	'Saint Kitts and Nevis': 'KNA',
	'Saint Lucia': 'LCA',
	'Saint Vincent and the Grenadines': 'VCT',
	Samoa: 'WSM',
	'San Marino': 'SMR',
	'Sao Tome and Principe': 'STP',
	'Saudi Arabia': 'SAU',
	Senegal: 'SEN',
	Serbia: 'SRB',
	Seychelles: 'SYC',
	'Sierra Leone': 'SLE',
	Singapore: 'SGP',
	Slovakia: 'SVK',
	Slovenia: 'SVN',
	'Solomon Islands': 'SLB',
	Somalia: 'SOM',
	'South Africa': 'ZAF',
	'South Korea': 'KOR',
	'South Sudan': 'SSD',
	Spain: 'ESP',
	'Sri Lanka': 'LKA',
	Sudan: 'SDN',
	Suriname: 'SUR',
	Sweden: 'SWE',
	Switzerland: 'CHE',
	Syria: 'SYR',
	Taiwan: 'TWN',
	Tajikistan: 'TJK',
	Tanzania: 'TZA',
	Thailand: 'THA',
	'Timor-Leste': 'TLS',
	Togo: 'TGO',
	Tonga: 'TON',
	'Trinidad and Tobago': 'TTO',
	Tunisia: 'TUN',
	Turkey: 'TUR',
	Turkmenistan: 'TKM',
	Tuvalu: 'TUV',
	Uganda: 'UGA',
	Ukraine: 'UKR',
	'United Arab Emirates': 'ARE',
	'United Kingdom': 'GBR',
	'United States of America': 'USA',
	Uruguay: 'URY',
	Uzbekistan: 'UZB',
	Vanuatu: 'VUT',
	'Vatican City': 'VAT',
	Venezuela: 'VEN',
	Vietnam: 'VNM',
	Yemen: 'YEM',
	Zambia: 'ZMB',
	Zimbabwe: 'ZWE',
	'Ivory Coast': 'CIV',
	"Côte d'Ivoire": 'CIV',
};
const iso3ToCountryName: Record<string, string> = Object.fromEntries(
	Object.entries(countryNameToIso3).map(([k, v]) => [v, k])
);

function formatCountry(value: any, format: string): string {
	if (value === null || value === undefined || value === '') return '';
	const str = String(value).trim();
	if (format === 'default' || !format) return str;
	if (format === 'iso3') {
		if (str.length === 3 && iso3ToCountryName[str.toUpperCase()]) return str.toUpperCase();
		return countryNameToIso3[str] || str;
	} else if (format === 'full') {
		if (str.length === 3 && iso3ToCountryName[str.toUpperCase()]) return iso3ToCountryName[str.toUpperCase()];
		return str;
	}
	return str;
}

export function DataPreview({
	data,
	columns,
	mapType,
	onClearData,
	symbolDataExists,
	choroplethDataExists,
	customDataExists,
	columnTypes,
	onUpdateColumnTypes,
	onUpdateColumnFormats,
	symbolDataLength,
	choroplethDataLength,
	customDataLoaded,
	onMapTypeChange,
	columnFormats,
	selectedGeography,
	isExpanded,
	setIsExpanded,
}: DataPreviewProps) {
	const [inferredTypes, setInferredTypes] = useState<ColumnType>({});

	// NEW: Enhanced tab logic - always show choropleth tab as active when custom map has choropleth data
	const [internalActiveTab, setInternalActiveTab] = useState<'symbol' | 'choropleth'>(() => {
		if (mapType === 'custom' && choroplethDataExists) {
			return 'choropleth';
		}
		return mapType === 'custom' ? 'choropleth' : mapType;
	});

	useEffect(() => {
		// NEW: Enhanced logic for setting internal active tab
		if (mapType === 'custom' && choroplethDataExists) {
			setInternalActiveTab('choropleth');
		} else {
			setInternalActiveTab(mapType === 'custom' ? 'choropleth' : mapType);
		}
	}, [mapType, choroplethDataExists]);

	useEffect(() => {
		const handler = () => setIsExpanded(false);
		window.addEventListener('collapse-all-panels', handler);
		return () => window.removeEventListener('collapse-all-panels', handler);
	}, []);

	const formatNumber = (value: any, format: string): string => {
		if (value === null || value === undefined || value === '') return '';

		let num: number;
		const strValue = String(value).trim();

		const compactNum = parseCompactNumber(strValue);
		if (compactNum !== null) {
			num = compactNum;
		} else {
			const cleanedValue = strValue.replace(/[,$%]/g, '');
			num = Number.parseFloat(cleanedValue);
		}

		if (isNaN(num)) {
			return strValue;
		}

		switch (format) {
			case 'raw':
				return num.toString();
			case 'comma':
				return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 20 });
			case 'compact':
				if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
				if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
				if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
				return num.toString();
			case 'currency':
				return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
			case 'percent':
				return (num * 100).toFixed(0) + '%';
			case '0-decimals':
				return Math.round(num).toLocaleString('en-US');
			case '1-decimal':
				return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
			case '2-decimals':
				return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			default:
				return num.toString();
		}
	};

	const formatDate = (value: any, format: string): string => {
		if (value === null || value === undefined || value === '') return '';

		let date: Date;
		if (value instanceof Date) {
			date = value;
		} else {
			date = new Date(String(value));
			if (isNaN(date.getTime())) return String(value);
		}

		switch (format) {
			case 'yyyy-mm-dd':
				return date.toISOString().split('T')[0];
			case 'mm/dd/yyyy':
				return date.toLocaleDateString('en-US');
			case 'dd/mm/yyyy':
				return date.toLocaleDateString('en-GB');
			case 'mmm-dd-yyyy':
				return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			case 'mmmm-dd-yyyy':
				return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
			case 'dd-mmm-yyyy':
				return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
			case 'yyyy':
				return date.getFullYear().toString();
			case 'mmm-yyyy':
				return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
			case 'mm/dd/yy':
				return date.toLocaleDateString('en-US', { year: '2-digit' });
			case 'dd/mm/yy':
				return date.toLocaleDateString('en-GB', { year: '2-digit' });
			default:
				return String(value);
		}
	};

	const formatState = (value: any, format: string): string => {
		if (value === null || value === undefined || value === '') return '';

		const str = String(value).trim();

		// Handle Canadian provinces
		if (selectedGeography === 'canada-provinces') {
			// First check if it's an SGC code and convert to province abbreviation
			let provinceAbbr = str;
			if (sgcToProvinceMap[str]) {
				provinceAbbr = sgcToProvinceMap[str];
			}

			switch (format) {
				case 'abbreviated':
					if (provinceAbbr.length === 2 && canadaProvinceMap[provinceAbbr.toUpperCase()]) {
						return provinceAbbr.toUpperCase();
					}
					const abbr = reverseCanadaProvinceMap[str.toLowerCase()];
					return abbr || str;
				case 'full':
					if (provinceAbbr.length === 2) {
						return canadaProvinceMap[provinceAbbr.toUpperCase()] || str;
					}
					const fullName = Object.values(canadaProvinceMap).find(
						(province) => province.toLowerCase() === str.toLowerCase()
					);
					return fullName || str;
				default:
					return str;
			}
		}

		// Handle US states (existing logic)
		switch (format) {
			case 'abbreviated':
				if (str.length === 2 && stateMap[str.toUpperCase()]) {
					return str.toUpperCase();
				}
				const abbr = reverseStateMap[str.toLowerCase()];
				return abbr || str;
			case 'full':
				if (str.length === 2) {
					return stateMap[str.toUpperCase()] || str;
				}
				const fullName = Object.values(stateMap).find((state) => state.toLowerCase() === str.toLowerCase());
				return fullName || str;
			default:
				return str;
		}
	};

	const detectFormat = (column: string, type: 'number' | 'date' | 'state'): string => {
		if (!data.length) return getDefaultFormat(type);

		const sampleValues = data
			.slice(0, 10)
			.map((row) => row[column])
			.filter((val) => val !== null && val !== undefined && val !== '');

		if (type === 'number') {
			if (sampleValues.some((val) => /\d+(\.\d+)?[MKB]$/i.test(String(val)))) return 'compact';
			if (sampleValues.some((val) => String(val).includes('$'))) return 'currency';
			if (sampleValues.some((val) => String(val).includes('%'))) return 'percent';
			if (sampleValues.some((val) => String(val).includes(','))) return 'comma';
			return 'raw';
		}

		if (type === 'date') {
			const firstValue = String(sampleValues[0] || '');
			if (/^\d{4}-\d{2}-\d{2}$/.test(firstValue)) return 'yyyy-mm-dd';
			if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstValue)) return 'mm/dd/yyyy';
			if (/^\d{2}\/\d{2}\/\d{2}$/.test(firstValue)) return 'mm/dd/yy';
			if (/^\d{4}$/.test(firstValue)) return 'yyyy';
			return 'yyyy-mm-dd';
		}

		if (type === 'state') {
			const firstValue = String(sampleValues[0] || '').trim();

			// Handle Canadian provinces
			if (selectedGeography === 'canada-provinces') {
				// Check if it's an SGC code (2-digit number)
				if (/^\d{2}$/.test(firstValue)) {
					return 'abbreviated'; // SGC codes should be converted to abbreviations
				}
				// Check if it's already abbreviated
				if (firstValue.length === 2 && canadaProvinceMap[firstValue.toUpperCase()]) {
					return 'abbreviated';
				}
				// Check if it's a full name
				if (Object.values(canadaProvinceMap).some((province) => province.toLowerCase() === firstValue.toLowerCase())) {
					return 'full';
				}
				return 'abbreviated'; // Default for Canadian provinces
			}

			// Handle US states (existing logic)
			if (firstValue.length === 2) return 'abbreviated';
			if (Object.values(stateMap).some((state) => state.toLowerCase() === firstValue.toLowerCase())) return 'full';
			return 'abbreviated';
		}

		return getDefaultFormat(type);
	};

	const getDefaultFormat = (type: 'number' | 'date' | 'state'): string => {
		switch (type) {
			case 'number':
				return 'raw';
			case 'date':
				return 'yyyy-mm-dd';
			case 'state':
				return 'abbreviated';
			default:
				return 'raw';
		}
	};

	const inferColumnTypes = () => {
		const newInferredTypes: ColumnType = {};
		const newColumnFormats: ColumnFormat = {};

		columns.forEach((column) => {
			if (isCoordinateColumn(column)) {
				newInferredTypes[column] = 'coordinate';
			} else if (isCountryColumn(column)) {
				newInferredTypes[column] = 'country';
			} else if (isStateColumn(column, data)) {
				newInferredTypes[column] = 'state';
			} else if (isDateColumn(column, data)) {
				newInferredTypes[column] = 'date';
			} else if (isNumericColumn(column, data)) {
				newInferredTypes[column] = 'number';
			} else {
				newInferredTypes[column] = 'text';
			}

			const inferredType = newInferredTypes[column];
			if (
				inferredType === 'number' ||
				inferredType === 'date' ||
				inferredType === 'state' ||
				inferredType === 'country'
			) {
				newColumnFormats[column] = detectFormat(column, inferredType as any);
			}
		});

		setInferredTypes(newInferredTypes);
		onUpdateColumnFormats(newColumnFormats);

		const mergedTypes = { ...newInferredTypes, ...columnTypes };
		let typesChanged = false;
		if (Object.keys(mergedTypes).length !== Object.keys(columnTypes).length) {
			typesChanged = true;
		} else {
			for (const col of columns) {
				if (mergedTypes[col] !== columnTypes[col]) {
					typesChanged = true;
					break;
				}
			}
		}

		if (typesChanged) {
			onUpdateColumnTypes(mergedTypes);
		}
	};

	useEffect(() => {
		if (Object.keys(inferredTypes).length > 0 || Object.keys(columnTypes).length > 0) {
			initializeColumnFormats();
		}
	}, [inferredTypes, columnTypes]);

	const hasGeocodingBeenInitiated = (): boolean => {
		return data.some((row) => {
			const geocodedRow = row as GeocodedRow;
			return (
				geocodedRow.geocoded === true ||
				geocodedRow.geocoded === false ||
				geocodedRow.processing === true ||
				geocodedRow.source !== undefined
			);
		});
	};

	const shouldShowGeocodingIcons = (): boolean => {
		return hasGeocodingBeenInitiated();
	};

	const getColumnIcon = (type: string) => {
		switch (type) {
			case 'coordinate':
				return <MapPin className="w-3 h-3" />;
			case 'number':
				return <Hash className="w-3 h-3" />;
			case 'date':
				return <Calendar className="w-3 h-3" />;
			case 'state':
			case 'country':
				return <Flag className="w-3 h-3" />;
			default:
				return <Type className="w-3 h-3" />;
		}
	};

	const getDropdownColor = (type: string) => {
		switch (type) {
			case 'coordinate':
				return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700';
			case 'number':
				return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700';
			case 'date':
				return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700';
			case 'state':
				return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:border-orange-300 dark:hover:border-orange-700';
			default:
				return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700';
		}
	};

	const getColumnLetter = (index: number): string => {
		let result = '';
		while (index >= 0) {
			result = String.fromCharCode(65 + (index % 26)) + result;
			index = Math.floor(index / 26) - 1;
		}
		return result;
	};

	const toSentenceCase = (str: string): string => {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

	const getGeocodingStatusIcon = (row: DataRow | GeocodedRow) => {
		if (!shouldShowGeocodingIcons()) {
			return null;
		}

		const geocodedRow = row as GeocodedRow;

		if (geocodedRow.geocoded === true) {
			if (geocodedRow.source === 'persistent' || geocodedRow.source === 'session') {
				return <Database className="w-3 h-3 text-blue-500" />;
			}
			return <Check className="w-3 h-3 text-green-500" />;
		} else if (geocodedRow.geocoded === false) {
			return <XCircle className="w-3 h-3 text-red-500" />;
		} else if (geocodedRow.processing === true) {
			return <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />;
		}

		return null;
	};

	const calculateColumnWidth = (column: string, index: number): string => {
		const maxContentLength = Math.max(
			column.length,
			...data.slice(0, 10).map((row) => String(row[column] || '').length)
		);

		const baseWidth = Math.max(80, Math.min(200, maxContentLength * 8 + 40));
		const minWidthForDropdown = 120;

		return `${Math.max(baseWidth, minWidthForDropdown)}px`;
	};

	const calculateRowNumberColumnWidth = (): string => {
		const showingGeocodingIcons = shouldShowGeocodingIcons();
		const rowNumberWidth = String(data.length).length * 8 + 16;
		const iconWidth = showingGeocodingIcons ? 20 : 0;

		return `${Math.max(showingGeocodingIcons ? 60 : 45, rowNumberWidth + iconWidth)}px`;
	};

	const handleCopyData = async () => {
		try {
			const headers = columns.join('\t');
			const rows = data.map((row) => columns.map((col) => formatCellValue(row[col], col)).join('\t')).join('\n');
			const tsvData = headers + '\n' + rows;

			await navigator.clipboard.writeText(tsvData);
			toast({
				icon: <Copy className="h-4 w-4" />,
				description: 'Data copied to clipboard.',
				duration: 3000,
			});
		} catch (error) {
			toast({
				title: 'Copy failed',
				description: 'Failed to copy data to clipboard',
				variant: 'destructive',
				duration: 3000,
			});
		}
	};

	const handleDownloadData = () => {
		try {
			const headers = columns.join(',');
			const rows = data
				.map((row) =>
					columns
						.map((col) => {
							const value = formatCellValue(row[col], col);
							return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
						})
						.join(',')
				)
				.join('\n');
			const csvData = headers + '\n' + rows;

			const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `map-studio-data-${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast({
				icon: <Download className="h-4 w-4" />,
				description: 'Data downloaded successfully.',
				duration: 3000,
			});
		} catch (error) {
			toast({
				title: 'Download failed',
				description: 'Failed to download data',
				variant: 'destructive',
				duration: 3000,
			});
		}
	};

	const formatCellValue = (value: any, column: string): string => {
		const type = columnTypes[column] || inferredTypes[column] || 'text';
		const format = columnFormats[column];

		if (type === 'coordinate' && typeof value === 'number') {
			return value.toFixed(6);
		}

		if (type === 'number' && format) {
			return formatNumber(value, format);
		}

		if (type === 'date' && format) {
			return formatDate(value, format);
		}

		if (type === 'state' && format) {
			return formatState(value, format);
		}

		if (type === 'country' && format) {
			return formatCountry(value, format);
		}

		return String(value || '');
	};

	const handleClearData = () => {
		// NEW: Enhanced clear logic - determine which data type to clear based on current context
		let dataTypeToClear = mapType;

		// If we're showing choropleth data in a custom map context, clear choropleth data
		if (mapType === 'custom' && choroplethDataExists && data.length > 0) {
			dataTypeToClear = 'choropleth';
		}

		onClearData(dataTypeToClear);

		let switchMessage = '';
		if (dataTypeToClear === 'symbol') {
			if (choroplethDataExists) {
				switchMessage = ' Switching to Choropleth view.';
			} else if (customDataExists) {
				switchMessage = ' Switching to Custom map view.';
			} else {
				switchMessage = ' Opening Data Input panel for new data.';
			}
		} else if (dataTypeToClear === 'choropleth') {
			if (symbolDataExists) {
				switchMessage = ' Switching to Symbol map view.';
			} else if (customDataExists) {
				switchMessage = ' Switching to Custom map view.';
			} else {
				switchMessage = ' Opening Data Input panel for new data.';
			}
		} else if (dataTypeToClear === 'custom') {
			if (symbolDataExists) {
				switchMessage = ' Switching to Symbol map view.';
			} else if (choroplethDataExists) {
				switchMessage = ' Switching to Choropleth view.';
			} else {
				switchMessage = ' Opening Data Input panel for new data.';
			}
		}

		toast({
			icon: <Trash2 className="h-4 w-4" />,
			description: `${
				dataTypeToClear === 'symbol' ? 'Symbol map' : dataTypeToClear === 'choropleth' ? 'Choropleth' : 'Custom map'
			} data has been cleared.${switchMessage}`,
			duration: 4000,
		});
	};

	const handleTabChange = (tab: 'symbol' | 'choropleth') => {
		if (hasDataForTab(tab)) {
			setInternalActiveTab(tab);
			// NEW: Enhanced tab change logic
			if (tab === 'choropleth' && customDataExists) {
				// If switching to choropleth and custom map exists, use custom map type
				onMapTypeChange('custom');
			} else {
				onMapTypeChange(tab);
			}
		}
	};

	const hasDataForTab = (tab: 'symbol' | 'choropleth') => {
		switch (tab) {
			case 'symbol':
				return symbolDataExists;
			case 'choropleth':
				return choroplethDataExists;
			default:
				return false;
		}
	};

	const isTabDisabled = (tab: 'symbol' | 'choropleth') => {
		return !hasDataForTab(tab);
	};

	const getTabTooltip = (tab: 'symbol' | 'choropleth') => {
		if (tab === 'symbol' && !symbolDataExists) {
			return 'Add symbol map data to preview.';
		}
		if (tab === 'choropleth' && !choroplethDataExists) {
			return 'Add choropleth data to preview.';
		}
		return '';
	};

	const renderTabButton = (tab: 'symbol' | 'choropleth', icon: React.ReactNode, label: string, isActive: boolean) => {
		// NEW: Enhanced active state logic
		const actualIsActive = isActive || (mapType === 'custom' && tab === 'choropleth' && choroplethDataExists);

		const disabled = isTabDisabled(tab);

		if (disabled) {
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-normal opacity-50 text-gray-500 dark:text-gray-400 transition-all duration-200">
							{icon}
							{label}
						</div>
					</TooltipTrigger>
					<TooltipContent
						side="bottom"
						className="bg-black text-white border-black px-3 py-2 rounded-md shadow-lg text-xs font-medium z-50"
						sideOffset={8}>
						<p>{getTabTooltip(tab)}</p>
					</TooltipContent>
				</Tooltip>
			);
		}

		return (
			<Button
				variant={actualIsActive ? 'secondary' : 'ghost'}
				size="sm"
				className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200 group"
				onClick={() => handleTabChange(tab)}>
				{icon}
				{label}
			</Button>
		);
	};

	const getFormatOptions = (
		type: 'number' | 'date' | 'state' | 'country' | 'province'
	): Array<{ value: string; label: string; example: string }> => {
		switch (type) {
			case 'number':
				return [
					{ value: 'raw', label: 'Raw', example: '1234567.89' },
					{ value: 'comma', label: 'Comma', example: '1,234,567.89' },
					{ value: 'compact', label: 'Compact', example: '1.2M' },
					{ value: 'currency', label: 'Currency', example: '$1,234,567.89' },
					{ value: 'percent', label: 'Percent', example: '123456789%' },
					{ value: '0-decimals', label: '0 decimals', example: '1,234,568' },
					{ value: '1-decimal', label: '1 decimal', example: '1,234,567.9' },
					{ value: '2-decimals', label: '2 decimals', example: '1,234,567.89' },
				];
			case 'date':
				return [
					{ value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2024-03-15' },
					{ value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '03/15/2024' },
					{ value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '15/03/2024' },
					{ value: 'mmm-dd-yyyy', label: 'MMM DD, YYYY', example: 'Mar 15, 2024' },
					{ value: 'mmmm-dd-yyyy', label: 'MMMM DD, YYYY', example: 'March 15, 2024' },
					{ value: 'dd-mmm-yyyy', label: 'DD MMM YYYY', example: '15 Mar 2024' },
					{ value: 'yyyy', label: 'YYYY', example: '2024' },
					{ value: 'mmm-yyyy', label: 'MMM YYYY', example: 'Mar 2024' },
					{ value: 'mm/dd/yy', label: 'MM/DD/YY', example: '03/15/24' },
					{ value: 'dd/mm/yy', label: 'DD/MM/YY', example: '15/03/24' },
				];
			case 'state':
			case 'province':
				return [
					{ value: 'abbreviated', label: 'Abbreviated', example: 'CA / ON' },
					{ value: 'full', label: 'Full', example: 'California / Ontario' },
				];
			case 'country':
				return [
					{ value: 'default', label: 'Default', example: 'United States' },
					{ value: 'full', label: 'Full name', example: 'United States' },
					{ value: 'iso3', label: 'ISO3', example: 'USA' },
				];
			default:
				return [];
		}
	};

	const shouldShowFormatting = (type: string) => {
		return type === 'number' || type === 'date' || type === 'state' || type === 'province' || type === 'country';
	};

	const hasFormattableColumns = () => {
		return columns.some((column) => {
			const type = columnTypes[column] || inferredTypes[column];
			return shouldShowFormatting(type);
		});
	};

	const calculateTableHeight = () => {
		const maxDisplayHeight = 400;
		return maxDisplayHeight;
	};

	const handleColumnTypeChange = (column: string, type: string) => {
		const newTypes = {
			...columnTypes,
			[column]: type as 'text' | 'number' | 'date' | 'coordinate' | 'state' | 'country',
		};
		onUpdateColumnTypes(newTypes);

		const newFormats = { ...columnFormats };
		if (type === 'number' || type === 'date' || type === 'state' || type === 'country') {
			newFormats[column] = getDefaultFormat(type as 'number' | 'date' | 'state');
		} else {
			delete newFormats[column];
		}
		onUpdateColumnFormats(newFormats);
	};

	useEffect(() => {
		inferColumnTypes();
	}, [data, columns]);

	// Utility to get subnational label based on geography
	const getSubnationalLabel = (geo: string, plural = false) => {
		if (geo === 'usa-states') return plural ? 'States' : 'State';
		if (geo === 'usa-counties') return plural ? 'Counties' : 'County';
		if (geo === 'canada-provinces') return plural ? 'Provinces' : 'Province';
		if (geo === 'world') return plural ? 'Countries' : 'Country';
		return plural ? 'Regions' : 'Region';
	};

	const subnationalLabel = getSubnationalLabel(selectedGeography, false);

	// Helper function to get display label for column types
	const getColumnTypeDisplayLabel = (type: string) => {
		if (type === 'state') {
			return subnationalLabel;
		}
		if (type === 'country') {
			return 'Country';
		}
		return toSentenceCase(type);
	};

	// Fix useEffect for duplicate country detection
	useEffect(() => {
		const countryCol = columns.find((col) => (columnTypes[col] || inferredTypes[col]) === 'country');
		if (!countryCol) return;
		const seenFull = new Set<string>();
		const seenIso3 = new Set<string>();
		let hasDuplicates = false;
		for (const row of data as any[]) {
			const raw = row[countryCol];
			if (raw == null) continue;
			const full = formatCountry(raw, 'full');
			const iso3 = formatCountry(raw, 'iso3');
			if (seenFull.has(full) && seenIso3.has(iso3)) {
				hasDuplicates = true;
				break;
			}
			seenFull.add(full);
			seenIso3.add(iso3);
		}
		if (hasDuplicates) {
			toast({
				title: 'Duplicate country keys detected',
				description:
					'Your data contains both full names and ISO3 codes for the same country (e.g., "USA" and "United States"). This may cause some countries to not fill correctly. Please use a consistent format.',
				variant: 'default',
				duration: 6000,
			});
		}
		return undefined;
	}, [data, columns, columnTypes, inferredTypes]);

	if (!data.length && !customDataLoaded) {
		return (
			<TooltipProvider>
				<Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
					<CardHeader className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl">
						<CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Data preview</CardTitle>
					</CardHeader>
					<CardContent className="px-6 pb-6">
						<p className="text-gray-500 dark:text-gray-400 text-center min-h-[100px] flex items-center justify-center transition-colors duration-200">
							No data to preview. Please load data first.
						</p>
					</CardContent>
				</Card>
			</TooltipProvider>
		);
	}

	const tableData = data;

	return (
		<TooltipProvider>
			<Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
				<CardHeader
					className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
					onClick={() => setIsExpanded(!isExpanded)}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
								Data preview
							</CardTitle>
							{symbolDataLength > 0 && (
								<Badge
									variant="secondary"
									className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200 animate-in fade-in-50 slide-in-from-left-2">
									{symbolDataLength} rows (Symbol)
								</Badge>
							)}
							{choroplethDataLength > 0 && (
								<Badge
									variant="secondary"
									className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200 animate-in fade-in-50 slide-in-from-left-2">
									{choroplethDataLength} rows (Choropleth)
								</Badge>
							)}
							{customDataLoaded && (
								<Badge
									variant="secondary"
									className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200 animate-in fade-in-50 slide-in-from-left-2">
									Custom map loaded
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className={cn(
									'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
									'group'
								)}
								onClick={(e) => {
									e.stopPropagation();
									handleCopyData();
								}}>
								<Copy className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
								Copy data
							</Button>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
									'group'
								)}
								onClick={(e) => {
									e.stopPropagation();
									handleDownloadData();
								}}>
								<Download className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-1" />
								Download data
							</Button>
							<div className="transform transition-transform duration-200 ease-in-out">
								{isExpanded ? (
									<ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
								) : (
									<ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
								)}
							</div>
						</div>
					</div>
				</CardHeader>

				<div
					className={`transition-all duration-300 ease-in-out ${
						isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
					} overflow-hidden`}>
					<CardContent className="space-y-4 px-6 pb-6 pt-2">
						<div className="inline-flex h-auto items-center justify-start gap-2 bg-transparent p-0">
							{renderTabButton(
								'symbol',
								<MapPin className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
								'Symbol map',
								internalActiveTab === 'symbol'
							)}

							{renderTabButton(
								'choropleth',
								<BarChart3 className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
								'Choropleth',
								internalActiveTab === 'choropleth'
							)}
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">Data preview</span>
								<Badge
									variant="secondary"
									className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200">
									({data.length} rows, {columns.length} columns)
								</Badge>
							</div>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className={cn(
											'flex items-center gap-2 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800',
											'group'
										)}
										onClick={handleClearData}>
										<Trash2 className="w-3 h-3 transition-transform duration-300 group-hover:rotate-3" />
										Clear data
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left" className="max-w-xs">
									<p className="font-medium">
										Clear {mapType === 'custom' && choroplethDataExists ? 'choropleth' : mapType} data
									</p>
									<p className="text-gray-600 dark:text-gray-400 mt-1">
										This will clear only the{' '}
										{mapType === 'custom' && choroplethDataExists
											? 'choropleth'
											: mapType === 'symbol'
											? 'symbol map'
											: mapType === 'choropleth'
											? 'choropleth'
											: 'custom map'}{' '}
										data
									</p>
								</TooltipContent>
							</Tooltip>
						</div>

						{/* Render the table only if mapType is 'symbol' or 'choropleth', or if custom map with choropleth data */}
						{(mapType === 'symbol' || mapType === 'choropleth' || (mapType === 'custom' && choroplethDataExists)) && (
							<div
								className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg relative animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
								style={{
									maxHeight: `${calculateTableHeight()}px`,
								}}>
								<table className="w-full min-w-full font-mono text-sm">
									<thead className="sticky top-0 z-20 bg-white dark:bg-gray-800">
										<tr className="bg-gray-100 dark:bg-gray-600 shadow-sm">
											<th
												className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-500 border-b border-gray-200 dark:border-gray-500 transition-colors duration-200 bg-gray-100 dark:bg-gray-600 sticky left-0 z-20 shadow-r"
												style={{
													width: calculateRowNumberColumnWidth(),
													boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
												}}></th>
											{columns.map((column, index) => {
												const columnType = columnTypes[column] || inferredTypes[column] || 'text';

												return (
													<th
														key={column}
														className="px-3 py-2 text-left border-r border-gray-200 dark:border-gray-500 border-b border-gray-200 dark:border-gray-500 last:border-r transition-colors duration-200 relative z-20 bg-gray-100 dark:bg-gray-600"
														style={{ width: calculateColumnWidth(column, index), maxWidth: '200px' }}>
														<div className="flex items-center justify-between">
															<span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-4">
																{getColumnLetter(index)}
															</span>
															<div className="relative z-30">
																<Select
																	value={columnTypes[column] || inferredTypes[column] || 'text'}
																	onValueChange={(value) => handleColumnTypeChange(column, value)}>
																	<SelectTrigger
																		className={`h-6 w-auto min-w-[80px] text-xs ${getDropdownColor(
																			columnTypes[column] || inferredTypes[column] || 'text'
																		)} transition-all duration-200 relative z-30`}>
																		<div className="flex items-center gap-2">
																			{getColumnIcon(columnTypes[column] || inferredTypes[column] || 'text')}
																			<span>
																				{getColumnTypeDisplayLabel(
																					columnTypes[column] || inferredTypes[column] || 'text'
																				)}
																			</span>
																		</div>
																	</SelectTrigger>
																	<SelectContent
																		className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-[100]"
																		position="popper"
																		sideOffset={4}>
																		<SelectItem
																			value="text"
																			className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																			<div className="flex items-center justify-between w-full">
																				<div className="flex items-center gap-2">
																					<Type className="w-3 h-3" />
																					<span>Text</span>
																				</div>
																			</div>
																		</SelectItem>
																		<SelectItem
																			value="number"
																			className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																			<div className="flex items-center justify-between w-full">
																				<div className="flex items-center gap-2">
																					<Hash className="w-3 h-3" />
																					<span>Number</span>
																				</div>
																			</div>
																		</SelectItem>
																		<SelectItem
																			value="date"
																			className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																			<div className="flex items-center justify-between w-full">
																				<div className="flex items-center gap-2">
																					<Calendar className="w-3 h-3" />
																					<span>Date</span>
																				</div>
																			</div>
																		</SelectItem>
																		<SelectItem
																			value="coordinate"
																			className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																			<div className="flex items-center justify-between w-full">
																				<div className="flex items-center gap-2">
																					<MapPin className="w-3 h-3" />
																					<span>Coordinate</span>
																				</div>
																			</div>
																		</SelectItem>
																		<SelectItem
																			value="state"
																			className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																			<div className="flex items-center justify-between w-full">
																				<div className="flex items-center gap-2">
																					<Flag className="w-3 h-3" />
																					<span>{subnationalLabel}</span>
																				</div>
																			</div>
																		</SelectItem>
																		{subnationalLabel !== 'Country' && (
																			<SelectItem
																				value="country"
																				className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																				<div className="flex items-center justify-between w-full">
																					<div className="flex items-center gap-2">
																						<Flag className="w-3 h-3" />
																						<span>Country</span>
																					</div>
																				</div>
																			</SelectItem>
																		)}
																	</SelectContent>
																</Select>
															</div>
														</div>
													</th>
												);
											})}
										</tr>
										<tr className="bg-gray-75 dark:bg-gray-650 shadow-sm">
											<th
												className="px-3 py-2 text-left text-xs font-bold text-black dark:text-white border-r border-gray-200 dark:border-gray-500 border-b-2 border-gray-300 dark:border-gray-500 transition-colors duration-200 sticky left-0 z-20 shadow-r"
												style={{
													width: calculateRowNumberColumnWidth(),
													boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
												}}></th>
											{columns.map((column, index) => (
												<th
													key={column}
													className="px-3 py-2 text-left text-xs font-bold text-black dark:text-white border-r border-gray-200 dark:border-gray-500 border-b-2 border-gray-300 dark:border-gray-500 last:border-r transition-colors duration-200 truncate z-20"
													style={{
														width: calculateColumnWidth(column, index),
														maxWidth: '200px',
													}}
													title={toSentenceCase(column)}>
													<div className="truncate">{toSentenceCase(column)}</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody className="bg-white dark:bg-gray-800 transition-colors duration-200 relative z-10">
										{tableData.map((row, rowIndex) => (
											<tr
												key={rowIndex}
												className={`transition-colors duration-150 ${
													rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
												}`}>
												<td
													className={`px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-500 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 sticky left-0 z-20 font-medium shadow-r ${
														rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
													}`}
													style={{
														width: calculateRowNumberColumnWidth(),
														boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)',
													}}>
													<div className="flex items-center gap-2">
														<span>{rowIndex + 1}</span>
														{getGeocodingStatusIcon(row)}
													</div>
												</td>
												{columns.map((column, colIndex) => (
													<td
														key={column}
														className="px-3 py-2 text-xs border-r border-gray-200 dark:border-gray-500 border-b border-gray-200 dark:border-gray-700 last:border-r transition-colors duration-200 whitespace-nowrap text-gray-900 dark:text-gray-100 relative z-10"
														style={{
															width: calculateColumnWidth(column, colIndex),
															maxWidth: '200px',
														}}
														title={formatCellValue(row[column], column)}>
														<div className="truncate" style={{ maxWidth: '180px' }}>
															{formatCellValue(row[column], column)}
														</div>
													</td>
												))}
											</tr>
										))}
									</tbody>
									{hasFormattableColumns() && (
										<tfoot className="sticky bottom-0 z-30">
											<tr className="bg-gray-100 dark:bg-gray-600 shadow-sm border-t-2 border-gray-300 dark:border-gray-500">
												<td
													className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-500 transition-colors duration-200 bg-gray-100 dark:bg-gray-600 sticky left-0 z-20 shadow-r"
													style={{
														width: calculateRowNumberColumnWidth(),
														boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
													}}></td>
												{columns.map((column, index) => {
													const columnType = columnTypes[column] || inferredTypes[column] || 'text';
													const needsFormatting = shouldShowFormatting(columnType);

													return (
														<td
															key={column}
															className="px-3 py-2 text-left border-r border-gray-200 dark:border-gray-500 last:border-r transition-colors duration-200 relative z-20 bg-gray-100 dark:bg-gray-600"
															style={{ width: calculateColumnWidth(column, index), maxWidth: '200px' }}>
															{needsFormatting && (
																<div className="relative z-30">
																	<Select
																		value={
																			columnFormats[column] ||
																			getDefaultFormat(columnType as 'number' | 'date' | 'state')
																		}
																		onValueChange={(value) => {
																			onUpdateColumnFormats({
																				...columnFormats,
																				[column]: value,
																			});
																		}}>
																		<SelectTrigger
																			className={`h-6 w-full text-xs ${getDropdownColor(
																				columnType
																			)} transition-all duration-200 relative z-30`}>
																			<div className="flex items-center gap-2">
																				<span>
																					{getFormatOptions(columnType as 'number' | 'date' | 'state').find(
																						(opt) =>
																							opt.value ===
																							(columnFormats[column] ||
																								getDefaultFormat(columnType as 'number' | 'date' | 'state'))
																					)?.label || 'Format'}
																				</span>
																			</div>
																		</SelectTrigger>
																		<SelectContent
																			className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-[100]"
																			position="popper"
																			sideOffset={4}>
																			{getFormatOptions(columnType as 'number' | 'date' | 'state').map((option) => (
																				<SelectItem
																					key={option.value}
																					value={option.value}
																					className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
																					<div className="flex flex-col">
																						<span className="font-medium">{option.label}</span>
																						<span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
																							{option.example}
																						</span>
																					</div>
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>
															)}
														</td>
													);
												})}
											</tr>
										</tfoot>
									)}
								</table>
							</div>
						)}

						{/* Render the custom map message only if mapType is 'custom' and no choropleth data */}
						{mapType === 'custom' && !choroplethDataExists && (
							<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-200 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
								<div className="flex items-center gap-2 mb-2">
									<MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
									<span className="text-sm font-medium text-gray-900 dark:text-white">Custom SVG Map</span>
								</div>
								<p className="text-sm text-gray-600 dark:text-gray-300">
									Custom map data has been loaded successfully. The SVG content is ready for visualization.
								</p>
							</div>
						)}
					</CardContent>
				</div>
			</Card>
		</TooltipProvider>
	);
}
