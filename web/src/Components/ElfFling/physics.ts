/**
 * Elf Fling's rules, in metres and seconds with no drawing or React: a little elf hops off a
 * stack of presents, the reindeer swings a candy cane when the player taps, and how close the
 * elf is to the bat's sweet spot at that moment sets how hard and how high it flies. Then it
 * bounces and slides along the snow until it stops. On the way: coins to collect, and (with
 * shop upgrades, see upgrades.ts) crackers, sky ornaments and a sleigh that launch it on,
 * jumps and a rocket the player sets off, and the odd snowman that gets in the way. The course
 * never ends: it's laid out as the elf goes (course.ts). Distance is measured from the reindeer.
 */

import { COIN_LAYOUTS, collectCoins, type ICoin } from "Components/ElfFling/coins";
import { keepCourseAhead, seededRandom, startCourse, type ICourse } from "Components/ElfFling/course";
import { CRACKER_LAYOUT, crackerTouching, poppedVelocity, type ICracker } from "Components/ElfFling/crackers";
import { kickedVelocity, ORNAMENT_LAYOUT, ornamentHit, type IOrnament } from "Components/ElfFling/ornaments";
import {
	canBoard,
	maybeSleigh,
	moveSleigh,
	RELEASE_UP,
	RIDE_SECONDS,
	RIDE_SPEED,
	type ISleigh,
} from "Components/ElfFling/sleigh";
import { SNOWMAN_LAYOUT, snowmanHit, type ISnowman } from "Components/ElfFling/snowmen";
import {
	airDragShare,
	bounceKeep,
	magnetRadius,
	NO_THROW_UPGRADES,
	snowFriction,
	snowmanKeep,
	swingMultiplier,
	swingReach,
	type IThrowUpgrades,
} from "Components/ElfFling/upgrades";

export type IPhase = "ready" | "dropping" | "flying" | "sliding" | "done";

/** How the throw went: a clean or perfect hit, a swing that missed, or no swing at all. */
export type IOutcome = "perfect" | "hit" | "miss" | "late";

export type IElf = { x: number; y: number; vx: number; vy: number; spin: number };

export type IGameState = {
	phase: IPhase;
	elf: IElf;
	/** Seconds since the swing began, or null before the player swings. */
	swingTime: number | null;
	/** Whether the bat has already passed the elf (hit or missed). */
	swingResolved: boolean;
	outcome: IOutcome | null;
	/** Metres from the reindeer, once the elf has stopped. */
	distance: number | null;
	/** Seconds since the round began moving (for animations and timed effects). */
	time: number;
	/** The shop upgrades in play this round. */
	upgrades: IThrowUpgrades;
	/** How far the course is laid out, and how to lay more (course.ts). */
	course: ICourse;
	/** What's on the course near the elf: ahead of it, and not too far behind. */
	coins: ICoin[];
	/** What this round's coins are worth so far (before the lucky stocking). */
	coinsCollected: number;
	crackers: ICracker[];
	/** How many crackers the elf has popped this round. */
	pops: number;
	ornaments: IOrnament[];
	/** How many sky ornaments the elf has shattered this round. */
	smashes: number;
	snowmen: ISnowman[];
	/** How many snowmen the elf has run into this round. */
	bonks: number;
	sleigh: ISleigh | null;
	/** Jumps the elf still has this round. */
	jumpsLeft: number;
	/** Whether the rocket is still unused this round. */
	rocketReady: boolean;
	/** Game time the rocket burns out, while it's burning. */
	rocketUntil: number | null;
};

export const GRAVITY = 9.8;
/** Hopping off the presents, the elf floats down slower than it flies, so the swing is catchable. */
const DROP_GRAVITY = 4;
/** Where the reindeer stands, and so where distance is measured from. */
export const REINDEER_X = 0.2;
/** The stack of presents the elf hops off. */
export const STACK = { left: 1.9, right: 2.7, top: 4.5 };
/** The elf's size: its centre sits this far above whatever it's touching. */
export const ELF_RADIUS = 0.3;
/** Height of the candy cane's sweet spot. */
export const SWEET_SPOT_Y = 1.4;
/** The bat takes this long from the tap to where it meets the elf, and this long in all. */
export const SWING_CONTACT_TIME = 0.11;
export const SWING_DURATION = 0.3;

