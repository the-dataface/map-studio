import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Minimize2 } from 'lucide-react';

interface FloatingActionButtonsProps {
	onScrollToMap: () => void;
	onCollapseAll: () => void;
	visible: boolean;
	showCollapse: boolean;
	showJump: boolean;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
	onScrollToMap,
	onCollapseAll,
	visible,
	showCollapse,
	showJump,
}) => {
	const collapseBtnRef = useRef<HTMLButtonElement>(null);
	const [showJumpRender, setShowJumpRender] = useState(showJump);
	const [showCollapseRender, setShowCollapseRender] = useState(showCollapse);
	const [jumpActive, setJumpActive] = useState(false);
	const [collapseActive, setCollapseActive] = useState(false);

	// Animate out before unmounting (Jump to map)
	useEffect(() => {
		if (showJump) {
			setShowJumpRender(true);
			setTimeout(() => setJumpActive(true), 10); // allow mount before activating
		} else {
			setJumpActive(false);
			const timeout = setTimeout(() => setShowJumpRender(false), 300);
			return () => clearTimeout(timeout);
		}
	}, [showJump]);

	// Animate out before unmounting (Collapse All)
	useEffect(() => {
		if (showCollapse) {
			setShowCollapseRender(true);
			setTimeout(() => setCollapseActive(true), 10);
		} else {
			setCollapseActive(false);
			const timeout = setTimeout(() => setShowCollapseRender(false), 300);
			return () => clearTimeout(timeout);
		}
	}, [showCollapse]);

	// Blur the Collapse All button if it is being hidden and has focus
	useEffect(() => {
		if (!showCollapse && collapseBtnRef.current && document.activeElement === collapseBtnRef.current) {
			collapseBtnRef.current.blur();
		}
	}, [showCollapse]);

	if (!visible) return null;

	// Only one button visible? Used for slide-to-center effect
	const onlyJump = showJumpRender && !showCollapseRender;
	const onlyCollapse = showCollapseRender && !showJumpRender;

	return (
		<div
			className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 flex justify-center gap-2 items-center animate-in fade-in duration-300 transition-all p-2 overflow-visible`}
			style={{ minWidth: 0 }}>
			{showJumpRender && (
				<Button
					variant="default"
					size="lg"
					onClick={onScrollToMap}
					className={`px-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center gap-2 shadow-xl group transition-all duration-300 hover:bg-gray-700 dark:hover:bg-gray-100
						${jumpActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
						${onlyJump ? 'translate-x-0' : 'translate-x-0'}
					`}
					aria-label="Jump to map preview"
					style={{
						transition: 'opacity 0.3s, transform 0.3s',
						...(onlyJump ? { marginLeft: 0, marginRight: 0 } : {}),
					}}>
					<ArrowDown className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-1" />
					Jump to map
				</Button>
			)}
			{showCollapseRender && (
				<Button
					ref={collapseBtnRef}
					variant="outline"
					size="lg"
					onClick={onCollapseAll}
					className={`px-4 rounded-full flex items-center gap-2 shadow-xl group transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700
						${collapseActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
						${onlyCollapse ? 'translate-x-0' : 'translate-x-0'}
					`}
					aria-label="Collapse all panels"
					style={{
						transition: 'opacity 0.3s, transform 0.3s',
						...(onlyCollapse ? { marginLeft: 0, marginRight: 0 } : {}),
					}}>
					<Minimize2
						className="w-5 h-5 transition-transform duration-200 group-hover:scale-75"
						style={{ transition: 'transform 0.2s' }}
					/>
					Collapse all
				</Button>
			)}
		</div>
	);
};
