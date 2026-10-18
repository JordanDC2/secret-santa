/**
 * Christmas pinball's rules, with no drawing or React. The table is in table.ts; the rules,
 * much as on a real machine:
 *
 * - Each ball waits on the plunger: pull it back (hold) and let go to launch. Drop the launch
 *   into the flashing rollover lane for a skill shot.
 * - Light all four N-O-E-L lanes for a bigger end-of-ball bonus (up to 5x). The flippers move
 *   the lit lanes along.
 * - Knock down all three reindeer to light the kickback, which saves one ball from the left
 *   outlane.
 * - Ring all three bells to light the lock; then sink the ball in the chimney to lock it. Lock
 *   two for three-ball multiball, when every ramp is a jackpot.
 * - Otherwise the chimney starts a mission: do it in time and go up a rank.
 * - Two ramps in a row is a combo. Each ball is saved if it drains in its first few seconds.
 *
 * Table units and seconds; used on its own (the Games page) and as Elf Fling's secret level.
 */

import {
	bounceBalls,
	bounceOffBumper,
	bounceOffFlipper,
	bounceOffGate,
	bounceOffSegment,
	type IMovingBall,
} from "Components/Pinball/collide";
import {
	BALL_RADIUS,
	BELLS,
	BUMPERS,
	DROP_TARGETS,
	FLIPPER_IDS,
	FLIPPERS,
	flipperTip,
	GATE,
	inBox,
	KICKBACK,
	LANE_TRIGGER_Y,
	LANES,
	PLUNGER,
	RAIL_IDS,
	RAILS,
	railPoint,
	SAUCER,
	SAUCER_CATCH_SPEED,
	SLINGSHOTS,
	TABLE,
	WALLS,
	type IFlipperId,
	type IFlipperSide,
	type IRailId,
} from "Components/Pinball/table";

export { TABLE } from "Components/Pinball/table";
export type { IFlipperSide } from "Components/Pinball/table";

const GRAVITY = 900;
const MAX_SPEED = 1800;
/** Each second runs in this many steps, so a fast ball can't pass through a wall. */
export const STEP = 1 / 480;
const FLIPPER_SPEED = 20;
const SLINGSHOT_KICK = 380;
const BUMPER_KICK = 520;
/** The plunger: how long a full pull takes, and the launch at no pull and a full one. */
const PULL_SECONDS = 0.9;
const LAUNCH_SLOWEST = 900;
const LAUNCH_FASTEST = 1260;
const RAIL_ENTRY_SPEED = 100;
/** How fast a ball rides a rail (at least), and how fast it drops off the end. */
const RAIL_MIN_SPEED = 300;
const RAIL_EXIT_SPEED = 220;
const KICKBACK_SPEED = 1150;
/** How long the chimney holds a ball, and how soon it can catch one it just let go. */
const SAUCER_HOLD = 1;
const SAUCER_REST = 0.6;
/** A ball barely moving for this long gets nudged, as a player would nudge a real table. */
const STILL_SPEED = 25;
const NUDGE_AFTER = 1.2;
/** A target hit again within this long is the same hit. */
const DEBOUNCE = 0.25;
const SERVE_DELAY = 1;
/** After the last ball, the bonus shows this long before the game's over. */
const GAME_OVER_DELAY = 2;
/** Each ball is saved if it drains this soon after its launch (or multiball's start). */
const BALL_SAVE = 6;
const MULTIBALL_SAVE = 10;
const SKILL_SHOT_WINDOW = 5;
const COMBO_WINDOW = 4;
const LOCKS_FOR_MULTIBALL = 2;
const MULTIBALL_BALLS = 3;
const MAX_MULTIPLIER = 5;
const MISSION_SECONDS = 45;
/** An extra ball every this many points. */
const EXTRA_BALL_EVERY = 50000;

/** Everything that happens on the table, for the sounds (and the missions). */
export type IPinballEvent =
	| "flip"
	| "launch"
	| "bumper"
	| "slingshot"
	| "rollover"
	| "lanesLit"
	| "skillShot"
	| "drop"
	| "reindeer"
	| "bell"
	| "lockLit"
	| "sleigh"
	| "ramp"
	| "combo"
	| "jackpot"
	| "saucer"
	| "lock"
	| "multiball"
	| "missionStart"
	| "missionDone"
	| "missionFailed"
	| "kickback"
	| "ballSaved"
	| "drain"
	| "extraBall";