const HOP = { vx: -0.6, vy: 1.2 };
const MIN_SPEED = 11;
const MAX_SPEED = 34;
/** Launch angle at the sweet spot; hitting above it sends the elf higher, below it flatter. */
const BEST_ANGLE = 38;
const ANGLE_RANGE = 30;
const PERFECT_QUALITY = 0.92;
const AIR_DRAG = 0.003;
/** Landings harder than this bounce; softer ones turn into a slide. */
const BOUNCE_MIN_SPEED = 3;
/** A jump: at least this much upward speed. */
const JUMP_SPEED = 7;
/** The firework rocket: pushes forward (and a little up) this hard, for this long. */
export const ROCKET_SECONDS = 1.3;
const ROCKET_PUSH = { forward: 22, up: 9 };

/** Which things this round's course has: crackers and ornaments only once they're bought. */
function layoutsFor(upgrades: IThrowUpgrades) {
	return {
		coins: COIN_LAYOUTS,
		crackers: upgrades.crackers > 0 ? CRACKER_LAYOUT : null,
		ornaments: upgrades.skyOrnaments > 0 ? ORNAMENT_LAYOUT : null,
		snowmen: SNOWMAN_LAYOUT,
	};
}

/** A fresh round. The course is random; pass a seed to get the same one again (for tests). */
export function newGame(
	upgrades: IThrowUpgrades = NO_THROW_UPGRADES,
	seed: number = Math.floor(Math.random() * 2 ** 32),
): IGameState {
	const layouts = layoutsFor(upgrades);
	const state: IGameState = {
		phase: "ready",
		// Standing at the front edge of the top present.
		elf: { x: STACK.left + 0.1, y: STACK.top + ELF_RADIUS, vx: 0, vy: 0, spin: 0 },
		swingTime: null,
		swingResolved: false,
		outcome: null,
		distance: null,
		time: 0,
		upgrades,
		course: startCourse(layouts, seed),
		coins: [],
		coinsCollected: 0,
		crackers: [],
		pops: 0,
		ornaments: [],
		smashes: 0,
		snowmen: [],
		bonks: 0,
		sleigh: upgrades.sleigh > 0 ? maybeSleigh(seededRandom(seed)) : null,
		jumpsLeft: upgrades.elfJump,
		rocketReady: upgrades.rocket > 0,
		rocketUntil: null,
	};

	return keepCourseAhead(state, layouts, state.elf.x);
}

/** Whether the elf is out on the course: flying or sliding, not riding the sleigh. */
function isLoose(state: IGameState): boolean {
	return (state.phase === "flying" || state.phase === "sliding") && !isRiding(state);
}

function isRiding(state: IGameState): boolean {
	return state.sleigh !== null && state.sleigh.boardedAt !== null && !state.sleigh.finished;
}

/** Whether a tap now would make the elf jump. */
export function canJump(state: IGameState): boolean {
	return state.jumpsLeft > 0 && isLoose(state);
}

/** Whether the rocket button would fire now. */
export function canRocket(state: IGameState): boolean {
	return state.rocketReady && isLoose(state);
}

/** The one button: hop off the presents, then swing, then (with the upgrade) jump. */
export function tap(state: IGameState): IGameState {
	if (state.phase === "ready") {
		return { ...state, phase: "dropping", elf: { ...state.elf, vx: HOP.vx, vy: HOP.vy } };
	}

	if (state.phase === "dropping" && state.swingTime === null) {
		return { ...state, swingTime: 0 };
	}

	if (canJump(state)) {
		const vy = Math.max(state.elf.vy, 0) + JUMP_SPEED;

		return {
			...state,
			phase: "flying",
			jumpsLeft: state.jumpsLeft - 1,
			elf: { ...state.elf, y: Math.max(state.elf.y, ELF_RADIUS), vy },
		};
	}

	return state;
}

/** The rocket button: a burst of thrust for a moment. */
export function fireRocket(state: IGameState): IGameState {
	if (!canRocket(state)) {
		return state;
	}

	return {
		...state,
		phase: "flying",
		rocketReady: false,
		rocketUntil: state.time + ROCKET_SECONDS,
		elf: { ...state.elf, y: Math.max(state.elf.y, ELF_RADIUS) },
	};
}

