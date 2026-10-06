import FestiveSvg, { type IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

const ARM_ANGLES = [0, 60, 120, 180, 240, 300];

/** The falling snow, and the Settings icon (it reads a bit like a gear). Drawn in currentColor, so the surrounding CSS picks its color. */
export default function SnowflakeIcon(props: IFestiveIconProps) {
	return (
		<FestiveSvg {...props}>
			<g fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round">
				{ARM_ANGLES.map((angle) => (
					<path
						key={angle}
						d="M32 32 V6 M32 14 L25 8 M32 14 L39 8 M32 23 L26 18 M32 23 L38 18"
						transform={`rotate(${angle} 32 32)`}
					/>
				))}
			</g>
		</FestiveSvg>
	);
}