/** Points for each, and what each adds to the end-of-ball bonus. */
const POINTS: Partial<Record<IPinballEvent, number>> = {
	bumper: 100,
	slingshot: 10,
	rollover: 500,
	lanesLit: 2000,
	skillShot: 5000,
	drop: 250,
	reindeer: 2500,
	bell: 250,
	lockLit: 1000,
	sleigh: 1000,
	ramp: 1500,
	combo: 5000,
	saucer: 1000,
	lock: 2500,
	multiball: 5000,
};
const BONUS: Partial<Record<IPinballEvent, number>> = {
	rollover: 200,
	drop: 200,
	bell: 200,
	sleigh: 1000,
	ramp: 1000,
	reindeer: 1000,
	missionDone: 2500,
};
const JACKPOT_START = 10000;
const JACKPOT_STEP = 5000;

/** The chimney's missions, in turn: the event that counts towards each, and how many. */
export const MISSIONS: Array<{
	name: string;
	event: IPinballEvent;
	goal: number;
}> = [
	{ name: "Wake the reindeer", event: "reindeer", goal: 1 },
	{ name: "Ring the bells", event: "bell", goal: 6 },
	{ name: "Sleigh test run", event: "sleigh", goal: 2 },
	{ name: "Reindeer games", event: "ramp", goal: 2 },
	{ name: "Light the tree", event: "bumper", goal: 20 },
	{ name: "Check it twice", event: "rollover", goal: 8 },
];
/** Each mission done is a rank up, and a mission is worth more the higher the rank. */
export const RANKS = ["Elf", "Toy maker", "Sleigh mechanic", "Reindeer handler", "Head elf", "Santa's deputy", "Santa"];
const MISSION_POINTS = 5000;

export type IBall = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** On the plunger, loose on the table, held in the chimney, or riding a rail. */
	at: "plunger" | "table" | "saucer" | "rail";
	rail: { id: IRailId; along: number; speed: number } | null;
	/** In the chimney: when it's let go. After: when it was, so it isn't caught again at once. */
	saucerUntil: number;
	launchedAt: number;
	/** How long it's been barely moving (for the nudge). */
	stillFor: number;
};

export type IControl = IFlipperSide | "launch";

export type IPinballState = {
	time: number;
	balls: IBall[];
	/** Balls still to come, counting the one in play. */
	ballsLeft: number;
	ballNumber: number;
	score: number;
	flippers: Record<IFlipperId, { angle: number; omega: number }>;
	held: Record<IControl, boolean>;
	/** How far back the plunger's pulled, 0 to 1. */
	pull: number;
	/** When each bumper, slingshot and bell was last hit (for the flash), or -Infinity. */
	bumperHitAt: number[];
	slingshotHitAt: number[];
	bellHitAt: number[];
	lanes: boolean[];
	/** The lane that's a skill shot for the ball on the plunger. */
	skillLane: number | null;
	drops: boolean[];
	dropsResetAt: number | null;
	bells: boolean[];
	lockLit: boolean;
	locks: number;
	multiball: boolean;
	jackpot: number;
	mission: { index: number; progress: number; until: number } | null;
	nextMission: number;
	rank: number;
	/** The end-of-ball bonus so far, and what it's multiplied by. */
	bonus: number;
	multiplier: number;
	kickback: boolean;
	ballSaveUntil: number;
	lastRampAt: number;
	/** When the next ball goes on the plunger, while one's on its way. */
	serveAt: number | null;
	endsAt: number | null;
	nextExtraBallAt: number;
	/** A message for the display (big ones over the table too), until a time. */
	message: { text: string; until: number; big: boolean } | null;
	/** What's happened since the caller last cleared them, for the sounds. */
	events: IPinballEvent[];
	over: boolean;
};

export function newPinball(balls = 3): IPinballState {
	return {
		time: 0,
		balls: [],
		ballsLeft: balls,
		ballNumber: 0,
		score: 0,
		flippers: {
			left: { angle: FLIPPERS.left.rest, omega: 0 },
			right: { angle: FLIPPERS.right.rest, omega: 0 },
			upper: { angle: FLIPPERS.upper.rest, omega: 0 },
		},
		held: { left: false, right: false, launch: false },
		pull: 0,
		bumperHitAt: BUMPERS.map(() => -Infinity),
		slingshotHitAt: SLINGSHOTS.map(() => -Infinity),
		bellHitAt: BELLS.map(() => -Infinity),
		lanes: LANES.map(() => false),
		skillLane: null,
		drops: DROP_TARGETS.map(() => false),
		dropsResetAt: null,
		bells: BELLS.map(() => false),
		lockLit: false,
		locks: 0,
		multiball: false,
		jackpot: JACKPOT_START,
		mission: null,
		nextMission: 0,
		rank: 0,
		bonus: 0,
		multiplier: 1,
		kickback: false,
		ballSaveUntil: -Infinity,
		lastRampAt: -Infinity,
		serveAt: 0.3,
		endsAt: null,
		nextExtraBallAt: EXTRA_BALL_EVERY,
		message: null,
		events: [],
		over: false,
	};
}

