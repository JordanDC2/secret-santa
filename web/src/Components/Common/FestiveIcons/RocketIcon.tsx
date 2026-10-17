import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/**
 * A festive firework rocket, flying up and to the right: red with white bands, a gold nose,
 * green fins and a flame. Drawn upright and symmetric about x = 32 (nose tip to flame tip
 * spans y 9.5 to 58.5, so it is nudged up 2 to centre it), then tilted 45°.
 * Elf Fling's rocket button.
 */
export default function RocketIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<g transform="rotate(45 32 32) translate(0 -2)">
				{/* Flame. */}
				<path d="M25.5 47 Q32 70 38.5 47 Z" fill="var(--festive-gold-deep)" />
				<path d="M28 47 Q32 64 36 47 Z" fill="var(--festive-red-bright)" />
				{/* Fins. */}
				<path d="M24 34 L16 47 L24 44 Z" fill="var(--festive-green)" />
				<path d="M40 34 L48 47 L40 44 Z" fill="var(--festive-green)" />
				{/* Body, with two white bands and a porthole between them. */}
				<rect x={24} y={16} width={16} height={31} rx={3} fill="var(--festive-red)" />
				<rect x={24} y={22} width={16} height={4} fill="var(--festive-white)" />
				<rect x={24} y={37} width={16} height={4} fill="var(--festive-white)" />
				<circle
					cx={32}
					cy={31.5}
					r={3.5}
					fill="var(--festive-white)"
					stroke="var(--festive-gold-deep)"
					strokeWidth={1.5}
				/>
				{/* Nose cone. */}
				<path d="M24 17 Q32 2 40 17 Z" fill="var(--festive-gold-deep)" />
			</g>
		</FestiveSvg>
	);
}
