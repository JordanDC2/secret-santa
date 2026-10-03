import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** Your own stocking: the account page and its header link. */
export default function StockingIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<path
				d="M27 6 C25 1 33 1 32 6"
				fill="none"
				stroke="var(--festive-gold-deep)"
				strokeWidth={2.5}
				strokeLinecap="round"
			/>
			<path
				d="M22 18 H44 V37 C44 44 41 50 35 54 C29 58 19 59 14 55 C9 51 11 44 17 42 C21 40.5 22 38 22 35 Z"
				fill="var(--festive-red)"
			/>
			<path
				d="M14 55 C9 51 11 44 17 42 C19 46 19.5 51 17.5 56.5 C16 56.4 15 55.8 14 55 Z"
				fill="var(--festive-white)"
				stroke="var(--festive-fur-shadow)"
				strokeWidth={1.5}
			/>
			<path
				d="M44 38 C44 44 42 48.5 38.5 51.5 C35.5 48 35.5 42 38.5 38 Z"
				fill="var(--festive-white)"
				stroke="var(--festive-fur-shadow)"
				strokeWidth={1.5}
			/>
			<path
				d="M29 28 L30.4 31 L33.6 31.4 L31.2 33.6 L31.9 36.8 L29 35.2 L26.1 36.8 L26.8 33.6 L24.4 31.4 L27.6 31 Z"
				fill="var(--festive-gold)"
			/>
			<rect
				x={18}
				y={7}
				width={30}
				height={13}
				rx={4}
				fill="var(--festive-white)"
				stroke="var(--festive-fur-shadow)"
				strokeWidth={1.5}
			/>
		</FestiveSvg>
	);
}
