import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

/** A door wreath, i.e. "come on in": "Join a group". */
export default function WreathIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<circle cx={32} cy={30} r={19} fill="none" stroke="var(--festive-green)" strokeWidth={12} />
			<circle
				cx={32}
				cy={30}
				r={19}
				fill="none"
				stroke="var(--festive-green-dark)"
				strokeWidth={12}
				strokeDasharray="5 7"
				opacity={0.45}
			/>
			<circle cx={32} cy={11} r={2.6} fill="var(--festive-red-bright)" />
			<circle cx={15} cy={22} r={2.6} fill="var(--festive-red-bright)" />
			<circle cx={49} cy={22} r={2.6} fill="var(--festive-red-bright)" />
			<circle cx={15} cy={39} r={2.6} fill="var(--festive-gold-deep)" />
			<circle cx={49} cy={39} r={2.6} fill="var(--festive-gold-deep)" />
			<path d="M32 50 L22 44 C19 43 18 50 21 52 Z M32 50 L42 44 C45 43 46 50 43 52 Z" fill="var(--festive-red)" />
			<path d="M30 51 L24 61 L28 60 L30 63 Z M34 51 L40 61 L36 60 L34 63 Z" fill="var(--festive-red)" />
			<circle cx={32} cy={50} r={3.5} fill="var(--festive-red-bright)" />
		</FestiveSvg>
	);
}
