import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import { useElementSize } from "@mantine/hooks";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import { drawWorld } from "Components/SilentNight/drawWorld";
import { makeSprites } from "Components/SilentNight/sprites";
import {
	MAGAZINE,
	MAX_HEALTH,
	NIGHT_SECONDS,
	newWorld,
	reloading,
	step,
	VIEW_HEIGHT,
	type IInput,
	type IWorld,
} from "Components/SilentNight/world";
import classes from "Components/SilentNight/SilentNight.module.less";

/** The rules run in steps this long, however fast the screen refreshes, and never more than MAX_FRAME at once. */
const STEP = 1 / 120;
const MAX_FRAME = 0.1;
/** A thumbstick's reach on screen, in CSS pixels, and how far it has to go to count. */
const STICK_REACH = 52;
const STICK_DEADZONE = 0.2;

type IStick = { id: number; originX: number; originY: number; x: number; y: number } | null;

type IGameProps = {
	fullscreen: boolean;
	onToggleFullscreen: () => void;
};

function clock(seconds: number): string {
	const whole = Math.floor(seconds);

	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** A stick's push as a vector of length up to 1. */
function stickVector(stick: IStick): { x: number; y: number } {
	if (!stick) {
		return { x: 0, y: 0 };
	}

	const dx = (stick.x - stick.originX) / STICK_REACH;
	const dy = (stick.y - stick.originY) / STICK_REACH;
	const length = Math.hypot(dx, dy);

	return length > 1 ? { x: dx / length, y: dy / length } : { x: dx, y: dy };
}

/**
 * Silent Night itself: the night drawn on a canvas at the game's own resolution and scaled up
 * crisply, run in fixed steps, with the counters over it. Keyboard and mouse (WASD to move, the
 * mouse to aim, hold the button to fire, Space to dash, R to reload) or, on a touch screen, a
 * thumbstick on each half of the screen (left to move, right to aim and fire) and a dash button.
 */
export default function SilentNightGame({ fullscreen, onToggleFullscreen }: IGameProps) {
	const { ref: frameRef, width, height } = useElementSize();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const touchScreen = useTouchScreen();
	const sprites = useMemo(() => makeSprites(), []);
	const worldRef = useRef<IWorld>(newWorld());
	// Which night this is (0 before the first): each one starts the loop afresh.
	const [night, setNight] = useState(0);
	const started = night > 0;
	const [over, setOver] = useState<{ time: number; kills: number } | null>(null);
	// Input, read by the loop.
	const keysRef = useRef(new Set<string>());
	const mouseRef = useRef<{ x: number; y: number; down: boolean } | null>(null);
	const moveStickRef = useRef<IStick>(null);
	const aimStickRef = useRef<IStick>(null);
	const dashRef = useRef(false);
	const reloadRef = useRef(false);
	// The counters, updated straight from the loop.
	const healthRef = useRef<HTMLDivElement>(null);
	const timeRef = useRef<HTMLSpanElement>(null);
	const killsRef = useRef<HTMLSpanElement>(null);
	const ammoRef = useRef<HTMLSpanElement>(null);
	const moveStickView = useRef<HTMLDivElement>(null);
	const aimStickView = useRef<HTMLDivElement>(null);

	// The view in the game's pixels: always VIEW_HEIGHT tall, as wide as the screen's shape allows.
	const view = useMemo(
		() => ({ width: height > 0 ? Math.round((VIEW_HEIGHT * width) / height) : 0, height: VIEW_HEIGHT }),
		[width, height],
	);

	// Keys: moving, dashing, reloading.
	useEffect(() => {
		const GAME_KEYS = new Set([
			"KeyW",
			"KeyA",
			"KeyS",
			"KeyD",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"Space",
			"KeyR",
		]);
		const down = (event: KeyboardEvent) => {
			const typing = (event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]");

			if (typing || !GAME_KEYS.has(event.code)) {
				return;
			}

			event.preventDefault();
			keysRef.current.add(event.code);

			if (event.code === "Space" && !event.repeat) {
				dashRef.current = true;
			}

			if (event.code === "KeyR") {
				reloadRef.current = true;
			}
		};
		const up = (event: KeyboardEvent) => keysRef.current.delete(event.code);
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);

		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
		};
	}, []);

	// The loop: run the rules in fixed steps, draw, update the counters.
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas || view.width === 0 || night === 0) {
			return;
		}

		canvas.width = view.width;
		canvas.height = view.height;
		const context = canvas.getContext("2d")!;
		const darknessCanvas = document.createElement("canvas");
		darknessCanvas.width = view.width;
		darknessCanvas.height = view.height;
		const darkness = darknessCanvas.getContext("2d")!;
		let frame = 0;
		let last = performance.now();
		let carry = 0;
		let shown = { health: -1, time: -1, kills: -1, ammo: "" };

		const input = (): IInput => {
			const keys = keysRef.current;
			const key = (...codes: string[]) => codes.some((code) => keys.has(code));
			let move = {
				x: (key("KeyD", "ArrowRight") ? 1 : 0) - (key("KeyA", "ArrowLeft") ? 1 : 0),
				y: (key("KeyS", "ArrowDown") ? 1 : 0) - (key("KeyW", "ArrowUp") ? 1 : 0),
			};
			let aim: { x: number; y: number } | null = null;
			let firing = false;

			if (moveStickRef.current) {
				move = stickVector(moveStickRef.current);
			}

			if (aimStickRef.current) {
				const push = stickVector(aimStickRef.current);
				const length = Math.hypot(push.x, push.y);

				if (length > STICK_DEADZONE) {
					aim = { x: push.x / length, y: push.y / length };
					firing = true;
				}
			} else if (mouseRef.current) {
				// The mouse, from the elf's middle (it's always in the middle of the view).
				const dx = mouseRef.current.x - view.width / 2;
				const dy = mouseRef.current.y - (view.height / 2 - 8);
				const length = Math.hypot(dx, dy) || 1;
				aim = { x: dx / length, y: dy / length };
				firing = mouseRef.current.down;
			}

			const result: IInput = { move, aim, firing, dash: dashRef.current, reload: reloadRef.current };
			dashRef.current = false;
			reloadRef.current = false;

			return result;
		};

		const render = (now: number) => {
			const world = worldRef.current;
			carry += Math.min(MAX_FRAME, (now - last) / 1000);
			last = now;

			while (carry >= STEP) {
				step(world, input(), STEP, view);
				carry -= STEP;
			}

			drawWorld(context, darkness, world, sprites, view);

			// The counters, only touched when they change.
			const health = Math.ceil(world.player.health);
			const time = Math.floor(world.time);
			const ammo = reloading(world) ? "Reloading" : `${world.player.ammo} / ${MAGAZINE}`;

			if (health !== shown.health && healthRef.current) {
				healthRef.current.style.width = `${(health / MAX_HEALTH) * 100}%`;
			}

			if (time !== shown.time && timeRef.current) {
				timeRef.current.textContent = clock(time);
			}

			if (world.kills !== shown.kills && killsRef.current) {
				killsRef.current.textContent = world.kills.toLocaleString();
			}

			if (ammo !== shown.ammo && ammoRef.current) {
				ammoRef.current.textContent = ammo;
			}

			shown = { health, time, kills: world.kills, ammo };

			if (world.over) {
				setOver({ time: world.time, kills: world.kills });

				return;
			}

			frame = requestAnimationFrame(render);
		};

		frame = requestAnimationFrame(render);

		return () => cancelAnimationFrame(frame);
	}, [view, sprites, night]);

	const start = () => {
		worldRef.current = newWorld();
		setOver(null);
		setNight((current) => current + 1);
	};

	// The mouse, in the game's pixels.
	const toView = (event: React.PointerEvent) => {
		const box = event.currentTarget.getBoundingClientRect();

		return {
			x: ((event.clientX - box.left) / box.width) * view.width,
			y: ((event.clientY - box.top) / box.height) * view.height,
		};
	};

	// A thumbstick's look follows the thumb: its base where it landed, its knob where it is.
	const showStick = (element: HTMLDivElement | null, stick: IStick) => {
		if (!element) {
			return;
		}

		if (!stick) {
			element.style.display = "none";

			return;
		}

		const push = stickVector(stick);
		element.style.display = "block";
		element.style.left = `${stick.originX}px`;
		element.style.top = `${stick.originY}px`;
		element.style.setProperty("--knob-x", `${push.x * STICK_REACH}px`);
		element.style.setProperty("--knob-y", `${push.y * STICK_REACH}px`);
	};

	const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "mouse") {
			mouseRef.current = { ...toView(event), down: event.button === 0 };

			return;
		}

		event.preventDefault();
		const box = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - box.left;
		const y = event.clientY - box.top;
		const stick = { id: event.pointerId, originX: x, originY: y, x, y };

		if (x < box.width / 2) {
			moveStickRef.current = stick;
			showStick(moveStickView.current, stick);
		} else {
			aimStickRef.current = stick;
			showStick(aimStickView.current, stick);
		}

		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "mouse") {
			mouseRef.current = { ...toView(event), down: mouseRef.current?.down ?? false };

			return;
		}

		const box = event.currentTarget.getBoundingClientRect();

		for (const [ref, element] of [
			[moveStickRef, moveStickView.current],
			[aimStickRef, aimStickView.current],
		] as const) {
			if (ref.current?.id === event.pointerId) {
				ref.current = { ...ref.current, x: event.clientX - box.left, y: event.clientY - box.top };
				showStick(element, ref.current);
			}
		}
	};

	const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "mouse") {
			if (mouseRef.current) {
				mouseRef.current = { ...mouseRef.current, down: false };
			}

			return;
		}

		for (const [ref, element] of [
			[moveStickRef, moveStickView.current],
			[aimStickRef, aimStickView.current],
		] as const) {
			if (ref.current?.id === event.pointerId) {
				ref.current = null;
				showStick(element, null);
			}
		}
	};

	return (
		<div ref={frameRef} className={classes.frame}>
			<div
				className={classes.surface}
				onPointerDown={pointerDown}
				onPointerMove={pointerMove}
				onPointerUp={pointerUp}
				onPointerCancel={pointerUp}
				onContextMenu={(event) => event.preventDefault()}
			>
				<canvas
					ref={canvasRef}
					className={classes.canvas}
					role="img"
					aria-label="Silent Night: an elf with a candy cane gun in a ring of light, in the dark, with gingerbread men coming"
				/>
				<div ref={moveStickView} className={classes.stick} />
				<div ref={aimStickView} className={classes.stick} data-aim />
			</div>

			{started && (
				<>
					<div className={classes.health} aria-label="Health">
						<div ref={healthRef} className={classes.healthFill} />
					</div>
					<div className={classes.clock}>
						<span ref={timeRef}>0:00</span>
						<span className={classes.clockOf}> / {clock(NIGHT_SECONDS)}</span>
					</div>
					<div className={classes.kills}>
						<span ref={killsRef}>0</span> broken
					</div>
					<div className={classes.ammo}>
						<span ref={ammoRef} />
					</div>
				</>
			)}

			{started && touchScreen && !over && (
				<button
					type="button"
					className={classes.dash}
					onPointerDown={(event) => {
						event.stopPropagation();
						dashRef.current = true;
					}}
				>
					Dash
				</button>
			)}

			<Tooltip label={fullscreen ? "Leave full screen (Esc)" : "Play full screen"} withArrow disabled={touchScreen}>
				<ActionIcon
					variant="transparent"
					radius="xl"
					size={touchScreen ? 44 : 36}
					className={classes.fullscreenButton}
					aria-label={fullscreen ? "Leave full screen" : "Play full screen"}
					onClick={(event) => {
						onToggleFullscreen();
						event.currentTarget.blur();
					}}
				>
					<FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
				</ActionIcon>
			</Tooltip>

			{(!started || over) && (
				<div className={classes.overlay}>
					{over ? (
						<>
							<p className={classes.title}>The night took you</p>
							<p>
								You lasted {clock(over.time)} and broke {over.kills.toLocaleString()}{" "}
								{over.kills === 1 ? "gingerbread man" : "gingerbread men"}.
							</p>
						</>
					) : (
						<>
							<p className={classes.title}>Silent Night</p>
							<p>Hold out until dawn.</p>
						</>
					)}
					<Button onClick={start}>{over ? "Try again" : "Start the night"}</Button>
				</div>
			)}
		</div>
	);
}
