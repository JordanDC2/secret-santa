import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useElementSize } from "@mantine/hooks";
import { drawFrame, nextCamera, readPalette, type ICamera, type IPalette } from "Components/ElfFling/draw";
import { FIXED_STEP, newGame, step, tap, type IGameState, type IPhase } from "Components/ElfFling/physics";
import classes from "Components/ElfFling/ElfFling.module.less";

/** The page gives each round a new React key, so a fresh game starts on top of the presents. */
type IElfFlingGameProps = {
	best: number | null;
	onPhaseChange: (phase: IPhase) => void;
	onFinish: (state: IGameState) => void;
	/** A tap after the elf has stopped: the page starts the next round. */
	onRestart: () => void;
};

/** Never simulate more than this much at once, e.g. after the tab was in the background. */
const MAX_FRAME_TIME = 0.1;

/**
 * The game's canvas: runs the physics in fixed steps on every animation frame and draws the
 * result. One input does everything: tap or click the canvas, or press Space or Enter.
 * Only phase changes reach React, so the page doesn't re-render sixty times a second.
 */
export default function ElfFlingGame({ best, onPhaseChange, onFinish, onRestart }: IElfFlingGameProps) {
	const { ref: frameRef, width } = useElementSize();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const stateRef = useRef<IGameState>(newGame());
	const cameraRef = useRef<ICamera | null>(null);
	const paletteRef = useRef<IPalette | null>(null);
	const bestRef = useRef(best);
	const callbacksRef = useRef({ onPhaseChange, onFinish, onRestart });

	// The animation loop and input handlers read the latest props through these.
	useLayoutEffect(() => {
		bestRef.current = best;
		callbacksRef.current = { onPhaseChange, onFinish, onRestart };
	});

	const height = Math.round(Math.min(440, Math.max(260, width * 0.6)));

	const setState = useCallback((next: IGameState) => {
		const previous = stateRef.current;
		stateRef.current = next;

		if (next.phase !== previous.phase) {
			callbacksRef.current.onPhaseChange(next.phase);

			if (next.phase === "done") {
				callbacksRef.current.onFinish(next);
			}
		}
	}, []);

	const handleInput = useCallback(() => {
		if (stateRef.current.phase === "done") {
			callbacksRef.current.onRestart();
		} else {
			setState(tap(stateRef.current));
		}
	}, [setState]);

	// Space or Enter anywhere on the page, unless someone's typing in a field.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			const typing = target?.closest("input, textarea, select, button, a, [contenteditable]");

			if ((event.key === " " || event.key === "Enter") && !typing && !event.repeat) {
				event.preventDefault();
				handleInput();
			}
		}

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleInput]);

	// The animation loop.
	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");

		if (!canvas || !context || width === 0) {
			return;
		}

		const pixelRatio = window.devicePixelRatio || 1;
		canvas.width = Math.round(width * pixelRatio);
		canvas.height = Math.round(height * pixelRatio);
		paletteRef.current ??= readPalette(canvas);

		let frame = 0;
		let last = performance.now();
		let leftover = 0;

		function render(now: number) {
			leftover += Math.min(MAX_FRAME_TIME, (now - last) / 1000);
			last = now;

			let state = stateRef.current;
			while (leftover >= FIXED_STEP) {
				state = step(state, FIXED_STEP);
				leftover -= FIXED_STEP;
			}
			setState(state);

			cameraRef.current = nextCamera(cameraRef.current, state, width, height);
			context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			drawFrame(context!, state, cameraRef.current, paletteRef.current!, { width, height }, bestRef.current);
			frame = requestAnimationFrame(render);
		}

		frame = requestAnimationFrame(render);

		return () => cancelAnimationFrame(frame);
	}, [width, height, setState]);

	return (
		<div ref={frameRef} className={classes.frame}>
			<canvas
				ref={canvasRef}
				className={classes.canvas}
				style={{ height }}
				role="img"
				aria-label="Elf Fling: a reindeer with a candy cane bat stands by a stack of presents, with a little elf on top."
				onPointerDown={(event) => {
					event.preventDefault();
					handleInput();
				}}
			/>
		</div>
	);
}
