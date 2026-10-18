import { AURORA_LEVELS, centerPostUp, type IPinballState } from "Components/Pinball/pinball";
import {
	archPoint,
	CHIMNEY_IDS,
	CHIMNEYS,
	COOKIE_ROLLOVERS,
	JOY_LANES,
	JOY_LETTERS,
	JOY_TRIGGER_Y,
	KICKOUTS,
	PLUNGER,
	PROGRESS_RING,
	RANK_RING,
	SKILL_GATES,
	TARGETS,
	TOY_LANES,
	TOY_TRIGGER_Y,
	type IPoint,
} from "Components/Pinball/table";
import { flatCircle, polygon, project } from "Components/Pinball/view";

/**
 * The playfield's lights (inserts), like Space Cadet's two hundred: each shows something lit,
 * done or to do, and glows when it's on. Off, they're a dim tint of their colour. Big moments
 * set off a light show over all of them (a strobe, or a chase round the table), and while a
 * ball waits on the plunger they ripple up the table.
 */

export const LIGHT_COLOURS = {
	red: "#ff3b4e",
	green: "#41e07f",
	gold: "#ffcf4a",
	blue: "#4cc4ff",
	white: "#fff3d6",
	violet: "#b685ff",
	orange: "#ff9a3c",
	ice: "#9be7ff",
};

type ILightState = boolean | "blink" | "fast";
type ILight = {
	at: IPoint;
	radius: number;
	colour: string;
	shape: "circle" | "arrow" | "ring";
	/** For an arrow: which way it points. */
	angle?: number;
	label?: string;
	state: (state: IPinballState) => ILightState;
};

function circle(at: IPoint, radius: number, colour: string, state: ILight["state"], label?: string): ILight {
	return { at, radius, colour, shape: "circle", label, state };
}

function arrow(at: IPoint, radius: number, angle: number, colour: string, state: ILight["state"]): ILight {
	return { at, radius, colour, shape: "arrow", angle, state };
}

function ring(at: IPoint, radius: number, colour: string, state: ILight["state"]): ILight {
	return { at, radius, colour, shape: "ring", state };
}

/** Lit, and flashing while it's just been hit. */
function flashed(state: IPinballState, name: string, seconds = 0.4): ILightState {
	return state.time - (state.hitAt[name] ?? -Infinity) < seconds ? "fast" : false;
}

/** The middle of a target, nudged `by` out in front of it (towards the ball's side). */
function inFront(bank: keyof typeof TARGETS, index: number, by: IPoint): IPoint {
	const { a, b } = TARGETS[bank][index];

	return { x: (a.x + b.x) / 2 + by.x, y: (a.y + b.y) / 2 + by.y };
}

/** A point round a ring of `count` about a centre, starting at the top. */
function round(centre: IPoint, radius: number, index: number, count: number): IPoint {
	const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;

	return { x: centre.x + Math.cos(angle) * radius, y: centre.y + Math.sin(angle) * radius };
}

const { red, green, gold, blue, white, violet, orange, ice } = LIGHT_COLOURS;
const CHIMNEY_COLOURS = { green, red, gold };
const UP = -Math.PI / 2;
const ARCH_CENTRE = { x: 270, y: 170 };
const ARCH_LAMPS = 18;

/** A point just inside the arch (`by` in from it), at an angle round it from its right end. */
function insideArch(angle: number, by = 20): IPoint {
	const point = archPoint(angle);
	const dx = ARCH_CENTRE.x - point.x;
	const dy = ARCH_CENTRE.y - point.y;
	const distance = Math.hypot(dx, dy);

	return { x: point.x + (dx / distance) * by, y: point.y + (dy / distance) * by };
}

