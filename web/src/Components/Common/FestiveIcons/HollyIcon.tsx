import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** A holly sprig for starting something new: "Create a group". */
export default function HollyIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<path
				d="M31 36 C27 26 18 20 6 22 C9 25 8 28 5 30 C9 30 11 33 9 36 C13 35 16 38 15 42 C18 39 22 40 24 43 C25 39 28 37 31 36 Z"
				fill="var(--festive-green)"
			/>
			<path
				d="M31 36 C24 31 16 27 8 26"
				fill="none"
				stroke="var(--festive-green-dark)"
				strokeWidth={1.8}
				strokeLinecap="round"
			/>
			<path
				d="M33 36 C37 26 46 20 58 22 C55 25 56 28 59 30 C55 30 53 33 55 36 C51 35 48 38 49 42 C46 39 42 40 40 43 C39 39 36 37 33 36 Z"
				fill="var(--festive-green)"
			/>
			<path
				d="M33 36 C40 31 48 27 56 26"
				fill="none"
				stroke="var(--festive-green-dark)"
				strokeWidth={1.8}
				strokeLinecap="round"
			/>
			<circle cx={26} cy={38} r={6} fill="var(--festive-red)" />
			<circle cx={38} cy={38} r={6} fill="var(--festive-red)" />
			<circle cx={32} cy={46} r={6} fill="var(--festive-red-bright)" />
			<circle cx={24} cy={36} r={1.8} fill="var(--festive-white)" opacity={0.7} />
			<circle cx={36} cy={36} r={1.8} fill="var(--festive-white)" opacity={0.7} />
			<circle cx={30} cy={44} r={1.8} fill="var(--festive-white)" opacity={0.7} />
		</FestiveSvg>
	);
}
