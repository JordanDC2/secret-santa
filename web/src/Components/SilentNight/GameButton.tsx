import type { ReactNode } from "react";
import classes from "Components/SilentNight/SilentNight.module.less";

type IGameButtonProps = {
	children: ReactNode;
	onClick: () => void;
	/** "main" for the thing to do (crimson and gold), "plain" for the rest, "quiet" for backing out. */
	variant?: "main" | "plain" | "quiet";
	small?: boolean;
	disabled?: boolean;
	/** An icon before the words. */
	icon?: ReactNode;
};

const LOOKS = { main: classes.gameMain, plain: classes.gamePlain, quiet: classes.gameQuiet };

/**
 * A button in the game's own look rather than the app's: framed in bronze like its dialogue
 * boxes, lettered in its serif, glowing gold when it's pointed at.
 */
export default function GameButton({
	children,
	onClick,
	variant = "main",
	small = false,
	disabled = false,
	icon,
}: IGameButtonProps) {
	return (
		<button
			type="button"
			className={[classes.gameButton, LOOKS[variant], small ? classes.gameButtonSmall : ""].join(" ")}
			disabled={disabled}
			onClick={onClick}
		>
			{icon}
			{children}
		</button>
	);
}
