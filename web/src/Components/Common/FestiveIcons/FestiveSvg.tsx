import type { ReactNode } from "react";
import classes from "Components/Common/FestiveIcons/FestiveSvg.module.less";

export type IFestiveIconProps = {
	/** Width and height (px or any CSS length). Defaults to the surrounding text size. */
	size?: number | string;
	className?: string;
};

type IFestiveSvgProps = IFestiveIconProps & {
	viewBox?: string;
	children: ReactNode;
};

/**
 * The shared frame for the app's festive illustrations: drawn on a 64-unit grid in the
 * --festive-* colors. Decorative, so hidden from screen readers like the emoji they replaced.
 */
export default function FestiveSvg({ size = "1em", className, viewBox = "0 0 64 64", children }: IFestiveSvgProps) {
	return (
		<svg
			viewBox={viewBox}
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			className={className ? `${classes.icon} ${className}` : classes.icon}
		>
			{children}
		</svg>
	);
}