/** Whether a ball is waiting on the plunger with nothing else in play (so any press launches). */
export function waitingToLaunch(state: IPinballState): boolean {
	return state.balls.length > 0 && state.balls.every((ball) => ball.at === "plunger");
}

/** Press or let go of a flipper button or the plunger. A flipper press moves the lit lanes along. */
export function hold(state: IPinballState, control: IControl, down: boolean): IPinballState {
	if (state.held[control] === down) {
		return state;
	}

	const next = { ...state, held: { ...state.held, [control]: down } };

	if (down && control !== "launch") {
		const turn = (items: boolean[]) =>
			control === "left" ? [...items.slice(1), items[0]] : [items[items.length - 1], ...items.slice(0, -1)];
		next.lanes = turn(state.lanes);
		next.events = [...state.events, "flip"];

		if (state.skillLane !== null) {
			next.skillLane = (state.skillLane + (control === "left" ? LANES.length - 1 : 1)) % LANES.length;
		}
	}

	return next;
}

/** Moves the game on by one STEP. */
export function step(state: IPinballState, random: () => number = Math.random): IPinballState {
	if (state.over) {
		return state;
	}

	const dt = STEP;
	const s: IPinballState = {
		...state,
		time: state.time + dt,
		balls: state.balls.map((ball) => ({ ...ball, rail: ball.rail && { ...ball.rail } })),
		flippers: moveFlippers(state, dt),
		lanes: [...state.lanes],
		drops: [...state.drops],
		bells: [...state.bells],
		bumperHitAt: [...state.bumperHitAt],
		slingshotHitAt: [...state.slingshotHitAt],
		bellHitAt: [...state.bellHitAt],
		mission: state.mission && { ...state.mission },
		events: [...state.events],
	};
	const firstEvent = s.events.length;

	if (s.endsAt !== null && s.time >= s.endsAt) {
		return { ...s, over: true };
	}

	if (s.serveAt !== null && s.time >= s.serveAt) {
		s.serveAt = null;
		s.ballNumber++;
		serve(s, random);
	}

	if (s.dropsResetAt !== null && s.time >= s.dropsResetAt) {
		s.drops = s.drops.map(() => false);
		s.dropsResetAt = null;
	}

	if (s.mission && s.time >= s.mission.until) {
		s.mission = null;
		fire(s, "missionFailed");
		say(s, "Mission failed", 1.5);
	}

	pullPlunger(s, dt);
	const drained: IBall[] = [];

	for (const ball of s.balls) {
		if (ball.at === "rail") {
			rideRail(ball, dt);
		} else if (ball.at === "saucer") {
			if (s.time >= ball.saucerUntil) {
				// Out of the chimney, towards the left flipper.
				ball.at = "table";
				ball.vx = -190 + (random() - 0.5) * 60;
				ball.vy = -160;
			}
		} else if (ball.at === "table") {
			moveBall(s, ball, dt, random);

			if (ball.y > TABLE.height + BALL_RADIUS * 2) {
				drained.push(ball);
			}
		}
	}

	const loose = s.balls.filter((ball) => ball.at === "table");

	for (let first = 0; first < loose.length; first++) {
		for (let second = first + 1; second < loose.length; second++) {
			bounceBalls(loose[first], loose[second], BALL_RADIUS);
		}
	}

	if (drained.length > 0) {
		drain(s, drained);
	}

	countMission(s, firstEvent);

	if (s.score >= s.nextExtraBallAt) {
		s.ballsLeft++;
		s.nextExtraBallAt += EXTRA_BALL_EVERY;
		fire(s, "extraBall");
		say(s, "Extra ball!", 2, true);
	}

	return s;
}