export const LIGHTS: ILight[] = [
	// J-O-Y lanes, the toy lanes, and the bumpers' levels.
	...JOY_LANES.map((x, index) =>
		circle({ x, y: JOY_TRIGGER_Y }, 11, gold, (s) => s.joyLanes[index], JOY_LETTERS[index]),
	),
	...TOY_LANES.map((x, index) => circle({ x, y: TOY_TRIGGER_Y }, 8, green, (s) => s.toyLanes[index])),
	...[0, 1, 2, 3].map((level) => circle({ x: 254 + level * 18, y: 338 }, 6, red, (s) => s.attackLevel >= level)),
	...[0, 1, 2, 3].map((level) => circle({ x: 156, y: 500 + level * 16 }, 5, green, (s) => s.workshopLevel >= level)),
	// The cookie gauge up the plunger lane, and the skill shot's lights.
	...COOKIE_ROLLOVERS.map((y, index) =>
		circle(
			{ x: PLUNGER.x, y },
			7,
			orange,
			(s) => flashed(s, `cookieRollover${y}`) || (s.cookies > index && (s.mission && s.cookies <= 2 ? "blink" : true)),
		),
	),
	circle({ x: PLUNGER.x, y: SKILL_GATES.laneTop }, 6, white, (s) => s.balls.some((ball) => ball.launch)),
	...SKILL_GATES.archAngles.map((angle) =>
		circle(insideArch(angle), 6, white, (s) => s.balls.some((ball) => ball.launch && ball.launch.furthest >= angle)),
	),
	// Chimneys: the lit one's the destination; the presents delivered so far.
	...CHIMNEY_IDS.map((id) =>
		ring(CHIMNEYS[id], CHIMNEYS[id].radius + 7, CHIMNEY_COLOURS[id], (s) =>
			s.destination === id ? (s.multiball ? "fast" : "blink") : false,
		),
	),
	...[0, 1, 2].map((lock) =>
		circle({ x: 398, y: 396 + lock * 16 }, 6, gold, (s) => (s.multiball ? "fast" : s.locks > lock)),
	),
	// The aurora's levels up its chute, its kickout, and the snow globe.
	...[0, 1, 2, 3].map((level) =>
		arrow({ x: 470, y: [424, 322, 286, 250][level] }, 9, UP, violet, (s) => s.aurora > level),
	),
	ring(KICKOUTS.aurora, KICKOUTS.aurora.radius + 6, violet, (s) =>
		s.aurora === AURORA_LEVELS ? "fast" : s.aurora > 0 ? "blink" : false,
	),
	ring(KICKOUTS.globe, KICKOUTS.globe.radius + 8, ice, (s) => (s.globeLit ? "fast" : false)),
	// Ranks round the snow globe, and progress towards the next.
	...Array.from({ length: RANK_RING.count }, (_, index) =>
		circle(round(KICKOUTS.globe, RANK_RING.radius, index, RANK_RING.count), 7, red, (s) => s.rank >= index),
	),
	...Array.from({ length: PROGRESS_RING.count }, (_, index) =>
		circle(round(KICKOUTS.globe, PROGRESS_RING.radius, index, PROGRESS_RING.count), 6, blue, (s) => s.progress > index),
	),
	// Missions: the letters, and the ramp's arrow to accept one; the reflex shot and jackpot on the ramp.
	...TARGETS.letters.map((_, index) =>
		circle(inFront("letters", index, { x: 16, y: 0 }), 6, white, (s) =>
			s.targets.letters[index] ? (s.mission ? true : "blink") : false,
		),
	),
	arrow({ x: 216, y: 412 }, 13, UP, gold, (s) => (s.selected && !s.mission ? "fast" : false)),
	circle({ x: 196, y: 440 }, 6, white, (s) => (s.time < s.reflexUntil ? "blink" : false)),
	circle({ x: 236, y: 440 }, 6, gold, (s) => (s.time < s.jackpotLitUntil ? "blink" : false)),
	// Standups: cookies, icicles, snowflakes.
	...TARGETS.cookies.map((_, index) =>
		circle(inFront("cookies", index, { x: 14, y: 0 }), 5, orange, (s) => s.targets.cookies[index]),
	),
	...TARGETS.icicles.map((_, index) =>
		circle(inFront("icicles", index, { x: 11, y: 11 }), 5, ice, (s) => s.targets.icicles[index]),
	),
	...TARGETS.snowflakes.map((_, index) =>
		circle(inFront("snowflakes", index, { x: -14, y: 0 }), 5, ice, (s) => s.targets.snowflakes[index]),
	),
	// The drop targets' awards: the reindeer's four, the gold stars' completions, the score multiplier.
	...[
		{ colour: orange, lit: (s: IPinballState) => s.time < s.spinnersLitUntil },
		{ colour: gold, lit: (s: IPinballState) => s.time < s.jackpotLitUntil },
		{ colour: green, lit: (s: IPinballState) => s.time < s.bonusLitUntil },
		{ colour: blue, lit: (s: IPinballState) => s.bonusHeld },
	].map(({ colour, lit }, index) => circle({ x: 382, y: 478 + index * 22 }, 6, colour, lit)),
	...[0, 1, 2].map((completion) =>
		circle({ x: 104, y: 270 + completion * 24 }, 6, gold, (s) => s.goldStarCompletions > completion),
	),
	...[2, 3, 4].map((times, index) =>
		circle({ x: 130 + index * 22, y: 304 + index * 12 }, 9, gold, (s) => s.multiplier >= times, `${times}x`),
	),
	// Kickbacks and extra balls in the outlanes; return lanes; the stocking lane and bonus hold.
	arrow({ x: 36, y: 862 }, 10, UP, green, (s) => s.kickbacks.left),
	arrow({ x: 476, y: 862 }, 10, UP, green, (s) => s.kickbacks.right),
	circle({ x: 36, y: 824 }, 7, red, (s) => (s.time < s.extraBallLitUntil ? "blink" : false)),
	circle({ x: 476, y: 824 }, 7, red, (s) => (s.time < s.extraBallLitUntil ? "blink" : false)),
	circle({ x: 72, y: 772 }, 6, white, (s) => flashed(s, "leftReturnLane")),
	circle({ x: 440, y: 772 }, 6, white, (s) => flashed(s, "rightReturnLane")),
	circle({ x: 64, y: 692 }, 8, gold, (s) => (s.time < s.bonusLitUntil ? "blink" : false)),
	circle({ x: 92, y: 692 }, 6, blue, (s) => s.bonusHeld),
	// The sleigh bells and the spinners.
	circle({ x: 50, y: 316 }, 7, gold, (s) => flashed(s, "sleighBell", 0.8)),
	circle(
		{ x: 50, y: 400 },
		6,
		orange,
		(s) => flashed(s, "spinner-cocoa") || (s.time < s.spinnersLitUntil ? "blink" : false),
	),
	circle(
		{ x: 470, y: 384 },
		6,
		orange,
		(s) => flashed(s, "spinner-aurora") || (s.time < s.spinnersLitUntil ? "blink" : false),
	),
	// Shoot again (ball save), and the center post's light.
	circle({ x: 256, y: 904 }, 9, red, (s) => (s.time < s.ballSaveUntil ? "blink" : false)),
	circle({ x: 256, y: 940 }, 6, gold, (s) => (centerPostUp(s).ending ? "fast" : centerPostUp(s).up)),
	// Lamps round the arch, always chasing (faster in multiball).
	...Array.from({ length: ARCH_LAMPS }, (_, index) =>
		circle(insideArch(0.2 + (index / (ARCH_LAMPS - 1)) * 2.74, 10), 4, white, (s) => {
			const speed = s.multiball ? 24 : 6;

			return (index + s.time * speed) % ARCH_LAMPS < 3;
		}),
	),
];

