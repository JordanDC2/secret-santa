import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** The dashboard welcome. */
export default function ChristmasTreeIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<rect x={28} y={50} width={8} height={10} rx={1.5} fill="var(--festive-bark)" />
			<path
				d="M32 9 L46 25 H39 L50 38 H42 L55 52 H9 L22 38 H14 L25 25 H18 Z"
				fill="var(--festive-green)"
				stroke="var(--festive-green)"
				strokeWidth={2}
				strokeLinejoin="round"
			/>
			<path d="M32 9 L46 25 H39 L50 38 H42 L55 52 H32 Z" fill="var(--festive-green-dark)" opacity={0.45} />
			<path
				d="M22 33 Q32 37 42 31 M17 46 Q32 50 47 43"
				fill="none"
				stroke="var(--festive-gold)"
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<circle cx={27} cy={27} r={2.8} fill="var(--festive-red-bright)" />
			<circle cx={38} cy={38} r={2.8} fill="var(--festive-gold-deep)" />
			<circle cx={24} cy={42} r={2.8} fill="var(--festive-gold-deep)" />
			<circle cx={43} cy={48} r={2.8} fill="var(--festive-red-bright)" />
			<circle cx={31} cy={46} r={2.8} fill="var(--festive-red-bright)" />
			<path
				d="M32 1.5 L34.4 6.6 L40 7.3 L35.9 11.1 L37 16.6 L32 13.9 L27 16.6 L28.1 11.1 L24 7.3 L29.6 6.6 Z"
				fill="var(--festive-gold-deep)"
				stroke="var(--festive-gold-deep)"
				strokeWidth={1.5}
				strokeLinejoin="round"
			/>
		</FestiveSvg>
	);
}