/**
 * How the bat meets an elf at this height: null if it's out of reach, otherwise the launch
 * speed and angle (degrees) and how clean the hit was (1 is dead on the sweet spot).
 */
export function hitAt(elfY: number, reach: number): { speed: number; angle: number; quality: number } | null {
	const offset = (elfY - SWEET_SPOT_Y) / reach;

	if (Math.abs(offset) > 1) {
		return null;
	}

	const quality = 1 - Math.abs(offset);
	const angle = Math.min(70, Math.max(5, BEST_ANGLE + offset * ANGLE_RANGE));
	const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * quality ** 1.5;

	return { speed, angle, quality };
}

/** Moves the game on by dt seconds. Call with small steps (see FIXED_STEP). */
export function step(state: IGameState, dt: number): IGameState {
	if (state.phase === "ready" || state.phase === "done") {
		return state;
	}

	let next: IGameState = keepCourseAhead(
		{ ...state, elf: { ...state.elf }, time: state.time + dt },
		layoutsFor(state.upgrades),
		state.elf.x,
	);

	if (next.sleigh) {
		next.sleigh = moveSleigh(next.sleigh, dt, next.elf);
	}

	if (next.swingTime !== null) {
		next.swingTime += dt;

		if (!next.swingResolved && next.swingTime >= SWING_CONTACT_TIME && next.phase === "dropping") {
			next = resolveSwing(next);
		}
	}

	if (isRiding(next)) {
		return ride(next, dt);
	}

	return next.phase === "sliding" ? slide(next, dt) : fly(next, dt);
}

/** Through the air (or dropping off the presents before the swing). */
function fly(state: IGameState, dt: number): IGameState {
	let next = state;
	const elf = next.elf;
	const speed = Math.hypot(elf.vx, elf.vy);
	const gravity = next.phase === "dropping" ? DROP_GRAVITY : GRAVITY;
	const rocket = next.rocketUntil !== null && next.time < next.rocketUntil;
	const drag = AIR_DRAG * airDragShare(next.upgrades);

	elf.vx += ((rocket ? ROCKET_PUSH.forward : 0) - drag * elf.vx * speed) * dt;
	elf.vy += ((rocket ? ROCKET_PUSH.up : 0) - gravity - drag * elf.vy * speed) * dt;
	elf.x += elf.vx * dt;
	elf.y += elf.vy * dt;

	if (next.phase === "flying") {
		elf.spin += (elf.vx / ELF_RADIUS) * dt * 0.35;
		next = bumpSnowman(smashOrnament(pickUpCoins(next, dt)));

		if (canBoard(next.sleigh, next.elf.x, next.elf.y)) {
			return { ...next, sleigh: { ...next.sleigh!, boardedAt: next.time, vx: RIDE_SPEED } };
		}

		const popped = popCracker(next);

		if (popped) {
			return popped;
		}
	}

	return next.elf.y <= ELF_RADIUS ? land(next) : next;
}

/** Along the snow, slowing until it stops. */
function slide(state: IGameState, dt: number): IGameState {
	const elf = state.elf;
	elf.vx = Math.max(0, elf.vx - snowFriction(state.upgrades) * dt);
	elf.x += elf.vx * dt;
	elf.spin += (elf.vx / ELF_RADIUS) * dt * 0.5;

	const next = bumpSnowman(pickUpCoins(state, dt));
	const popped = popCracker(next);

	if (popped) {
		return popped;
	}

	return next.elf.vx === 0 ? finish(next, next.outcome ?? "hit") : next;
}

/** Aboard the sleigh: carried along at its speed, then let go with a forward fling. */
function ride(state: IGameState, dt: number): IGameState {
	const sleigh = state.sleigh!;
	const elf = { ...state.elf, x: sleigh.x, y: sleigh.y + 0.45, vx: sleigh.vx, vy: 0 };

	if (state.time - sleigh.boardedAt! < RIDE_SECONDS) {
		return pickUpCoins({ ...state, phase: "flying", elf }, dt);
	}

	return {
		...state,
		phase: "flying",
		sleigh: { ...sleigh, finished: true },
		elf: { ...elf, vx: RIDE_SPEED, vy: RELEASE_UP },
	};
}