const TABLE_MIDDLE = { x: 256, y: 520 };

/** How lit a light is now, 0 to 1: its own state, under any light show or the plunger's ripple. */
function brightness(light: ILight, state: IPinballState, waiting: boolean): number {
	const { time } = state;
	const show = state.lightShow && time < state.lightShow.until ? state.lightShow.kind : null;

	if (show === "flash") {
		return Math.floor(time * 12) % 2 === 0 ? 1 : 0.15;
	}

	if (show === "chase") {
		const angle = Math.atan2(light.at.y - TABLE_MIDDLE.y, light.at.x - TABLE_MIDDLE.x);
		const sweep = (((angle + time * 9) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

		return sweep < 1.4 ? 1 : 0.15;
	}

	const own = light.state(state);
	const on =
		own === true ||
		(own === "blink" && Math.floor(time * 4) % 2 === 0) ||
		(own === "fast" && Math.floor(time * 12) % 2 === 0);

	if (on) {
		return state.tilted ? 0.3 : 1;
	}

	// Waiting on the plunger: a ripple of light up the table.
	if (waiting && ((light.at.y / 1000) * 3 + time * 1.2) % 1 < 0.12) {
		return 0.6;
	}

	return 0;
}

function shape(context: CanvasRenderingContext2D, light: ILight, grow = 1) {
	const radius = light.radius * grow;

	if (light.shape === "arrow") {
		const angle = light.angle ?? 0;
		const point = (forward: number, across: number) =>
			project(
				light.at.x + Math.cos(angle) * forward - Math.sin(angle) * across,
				light.at.y + Math.sin(angle) * forward + Math.cos(angle) * across,
			);
		polygon(context, [
			point(radius, 0),
			point(-radius * 0.7, radius * 0.8),
			point(-radius * 0.3, 0),
			point(-radius * 0.7, -radius * 0.8),
		]);
	} else {
		flatCircle(context, light.at, radius);
	}
}

/** The lights as inserts in the playfield, lit or not (drawn before what stands on the table). */
export function drawLights(context: CanvasRenderingContext2D, state: IPinballState, waiting: boolean) {
	context.textAlign = "center";
	context.textBaseline = "middle";

	for (const light of LIGHTS) {
		const lit = brightness(light, state, waiting);

		if (light.shape === "ring") {
			context.strokeStyle = light.colour;
			context.lineWidth = 3 * project(light.at.x, light.at.y).scale;
			context.globalAlpha = 0.25 + 0.75 * lit;
			shape(context, light);
			context.stroke();
			context.globalAlpha = 1;
			continue;
		}

		// A dark rim, the coloured insert (a dim tint when off), and a hot middle when on.
		context.fillStyle = "rgba(0, 0, 0, 0.45)";
		shape(context, light, 1.2);
		context.fill();
		context.fillStyle = light.colour;
		context.globalAlpha = 0.32 + 0.68 * lit;
		shape(context, light);
		context.fill();
		context.globalAlpha = 1;

		if (lit > 0.5) {
			context.fillStyle = "rgba(255, 255, 255, 0.55)";
			shape(context, light, 0.45);
			context.fill();
		}

		if (light.label) {
			const at = project(light.at.x, light.at.y);
			context.font = `800 ${Math.round(light.radius * 1.15 * at.scale * 1.4)}px Nunito, sans-serif`;
			context.fillStyle = lit > 0.5 ? "#1a1208" : light.colour;
			context.fillText(light.label, at.x, at.y + 0.5);
		}
	}
}

/** The lit lights' glow, added over everything (drawn last, so it spills over what's around them). */
export function drawGlows(context: CanvasRenderingContext2D, state: IPinballState, waiting: boolean) {
	context.save();
	context.globalCompositeOperation = "lighter";

	for (const light of LIGHTS) {
		const lit = brightness(light, state, waiting);

		if (lit === 0) {
			continue;
		}

		const at = project(light.at.x, light.at.y);
		const reach = light.radius * at.scale * 3.6;
		const glow = context.createRadialGradient(at.x, at.y, 0, at.x, at.y, reach);
		glow.addColorStop(0, light.colour);
		glow.addColorStop(1, "rgba(0, 0, 0, 0)");
		context.globalAlpha = 0.6 * lit;
		context.fillStyle = glow;
		context.beginPath();
		context.arc(at.x, at.y, reach, 0, Math.PI * 2);
		context.fill();
	}

	context.restore();
}
