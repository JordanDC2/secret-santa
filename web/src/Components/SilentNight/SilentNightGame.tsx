import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress, faExpand, faPause, faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { useElementSize } from "@mantine/hooks";
import { readSoundOn, saveSoundOn, wakeAudio } from "Components/ElfFling/sound";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import GameButton from "Components/SilentNight/GameButton";
import { experienceFor } from "Components/SilentNight/constants";
import { drawWorld } from "Components/SilentNight/drawWorld";
import { ENEMIES } from "Components/SilentNight/enemies";
import { GEAR_SLOTS, RARITY_COLOURS } from "Components/SilentNight/gear";
import { iconUrl } from "Components/SilentNight/icons";
import Carried from "Components/SilentNight/Carried";
import GearSlots from "Components/SilentNight/GearSlots";
import Menu from "Components/SilentNight/Menu";
import NightOver, { clock } from "Components/SilentNight/NightOver";
import Prompt from "Components/SilentNight/Prompt";
import {
	addEvents,
	enableSounds,
	playNightBegins,
	playNightEvents,
	playPause,
	setVolumes,
	startNightMusic,
} from "Components/SilentNight/sound";
import { readSettings, saveSettings, type ISettings } from "Components/SilentNight/settings";
import SettingsMenu from "Components/SilentNight/SettingsMenu";
import { makeSprites } from "Components/SilentNight/sprites";
import { PASSIVES } from "Components/SilentNight/stats";
import {
	noEvents,
	type ICastId,
	type IGunId,
	type IInput,
	type IPrompt,
	type IWorld,
} from "Components/SilentNight/types";
import { drawAmmo } from "Components/SilentNight/ammo";
import { gunNumbers, gunOf, isGun } from "Components/SilentNight/guns";
import { weaponInfo } from "Components/SilentNight/weapons";
import type { IProgress, IPurchase, IRun } from "Components/SilentNight/hooks";
import { NIGHT_SECONDS, newWorld, step, VIEW_HEIGHT } from "Components/SilentNight/world";
import classes from "Components/SilentNight/SilentNight.module.less";

/** The rules run in steps this long, however fast the screen refreshes, and never more than MAX_FRAME at once. */
const STEP = 1 / 120;
const MAX_FRAME = 0.1;
/** How far auto-aim and auto-shoot look for an enemy (the game's pixels): about as far as the guns reach. */
const AUTO_REACH = 150;
/** How long the curtain takes to rise on a night (ms): it holds, then lifts off the top (SilentNight.module.less). */
const ENTERING_MS = 2400;
/** A thumbstick's reach on screen, in CSS pixels, and how far it has to go to count. */
const STICK_REACH = 52;
const STICK_DEADZONE = 0.2;

type IStick = { id: number; originX: number; originY: number; x: number; y: number } | null;

type IGameProps = {
	fullscreen: boolean;
	onToggleFullscreen: () => void;
	/** What's kept between nights, and buying and choosing in the menu (Menu.tsx). */
	progress: IProgress;
	busy: boolean;
	error: string | null;
	onBuy: (purchase: IPurchase) => void;
	onChoose: (character: ICastId) => void;
	/** A night's over, won or lost (or given up). */
	onNightOver: (run: IRun) => void;
	/** The coal the last night earned, once it's saved. */
	coalEarned: number | null;
};

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

// A thumbstick's look follows the thumb: its base where it landed, its knob where it is.
function showStick(element: HTMLDivElement | null, stick: IStick) {
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
}

type IBuild = ReturnType<typeof buildOf>;

/** What the elf carries, as the counters show it: each weapon and passive, at its level. */
function buildOf(world: IWorld) {
	return {
		weapons: world.player.weapons.map((weapon) => ({ id: weapon.id, level: weapon.level, evolved: weapon.evolved })),
		passives: PASSIVES.filter((passive) => world.player.passives[passive.id]).map((passive) => ({
			id: passive.id,
			level: world.player.passives[passive.id]!,
		})),
		gear: GEAR_SLOTS.flatMap((slot) => world.player.gear[slot] ?? []),
	};
}