function moveFlippers(state: IPinballState, dt: number): IPinballState["flippers"] {
	const move = (id: IFlipperId) => {
		const { rest, raised, side } = FLIPPERS[id];
		const target = state.held[side] ? raised : rest;
		const { angle } = state.flippers[id];
		const room = target - angle;
		const turn = Math.sign(room) * Math.min(Math.abs(room), FLIPPER_SPEED * dt);

		return { angle: angle + turn, omega: turn / dt };
	};

	return { left: move("left"), right: move("right"), upper: move("upper") };
}

function fire(s: IPinballState, event: IPinballEvent, points = POINTS[event] ?? 0) {
	s.events.push(event);
	s.score += points;
	s.bonus += BONUS[event] ?? 0;
}

function say(s: IPinballState, text: string, seconds: number, big = false) {
	s.message = { text, until: s.time + seconds, big };
}

/** A new ball on the plunger, with a lane flashing for the skill shot. */
function serve(s: IPinballState, random: () => number) {
	s.balls.push({
		x: PLUNGER.x,
		y: PLUNGER.y,
		vx: 0,
		vy: 0,
		at: "plunger",
		rail: null,
		saucerUntil: -Infinity,
		launchedAt: -Infinity,
		stillFor: 0,
	});
	s.skillLane = Math.floor(random() * LANES.length);
}

/** Held, the plunger pulls back; let go, it fires whatever ball is on it, harder the further it was pulled. */
function pullPlunger(s: IPinballState, dt: number) {
	const ball = s.balls.find((candidate) => candidate.at === "plunger");

	if (!ball) {
		s.pull = 0;

		return;
	}

	if (s.held.launch) {
		s.pull = Math.min(1, s.pull + dt / PULL_SECONDS);
	} else if (s.pull > 0) {
		ball.at = "table";
		ball.vy = -(LAUNCH_SLOWEST + (LAUNCH_FASTEST - LAUNCH_SLOWEST) * s.pull);
		ball.launchedAt = s.time;
		s.pull = 0;
		s.ballSaveUntil = Math.max(s.ballSaveUntil, s.time + BALL_SAVE);
		fire(s, "launch");
	}
}

function moveBall(s: IPinballState, ball: IBall, dt: number, random: () => number) {
	const fromY = ball.y;
	ball.vy += GRAVITY * dt;
	ball.x += ball.vx * dt;
	ball.y += ball.vy * dt;
	collide(s, ball);

	const speed = Math.hypot(ball.vx, ball.vy);

	if (speed > MAX_SPEED) {
		ball.vx *= MAX_SPEED / speed;
		ball.vy *= MAX_SPEED / speed;
	}

	// Back down the plunger lane (a weak launch): onto the plunger again.
	if (ball.x > PLUNGER.left && ball.y >= PLUNGER.y - 4 && Math.abs(ball.vy) < 80) {
		Object.assign(ball, { x: PLUNGER.x, y: PLUNGER.y, vx: 0, vy: 0, at: "plunger" });

		return;
	}

	// Stuck somewhere? A nudge, up and to one side, gets it going again.
	ball.stillFor = speed < STILL_SPEED ? ball.stillFor + dt : 0;

	if (ball.stillFor > NUDGE_AFTER) {
		ball.vx += (random() < 0.5 ? -1 : 1) * 120;
		ball.vy -= 140;
		ball.stillFor = 0;
	}

	// Across a rollover lane.
	if ((fromY - LANE_TRIGGER_Y) * (ball.y - LANE_TRIGGER_Y) <= 0 && fromY !== ball.y) {
		const lane = LANES.findIndex((x) => Math.abs(ball.x - x) < 16);

		if (lane >= 0) {
			rollover(s, ball, lane);
		}
	}

	const fromSaucer = Math.hypot(ball.x - SAUCER.x, ball.y - SAUCER.y);

	if (fromSaucer < SAUCER.radius && speed < SAUCER_CATCH_SPEED && s.time > ball.saucerUntil + SAUCER_REST) {
		sinkInChimney(s, ball, random);

		return;
	}

	for (const id of RAIL_IDS) {
		if (ball.vy < -RAIL_ENTRY_SPEED && inBox(ball, RAILS[id].mouth)) {
			boardRail(s, ball, id, speed);

			return;
		}
	}

	if (s.kickback && ball.x < KICKBACK.right && ball.y > KICKBACK.y) {
		ball.vx = 20;
		ball.vy = -KICKBACK_SPEED;
		s.kickback = false;
		fire(s, "kickback");
		say(s, "Kickback!", 1.2);
	}
}

