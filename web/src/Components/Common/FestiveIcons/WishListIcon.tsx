import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** A wish list scroll: wishlist page titles and the header link. */
export default function WishListIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<rect
				x={14}
				y={9}
				width={36}
				height={46}
				fill="var(--festive-cream)"
				stroke="var(--festive-paper-line)"
				strokeWidth={2}
			/>
			<rect
				x={9}
				y={5}
				width={46}
				height={9}
				rx={4.5}
				fill="var(--festive-gold)"
				stroke="var(--festive-gold-deep)"
				strokeWidth={2}
			/>
			<rect
				x={9}
				y={50}
				width={46}
				height={9}
				rx={4.5}
				fill="var(--festive-gold)"
				stroke="var(--festive-gold-deep)"
				strokeWidth={2}
			/>
			<path
				d="M19.5 22.5 l2.5 2.5 l4.5 -5"
				fill="none"
				stroke="var(--festive-green)"
				strokeWidth={2.8}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M30 22.5 H44 M30 32 H44 M30 41.5 H40"
				stroke="var(--festive-paper-line)"
				strokeWidth={3}
				strokeLinecap="round"
			/>
			<path
				d="M23 35.5 c-3 -2 -4.5 -3.5 -4.5 -5.2 a2.3 2.3 0 0 1 4.5 -0.6 a2.3 2.3 0 0 1 4.5 0.6 c0 1.7 -1.5 3.2 -4.5 5.2 Z"
				fill="var(--festive-red-bright)"
			/>
			<circle cx={23} cy={41.5} r={2.6} fill="var(--festive-gold-deep)" />
		</FestiveSvg>
	);
}