const buildKey = (world: IWorld) =>
	world.player.weapons.map((weapon) => `${weapon.id}${weapon.level}${weapon.evolved}`).join() +
	JSON.stringify(world.player.passives) +
	Object.values(world.player.gear)
		.map((piece) => piece.name)
		.join();

/**
 * Silent Night itself: the night drawn on a canvas at the game's own resolution and scaled up
 * crisply, run in fixed steps, with the counters over it and whatever the night's waiting on the
 * player for (Prompt.tsx). Keyboard and mouse (WASD to move, the mouse to aim, hold the button to
 * fire, Space to dash, R to reload, Esc to pause) or, on a touch screen, a thumbstick on each half
 * of the screen (left to move, right to aim and fire) and a dash button.
 */
export default function SilentNightGame({
	fullscreen,
	onToggleFullscreen,
	progress,
	busy,
	error,
	onBuy,
	onChoose,
	onNightOver,
	coalEarned,
}: IGameProps) {
	const { ref: frameRef, width, height } = useElementSize();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const touchScreen = useTouchScreen();
	const sprites = useMemo(() => makeSprites(), []);
	const castImages = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(sprites.cast).map(([id, frames]) => [id, frames.right[1].toDataURL()]),
			) as Record<ICastId, string>,
		[sprites],
	);
	// The night being played (null before the first), and the same for the loop and handlers.
	const [world, setWorld] = useState<IWorld | null>(null);
	const worldRef = useRef<IWorld | null>(null);
	const started = world !== null;
	const [over, setOver] = useState(false);
	const [prompt, setPrompt] = useState<IPrompt | null>(null);
	const [paused, setPaused] = useState(false);
	const pausedRef = useRef(false);
	// The settings (settings.ts), and the same for the loop.
	const [settings, setSettings] = useState(readSettings);
	const settingsRef = useRef(settings);
	const changeSettings = (next: ISettings) => {
		settingsRef.current = next;
		setSettings(next);
		saveSettings(next);
		setVolumes(next.music, next.effects);
	};
	const [showSettings, setShowSettings] = useState(false);
	// The curtain rising as a night begins.
	const [entering, setEntering] = useState(false);
	const enteringRef = useRef(false);
	const [build, setBuild] = useState<IBuild>({ weapons: [], passives: [], gear: [] });
	const [soundOn, setSoundOn] = useState(readSoundOn);
	// The latest callback, for the loop.
	const onNightOverRef = useRef(onNightOver);

	useEffect(() => {
		onNightOverRef.current = onNightOver;
	}, [onNightOver]);
	const soundOnRef = useRef(soundOn);
	// Input, read by the loop.
	const keysRef = useRef(new Set<string>());
	const mouseRef = useRef<{ x: number; y: number; down: boolean } | null>(null);
	const moveStickRef = useRef<IStick>(null);
	const aimStickRef = useRef<IStick>(null);
	const dashRef = useRef(false);
	// The fire button held (on a touch screen, with auto-aim but not auto-shoot).
	const fireRef = useRef(false);
	const reloadRef = useRef(false);
	// The counters, updated straight from the loop.
	const healthRef = useRef<HTMLDivElement>(null);
	const experienceRef = useRef<HTMLDivElement>(null);
	const levelRef = useRef<HTMLSpanElement>(null);
	const timeRef = useRef<HTMLSpanElement>(null);
	const killsRef = useRef<HTMLSpanElement>(null);
	const ammoRef = useRef<HTMLCanvasElement>(null);
	const bossRef = useRef<HTMLDivElement>(null);
	const bossNameRef = useRef<HTMLSpanElement>(null);
	const bossHealthRef = useRef<HTMLDivElement>(null);
	const moveStickView = useRef<HTMLDivElement>(null);
	const aimStickView = useRef<HTMLDivElement>(null);

	// The view in the game's pixels: always VIEW_HEIGHT tall, as wide as the screen's shape allows.
	const view = useMemo(
		() => ({ width: height > 0 ? Math.round((VIEW_HEIGHT * width) / height) : 0, height: VIEW_HEIGHT }),
		[width, height],
	);

	// Keys: moving, dashing, reloading, pausing.
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

			const current = worldRef.current;

			if (typing || !current) {
				return;
			}

			if (
				(event.code === "Escape" || event.code === "KeyP") &&
				!current.over &&
				current.prompt === null &&
				!enteringRef.current
			) {
				event.preventDefault();
				pausedRef.current = !pausedRef.current;
				setPaused(pausedRef.current);
				playPause(pausedRef.current);

				return;
			}

			if (!GAME_KEYS.has(event.code)) {
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
		// Looking away pauses the night.
		const hidden = () => {
			const current = worldRef.current;

			if (document.hidden && current && !current.over && current.prompt === null) {
				pausedRef.current = true;
				setPaused(true);
			}
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		document.addEventListener("visibilitychange", hidden);

		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			document.removeEventListener("visibilitychange", hidden);
		};
	}, []);

	// The loop: run the rules in fixed steps, draw, update the counters.
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas || view.width === 0 || !world) {
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
		let shown = {
			health: -1,
			experience: -1,
			level: -1,
			time: -1,
			kills: -1,
			ammo: "",
			boss: -1,
			build: "",
			prompt: null as IPrompt | null,
		};

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

			// Aiming and shooting for the player, if they've asked (settings.ts), at the nearest enemy in
			// the gun's reach. Auto-aim always aims there (nothing overrides it), or where the elf's heading
			// with none near, and leaves the firing to the mouse button or, on a touch screen, the fire
			// button; auto-shoot fires whenever there's an enemy in reach.
			const { autoAim, autoShoot } = settingsRef.current;

			if (autoAim || autoShoot) {
				const { player } = world;
				let nearest: { x: number; y: number } | null = null;
				let best = AUTO_REACH;

				for (const enemy of world.enemies) {
					const dx = enemy.x - player.x;
					const dy = enemy.y - enemy.radius * 0.8 - (player.y - 8);
					const distance = Math.hypot(dx, dy);

					if (distance < best) {
						best = distance;
						nearest = { x: dx / distance, y: dy / distance };
					}
				}

				if (autoAim) {
					aim = nearest ?? player.heading;
					firing = fireRef.current || (mouseRef.current?.down ?? false);
				}

				if (autoShoot) {
					firing = nearest !== null && aim !== null;
				}
			}

			const result: IInput = { move, aim, firing, dash: dashRef.current, reload: reloadRef.current };
			dashRef.current = false;
			reloadRef.current = false;

			return result;
		};

		const render = (now: number) => {
			carry += Math.min(MAX_FRAME, (now - last) / 1000);
			last = now;

			if (pausedRef.current || world.prompt !== null || enteringRef.current) {
				carry = 0;
			}

			const heard = noEvents();

			while (carry >= STEP) {
				addEvents(heard, step(world, input(), STEP, view));
				carry -= STEP;

				if (world.prompt !== null) {
					carry = 0;
				}
			}

			drawWorld(context, darkness, world, sprites, view);

			if (soundOnRef.current) {
				playNightEvents(heard);
			}

			// The counters, only touched when they change.
			const { player } = world;
			const health = Math.ceil(player.health);
			const experience = Math.floor((player.experience / experienceFor(player.level)) * 200);
			const time = Math.floor(world.time);
			// The gun's rounds: those loaded, or as many as the reload's got back so far.
			const gun = player.weapons.find((weapon) => isGun(weapon.id))!;
			const gunStats = gunNumbers(gun);
			const reloading =
				gun.reloadUntil === null ? 1 : 1 - (gun.reloadUntil - world.time) / (gunStats.reload * world.numbers.reload);
			const loaded = gun.reloadUntil === null ? gun.ammo : Math.floor(Math.max(0, reloading) * gunStats.magazine);
			const ammo = gunStats.endless ? "" : `${gun.id}:${loaded}/${gunStats.magazine}`;
			const boss = world.enemies.find((enemy) => enemy.boss);
			const bossHealth = boss ? Math.ceil((boss.health / boss.maxHealth) * 200) : -1;
			const key = buildKey(world);

			if (health !== shown.health && healthRef.current) {
				healthRef.current.style.width = `${Math.min(100, (health / world.numbers.maxHealth) * 100)}%`;
			}

			if (experience !== shown.experience && experienceRef.current) {
				experienceRef.current.style.width = `${experience / 2}%`;
			}

			if (player.level !== shown.level && levelRef.current) {
				levelRef.current.textContent = `Level ${player.level}`;
			}

			if (time !== shown.time && timeRef.current) {
				// Counting down to dawn.
				timeRef.current.textContent = world.dawn ? "Dawn" : clock(Math.max(0, NIGHT_SECONDS - time));
			}

			if (world.kills !== shown.kills && killsRef.current) {
				killsRef.current.textContent = world.kills.toLocaleString();
			}

			if (ammo !== shown.ammo && ammoRef.current) {
				ammoRef.current.style.display = ammo ? "block" : "none";

				if (ammo) {
					drawAmmo(ammoRef.current, gun.id as IGunId, loaded, gunStats.magazine);
				}
			}

			if (bossHealth !== shown.boss && bossRef.current && bossHealthRef.current && bossNameRef.current) {
				bossRef.current.style.display = boss ? "block" : "none";
				bossNameRef.current.textContent = boss ? ENEMIES[boss.kind].name : "";
				bossHealthRef.current.style.width = `${Math.max(0, bossHealth) / 2}%`;
			}

			if (key !== shown.build) {
				setBuild(buildOf(world));
			}

			if (world.prompt !== shown.prompt) {
				setPrompt(world.prompt);
			}

			shown = {
				health,
				experience,
				level: player.level,
				time,
				kills: world.kills,
				ammo,
				boss: bossHealth,
				build: key,
				prompt: world.prompt,
			};

			if (world.over) {
				setOver(true);
				onNightOverRef.current({
					seconds: Math.min(NIGHT_SECONDS, Math.floor(world.time)),
					kills: world.kills,
					level: player.level,
					bargains: player.bargains.length,
					won: world.won,
					bosses: world.bosses,
				});

				return;
			}

			frame = requestAnimationFrame(render);
		};

		frame = requestAnimationFrame(render);

		return () => cancelAnimationFrame(frame);
	}, [view, sprites, world]);

	// Leaving full screen in the middle of a night (the browser's own Escape, where the game can't
	// have it) pauses it.
	useEffect(() => {
		const current = worldRef.current;

		if (!fullscreen && current && !current.over && current.prompt === null) {
			pausedRef.current = true;
			setPaused(true);
		}
	}, [fullscreen]);

	const pause = (on: boolean) => {
		if (pausedRef.current !== on) {
			playPause(on);
		}

		pausedRef.current = on;
		setPaused(on);
	};

	const start = (character: ICastId, gun: IGunId) => {
		const fresh = newWorld(character, progress.cellar, progress.patrons, gun);
		worldRef.current = fresh;
		keysRef.current.clear();
		setOver(false);
		setPrompt(null);
		pause(false);
		setBuild(buildOf(fresh));
		setWorld(fresh);
		// The curtain rises on the night (the night waiting until it's gone), to its own few bars.
		enteringRef.current = true;
		setEntering(true);
		playNightBegins();
		window.setTimeout(() => {
			enteringRef.current = false;
			setEntering(false);
		}, ENTERING_MS);
	};

	// The mouse, in the game's pixels.
	const toView = (event: React.PointerEvent) => {
		const box = event.currentTarget.getBoundingClientRect();

		return {
			x: ((event.clientX - box.left) / box.width) * view.width,
			y: ((event.clientY - box.top) / box.height) * view.height,
		};
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
		} else if (!settingsRef.current.autoAim) {
			// (With auto-aim, there's no aiming by hand: the fire button fires.)
			aimStickRef.current = stick;
			showStick(aimStickView.current, stick);
		} else {
			return;
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

	const playing = started && !over;
	const waiting = playing && (prompt !== null || paused);
	const musicOn = playing && soundOn && !entering;
	const menuMusicOn = !started && soundOn;

	// The music, while the night's going on: its soft version while the night waits on a choice or a pause.
	useEffect(() => {
		if (!musicOn) {
			return;
		}

		return startNightMusic(() => ({
			time: worldRef.current?.time ?? 0,
			boss: worldRef.current?.enemies.some((enemy) => enemy.boss) ?? false,
			soft: pausedRef.current || worldRef.current?.prompt != null,
		}));
	}, [musicOn]);

	// In the menu: the song's gentle start, the music box and then the strings, over and over.
	useEffect(() => {
		if (!menuMusicOn) {
			return;
		}

		// Browsers hold sound back until the page is touched: wake it at the first touch or key.
		const wake = () => wakeAudio();
		window.addEventListener("pointerdown", wake, { once: true });
		window.addEventListener("keydown", wake, { once: true });
		const stop = startNightMusic(() => ({ time: 0, boss: false, soft: false }), true);

		return () => {
			window.removeEventListener("pointerdown", wake);
			window.removeEventListener("keydown", wake);
			stop();
		};
	}, [menuMusicOn]);

	const backToMenu = () => {
		worldRef.current = null;
		setOver(false);
		setPrompt(null);
		setWorld(null);
	};

	const toggleSound = () => {
		if (!soundOn) {
			wakeAudio();
		}

		saveSoundOn(!soundOn);
		enableSounds(!soundOn);
		soundOnRef.current = !soundOn;
		setSoundOn(!soundOn);
	};

	// Sticks (and the fire button) let go when something comes up over the game, so the elf doesn't run on.
	useEffect(() => {
		if (waiting) {
			moveStickRef.current = null;
			aimStickRef.current = null;
			fireRef.current = false;
			showStick(moveStickView.current, null);
			showStick(aimStickView.current, null);

			if (mouseRef.current) {
				mouseRef.current.down = false;
			}
		}
	}, [waiting]);

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
					aria-label="Silent Night: an elf in a ring of candlelight in the dark, with Krampus's horde coming"
				/>
				<div ref={moveStickView} className={classes.stick} />
				<div ref={aimStickView} className={classes.stick} data-aim />
			</div>

			{started && (
				<>
					<div className={classes.status}>
						<div className={classes.health} aria-label="Health">
							<div ref={healthRef} className={classes.healthFill} />
						</div>
						<div className={classes.experience} aria-label="Experience">
							<div ref={experienceRef} className={classes.experienceFill} />
						</div>
						<span ref={levelRef} className={classes.level}>
							Level 1
						</span>
						<div className={classes.carried}>
							{build.weapons.map((weapon) => (
								<span
									key={weapon.id}
									className={classes.slot}
									title={weapon.evolved ? weaponInfo(weapon.id).evolution.name : weaponInfo(weapon.id).name}
								>
									<img
										src={iconUrl(weapon.id)}
										alt=""
										className={weapon.evolved ? `${classes.icon} ${classes.evolved}` : classes.icon}
									/>
									<span className={classes.slotLevel}>{weapon.evolved ? "★" : weapon.level}</span>
								</span>
							))}
						</div>
						<div className={classes.carried}>
							{build.passives.map((passive) => (
								<span key={passive.id} className={classes.slot}>
									<img src={iconUrl(passive.id)} alt="" className={classes.icon} />
									<span className={classes.slotLevel}>{passive.level}</span>
								</span>
							))}
						</div>
						<div className={classes.carried}>
							{build.gear.map((piece) => (
								<span
									key={piece.slot}
									className={classes.slot}
									style={{ borderColor: RARITY_COLOURS[piece.rarity] }}
									title={piece.name}
								>
									<img src={iconUrl(piece.slot)} alt="" className={classes.icon} />
								</span>
							))}
						</div>
					</div>
					<div className={classes.clock}>
						<span ref={timeRef}>{clock(NIGHT_SECONDS)}</span>
					</div>
					<div ref={bossRef} className={classes.boss}>
						<span ref={bossNameRef} className={classes.bossName} />
						<div className={classes.bossHealth}>
							<div ref={bossHealthRef} className={classes.bossHealthFill} />
						</div>
					</div>
					<div className={classes.kills}>
						<span ref={killsRef}>0</span> slain
					</div>
					<canvas ref={ammoRef} className={classes.ammo} aria-hidden />
				</>
			)}

			{playing && touchScreen && !waiting && (
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

			{playing && touchScreen && !waiting && settings.autoAim && !settings.autoShoot && (
				<button
					type="button"
					className={classes.fire}
					onPointerDown={(event) => {
						event.stopPropagation();
						event.currentTarget.setPointerCapture(event.pointerId);
						fireRef.current = true;
					}}
					onPointerUp={() => {
						fireRef.current = false;
					}}
					onPointerCancel={() => {
						fireRef.current = false;
					}}
				>
					Fire
				</button>
			)}

			{playing && !waiting && !entering && (
				<Tooltip label="Pause (Esc)" withArrow disabled={touchScreen}>
					<ActionIcon
						variant="transparent"
						radius="xl"
						size={touchScreen ? 44 : 36}
						className={classes.pauseButton}
						aria-label="Pause"
						onClick={(event) => {
							pause(true);
							event.currentTarget.blur();
						}}
					>
						<FontAwesomeIcon icon={faPause} />
					</ActionIcon>
				</Tooltip>
			)}

			<Tooltip label={soundOn ? "Sound off" : "Sound on"} withArrow disabled={touchScreen}>
				<ActionIcon
					variant="transparent"
					radius="xl"
					size={touchScreen ? 44 : 36}
					className={classes.soundButton}
					aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
					onClick={(event) => {
						toggleSound();
						event.currentTarget.blur();
					}}
				>
					<FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />
				</ActionIcon>
			</Tooltip>

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

			{playing && prompt && <Prompt world={world} prompt={prompt} onChange={() => setPrompt(world.prompt)} />}

			{playing && paused && !prompt && (
				<div className={classes.overlay}>
					<p className={classes.title}>Paused</p>
					<Carried player={world.player} />
					<GearSlots gear={world.player.gear} />
					<div className={classes.promptButtons}>
						<GameButton onClick={() => pause(false)}>Carry on</GameButton>
						<GameButton variant="plain" onClick={() => setShowSettings(true)}>
							Settings
						</GameButton>
						<GameButton
							variant="quiet"
							onClick={() => {
								worldRef.current!.over = true;
								pause(false);
							}}
						>
							Give up the night
						</GameButton>
					</div>
				</div>
			)}

			{over && world && (
				<NightOver
					world={world}
					coalEarned={coalEarned}
					onAgain={() => start(world.player.character, gunOf(world.player))}
					onMenu={backToMenu}
				/>
			)}

			{entering && (
				<div className={classes.curtain} aria-hidden>
					<p className={classes.title}>The longest night begins.</p>
				</div>
			)}

			{!started && (
				<Menu
					progress={progress}
					castImages={castImages}
					busy={busy}
					error={error}
					onStart={start}
					onChoose={onChoose}
					onBuy={onBuy}
					onSettings={() => setShowSettings(true)}
				/>
			)}

			{showSettings && (
				<SettingsMenu settings={settings} onChange={changeSettings} onClose={() => setShowSettings(false)} />
			)}
		</div>
	);
}
