import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useElementSize, useMediaQuery, useViewportSize } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress, faExpand, faStore, faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import RocketIcon from "Components/Common/FestiveIcons/RocketIcon";
import { drawFrame, nextCamera, readPalette, type ICamera, type IPalette } from "Components/ElfFling/draw";
import {
	canJump,
	canRocket,
	FIXED_STEP,
	fireRocket,
	newGame,
	step,
	tap,
	type IGameState,
	type IPhase,
} from "Components/ElfFling/physics";
import type { IBatterId, ISkinId } from "Components/ElfFling/skins";
import type { IUpgrades } from "Components/ElfFling/upgrades";
import { releaseFocus } from "Components/ElfFling/releaseFocus";
import { playFanfare, playStateChanges } from "Components/ElfFling/sound";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import classes from "Components/ElfFling/ElfFling.module.less";

/** The page gives each round a new React key, so a fresh game starts on top of the presents. */
type IElfFlingGameProps = {
	/** The upgrades in play this round, coin and gem levels together (read when the round starts). */
	upgrades: IUpgrades;
	/** Who's being flung, and who's swinging; changing either shows at once, even mid-throw. */
	skin: ISkinId;
	batter: IBatterId;
	best: number | null;
	onPhaseChange: (phase: IPhase) => void;
	onFinish: (state: IGameState) => void;
	/** Whether a tap would jump now, and how many jumps are left (so the page can offer them). */
	onJumpsChange: (jumps: { available: boolean; left: number }) => void;
	/** A tap after the elf has stopped: the page starts the next round. */
	onRestart: () => void;
	/** What to tell the player over the game in full screen, where the page's text is hidden. */
	overlay: string;
	/** Full screen belongs to the page (it outlasts each round's game); this just shows it. */
	fullscreen: boolean;
	onToggleFullscreen: () => void;
	/** Sound belongs to the page too (it outlasts rounds); this plays it and shows the switch. */
	soundOn: boolean;
	onToggleSound: () => void;
	/** The coin balance, shown with this throw's pickings; and whether this throw is banked yet. */
	coins: number;
	/** The gem balance, shown once the player has prestiged (null before). */
	gems: number | null;
	throwBanked: boolean;
	/** The shop opens over the game (even in full screen). */
	onOpenShop: () => void;
	/** While the shop or the wrap-up is open over the game, taps and keys are theirs. */
	inputBlocked: boolean;
};

/** Never simulate more than this much at once, e.g. after the tab was in the background. */
const MAX_FRAME_TIME = 0.1;

/**
 * The game's canvas: runs the physics in fixed steps on every animation frame and draws the
 * result. One input does almost everything: tap or click the canvas, or press Space or Enter.
 * The rocket (an upgrade) has its own button over the canvas (and the R key on a keyboard),
 * and another button toggles full screen (the page owns it: see useFullscreen.ts).
 * Only phase changes reach React, so the page doesn't re-render sixty times a second.
 */
