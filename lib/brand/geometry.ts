export function shapeGroupTransform(viewBox: string, outerSize: number, inset: number): string {
	const parts = viewBox.split(/[\s,]+/).map(Number)
	const vbW = parts[2] || 128
	const vbH = parts[3] || 128
	const inner = outerSize - inset * 2
	const scale = inner / Math.max(vbW, vbH)
	const ox = inset + (inner - vbW * scale) / 2
	const oy = inset + (inner - vbH * scale) / 2
	return `translate(${ox} ${oy}) scale(${scale})`
}
