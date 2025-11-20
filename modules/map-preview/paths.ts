/**
 * Path drawing and rendering module
 * Handles drawing paths on the map similar to Figma's pen tool
 */

import * as d3 from 'd3'
import type { DrawnPath, PathPoint, StylingSettings, PathMarkerType } from '@/app/(studio)/types'

/**
 * Convert path points to SVG path data string
 */
export function pathPointsToSVGPath(points: PathPoint[]): string {
	if (points.length === 0) return ''

	let pathData = `M ${points[0].x} ${points[0].y}`

	for (let i = 1; i < points.length; i++) {
		const point = points[i]
		const prevPoint = points[i - 1]

		if (point.type === 'curve' && point.controlPoint1 && point.controlPoint2) {
			// Cubic Bezier curve: C x1 y1, x2 y2, x y
			pathData += ` C ${point.controlPoint1.x} ${point.controlPoint1.y}, ${point.controlPoint2.x} ${point.controlPoint2.y}, ${point.x} ${point.y}`
		} else if (point.type === 'curve' && point.controlPoint1) {
			// Quadratic Bezier curve: Q x1 y1, x y
			pathData += ` Q ${point.controlPoint1.x} ${point.controlPoint1.y}, ${point.x} ${point.y}`
		} else {
			// Straight line: L x y
			pathData += ` L ${point.x} ${point.y}`
		}
	}

	return pathData
}

/**
 * Constrain angle to 45-degree increments when Shift is held
 */
export function constrainAngle(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	constrain: boolean
): { x: number; y: number } {
	if (!constrain) {
		return { x: endX, y: endY }
	}

	const dx = endX - startX
	const dy = endY - startY
	const angle = Math.atan2(dy, dx)
	const distance = Math.sqrt(dx * dx + dy * dy)

	// Round to nearest 45-degree increment
	const constrainedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)

	return {
		x: startX + Math.cos(constrainedAngle) * distance,
		y: startY + Math.sin(constrainedAngle) * distance,
	}
}

/**
 * Create a marker definition for path endpoints
 */
function createMarker(
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
	markerId: string,
	markerType: PathMarkerType,
	color: string,
	size: number,
	isStart: boolean = false
) {
	if (markerType === 'none') return null

	const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs')
	const marker = defs.select(`#${markerId}`).empty()
		? defs.append('marker').attr('id', markerId)
		: defs.select(`#${markerId}`)

	// For start markers, we need to reverse the orientation
	const orient = isStart ? 'auto-start-reverse' : 'auto'

	marker
		.attr('markerWidth', size)
		.attr('markerHeight', size)
		.attr('refX', isStart ? size : size / 2)
		.attr('refY', size / 2)
		.attr('orient', orient)
		.attr('markerUnits', 'userSpaceOnUse')

	marker.selectAll('*').remove()

	switch (markerType) {
		case 'line-arrow':
			// Simple line arrow (V shape) - for start, reverse the direction
			if (isStart) {
				marker
					.append('path')
					.attr('d', `M ${size},${size / 2} L ${size * 0.4},0 M ${size},${size / 2} L ${size * 0.4},${size}`)
					.attr('stroke', color)
					.attr('stroke-width', size * 0.15)
					.attr('fill', 'none')
					.attr('stroke-linecap', 'round')
			} else {
				marker
					.append('path')
					.attr('d', `M 0,${size / 2} L ${size * 0.6},0 M 0,${size / 2} L ${size * 0.6},${size}`)
					.attr('stroke', color)
					.attr('stroke-width', size * 0.15)
					.attr('fill', 'none')
					.attr('stroke-linecap', 'round')
			}
			break
		case 'triangle-arrow':
			// Filled triangle arrow - for start, reverse the direction
			if (isStart) {
				marker
					.append('path')
					.attr('d', `M ${size},0 L 0,${size / 2} L ${size},${size} Z`)
					.attr('fill', color)
			} else {
				marker
					.append('path')
					.attr('d', `M 0,0 L ${size},${size / 2} L 0,${size} Z`)
					.attr('fill', color)
			}
			break
		case 'open-circle':
			// Hollow circle
			marker
				.append('circle')
				.attr('cx', size / 2)
				.attr('cy', size / 2)
				.attr('r', size * 0.4)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', size * 0.2)
			break
		case 'closed-circle':
			// Filled circle
			marker
				.append('circle')
				.attr('cx', size / 2)
				.attr('cy', size / 2)
				.attr('r', size / 2)
				.attr('fill', color)
			break
		case 'square':
			// Filled square
			marker
				.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', size)
				.attr('height', size)
				.attr('fill', color)
			break
		case 'round':
			// Round cap (semicircle) - for start, reverse the direction
			if (isStart) {
				marker
					.append('path')
					.attr('d', `M ${size},0 A ${size / 2},${size / 2} 0 0,0 ${size},${size}`)
					.attr('fill', color)
			} else {
				marker
					.append('path')
					.attr('d', `M 0,0 A ${size / 2},${size / 2} 0 0,1 0,${size}`)
					.attr('fill', color)
			}
			break
	}

	return markerId
}

