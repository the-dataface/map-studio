'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MapTooltipProps {
	x: number;
	y: number;
	content: React.ReactNode;
	visible: boolean;
	svgElement?: SVGSVGElement | null;
}

export const MapTooltip: React.FC<MapTooltipProps> = ({ x, y, content, visible, svgElement }) => {
	const [mounted, setMounted] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!visible || !svgElement) return;

		// Convert SVG coordinates to page coordinates
		const svgRect = svgElement.getBoundingClientRect();
		const viewBox = svgElement.viewBox.baseVal;
		const svgWidth = svgRect.width;
		const svgHeight = svgRect.height;
		const viewBoxWidth = viewBox.width || svgWidth;
		const viewBoxHeight = viewBox.height || svgHeight;

		// Calculate scale factors
		const scaleX = svgWidth / viewBoxWidth;
		const scaleY = svgHeight / viewBoxHeight;

		// Convert viewBox coordinates to screen coordinates
		const screenX = svgRect.left + x * scaleX;
		const screenY = svgRect.top + y * scaleY;

		setPosition({ x: screenX, y: screenY });
	}, [x, y, visible, svgElement]);

	if (!mounted || !visible || !content) {
		return null;
	}

	const tooltipContent = (
		<div
			className="fixed z-50 pointer-events-none rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
			style={{
				left: `${position.x + 10}px`,
				top: `${position.y - 10}px`,
				transform: 'translateY(-100%)',
			}}>
			{content}
		</div>
	);

	return createPortal(tooltipContent, document.body);
};
