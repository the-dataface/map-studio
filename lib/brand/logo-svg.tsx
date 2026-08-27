import {
	LOGO_FRAME,
	LOGO_HANDLE,
	LOGO_PAD,
	LOGO_SHAPE_INSET,
	LOGO_STROKE,
	type ParsedShape,
} from './types'
import { shapeGroupTransform } from './geometry'

/** Handle-centered frame. `inset` is the top-left of the top-left handle. */
export function LogoFrame({
	color = 'currentColor',
	inset = 0,
}: {
	color?: string
	inset?: number
}) {
	const h = LOGO_HANDLE
	const pad = LOGO_PAD
	const frame = LOGO_FRAME

	return (
		<g fill={color} stroke="none">
			<rect
				x={inset + pad}
				y={inset + pad}
				width={frame}
				height={frame}
				fill="none"
				stroke={color}
				strokeWidth={LOGO_STROKE}
			/>
			<rect x={inset} y={inset} width={h} height={h} />
			<rect x={inset + frame} y={inset} width={h} height={h} />
			<rect x={inset} y={inset + frame} width={h} height={h} />
			<rect x={inset + frame} y={inset + frame} width={h} height={h} />
		</g>
	)
}

export function LogoShapeGroup({
	shape,
	color = 'currentColor',
	opacity = 1,
	animateOpacity = false,
	inset = 0,
}: {
	shape: ParsedShape
	color?: string
	opacity?: number
	animateOpacity?: boolean
	inset?: number
}) {
	const origin = inset + LOGO_PAD
	const inner = shapeGroupTransform(shape.viewBox, LOGO_FRAME, LOGO_SHAPE_INSET)
	return (
		<g
			transform={`translate(${origin} ${origin}) ${inner}`}
			fill={color}
			opacity={animateOpacity ? undefined : opacity}
			style={
				animateOpacity
					? {
							opacity,
							transition: 'opacity 400ms ease',
						}
					: undefined
			}>
			{shape.paths.map((d, index) => (
				<path key={`${shape.kind}-${shape.code}-${index}`} d={d} fill={color} />
			))}
		</g>
	)
}

export function LogoMarkSvg({
	shape,
	outgoing,
	color = 'currentColor',
	className,
	size = 32,
	animate = false,
}: {
	shape: ParsedShape | null
	outgoing?: ParsedShape | null
	color?: string
	className?: string
	size?: number
	animate?: boolean
}) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${LOGO_FRAME} ${LOGO_FRAME}`}
			width={size}
			height={size}
			className={`${className ?? ''} overflow-visible`.trim()}
			overflow="visible"
			aria-hidden="true"
			focusable="false">
			{outgoing ? (
				<LogoShapeGroup
					shape={outgoing}
					color={color}
					opacity={0}
					animateOpacity={animate}
					inset={-LOGO_PAD}
				/>
			) : null}
			{shape ? (
				<LogoShapeGroup
					shape={shape}
					color={color}
					opacity={1}
					animateOpacity={animate}
					inset={-LOGO_PAD}
				/>
			) : null}
			<LogoFrame color={color} inset={-LOGO_PAD} />
		</svg>
	)
}