/** The bat reaches the elf: either it connects and the elf flies, or it whiffs. */
function resolveSwing(state: IGameState): IGameState {
	const hit = hitAt(state.elf.y, swingReach(state.upgrades));

	if (!hit) {
		return { ...state, swingResolved: true, outcome: "miss" };
	}

	const radians = (hit.angle * Math.PI) / 180;
	const speed = hit.speed * swingMultiplier(state.upgrades);

	return {
		...state,
		phase: "flying",
		swingResolved: true,
		outcome: hit.quality >= PERFECT_QUALITY ? "perfect" : "hit",
		elf: { ...state.elf, vx: speed * Math.cos(radians), vy: speed * Math.sin(radians) },
	};
}

function pickUpCoins(state: IGameState, dt: number): IGameState {
	const magnet = magnetRadius(state.upgrades);
	const { coins, gained } = collectCoins(state.coins, state.elf.x, state.elf.y, state.time, magnet, dt);

	return coins === state.coins ? state : { ...state, coins, coinsCollected: state.coinsCollected + gained };
}

/** An elf flying into a sky ornament shatters it and gets kicked up and forward. */
function smashOrnament(state: IGameState): IGameState {
	const index = ornamentHit(state.ornaments, state.elf.x, state.elf.y);

	if (index === -1) {
		return state;
	}

	return {
		...state,
		ornaments: state.ornaments.map((ornament, i) =>
			i === index ? { ...ornament, shatteredAt: state.time } : ornament,
		),
		smashes: state.smashes + 1,
		elf: { ...state.elf, ...kickedVelocity(state.elf.vx, state.elf.vy) },
	};
}

/** Running into a snowman knocks it over and costs the elf its speed (some of it, padded). */
function bumpSnowman(state: IGameState): IGameState {
	const index = snowmanHit(state.snowmen, state.elf.x, state.elf.y);

	if (index === -1) {
		return state;
	}

	const keep = snowmanKeep(state.upgrades);

	return {
		...state,
		snowmen: state.snowmen.map((snowman, i) => (i === index ? { ...snowman, toppledAt: state.time } : snowman)),
		bonks: state.bonks + 1,
		elf: { ...state.elf, vx: state.elf.vx * keep, vy: Math.min(state.elf.vy, 0) },
	};
}

/** If the elf is on a cracker, it goes bang and the elf takes off again; otherwise null. */
function popCracker(state: IGameState): IGameState | null {
	const index = crackerTouching(state.crackers, state.elf.x, state.elf.y);

	if (index === -1) {
		return null;
	}

	return {
		...state,
		phase: "flying",
		crackers: state.crackers.map((cracker, i) => (i === index ? { ...cracker, poppedAt: state.time } : cracker)),
		pops: state.pops + 1,
		elf: { ...state.elf, y: Math.max(state.elf.y, ELF_RADIUS), ...poppedVelocity(state.elf.vx) },
	};
}

function land(state: IGameState): IGameState {
	const elf = { ...state.elf, y: ELF_RADIUS };

	// Never hit: it just plops down by the reindeer's feet.
	if (state.phase === "dropping") {
		return finish({ ...state, elf: { ...elf, vx: 0, vy: 0 } }, state.outcome ?? "late");
	}

	if (-elf.vy > BOUNCE_MIN_SPEED) {
		const keep = bounceKeep(state.upgrades);

		return { ...state, elf: { ...elf, vy: -elf.vy * keep.vertical, vx: elf.vx * keep.forward } };
	}

	return { ...state, phase: "sliding", elf: { ...elf, vy: 0 } };
}

function finish(state: IGameState, outcome: IOutcome): IGameState {
	const flew = outcome === "hit" || outcome === "perfect";

	return {
		...state,
		phase: "done",
		outcome,
		distance: flew ? Math.max(0, state.elf.x - REINDEER_X) : 0,
	};
}

/** The simulation runs in steps this long, however fast the screen refreshes. */
export const FIXED_STEP = 1 / 240;
