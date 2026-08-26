import { describe, expect, it } from 'vitest';

import { computeSymbolLabelPlacement, resolveEffectiveSymbolLabelAlignment } from '../labels';

const projected: [number, number] = [400, 300];
const symbolSize = 20;

describe('resolveEffectiveSymbolLabelAlignment', () => {
	it('prefers per-label labelAlignment over global auto', () => {
		expect(
			resolveEffectiveSymbolLabelAlignment(
				{ id: 'symbol-0', labelAlignment: 'middle-left' },
				'auto'
			)
		).toBe('middle-left');
	});

	it('infers alignment from anchor attributes when labelAlignment is unset', () => {
		expect(
			resolveEffectiveSymbolLabelAlignment(
				{ id: 'symbol-0', textAnchor: 'end', dominantBaseline: 'middle' },
				'auto'
			)
		).toBe('middle-left');
	});
});

describe('computeSymbolLabelPlacement', () => {
	it('places auto-aligned labels to the right of the symbol by default', () => {
		const placement = computeSymbolLabelPlacement({
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		expect(placement.x).toBeGreaterThan(projected[0]);
		expect(placement.textAnchor).toBe('start');
		expect(placement.alignment).toBe('auto');
	});

	it('moves the anchor to the left side when per-label alignment is middle-left', () => {
		const autoPlacement = computeSymbolLabelPlacement({
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		const leftPlacement = computeSymbolLabelPlacement({
			override: {
				id: 'symbol-0',
				labelAlignment: 'middle-left',
				textAnchor: 'end',
				dominantBaseline: 'middle',
			},
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		expect(leftPlacement.x).toBeLessThan(projected[0]);
		expect(leftPlacement.x).not.toBe(autoPlacement.x);
		expect(leftPlacement.textAnchor).toBe('end');
		expect(leftPlacement.dominantBaseline).toBe('middle');
	});

	it('ignores mismatched text-anchor overrides when manual alignment is active', () => {
		const placement = computeSymbolLabelPlacement({
			override: {
				id: 'symbol-0',
				labelAlignment: 'middle-left',
				textAnchor: 'start',
				dominantBaseline: 'middle',
			},
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		expect(placement.x).toBeLessThan(projected[0]);
		expect(placement.textAnchor).toBe('end');
	});

	it('clears absolute drag positions when x/y are removed from the override', () => {
		const dragged = computeSymbolLabelPlacement({
			override: {
				id: 'symbol-0',
				x: autoPlacementX(projected, symbolSize),
				y: projected[1],
			},
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		const realigned = computeSymbolLabelPlacement({
			override: {
				id: 'symbol-0',
				labelAlignment: 'middle-left',
				textAnchor: 'end',
				dominantBaseline: 'middle',
			},
			globalAlignment: 'auto',
			projected,
			symbolSize,
			labelText: 'Chicago, IL',
			fontSize: 10,
			width: 975,
			height: 610,
			globalOffsetX: 0,
			globalOffsetY: 0,
			individualOffsetX: 0,
			individualOffsetY: 0,
		});

		expect(dragged.x).toBeGreaterThan(projected[0]);
		expect(realigned.x).toBeLessThan(projected[0]);
		expect(realigned.x).not.toBe(dragged.x);
	});
});

function autoPlacementX(projected: [number, number], symbolSize: number) {
	const margin = Math.max(8, symbolSize * 0.3);
	return projected[0] + symbolSize / 2 + margin;
}
