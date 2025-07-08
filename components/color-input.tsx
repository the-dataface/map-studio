'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ChromeColorPicker } from './chrome-color-picker';
import { cn, normalizeColorInput } from '@/lib/utils';

interface ColorInputProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function ColorInput({ value, onChange, className }: ColorInputProps) {
	const [inputValue, setInputValue] = useState(value);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		setInputValue(value);
	}, [value]);

	// Update picker position on scroll when open
	useEffect(() => {
		const updatePosition = () => {
			if (isPickerOpen && buttonRef.current) {
				const rect = buttonRef.current.getBoundingClientRect();
				const pickerWidth = 288; // w-72 = 18rem = 288px
				const pickerHeight = 400; // Approximate height of the picker

				// Calculate optimal position
				let top = rect.bottom + 8;
				let left = rect.left - pickerWidth / 2 + rect.width / 2; // Center align with button

				// Adjust if picker would go off-screen horizontally
				if (left < 10) {
					left = 10;
				} else if (left + pickerWidth > window.innerWidth - 10) {
					left = window.innerWidth - pickerWidth - 10;
				}

				// Adjust if picker would go off-screen vertically
				if (top + pickerHeight > window.innerHeight - 10) {
					// Position above the button instead
					top = rect.top - pickerHeight - 8;

					// If still off-screen, position at top of viewport
					if (top < 10) {
						top = 10;
					}
				}

				setPickerPosition({ top, left });
			}
		};

		if (isPickerOpen) {
			updatePosition();
			window.addEventListener('scroll', updatePosition, true); // Use capture to catch all scroll events
			window.addEventListener('resize', updatePosition);
		}

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [isPickerOpen]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);
		onChange(newValue);
	};

	const handleSwatchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			const pickerWidth = 288; // w-72 = 18rem = 288px
			const pickerHeight = 400; // Approximate height of the picker

			// Calculate optimal position - center align with button
			let top = rect.bottom + 8;
			let left = rect.left - pickerWidth / 2 + rect.width / 2;

			// Adjust if picker would go off-screen horizontally
			if (left < 10) {
				left = 10;
			} else if (left + pickerWidth > window.innerWidth - 10) {
				left = window.innerWidth - pickerWidth - 10;
			}

			// Adjust if picker would go off-screen vertically
			if (top + pickerHeight > window.innerHeight - 10) {
				// Position above the button instead
				top = rect.top - pickerHeight - 8;

				// If still off-screen, position at top of viewport
				if (top < 10) {
					top = 10;
				}
			}

			setPickerPosition({ top, left });
		}

		setIsPickerOpen(!isPickerOpen);
	};

	const handleColorChange = (newColor: string) => {
		setInputValue(newColor);
		onChange(newColor);
	};

	const handlePickerClose = () => {
		setIsPickerOpen(false);
	};

	// Simple color validation
	const isValidColor = (color: string) => {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || color === '';
	};

	const displayColor = isValidColor(inputValue) ? inputValue : '#cccccc';

	const handleInputBlur = () => {
		const normalized = normalizeColorInput(inputValue);
		setInputValue(normalized);
		onChange(normalized);
	};

	return (
		<div className={cn('relative', className)}>
			<Input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onBlur={handleInputBlur}
				className="pr-10"
				placeholder="#RRGGBB"
			/>

			<button
				ref={buttonRef}
				type="button"
				onClick={handleSwatchClick}
				className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
				style={{ backgroundColor: displayColor }}
				title="Click to open color picker">
				<span className="sr-only">Open color picker</span>
			</button>

			<ChromeColorPicker
				isOpen={isPickerOpen}
				onClose={handlePickerClose}
				onColorChange={handleColorChange}
				currentColor={displayColor}
				position={pickerPosition}
			/>
		</div>
	);
}
