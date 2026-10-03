import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** A "To:" tag: who you are buying for. */
export default function GiftTagIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props} viewBox="-3 -1 72 72">
			<path
				d="M30 15 C24 8 14 8 9 13"
				fill="none"
				stroke="var(--festive-red)"
				strokeWidth={2.5}
				strokeLinecap="round"
			/>
			<g transform="rotate(-18 34 36)">
				<path
					d="M22 20 L34 9 L46 20 V56 a3 3 0 0 1 -3 3 H25 a3 3 0 0 1 -3 -3 Z"
					fill="var(--festive-gold)"
					stroke="var(--festive-gold-deep)"
					strokeWidth={2}
					strokeLinejoin="round"
				/>
				<circle cx={34} cy={18} r={3} fill="var(--festive-white)" stroke="var(--festive-gold-deep)" strokeWidth={2} />
				<path d="M27 32 H41 M27 40 H37" stroke="var(--festive-maroon)" strokeWidth={3} strokeLinecap="round" />
				<path
					d="M34 51.5 c-3.5 -2.3 -5.2 -4 -5.2 -6 a2.6 2.6 0 0 1 5.2 -0.7 a2.6 2.6 0 0 1 5.2 0.7 c0 2 -1.7 3.7 -5.2 6 Z"
					fill="var(--festive-red-bright)"
				/>
			</g>
		</FestiveSvg>
	);
}
