'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { normalizeColorInput } from '@/lib/utils';

interface SimpleColorPickerProps {
	isOpen: boolean;
	onClose: () => void;
	onColorChange: (color: string) => void;
	currentColor: string;
	position: { top: number; left: number };
}

export function SimpleColorPicker({ isOpen, onClose, onColorChange, currentColor, position }: SimpleColorPickerProps) {
	const [selectedColor, setSelectedColor] = useState(currentColor);
	const pickerRef = useRef<HTMLDivElement>(null);

	// Predefined color palette
	const colors = [
		'#FF0000',
		'#FF4500',
		'#FFA500',
		'#FFD700',
		'#FFFF00',
		'#ADFF2F',
		'#00FF00',
		'#00FA9A',
		'#00FFFF',
		'#0080FF',
		'#0000FF',
		'#4169E1',
		'#8A2BE2',
		'#FF00FF',
		'#FF1493',
		'#FF69B4',
		'#800000',
		'#FF6347',
		'#CD853F',
		'#DAA520',
		'#808000',
		'#556B2F',
		'#008000',
		'#2E8B57',
		'#008B8B',
		'#4682B4',
		'#000080',
		'#483D8B',
		'#800080',
		'#9932CC',
		'#8B008B',
		'#C71585',
		'#000000',
		'#696969',
		'#808080',
		'#A9A9A9',
		'#C0C0C0',
		'#D3D3D3',
		'#DCDCDC',
		'#F5F5F5',
		'#FFFFFF',
		'#F0F8FF',
		'#F5F5DC',
		'#FFE4E1',
		'#FFFACD',
		'#F0FFF0',
		'#F0FFFF',
		'#E6E6FA',
	];

	useEffect(() => {
		setSelectedColor(currentColor);
	}, [currentColor]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleColorClick = (color: string) => {
		setSelectedColor(color);
		onColorChange(color);
	};

	const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const color = e.target.value;
		setSelectedColor(color);
		onColorChange(color);
	};

	const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const color = e.target.value;
		setSelectedColor(color);
		onColorChange(color);
	};

	const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const normalized = normalizeColorInput(selectedColor);
			setSelectedColor(normalized);
			onColorChange(normalized);
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div
			ref={pickerRef}
			className="fixed z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-lg outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: 'translateZ(0)', // Force hardware acceleration for smooth positioning
			}}>
			{/* Small arrow pointing to the trigger */}
			<div
				className="absolute -top-1 w-2 h-2 bg-white dark:bg-gray-950 border-l border-t border-gray-200 dark:border-gray-800 rotate-45"
				style={{
					left: '50%',
					transform: 'translateX(-50%) rotate(45deg)',
				}}
			/>

			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium">Choose a color</h3>
					<button
						onClick={onClose}
						className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
						<span className="sr-only">Close</span>
					</button>
				</div>

				{/* Color grid */}
				<div>
					<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preset colors</div>
					<div className="grid grid-cols-8 gap-1.5">
						{colors.map((color) => (
							<button
								key={color}
								onClick={() => handleColorClick(color)}
								className={`w-7 h-7 rounded border-2 hover:scale-105 transition-all duration-150 ${
									selectedColor.toLowerCase() === color.toLowerCase()
										? 'border-gray-900 dark:border-gray-100 ring-2 ring-gray-900/20 dark:ring-gray-100/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
								}`}
								style={{ backgroundColor: color }}
								title={color}
							/>
						))}
					</div>
				</div>

				{/* Custom color section */}
				<div className="space-y-3">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-400">Custom color</div>

					{/* Color picker input */}
					<div className="flex items-center space-x-3">
						<input
							type="color"
							value={selectedColor}
							onChange={handleCustomColorChange}
							className="w-10 h-10 border border-gray-200 dark:border-gray-700 rounded cursor-pointer bg-transparent"
						/>
						<div className="flex-1">
							<Input
								type="text"
								value={selectedColor}
								onChange={handleHexInputChange}
								onKeyDown={handleHexInputKeyDown}
								placeholder="#RRGGBB"
								className="text-sm"
							/>
						</div>
					</div>

					{/* Color preview */}
					<div>
						<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preview</div>
						<div
							className="w-full h-10 border border-gray-200 dark:border-gray-700 rounded"
							style={{ backgroundColor: selectedColor }}
						/>
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-800">
					<button
						onClick={onClose}
						className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
						Cancel
					</button>
					<button
						onClick={onClose}
						className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 transition-colors">
						Apply
					</button>
				</div>
			</div>
		</div>
	);
}
