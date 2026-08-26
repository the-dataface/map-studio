import * as d3 from 'd3'

import type { StylingSettings } from '@/app/(studio)/types'
import type { PathPoint } from '@/app/(studio)/types'
import { pathPointsToSVGPath } from './paths'

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

interface RenderPathPreviewParams {
  svg: SvgSelection
  isDrawing: boolean
  currentPath: PathPoint[]
  mousePosition: { x: number; y: number } | null
  isDragging: boolean
  dragStartPoint: { x: number; y: number } | null
  defaultPathStyles: StylingSettings['defaultPathStyles']
}

/** Render in-progress path drawing preview without rebuilding the full map. */
export function renderPathPreview({
  svg,
  isDrawing,
  currentPath,
  mousePosition,
  isDragging,
  dragStartPoint,
  defaultPathStyles,
}: RenderPathPreviewParams): void {
  if (!isDrawing || currentPath.length === 0) {
    svg.select('#PathPreview').remove()
    return
  }

  const previewGroup = svg.select<SVGGElement>('#PathPreview').empty()
    ? svg.append('g').attr('id', 'PathPreview')
    : svg.select<SVGGElement>('#PathPreview')

  const defaultStyles = defaultPathStyles || {
    stroke: '#000000',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
    opacity: 1,
  }

  const anchorPoints = currentPath.filter((p) => p.type === 'line' || !p.type)
  previewGroup
    .selectAll<SVGCircleElement, PathPoint>('circle.anchor-point')
    .data(anchorPoints, (_, i) => `anchor-${i}`)
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('class', 'anchor-point')
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y)
          .attr('r', 4)
          .attr('fill', defaultStyles.stroke)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .style('pointer-events', 'none'),
      (update) => update.attr('cx', (d) => d.x).attr('cy', (d) => d.y),
      (exit) => exit.remove(),
    )

  const pathData = pathPointsToSVGPath(currentPath)
  previewGroup
    .selectAll<SVGPathElement, PathPoint[]>('path.current-path')
    .data([currentPath])
    .join('path')
    .attr('class', 'current-path')
    .attr('d', pathData)
    .attr('stroke', defaultStyles.stroke)
    .attr('stroke-width', defaultStyles.strokeWidth)
    .attr('stroke-linecap', defaultStyles.strokeLinecap || 'round')
    .attr('stroke-linejoin', defaultStyles.strokeLinejoin || 'round')
    .attr('fill', defaultStyles.fill || 'none')
    .attr('opacity', (defaultStyles.opacity || 1) * 0.7)
    .style('pointer-events', 'none')

  if (mousePosition && currentPath.length > 0) {
    const lastPoint = currentPath[currentPath.length - 1]
    let previewLineData: string

    if (isDragging && dragStartPoint && currentPath.length > 0) {
      const prevPoint = currentPath.length > 1 ? currentPath[currentPath.length - 2] : lastPoint
      const dx1 = dragStartPoint.x - prevPoint.x
      const dy1 = dragStartPoint.y - prevPoint.y
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const dx2 = mousePosition.x - dragStartPoint.x
      const dy2 = mousePosition.y - dragStartPoint.y
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
      const tension = 0.4

      if (dist1 > 0.001 && dist2 > 0.001) {
        const cp1Distance = dist1 * tension
        const cp2Distance = dist2 * tension
        const cp1x = dragStartPoint.x - (dx1 / dist1) * cp1Distance
        const cp1y = dragStartPoint.y - (dy1 / dist1) * cp1Distance
        const cp2x = dragStartPoint.x + (dx2 / dist2) * cp2Distance
        const cp2y = dragStartPoint.y + (dy2 / dist2) * cp2Distance
        previewLineData = `M ${lastPoint.x} ${lastPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${mousePosition.x} ${mousePosition.y}`
      } else {
        previewLineData = `M ${lastPoint.x} ${lastPoint.y} L ${mousePosition.x} ${mousePosition.y}`
      }
    } else {
      previewLineData = `M ${lastPoint.x} ${lastPoint.y} L ${mousePosition.x} ${mousePosition.y}`
    }

    previewGroup
      .selectAll<SVGPathElement, { x: number; y: number }>('path.preview-line')
      .data([mousePosition])
      .join('path')
      .attr('class', 'preview-line')
      .attr('d', previewLineData)
      .attr('stroke', defaultStyles.stroke)
      .attr('stroke-width', defaultStyles.strokeWidth)
      .attr('stroke-linecap', defaultStyles.strokeLinecap || 'round')
      .attr('stroke-dasharray', '4 4')
      .attr('fill', 'none')
      .attr('opacity', (defaultStyles.opacity || 1) * 0.5)
      .style('pointer-events', 'none')
  } else {
    previewGroup.selectAll('path.preview-line').remove()
  }
}
