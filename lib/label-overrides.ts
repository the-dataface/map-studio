import type { IndividualLabelOverride, StylingSettings } from '@/app/(studio)/types';

/** Merge label override updates, removing keys explicitly cleared with `undefined`. */
export const mergeLabelOverride = (
	existing: IndividualLabelOverride | undefined,
	labelId: string,
	updates: Partial<IndividualLabelOverride>
): IndividualLabelOverride => {
	const merged: IndividualLabelOverride = {
		...existing,
		id: labelId,
		...updates,
	};

	for (const key of Object.keys(updates) as (keyof IndividualLabelOverride)[]) {
		if (updates[key] === undefined) {
			delete merged[key];
		}
	}

	return merged;
};

export type StylingSettingsUpdater = StylingSettings | ((prev: StylingSettings) => StylingSettings);

export const applyLabelOverrideUpdate = (
	prev: StylingSettings,
	labelId: string,
	updates: Partial<IndividualLabelOverride>
): StylingSettings => ({
	...prev,
	individualLabelOverrides: {
		...(prev.individualLabelOverrides || {}),
		[labelId]: mergeLabelOverride(prev.individualLabelOverrides?.[labelId], labelId, updates),
	},
});