/** Bounces the ball off everything it's touching, scoring as it goes. */
function collide(s: IPinballState, ball: IMovingBall) {
	for (const wall of WALLS) {
		bounceOffSegment(ball, wall, BALL_RADIUS, 0.45);
	}

	bounceOffGate(ball, GATE, BALL_RADIUS);

	SLINGSHOTS.forEach((sling, index) => {
		if (
			bounceOffSegment(ball, sling, BALL_RADIUS, 0.5, SLINGSHOT_KICK) &&
			s.time - s.slingshotHitAt[index] > DEBOUNCE
		) {
			s.slingshotHitAt[index] = s.time;
			fire(s, "slingshot");
		}
	});

	BUMPERS.forEach((bumper, index) => {
		if (bounceOffBumper(ball, bumper, BALL_RADIUS, BUMPER_KICK)) {
			s.bumperHitAt[index] = s.time;
			fire(s, "bumper");
		}
	});

	DROP_TARGETS.forEach((target, index) => {
		if (!s.drops[index] && bounceOffSegment(ball, target, BALL_RADIUS, 0.5)) {
			s.drops[index] = true;
			fire(s, "drop");

			if (s.drops.every(Boolean)) {
				s.kickback = true;
				s.dropsResetAt = s.time + 1.5;
				fire(s, "reindeer");
				say(s, "Reindeer awake! Kickback lit", 2);
			}
		}
	});

	BELLS.forEach((bell, index) => {
		if (bounceOffSegment(ball, bell, BALL_RADIUS, 0.5) && s.time - s.bellHitAt[index] > DEBOUNCE) {
			s.bellHitAt[index] = s.time;
			s.bells[index] = true;
			fire(s, "bell");

			if (s.bells.every(Boolean)) {
				s.bells = s.bells.map(() => false);

				if (!s.lockLit && !s.multiball) {
					s.lockLit = true;
					fire(s, "lockLit");
					say(s, "Lock is lit: shoot the chimney", 2);
				}
			}
		}
	});

	for (const id of FLIPPER_IDS) {
		const { pivot, radius } = FLIPPERS[id];
		const flipper = s.flippers[id];
		bounceOffFlipper(ball, pivot, flipperTip(id, flipper.angle), flipper.omega, BALL_RADIUS + radius);
	}
}

function rollover(s: IPinballState, ball: IBall, lane: number) {
	const skillShot = s.skillLane === lane && s.time - ball.launchedAt < SKILL_SHOT_WINDOW;
	s.skillLane = null;

	if (skillShot) {
		fire(s, "skillShot");
		say(s, "Skill shot!", 1.5, true);
	}

	if (s.lanes[lane]) {
		return;
	}

	s.lanes[lane] = true;
	fire(s, "rollover");

	if (s.lanes.every(Boolean)) {
		s.lanes = s.lanes.map(() => false);
		s.multiplier = Math.min(MAX_MULTIPLIER, s.multiplier + 1);
		fire(s, "lanesLit");
		say(s, `NOEL! Bonus ${s.multiplier}x`, 1.5);
	}
}

/**
 * Into the chimney: it holds the ball a moment, then lets it go. Lit, it locks the ball instead
 * (the third lock starts multiball); otherwise it starts the next mission.
 */
function sinkInChimney(s: IPinballState, ball: IBall, random: () => number) {
	Object.assign(ball, { x: SAUCER.x, y: SAUCER.y, vx: 0, vy: 0, at: "saucer", saucerUntil: s.time + SAUCER_HOLD });
	fire(s, "saucer");

	if (s.lockLit && !s.multiball) {
		s.lockLit = false;
		s.locks++;

		if (s.locks >= LOCKS_FOR_MULTIBALL) {
			// Multiball: the chimney lets out the locked balls one after another.
			s.locks = 0;
			s.multiball = true;
			s.ballSaveUntil = s.time + MULTIBALL_SAVE;

			for (let extra = 1; extra < MULTIBALL_BALLS; extra++) {
				s.balls.push({ ...ball, saucerUntil: s.time + SAUCER_HOLD + extra * 0.8 });
			}

			fire(s, "multiball");
			say(s, "Multiball!", 2.5, true);
		} else {
			// Locked: the ball stays, and a new one goes on the plunger.
			s.balls = s.balls.filter((candidate) => candidate !== ball);
			serve(s, random);
			fire(s, "lock");
			say(s, `Ball ${s.locks} locked`, 2);
		}
	} else if (!s.mission && !s.multiball) {
		const index = s.nextMission;
		s.mission = { index, progress: 0, until: s.time + MISSION_SECONDS };
		s.nextMission = (index + 1) % MISSIONS.length;
		fire(s, "missionStart");
		say(s, `Mission: ${MISSIONS[index].name}`, 2);
	}
}

