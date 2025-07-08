import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Utility to normalize color input (shared)
export function normalizeColorInput(input: string): string {
	let value = input.trim().replace(/^#/, '').toLowerCase();
	if (!/^([0-9a-f]{1,6})$/.test(value)) {
		if (typeof window !== 'undefined') {
			const ctx = document.createElement('canvas').getContext('2d');
			if (ctx) {
				ctx.fillStyle = value;
				const computed = ctx.fillStyle;
				if (computed.startsWith('#')) {
					value = computed.replace(/^#/, '');
				} else if (computed.startsWith('rgb')) {
					const rgb = computed.match(/\d+/g);
					if (rgb && rgb.length >= 3) {
						value = ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2]))
							.toString(16)
							.slice(1);
					}
				}
			}
		}
	}
	if (value.length === 1) {
		value = value.repeat(6);
	} else if (value.length === 2) {
		value = value[0] + value[1] + value[0] + value[1] + value[0] + value[1];
	} else if (value.length === 3) {
		value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
	} else if (value.length === 4) {
		value = value[0] + value[1] + value[2] + value[3] + value[0] + value[1];
	} else if (value.length === 5) {
		value = value[0] + value[1] + value[2] + value[3] + value[4] + value[0];
	} else if (value.length === 6) {
	} else {
		value = 'cccccc';
	}
	return `#${value}`;
}
