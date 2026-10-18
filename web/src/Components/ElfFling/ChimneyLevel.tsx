import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { useMediaQuery } from "@mantine/hooks";
import classes from "Components/ElfFling/ElfFling.module.less";
import PinballGame, { type IPinballTurn } from "Components/Pinball/PinballGame";

type IChimneyLevelProps = {
	/** Where the chimney's mouth is on screen (page pixels): the table grows out of it, and shrinks back in. */
	origin: { x: number; y: number };
	leaving: boolean;
	touchScreen: boolean;
	soundOn: boolean;
	onGameOver: (points: number) => void;
};

/** Which way a phone held sideways has its top: the table's drawn turned so its top is there too. */
function turnFor(landscapePhone: boolean): IPinballTurn {
	if (!landscapePhone) {
		return 0;
	}

	return screen.orientation?.type === "landscape-secondary" ? 90 : -90;
}

/**
 * Down the chimney: the pinball takes over the screen, its table pulling out of the chimney's
 * mouth (and shrinking back into it when the game's over).
 *
 * On a phone held sideways the table's drawn turned a quarter, to fill the screen, and it turns
 * into place as it pulls out; turned upright, the phone shows it the right way up. Where the
 * browser allows (Android), the first press also switches to full screen locked upright, so the
 * phone turns itself. Locking needs full screen, and full screen needs a press, which is why it
 * waits for one.
 */
export default function ChimneyLevel({ origin, leaving, touchScreen, soundOn, onGameOver }: IChimneyLevelProps) {
	const portrait = useMediaQuery("(orientation: portrait)");
	const turn = turnFor(touchScreen && portrait === false);
	const levelRef = useRef<HTMLDivElement>(null);
	const tableRef = useRef<HTMLDivElement>(null);
	// Whether this level locked the screen (and so has to unlock it and leave full screen).
	const lockedRef = useRef(false);

	// The table starts at the chimney: how far that is from where the table sits, set before it's first painted.
	useLayoutEffect(() => {
		const box = tableRef.current!.getBoundingClientRect();
		levelRef.current!.style.setProperty("--from-x", `${origin.x - (box.left + box.width / 2)}px`);
		levelRef.current!.style.setProperty("--from-y", `${origin.y - (box.top + box.height / 2)}px`);
	}, [origin]);

	useEffect(
		() => () => {
			if (lockedRef.current) {
				screen.orientation.unlock();

				if (document.fullscreenElement) {
					document.exitFullscreen().catch(() => {});
				}
			}
		},
		[],
	);

	const lockUpright = () => {
		if (turn === 0 || lockedRef.current || !document.documentElement.requestFullscreen) {
			return;
		}

		const orientation = screen.orientation as ScreenOrientation & {
			lock?: (orientation: "portrait") => Promise<void>;
		};
		document.documentElement
			.requestFullscreen()
			.then(() => orientation.lock?.("portrait"))
			.then(() => {
				lockedRef.current = true;
			})
			.catch(() => {
				// Not allowed here (an iPhone): the table stays turned until the phone is.
				if (document.fullscreenElement) {
					document.exitFullscreen().catch(() => {});
				}
			});
	};

	return (
		<div
			ref={levelRef}
			className={classes.chimneyLevel}
			data-leaving={leaving || undefined}
			style={{ "--turn-from": `${-turn}deg` } as CSSProperties}
			role="dialog"
			aria-modal="true"
			aria-label="Down the chimney: pinball"
			onPointerDownCapture={lockUpright}
		>
			<p className={classes.chimneyTitle}>Down the chimney!</p>
			<p className={classes.chimneyHint}>
				{turn !== 0
					? "Turn your phone upright for the best view. Press and let go to launch, then press the half by a flipper to flip."
					: touchScreen
						? "Press and let go to launch, then press the left or right half to flip."
						: "Hold Space and let go to launch. Flip with the left and right arrow keys, or Space for both."}
			</p>
			<div ref={tableRef} className={classes.chimneyTable}>
				<PinballGame soundOn={soundOn} turn={turn} onGameOver={onGameOver} />
			</div>
		</div>
	);
}