/** Onto a rail: points, a combo if it's soon after another, and in multiball the jackpot. */
function boardRail(s: IPinballState, ball: IBall, id: IRailId, speed: number) {
	ball.at = "rail";
	ball.rail = { id, along: 0, speed: Math.max(RAIL_MIN_SPEED, speed * 0.8) };
	fire(s, id === "sleigh" ? "sleigh" : "ramp");
	say(s, id === "sleigh" ? "Sleigh ride!" : "Reindeer ramp!", 1.2);

	if (s.time - s.lastRampAt < COMBO_WINDOW) {
		fire(s, "combo");
		say(s, "Combo!", 1.2, true);
	}

	s.lastRampAt = s.time;

	if (s.multiball) {
		fire(s, "jackpot", s.jackpot);
		say(s, `Jackpot! ${s.jackpot.toLocaleString()}`, 1.8, true);
		s.jackpot += JACKPOT_STEP;
	}
}

/** Along a rail at its own pace, then off the end into an inlane. */
function rideRail(ball: IBall, dt: number) {
	const { id, speed } = ball.rail!;
	const { path, length } = RAILS[id];
	const along = ball.rail!.along + speed * dt;

	if (along >= length) {
		const end = path[path.length - 1];
		const before = path[path.length - 2];
		const segmentLength = Math.hypot(end.x - before.x, end.y - before.y);
		Object.assign(ball, {
			at: "table",
			rail: null,
			x: end.x,
			y: end.y,
			vx: ((end.x - before.x) / segmentLength) * RAIL_EXIT_SPEED,
			vy: ((end.y - before.y) / segmentLength) * RAIL_EXIT_SPEED,
		});

		return;
	}

	ball.rail!.along = along;
	Object.assign(ball, railPoint(id, along), { stillFor: 0 });
}

/**
 * Balls down past the flippers. Saved ones come back; otherwise they're gone, multiball ends
 * when one's left, and when none are, so is the ball: the bonus is paid out and the next one
 * goes on the plunger (or that was the last).
 */
function drain(s: IPinballState, drained: IBall[]) {
	s.balls = s.balls.filter((ball) => !drained.includes(ball));

	if (s.time < s.ballSaveUntil) {
		for (const ball of drained) {
			fire(s, "ballSaved");
			say(s, "Ball saved!", 1.5);

			if (s.multiball) {
				s.balls.push({ ...ball, x: SAUCER.x, y: SAUCER.y, vx: 0, vy: 0, at: "saucer", saucerUntil: s.time + 0.6 });
			} else {
				s.balls.push({ ...ball, x: PLUNGER.x, y: PLUNGER.y, vx: 0, vy: 0, at: "plunger", stillFor: 0 });
			}
		}

		return;
	}

	if (s.multiball && s.balls.length <= 1) {
		s.multiball = false;
		s.jackpot = JACKPOT_START;
		say(s, "Multiball over", 1.5);
	}

	if (s.balls.length > 0) {
		return;
	}

	const bonus = s.bonus * s.multiplier;
	fire(s, "drain", bonus);
	say(s, `Bonus ${s.bonus.toLocaleString()} x ${s.multiplier}`, 2);

	if (s.mission) {
		s.mission = null;
		fire(s, "missionFailed");
	}

	s.bonus = 0;
	s.multiplier = 1;
	s.ballsLeft--;

	if (s.ballsLeft > 0) {
		s.serveAt = s.time + SERVE_DELAY;
	} else {
		s.endsAt = s.time + GAME_OVER_DELAY;
	}
}

/** The mission's goal, counted from this step's events: done in time, a rank up. */
function countMission(s: IPinballState, firstEvent: number) {
	if (!s.mission) {
		return;
	}

	const mission = MISSIONS[s.mission.index];
	s.mission.progress += s.events.slice(firstEvent).filter((event) => event === mission.event).length;

	if (s.mission.progress >= mission.goal) {
		s.mission = null;
		s.rank = Math.min(RANKS.length - 1, s.rank + 1);
		fire(s, "missionDone", MISSION_POINTS * s.rank);
		say(s, `Mission done! ${RANKS[s.rank]}`, 2.5, true);
	}
}
