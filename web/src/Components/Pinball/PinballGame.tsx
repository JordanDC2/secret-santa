import { useEffect, useRef } from "react";
import { useElementSize } from "@mantine/hooks";
import { readPalette } from "Components/ElfFling/draw";
import { playFanfare, playPop, playThud } from "Components/ElfFling/sound";
import { drawPinball } from "Components/Pinball/drawPinball";
import { hold, newPinball, step, STEP, TABLE, type IFlipperSide, type IPinballState } from "Components/Pinball/pinball";
import classes from "Components/Pinball/Pinball.module.less";

type IPinballGameProps = {
	/** Called once, when the last ball drains, with the final score. */
	onGameOver: (score: number) => void;
	soundOn: boolean;
	balls?: number;
};

/** A press on the left half works the left flipper, on the right half the right one. */
function sideFor(event: React.PointerEvent<HTMLCanvasElement>): IFlipperSide {
	const box = event.currentTarget.getBoundingClientRect();

	return event.clientX - box.left < box.width / 2 ? "left" : "right";
}

/** Never run more than this much at once, e.g. after the tab was in the background. */
const MAX_FRAME_TIME = 0.1;

const KEYS: Record<string, IFlipperSide[]> = {
	ArrowLeft: ["left"],
	KeyZ: ["left"],
	KeyA: ["left"],
	ArrowRight: ["right"],
	KeyM: ["right"],
	KeyL: ["right"],
	Slash: ["right"],
	Space: ["left", "right"],
};

/**
 * A game of Christmas pinball, filling its container (the table keeps its shape and is centred).
 * Flippers: the left and right arrows (or Z and M), Space for both; on a touch screen, press
 * the left or right half. Only the end of the game reaches React.
 */
export default function PinballGame({ onGameOver, soundOn, balls = 3 }: IPinballGameProps) {
	const { ref: frameRef, width, height } = useElementSize();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const stateRef = useRef<IPinballState>(newPinball(balls));
	const soundRef = useRef(soundOn);
	const onGameOverRef = useRef(onGameOver);
	// Which pointers (fingers or the mouse) hold which flipper.
	const pointersRef = useRef(new Map<number, IFlipperSide>());

	useEffect(() => {
		soundRef.current = soundOn;
		onGameOverRef.current = onGameOver;
	});

	const setHeld = (side: IFlipperSide, down: boolean) => {
		stateRef.current = hold(stateRef.current, side, down);
	};

	useEffect(() => {
		function onKey(event: KeyboardEvent, down: boolean) {
			const sides = KEYS[event.code];

			if (!sides || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))) {
				return;
			}

			event.preventDefault();
			sides.forEach((side) => {
				stateRef.current = hold(stateRef.current, side, down);
			});
		}

		const keyDown = (event: KeyboardEvent) => onKey(event, true);
		const keyUp = (event: KeyboardEvent) => onKey(event, false);
		window.addEventListener("keydown", keyDown);
		window.addEventListener("keyup", keyUp);

		return () => {
			window.removeEventListener("keydown", keyDown);
			window.removeEventListener("keyup", keyUp);
		};
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas || width === 0 || height === 0) {
			return;
		}

		const context = canvas.getContext("2d")!;
		const palette = readPalette(canvas);
		const scale = Math.min(width / TABLE.width, height / TABLE.height);
		const ratio = window.devicePixelRatio || 1;
		canvas.width = Math.round(TABLE.width * scale * ratio);
		canvas.height = Math.round(TABLE.height * scale * ratio);
		canvas.style.width = `${TABLE.width * scale}px`;
		canvas.style.height = `${TABLE.height * scale}px`;

		let frame = 0;
		let last = performance.now();
		let carry = 0;
		let ended = false;

		const render = (now: number) => {
			carry += Math.min(MAX_FRAME_TIME, (now - last) / 1000);
			last = now;
			const before = stateRef.current;
			let state = before;

			while (carry >= STEP) {
				state = step(state);
				carry -= STEP;
			}

			stateRef.current = state;

			if (soundRef.current) {
				if (state.hits > before.hits) {
					playPop();
				}

				if (state.drains > before.drains) {
					playThud();
				}

				if (state.extraBalls > before.extraBalls) {
					playFanfare();
				}
			}

			context.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
			drawPinball(context, palette, state);

			if (state.over && !ended) {
				ended = true;
				onGameOverRef.current(state.score);
			}

			frame = requestAnimationFrame(render);
		};

		frame = requestAnimationFrame(render);

		return () => cancelAnimationFrame(frame);
	}, [width, height]);

	const release = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const side = pointersRef.current.get(event.pointerId);

		if (side) {
			pointersRef.current.delete(event.pointerId);

			// Still held by another finger on the same side?
			if (![...pointersRef.current.values()].includes(side)) {
				setHeld(side, false);
			}
		}
	};

	return (
		<div ref={frameRef} className={classes.frame}>
			<canvas
				ref={canvasRef}
				className={classes.canvas}
				aria-label="Pinball: press the left or right half to flip"
				onPointerDown={(event) => {
					event.preventDefault();
					const side = sideFor(event);
					pointersRef.current.set(event.pointerId, side);
					setHeld(side, true);
				}}
				onPointerUp={release}
				onPointerCancel={release}
				onPointerLeave={release}
				onContextMenu={(event) => event.preventDefault()}
			/>
		</div>
	);
}
