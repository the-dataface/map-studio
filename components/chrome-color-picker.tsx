/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import type React from 'react';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { normalizeColorInput } from '@/lib/utils';

interface ChromeColorPickerProps {
	isOpen: boolean;
	onClose: () => void;
	onColorChange: (color: string) => void;
	currentColor: string;
	position: { top: number; left: number };
}

// Color conversion utilities
const hexToHsv = (hex: string) => {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;

	let h = 0;
	if (diff !== 0) {
		if (max === r) h = ((g - b) / diff) % 6;
		else if (max === g) h = (b - r) / diff + 2;
		else h = (r - g) / diff + 4;
	}
	h = Math.round(h * 60);
	if (h < 0) h += 360;

	const s = max === 0 ? 0 : diff / max;
	const v = max;

	return { h, s: s * 100, v: v * 100 };
};

const hsvToHex = (h: number, s: number, v: number) => {
	s /= 100;
	v /= 100;

	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;

	let r = 0,
		g = 0,
		b = 0;

	if (0 <= h && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= h && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		g = 0;
		b = x;
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export function ChromeColorPicker({ isOpen, onClose, onColorChange, currentColor, position }: ChromeColorPickerProps) {
	const [hsv, setHsv] = useState(() => hexToHsv(currentColor || '#ff0000'));
	const [hexInput, setHexInput] = useState(currentColor || '#ff0000');
	const [isDragging, setIsDragging] = useState<'saturation' | 'hue' | null>(null);

	const pickerRef = useRef<HTMLDivElement>(null);
	const saturationRef = useRef<HTMLDivElement>(null);
	const hueRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (currentColor) {
			const newHsv = hexToHsv(currentColor);
			setHsv(newHsv);
			setHexInput(currentColor);
		}
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

	const updateColor = useCallback(
		(newHsv: { h: number; s: number; v: number }) => {
			const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
			setHsv(newHsv);
			setHexInput(hex);
			onColorChange(hex);
		},
		[onColorChange]
	);

	const handleSaturationMouseDown = (e: React.MouseEvent) => {
		setIsDragging('saturation');
		handleSaturationMove(e);
	};

	const handleSaturationMove = (e: React.MouseEvent | MouseEvent) => {
		if (!saturationRef.current) return;

		const rect = saturationRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

		const s = (x / rect.width) * 100;
		const v = ((rect.height - y) / rect.height) * 100;

		updateColor({ ...hsv, s, v });
	};

	const handleHueMouseDown = (e: React.MouseEvent) => {
		setIsDragging('hue');
		handleHueMove(e);
	};

	const handleHueMove = (e: React.MouseEvent | MouseEvent) => {
		if (!hueRef.current) return;

		const rect = hueRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const h = (x / rect.width) * 360;

		updateColor({ ...hsv, h });
	};

	const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setHexInput(value);

		if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
			const newHsv = hexToHsv(value);
			setHsv(newHsv);
			onColorChange(value);
		}
	};

	const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const normalized = normalizeColorInput(hexInput);
			setHexInput(normalized);
			onColorChange(normalized);
			onClose();
		}
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging === 'saturation') {
				handleSaturationMove(e);
			} else if (isDragging === 'hue') {
				handleHueMove(e);
			}
		};

		const handleMouseUp = () => {
			setIsDragging(null);
		};

		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, hsv, updateColor]);

	if (!isOpen) return null;

	const hueColor = hsvToHex(hsv.h, 100, 100);
	const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

	return (
		<div
			ref={pickerRef}
			className="fixed z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-lg outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: 'translateZ(0)',
			}}>
			{/* Arrow */}
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
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
						<span className="sr-only">Close</span>
					</button>
				</div>

				{/* Saturation/Value picker */}
				<div className="relative">
					<div
						ref={saturationRef}
						className="relative w-full h-40 cursor-crosshair rounded border border-gray-200 dark:border-gray-700 overflow-hidden"
						style={{
							background: `linear-gradient(to right, #fff, ${hueColor}), linear-gradient(to top, #000, transparent)`,
							backgroundBlendMode: 'multiply, normal',
						}}
						onMouseDown={handleSaturationMouseDown}>
						{/* Saturation/Value indicator */}
						<div
							className="absolute w-3 h-3 border-2 border-white rounded-full shadow-sm pointer-events-none"
							style={{
								left: `${(hsv.s / 100) * 100}%`,
								top: `${100 - (hsv.v / 100) * 100}%`,
								transform: 'translate(-50%, -50%)',
							}}
						/>
					</div>
				</div>

				{/* Hue slider */}
				<div className="flex items-center space-x-3">
					{/* Color preview */}
					<div
						className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
						style={{ backgroundColor: currentHex }}
					/>

					{/* Hue slider */}
					<div className="flex-1 relative">
						<div
							ref={hueRef}
							className="w-full h-3 cursor-pointer rounded border border-gray-200 dark:border-gray-700 overflow-hidden"
							style={{
								background:
									'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
							}}
							onMouseDown={handleHueMouseDown}>
							{/* Hue indicator */}
							<div
								className="absolute w-3 h-3 border-2 border-white rounded-full shadow-sm pointer-events-none"
								style={{
									left: `${(hsv.h / 360) * 100}%`,
									top: '50%',
									transform: 'translate(-50%, -50%)',
								}}
							/>
						</div>
					</div>
				</div>

				{/* Hex input */}
				<div className="space-y-2">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-400">Hex</div>
					<Input
						type="text"
						value={hexInput}
						onChange={handleHexInputChange}
						onKeyDown={handleHexInputKeyDown}
						placeholder="#RRGGBB"
						className="text-sm font-mono"
					/>
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
