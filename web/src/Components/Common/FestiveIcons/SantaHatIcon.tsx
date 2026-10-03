import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

// The brim runs from x 6 to 58: eight dots, 5 apart, centred on it.
const BRIM_DOTS = [14.5, 19.5, 24.5, 29.5, 34.5, 39.5, 44.5, 49.5];

/** The brand mark: app header, sign-in pages and favicon. */
export default function SantaHatIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<path
				d="M10 47 C10 30 19 14 34 10 C45 7 54 13 56 24 C51 20 46 22 44.5 27 C43.5 33 54.3 37 54.3 47 Z"
				fill="var(--festive-red)"
			/>
			<path
				d="M44.5 27 C43.5 33 54.3 37 54.3 47 H45 C42 39 41 32 44.5 27 Z"
				fill="var(--festive-maroon)"
				opacity={0.35}
			/>
			<path
				d="M19 22 C23 16 28 12.5 34 11.5"
				fill="none"
				stroke="var(--festive-white)"
				strokeWidth={2.5}
				strokeLinecap="round"
				opacity={0.35}
			/>
			<circle
				cx={55}
				cy={26}
				r={6.5}
				fill="var(--festive-white)"
				stroke="var(--festive-fur-shadow)"
				strokeWidth={1.5}
			/>
			<rect
				x={6}
				y={44}
				width={52}
				height={13}
				rx={6.5}
				fill="var(--festive-white)"
				stroke="var(--festive-fur-shadow)"
				strokeWidth={1.5}
			/>
			{BRIM_DOTS.map((x) => (
				<circle key={x} cx={x} cy={50.5} r={1.1} fill="var(--festive-fur-shadow)" />
			))}
		</FestiveSvg>
	);
}
