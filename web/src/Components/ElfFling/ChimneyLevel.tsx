import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useMediaQuery } from "@mantine/hooks";
import classes from "Components/ElfFling/ElfFling.module.less";
import PinballGame, { turnFor } from "Components/Pinball/PinballGame";
import { VIEW } from "Components/Pinball/view";

type IChimneyLevelProps = {
	/** Where the chimney's mouth is on screen (page pixels): the table comes out of it, and goes back in. */
	origin: { x: number; y: number };
	leaving: boolean;
	touchScreen: boolean;
	soundOn: boolean;
	onGameOver: (points: number) => void;
};

/**
 * Down the chimney: the pinball takes over the game, full screen if the game was. The table
 * comes out of the chimney's mouth as the view pulls back, showing it whole and tilted away;
 * on a phone held sideways it turns a quarter, to fill the screen; then the view moves in until
 * it fills the game. When the game's over, it goes back into the chimney.
 */
export default function ChimneyLevel({ origin, leaving, touchScreen, soundOn, onGameOver }: IChimneyLevelProps) {
	const portrait = useMediaQuery("(orientation: portrait)");
	const turn = turnFor(touchScreen && portrait === false);
	const levelRef = useRef<HTMLDivElement>(null);
	const tableRef = useRef<HTMLDivElement>(null);

	// Set before it's first painted: the table starts at the chimney, this far from where it sits;
	// and pulled back, it's half size, or on a phone held sideways (where it's drawn turned to
	// fill the screen), shown upright at 60% of the screen's height.
	useLayoutEffect(() => {
		const table = tableRef.current!;
		const box = table.getBoundingClientRect();
		const level = levelRef.current!;
		level.style.setProperty("--from-x", `${origin.x - (box.left + box.width / 2)}px`);
		level.style.setProperty("--from-y", `${origin.y - (box.top + box.height / 2)}px`);
		// Turned, the table's drawn as tall as the space, its length across it (or as long as fits).
		const length = Math.min(table.offsetWidth, (table.offsetHeight * VIEW.height) / VIEW.width);
		level.style.setProperty("--pulled-back", `${turn === 0 ? 0.5 : (0.6 * table.offsetHeight) / length}`);
	}, [origin, turn]);

	return (
		<div
			ref={levelRef}
			className={classes.chimneyLevel}
			data-leaving={leaving || undefined}
			style={{ "--turn-from": `${-turn}deg` } as CSSProperties}
			role="dialog"
			aria-modal="true"
			aria-label="Down the chimney: pinball, with one ball"
		>
			<div ref={tableRef} className={classes.chimneyTable}>
				<PinballGame soundOn={soundOn} balls={1} extraBalls={false} turn={turn} onGameOver={onGameOver} />
			</div>
		</div>
	);
}
