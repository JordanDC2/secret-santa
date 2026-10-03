import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** Stands in for a wishlist item that has no picture. */
export default function GiftBoxIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<g fill="none" stroke="var(--festive-gold-deep)" strokeWidth={4}>
				<ellipse cx={23.5} cy={13.5} rx={8} ry={5} transform="rotate(-25 23.5 13.5)" />
				<ellipse cx={40.5} cy={13.5} rx={8} ry={5} transform="rotate(25 40.5 13.5)" />
			</g>
			<rect x={11} y={30} width={42} height={28} rx={3.5} fill="var(--festive-red)" />
			<rect x={7} y={20} width={50} height={12} rx={3.5} fill="var(--festive-red-bright)" />
			<rect x={7} y={30} width={50} height={2.5} fill="var(--festive-maroon)" opacity={0.45} />
			<rect x={28} y={20} width={8} height={38} fill="var(--festive-gold-deep)" />
			<circle cx={32} cy={19} r={4} fill="var(--festive-gold-deep)" />
		</FestiveSvg>
	);
}