/**
 * Render all drawn paths on the SVG
 */
export function renderDrawnPaths({
	svg,
	drawnPaths,
	defaultStyles,
	activeTool,
	selectedPathId,
	onPathClick,
	onPathPositionUpdate,
	onPathPointUpdate,
}: {
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
	drawnPaths: DrawnPath[]
	defaultStyles: StylingSettings['defaultPathStyles']
	activeTool: 'inspect' | 'select' | 'move' | 'draw'
	selectedPathId?: string | null
	onPathClick?: (pathId: string) => void
	onPathPositionUpdate?: (pathId: string, deltaX: number, deltaY: number) => void
	onPathPointUpdate?: (pathId: string, pointIndex: number, x: number, y: number) => void
}) {
	if (!drawnPaths || drawnPaths.length === 0) {
		svg.select('#DrawnPaths').remove()
		return
	}

	const pathsGroup = svg.select('#DrawnPaths').empty()
		? svg.append('g').attr('id', 'DrawnPaths')
		: svg.select('#DrawnPaths')

	const paths = pathsGroup
		.selectAll<SVGGElement, DrawnPath>('g.path-group')
		.data(drawnPaths, (d) => d.id)

	// Remove paths that no longer exist
	paths.exit().remove()

	// Enter new paths
	const pathGroups = paths
		.enter()
		.append('g')
		.attr('class', 'path-group')
		.attr('data-path-id', (d) => d.id)

	// Merge enter and update
	const allPathGroups = paths.merge(pathGroups)

	// For each path group, render outline (if exists), main path, and markers
	allPathGroups.each(function (d) {
		const group = d3.select(this)
		const pathId = d.id

		// Get styles
		const stroke = d.stroke ?? defaultStyles?.stroke ?? '#000000'
		const strokeWidth = d.strokeWidth ?? defaultStyles?.strokeWidth ?? 2
		const strokeDasharray = d.strokeDasharray ?? defaultStyles?.strokeDasharray ?? 'none'
		const strokeLinecap = d.strokeLinecap ?? defaultStyles?.strokeLinecap ?? 'round'
		const strokeLinejoin = d.strokeLinejoin ?? defaultStyles?.strokeLinejoin ?? 'round'
		const fill = d.fill ?? defaultStyles?.fill ?? 'none'
		const opacity = d.opacity ?? defaultStyles?.opacity ?? 1
		const strokeOutline = d.strokeOutline ?? 'none'
		const strokeOutlineWidth = d.strokeOutlineWidth ?? 0
		const startMarker = d.startMarker ?? 'none'
		const endMarker = d.endMarker ?? 'none'
		const borderRadius = d.borderRadius ?? 0

		// Generate path data
		const pathData = pathPointsToSVGPath(d.points)

		// Remove existing path elements
		group.selectAll('path').remove()

		// Render outline stroke (behind main stroke)
		if (strokeOutline !== 'none' && strokeOutlineWidth > 0) {
			const outlinePath = group
				.append('path')
				.attr('d', pathData)
				.attr('stroke', strokeOutline)
				.attr('stroke-width', strokeWidth + strokeOutlineWidth * 2)
				.attr('stroke-dasharray', strokeDasharray)
				.attr('stroke-linecap', strokeLinecap)
				.attr('stroke-linejoin', strokeLinejoin)
				.attr('fill', 'none')
				.attr('opacity', opacity)
				.style('pointer-events', 'none')
		}

		// Render main stroke
		const mainPath = group
			.append('path')
			.attr('d', pathData)
			.attr('stroke', stroke)
			.attr('stroke-width', strokeWidth)
			.attr('stroke-dasharray', strokeDasharray)
			.attr('stroke-linecap', strokeLinecap)
			.attr('stroke-linejoin', strokeLinejoin)
			.attr('fill', fill)
			.attr('opacity', opacity)
			.attr('data-path-id', pathId)
			.style('pointer-events', activeTool === 'select' || activeTool === 'move' ? 'all' : 'none')
			.style('cursor', activeTool === 'select' ? 'pointer' : activeTool === 'move' ? 'move' : activeTool === 'draw' ? 'crosshair' : 'default')

		// Add markers if needed
		const markerSize = Math.max(strokeWidth * 2, 8)
		if (startMarker !== 'none') {
			const markerId = `marker-start-${pathId}`
			createMarker(svg, markerId, startMarker, stroke, markerSize, true)
			mainPath.attr('marker-start', `url(#${markerId})`)
		} else {
			mainPath.attr('marker-start', null)
		}

		if (endMarker !== 'none') {
			const markerId = `marker-end-${pathId}`
			createMarker(svg, markerId, endMarker, stroke, markerSize, false)
			mainPath.attr('marker-end', `url(#${markerId})`)
		} else {
			mainPath.attr('marker-end', null)
		}

		// Render anchor points if this path is selected
		if (selectedPathId === pathId && onPathPointUpdate) {
			// Remove existing anchor points
			group.selectAll('circle.anchor-point').remove()

			// Render anchor points for each point in the path
			const anchorPoints = group
				.selectAll<SVGCircleElement, { point: PathPoint; index: number; pathId: string }>('circle.anchor-point')
				.data(
					d.points.map((point, index) => ({ point, index, pathId })),
					(_, i) => `anchor-${pathId}-${i}`
				)

			anchorPoints
				.enter()
				.append('circle')
				.attr('class', 'anchor-point')
				.attr('cx', (d) => d.point.x)
				.attr('cy', (d) => d.point.y)
				.attr('r', 6)
				.attr('fill', stroke)
				.attr('stroke', '#ffffff')
				.attr('stroke-width', 2)
				.style('cursor', 'move')
				.style('pointer-events', 'all')
				.call(
					d3
						.drag<SVGCircleElement, { point: PathPoint; index: number; pathId: string }>()
						.subject(function (event, d) {
							// Store original points from the path data
							const pathData = d3.select(this.parentElement).datum() as DrawnPath
							return { x: d.point.x, y: d.point.y, originalPoints: pathData.points, pointIndex: d.index }
						})
						.on('start', function (event) {
							if (event.sourceEvent) {
								event.sourceEvent.preventDefault()
								event.sourceEvent.stopPropagation()
							}
							d3.select(this).attr('r', 8).style('opacity', '0.8')
						})
						.on('drag', function (event, d) {
							if (event.sourceEvent) {
								event.sourceEvent.preventDefault()
								event.sourceEvent.stopPropagation()
							}
							const [x, y] = d3.pointer(event, svg.node())
							d3.select(this).attr('cx', x).attr('cy', y)

							// Update the path data temporarily
							if (!event.subject) return
							const subject = event.subject as { x: number; y: number; originalPoints: PathPoint[]; pointIndex: number }
							const updatedPoints = [...subject.originalPoints]
							const deltaX = x - subject.x
							const deltaY = y - subject.y
							const oldPoint = updatedPoints[subject.pointIndex]
							updatedPoints[subject.pointIndex] = {
								...oldPoint,
								x,
								y,
								// Update control points relative to point movement
								controlPoint1: oldPoint.controlPoint1
									? {
											x: oldPoint.controlPoint1.x + deltaX,
											y: oldPoint.controlPoint1.y + deltaY,
										}
									: undefined,
								controlPoint2: oldPoint.controlPoint2
									? {
											x: oldPoint.controlPoint2.x + deltaX,
											y: oldPoint.controlPoint2.y + deltaY,
										}
									: undefined,
							}
							const pathData = pathPointsToSVGPath(updatedPoints)
							group.selectAll('path').attr('d', pathData)
						})
						.on('end', function (event, d) {
							if (event.sourceEvent) {
								event.sourceEvent.preventDefault()
								event.sourceEvent.stopPropagation()
							}
							d3.select(this).attr('r', 6).style('opacity', '1')
							const [x, y] = d3.pointer(event, svg.node())
							if (onPathPointUpdate) {
								onPathPointUpdate(d.pathId, d.index, x, y)
							}
						}) as any
				)

			anchorPoints.attr('cx', (d) => d.point.x).attr('cy', (d) => d.point.y)

			anchorPoints.exit().remove()
		} else {
			// Remove anchor points if path is not selected
			group.selectAll('circle.anchor-point').remove()
		}
	})

	// Remove all existing event handlers first
	allPathGroups.selectAll('path').on('click', null)
	allPathGroups.selectAll('path').on('.drag', null)

	// Add click handlers for select tool
	if (activeTool === 'select' && onPathClick) {
		allPathGroups.selectAll('path[data-path-id]').on('click', function (event) {
			event.stopPropagation()
			const pathId = d3.select(this).attr('data-path-id')
			if (pathId && onPathClick) {
				onPathClick(pathId)
			}
		})
	}

	// Add drag handlers for move tool
	if (activeTool === 'move' && onPathPositionUpdate) {
		const drag = d3
			.drag<SVGPathElement, DrawnPath>()
			.subject(function (event, d) {
				const [x, y] = d3.pointer(event, svg.node())
				return { x, y, originalPoints: d.points }
			})
			.on('start', function (event) {
				if (event.sourceEvent) {
					event.sourceEvent.preventDefault()
					event.sourceEvent.stopPropagation()
				}
				d3.select(this.parentElement).style('opacity', '0.7')
			})
			.on('drag', function (event, d) {
				if (event.sourceEvent) {
					event.sourceEvent.preventDefault()
					event.sourceEvent.stopPropagation()
				}
				const [x, y] = d3.pointer(event, svg.node())
				if (!event.subject) return

				const startPos = event.subject as { x: number; y: number; originalPoints: PathPoint[] }
				const deltaX = x - startPos.x
				const deltaY = y - startPos.y

				const updatedPoints = startPos.originalPoints.map((point) => ({
					...point,
					x: point.x + deltaX,
					y: point.y + deltaY,
					controlPoint1: point.controlPoint1
						? {
								x: point.controlPoint1.x + deltaX,
								y: point.controlPoint1.y + deltaY,
							}
						: undefined,
					controlPoint2: point.controlPoint2
						? {
								x: point.controlPoint2.x + deltaX,
								y: point.controlPoint2.y + deltaY,
							}
						: undefined,
				}))

				const pathData = pathPointsToSVGPath(updatedPoints)
				const group = d3.select(this.parentElement)
				group.selectAll('path').attr('d', pathData)
			})
			.on('end', function (event, d) {
				if (event.sourceEvent) {
					event.sourceEvent.preventDefault()
					event.sourceEvent.stopPropagation()
				}
				d3.select(this.parentElement).style('opacity', '1')

				if (!event.subject) return
				const [x, y] = d3.pointer(event, svg.node())
				const startPos = event.subject as { x: number; y: number; originalPoints: PathPoint[] }
				const deltaX = x - startPos.x
				const deltaY = y - startPos.y
				if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
					onPathPositionUpdate(d.id, deltaX, deltaY)
				}
			})

		allPathGroups.selectAll('path[data-path-id]').call(drag as any)
	}
}

