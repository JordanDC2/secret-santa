import { useEffect, useRef, useState } from "react";
import { useElementSize } from "@mantine/hooks";
import { readPalette } from "Components/ElfFling/draw";
import { drawPinball, VIEW } from "Components/Pinball/drawPinball";
import {
	hold,
	newPinball,
	nudge,
	step,
	STEP,
	waitingToLaunch,
	type IControl,
	type IFlipperSide,
	type INudge,
	type IPinballState,
} from "Components/Pinball/pinball";
import { playPinballEvents, startPinballMusic } from "Components/Pinball/pinballSound";
import classes from "Components/Pinball/Pinball.module.less";

/**
 * How far the table's drawn turned (degrees, clockwise): a quarter either way on a phone held
 * sideways, so its top is the phone's top.
 */
export type IPinballTurn = 0 | 90 | -90;

type IPinballGameProps = {
	/** Called once, when the last ball drains, with the final score. */
	onGameOver: (score: number) => void;
	soundOn: boolean;
	balls?: number;
	turn?: IPinballTurn;
};

/**
 * A press on the table's left half works the left flipper, on its right half the right one
 * (turned, the halves are the screen's bottom and top); while a ball waits on the plunger, any
 * press pulls it back.
 */
function controlFor(event: React.PointerEvent<HTMLCanvasElement>, state: IPinballState, turn: IPinballTurn): IControl {
	const box = event.currentTarget.getBoundingClientRect();

	if (waitingToLaunch(state)) {
		return "launch";
	}

	if (turn === 0) {
		return event.clientX - box.left < box.width / 2 ? "left" : "right";
	}

	const upperHalf = event.clientY - box.top < box.height / 2;

	return upperHalf === (turn === -90) ? "right" : "left";
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
};
/** Nudging the table, with Space Cadet's keys: X bumps it from the left, the full stop from the right, up from below. */
const NUDGE_KEYS: Record<string, INudge> = { KeyX: "left", Period: "right", ArrowUp: "up" };
/** The plunger's keys. Space is the plunger while a ball waits on it, and both flippers otherwise. */
const LAUNCH_KEYS = new Set(["Space", "ArrowDown", "Enter", "KeyS"]);

/**
 * A game of Christmas pinball, filling its container (the table keeps its shape and is centred).
 * Plunger: hold Space (or the down arrow) and let go. Flippers: the left and right arrows (or Z
 * and M), Space for both. Nudge: X, full stop, up arrow. On a touch screen, press and let go to
 * launch, then press the left or right half to flip. Only the end of the game reaches React.
 */
export default function PinballGame({ onGameOver, soundOn, balls = 3, turn = 0 }: IPinballGameProps) {
	const { ref: frameRef, width, height } = useElementSize();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const stateRef = useRef<IPinballState>(newPinball(balls));
	const soundRef = useRef(soundOn);
	const onGameOverRef = useRef(onGameOver);
	// Which pointers (fingers or the mouse) hold which control, and what each key pressed.
	const pointersRef = useRef(new Map<number, IControl>());
	const keysRef = useRef(new Map<string, IControl[]>());

	useEffect(() => {
		soundRef.current = soundOn;
		onGameOverRef.current = onGameOver;
	});

	// The music plays while the sound is on and the game isn't over.
	const [over, setOver] = useState(false);

	useEffect(() => (soundOn && !over ? startPinballMusic() : undefined), [soundOn, over]);

	const setHeld = (control: IControl, down: boolean) => {
		stateRef.current = hold(stateRef.current, control, down);
	};

	useEffect(() => {
		function onKey(event: KeyboardEvent, down: boolean) {
			const launchKey = LAUNCH_KEYS.has(event.code);
			const nudgeKey = NUDGE_KEYS[event.code];

			if (
				(!KEYS[event.code] && !launchKey && !nudgeKey) ||
				(event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
			) {
				return;
			}

			event.preventDefault();

			if (event.repeat) {
				return;
			}

			if (nudgeKey) {
				if (down) {
					stateRef.current = nudge(stateRef.current, nudgeKey);
				}

				return;
			}

			// A key lets go of whatever it pressed, even if the plunger's been fired since.
			let controls: IControl[] = KEYS[event.code] ?? [];

			if (!down) {
				controls = keysRef.current.get(event.code) ?? controls;
				keysRef.current.delete(event.code);
			} else if (launchKey) {
				const flipBoth = event.code === "Space" && !waitingToLaunch(stateRef.current);
				controls = flipBoth ? ["left", "right"] : ["launch"];
			}

			if (down) {
				keysRef.current.set(event.code, controls);
			}

			controls.forEach((control) => {
				stateRef.current = hold(stateRef.current, control, down);
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
		// Turned a quarter, the table's across is the screen's down.
		const across = turn === 0 ? VIEW.width : VIEW.height;
		const down = turn === 0 ? VIEW.height : VIEW.width;
		const scale = Math.min(width / across, height / down);
		const ratio = window.devicePixelRatio || 1;
		canvas.width = Math.round(across * scale * ratio);
		canvas.height = Math.round(down * scale * ratio);
		canvas.style.width = `${across * scale}px`;
		canvas.style.height = `${down * scale}px`;
		const size = ratio * scale;
		// The view's x and y to the canvas's: as is, or turned with its top to the left (-90) or right (90).
		const transform: [number, number, number, number, number, number] =
			turn === 0
				? [size, 0, 0, size, 0, 0]
				: turn === -90
					? [0, -size, size, 0, 0, VIEW.width * size]
					: [0, size, -size, 0, VIEW.height * size, 0];

		let frame = 0;
		let last = performance.now();
		let carry = 0;
		let ended = false;

		const render = (now: number) => {
			carry += Math.min(MAX_FRAME_TIME, (now - last) / 1000);
			last = now;
			let state = stateRef.current;

			while (carry >= STEP) {
				state = step(state);
				carry -= STEP;
			}

			if (soundRef.current) {
				playPinballEvents(state.events);
			}

			stateRef.current = { ...state, events: [] };

			context.setTransform(...transform);
			drawPinball(context, palette, state);

			if (state.over && !ended) {
				ended = true;
				setOver(true);
				onGameOverRef.current(state.score);
			}

			frame = requestAnimationFrame(render);
		};

		frame = requestAnimationFrame(render);

		return () => cancelAnimationFrame(frame);
	}, [width, height, turn]);

	const release = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const control = pointersRef.current.get(event.pointerId);

		if (control) {
			pointersRef.current.delete(event.pointerId);

			// Still held by another finger?
			if (![...pointersRef.current.values()].includes(control)) {
				setHeld(control, false);
			}
		}
	};

	return (
		<div ref={frameRef} className={classes.frame}>
			<canvas
				ref={canvasRef}
				className={classes.canvas}
				aria-label="Pinball: press and let go to launch, then press the left or right half to flip"
				onPointerDown={(event) => {
					event.preventDefault();
					const control = controlFor(event, stateRef.current, turn);
					pointersRef.current.set(event.pointerId, control);
					setHeld(control, true);
				}}
				onPointerUp={release}
				onPointerCancel={release}
				onPointerLeave={release}
				onContextMenu={(event) => event.preventDefault()}
			/>
		</div>
	);
}
