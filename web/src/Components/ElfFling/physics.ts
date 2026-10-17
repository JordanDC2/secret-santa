/**
 * Elf Fling's rules, in metres and seconds with no drawing or React: a little elf hops off a
 * stack of presents, the reindeer swings a candy cane when the player taps, and how close the
 * elf is to the bat's sweet spot at that moment sets how hard and how high it flies. Then it
 * bounces and slides along the snow until it stops. Distance is measured from the reindeer.
 */

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
/** Height of the candy cane's sweet spot, and how far either side of it still connects. */
export const SWEET_SPOT_Y = 1.4;
export const SWING_REACH = 0.85;
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
/** Hard landings bounce (keeping this much speed), softer ones turn into a slide. */
const BOUNCE_MIN_SPEED = 3;
const BOUNCE_KEEP_VERTICAL = 0.42;
const BOUNCE_KEEP_FORWARD = 0.8;
const SNOW_FRICTION = 4;

export function newGame(): IGameState {
	return {
		phase: "ready",
		// Standing at the front edge of the top present.
		elf: { x: STACK.left + 0.1, y: STACK.top + ELF_RADIUS, vx: 0, vy: 0, spin: 0 },
		swingTime: null,
		swingResolved: false,
		outcome: null,
		distance: null,
	};
}

/** The one button: hop off the presents, then swing. Does nothing at other times. */
export function tap(state: IGameState): IGameState {
	if (state.phase === "ready") {
		return { ...state, phase: "dropping", elf: { ...state.elf, vx: HOP.vx, vy: HOP.vy } };
	}

	if (state.phase === "dropping" && state.swingTime === null) {
		return { ...state, swingTime: 0 };
	}

	return state;
}

/**
 * How the bat meets an elf at this height: null if it's out of reach, otherwise the launch
 * speed and angle (degrees) and how clean the hit was (1 is dead on the sweet spot).
 */
export function hitAt(elfY: number): { speed: number; angle: number; quality: number } | null {
	const offset = (elfY - SWEET_SPOT_Y) / SWING_REACH;

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

	let next: IGameState = { ...state, elf: { ...state.elf } };

	if (next.swingTime !== null) {
		next.swingTime += dt;

		if (!next.swingResolved && next.swingTime >= SWING_CONTACT_TIME && next.phase === "dropping") {
			next = resolveSwing(next);
		}
	}

	const elf = next.elf;

	if (next.phase === "sliding") {
		elf.vx = Math.max(0, elf.vx - SNOW_FRICTION * dt);
		elf.x += elf.vx * dt;
		elf.spin += (elf.vx / ELF_RADIUS) * dt * 0.5;

		return elf.vx === 0 ? finish(next, next.outcome ?? "hit") : next;
	}

	const speed = Math.hypot(elf.vx, elf.vy);
	const gravity = next.phase === "dropping" ? DROP_GRAVITY : GRAVITY;
	elf.vx -= AIR_DRAG * elf.vx * speed * dt;
	elf.vy -= (gravity + AIR_DRAG * elf.vy * speed) * dt;
	elf.x += elf.vx * dt;
	elf.y += elf.vy * dt;

	if (next.phase === "flying") {
		elf.spin += (elf.vx / ELF_RADIUS) * dt * 0.35;
	}

	if (elf.y <= ELF_RADIUS) {
		return land(next);
	}

	return next;
}

/** The bat reaches the elf: either it connects and the elf flies, or it whiffs. */
function resolveSwing(state: IGameState): IGameState {
	const hit = hitAt(state.elf.y);

	if (!hit) {
		return { ...state, swingResolved: true, outcome: "miss" };
	}

	const radians = (hit.angle * Math.PI) / 180;

	return {
		...state,
		phase: "flying",
		swingResolved: true,
		outcome: hit.quality >= PERFECT_QUALITY ? "perfect" : "hit",
		elf: { ...state.elf, vx: hit.speed * Math.cos(radians), vy: hit.speed * Math.sin(radians) },
	};
}

function land(state: IGameState): IGameState {
	const elf = { ...state.elf, y: ELF_RADIUS };

	// Never hit: it just plops down by the reindeer's feet.
	if (state.phase === "dropping") {
		return finish({ ...state, elf: { ...elf, vx: 0, vy: 0 } }, state.outcome ?? "late");
	}

	if (-elf.vy > BOUNCE_MIN_SPEED) {
		return {
			...state,
			elf: { ...elf, vy: -elf.vy * BOUNCE_KEEP_VERTICAL, vx: elf.vx * BOUNCE_KEEP_FORWARD },
		};
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