export default function ElfFlingGame({
	upgrades,
	skin,
	batter,
	best,
	onPhaseChange,
	onFinish,
	onJumpsChange,
	onRestart,
	overlay,
	fullscreen,
	onToggleFullscreen,
	soundOn,
	onToggleSound,
	coins,
	gems,
	throwBanked,
	onOpenShop,
	inputBlocked,
}: IElfFlingGameProps) {
	const { ref: frameRef, width, height: frameHeight } = useElementSize();
	const { height: viewportHeight } = useViewportSize();
	const portrait = useMediaQuery("(orientation: portrait)");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// Built once per round (the page gives each round a new key), not on every render.
	const [firstState] = useState(() => newGame(upgrades));
	const stateRef = useRef<IGameState>(firstState);
	const cameraRef = useRef<ICamera | null>(null);
	const paletteRef = useRef<IPalette | null>(null);
	const bestRef = useRef(best);
	const soundRef = useRef(soundOn);
	const balanceRef = useRef({ coins, gems, banked: throwBanked });
	const inputBlockedRef = useRef(inputBlocked);
	// The best as this round began: beating it is a new best (the page's copy updates once it's saved).
	const [bestBefore] = useState(best);
	// When this round's new-best celebration started (page clock, seconds), if it's had one.
	const celebrationRef = useRef<number | null>(null);
	const skinRef = useRef(skin);
	const batterRef = useRef(batter);
	const callbacksRef = useRef({ onPhaseChange, onFinish, onJumpsChange, onRestart });
	// The rocket button shows only while the rocket can fire.
	const [rocketAvailable, setRocketAvailable] = useState(false);

	// The animation loop and input handlers read the latest props through these.
	useLayoutEffect(() => {
		bestRef.current = best;
		soundRef.current = soundOn;
		balanceRef.current = { coins, gems, banked: throwBanked };
		inputBlockedRef.current = inputBlocked;
		skinRef.current = skin;
		batterRef.current = batter;
		callbacksRef.current = { onPhaseChange, onFinish, onJumpsChange, onRestart };
	});

	// Full screen: all of it. Otherwise taller in proportion on phones, so there's room to see
	// the flight on a narrow screen.
	// It never needs scrolling to see, e.g. on a phone held sideways (where full screen is better).
	const height = fullscreen
		? Math.round(frameHeight)
		: Math.round(
				Math.min(
					440,
					viewportHeight > 0 ? viewportHeight * 0.85 : 440,
					Math.max(280, width * (width < 576 ? 0.85 : 0.6)),
				),
			);
	const touchScreen = useTouchScreen();

	const setState = useCallback(
		(next: IGameState) => {
			const previous = stateRef.current;
			stateRef.current = next;

			if (soundRef.current) {
				playStateChanges(previous, next);
			}

			const jumpAvailable = canJump(next);

			if (jumpAvailable !== canJump(previous) || next.jumpsLeft !== previous.jumpsLeft) {
				callbacksRef.current.onJumpsChange({ available: jumpAvailable, left: next.jumpsLeft });
			}

			if (canRocket(next) !== canRocket(previous)) {
				setRocketAvailable(canRocket(next));
			}

			if (next.phase !== previous.phase) {
				callbacksRef.current.onPhaseChange(next.phase);

				if (next.phase === "done") {
					callbacksRef.current.onFinish(next);

					if ((next.distance ?? 0) > (bestBefore ?? 0)) {
						celebrationRef.current = performance.now() / 1000;

						if (soundRef.current) {
							playFanfare();
						}
					}
				}
			}
		},
		[bestBefore],
	);

	const handleInput = useCallback(() => {
		// Something's open over the game: taps and keys belong to it.
		if (inputBlockedRef.current) {
			return;
		}

		if (stateRef.current.phase === "done") {
			callbacksRef.current.onRestart();
		} else {
			setState(tap(stateRef.current));
		}
	}, [setState]);

	const launchRocket = useCallback(() => {
		if (!inputBlockedRef.current) {
			setState(fireRocket(stateRef.current));
		}
	}, [setState]);

	// Space or Enter (and R for the rocket) anywhere on the page, unless someone's typing in a field.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			const typing = target?.closest("input, textarea, select, button, a, [contenteditable]");

			if (typing || event.repeat) {
				return;
			}

			if (event.key === " " || event.key === "Enter") {
				event.preventDefault();
				handleInput();
			} else if (event.key === "r" || event.key === "R") {
				launchRocket();
			}
		}

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleInput, launchRocket]);

	// The animation loop.
	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");

		if (!canvas || !context || width === 0 || height === 0) {
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
			drawFrame(
				context!,
				state,
				cameraRef.current,
				paletteRef.current!,
				{ width, height },
				bestRef.current,
				skinRef.current,
				batterRef.current,
				now / 1000,
				celebrationRef.current === null ? null : now / 1000 - celebrationRef.current,
				// Once this throw is banked the balance already includes its coins (and any bonus).
				{
					coins: balanceRef.current.banked ? balanceRef.current.coins - state.coinsCollected : balanceRef.current.coins,
					gems: balanceRef.current.gems,
				},
			);
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
				// A long press shouldn't open the phone's copy or save-image menu mid-throw.
				onContextMenu={(event) => event.preventDefault()}
				aria-label="Elf Fling: a reindeer with a candy cane bat stands by a stack of presents, with a little elf on top."
				onPointerDown={(event) => {
					event.preventDefault();
					handleInput();
				}}
			/>
			{rocketAvailable && (
				<Tooltip label="Fire the rocket (R)" withArrow disabled={touchScreen}>
					{/* A round, see-through button like a mobile game's: just the rocket, a little faded. */}
					<ActionIcon
						variant="transparent"
						radius="xl"
						size={touchScreen ? 68 : 56}
						className={classes.rocketButton}
						aria-label="Fire the rocket"
						onPointerDown={(event) => {
							// Fires on press, like the canvas, and keeps the tap from also reaching the game.
							event.preventDefault();
							event.stopPropagation();
							launchRocket();
						}}
						onClick={(event) => {
							launchRocket();
							releaseFocus(event);
						}}
					>
						<RocketIcon size="78%" />
					</ActionIcon>
				</Tooltip>
			)}
			{fullscreen && (overlay || (touchScreen && portrait)) && (
				// The page's prompts are hidden behind the game, so they show over it instead.
				<div className={classes.overlay} aria-live="polite">
					{overlay}
					{touchScreen && portrait && (
						<div className={classes.overlayHint}>Turn your phone sideways for a wider view.</div>
					)}
				</div>
			)}
			{/* Full screen, sound and shop, side by side in the bottom-left corner. */}
			<div className={classes.cornerButtons}>
				<Tooltip label={fullscreen ? "Leave full screen (Esc)" : "Play full screen"} withArrow disabled={touchScreen}>
					<ActionIcon
						variant="transparent"
						radius="xl"
						size={touchScreen ? 48 : 40}
						className={classes.cornerButton}
						aria-label={fullscreen ? "Leave full screen" : "Play full screen"}
						onClick={(event) => {
							onToggleFullscreen();
							releaseFocus(event);
						}}
					>
						<FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
					</ActionIcon>
				</Tooltip>
				<Tooltip label={soundOn ? "Turn sound off" : "Turn sound on"} withArrow disabled={touchScreen}>
					<ActionIcon
						variant="transparent"
						radius="xl"
						size={touchScreen ? 48 : 40}
						className={classes.cornerButton}
						aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
						aria-pressed={soundOn}
						onClick={(event) => {
							onToggleSound();
							releaseFocus(event);
						}}
					>
						<FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />
					</ActionIcon>
				</Tooltip>
				<Tooltip label="Shop" withArrow disabled={touchScreen}>
					<ActionIcon
						variant="transparent"
						radius="xl"
						size={touchScreen ? 48 : 40}
						className={classes.cornerButton}
						aria-label="Open the shop"
						onClick={(event) => {
							onOpenShop();
							releaseFocus(event);
						}}
					>
						<FontAwesomeIcon icon={faStore} />
					</ActionIcon>
				</Tooltip>
			</div>
		</div>
	);
}
