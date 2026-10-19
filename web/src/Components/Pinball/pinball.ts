/**
 * Christmas pinball's rules, with no drawing or React: Space Cadet's rules (from its decompiled
 * source, github.com/k4zmu2a/SpaceCadetPinball) on the table in table.ts, its scoring 1:1.
 *
 * - Launch: hold the plunger and let go. The ball goes up the lane over six cookie rollovers
 *   (each a cookie for the gauge) and round the arch; how far it gets is the skill shot.
 * - J-O-Y lanes raise the bumpers' level (and points); the flippers move their lit lights.
 *   The toy lanes do the same for the workshop's bumpers. Levels drop back each minute.
 * - Drop targets: the reindeer award, in turn, lit spinners, a lit jackpot (on the ramp), a lit
 *   bonus (in the stocking lane) and bonus hold; the gold stars pay 10,000, 50,000, then an
 *   extra ball; the gifts raise the score multiplier, which drops back every 30 seconds.
 * - Standups: the cookies fill the cookie gauge; the icicles and snowflakes light the left and
 *   right kickbacks; the weathervane turns the lit chimney; the letters choose a mission.
 * - Missions: chosen by a letter, accepted by the sleigh ramp, run on cookies (which also
 *   refill from the ramp). Done, they fill the progress ring round the snow globe; a full ring
 *   is a rank up.
 * - The aurora chute lights the aurora's levels; its kickout pays by level: the jackpot, the
 *   center post, lit extra balls (in the outlanes), then 150,000 and a lit snow globe, which
 *   pulls the ball in and raises the multiplier.
 * - Chimneys: the ball comes out of the lit one; going down the lit one locks a ball, and the
 *   third lock is three-ball multiball, where the lit chimney is a jackpot.
 * - Nudge the table, but not too much: it tilts.
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
import { CHRISTMAS_EVE, missionsAtRank, RANKS, SECRET_MISSIONS, type IMission } from "Components/Pinball/missions";
import {
	archAngle,
	BALL_RADIUS,
	BAUBLE_BUMPERS,
	CENTER_POST,
	CHIMNEY_IDS,
	CHIMNEYS,
	COOKIE_ROLLOVERS,
	DROP_BANKS,
	FLIPPER_SIDES,
	FLIPPERS,
	flipperTip,
	GATE,
	inBox,
	JOY_LANES,
	JOY_TRIGGER_Y,
	KICKBACK_Y,
	KICKOUT_IDS,
	KICKOUTS,
	LOWER_LANES,
	PLUNGER,
	PROGRESS_RING,
	RAMP,
	rampPoint,
	REBOUNDS,
	segment,
	SKILL_GATES,
	SKILL_SHOT_POINTS,
	SLEIGH_BELL_ROLLOVER,
	SLINGSHOTS,
	SPINNER_IDS,
	SPINNERS,
	STAR_BUMPER,
	STOCKING_LANE,
	TABLE,
	TARGET_BANKS,
	TARGETS,
	TOY_LANES,
	TOY_TRIGGER_Y,
	WALLS,
	WORKSHOP_BUMPERS,
	type IChimneyId,
	type IFlipperSide,
	type IKickoutId,
	type ITargetBank,
} from "Components/Pinball/table";

export { TABLE } from "Components/Pinball/table";
export type { IFlipperSide } from "Components/Pinball/table";

// The physics, scaled from the first table's (720 tall) to this one (1000 tall).
const GRAVITY = 1250;
const MAX_SPEED = 2500;
/** Each second runs in this many steps, so a fast ball can't pass through a wall. */
export const STEP = 1 / 480;
const FLIPPER_SPEED = 20;
const SLINGSHOT_KICK = 528;
const BUMPER_KICK = 722;
const WORKSHOP_KICK = 480;
/** How far a pop bumper's kick can turn from straight out (radians, either way half this). */
const BUMPER_SCATTER = 0.3;
/** The plunger: how long a full pull takes, and the launch at no pull and a full one. */
const PULL_SECONDS = 0.9;
const LAUNCH_SLOWEST = 1400;
const LAUNCH_FASTEST = 1700;
const RAMP_ENTRY_SPEED = 139;
const RAMP_MIN_SPEED = 417;
const RAMP_EXIT_SPEED = 120;
const KICKBACK_SPEED = 1600;
/** How long a kickout holds a ball, and how soon it can catch one it just let go. */
const KICKOUT_HOLD = 1;
const KICKOUT_REST = 0.6;
/** A kickout (but the aurora's, at the end of its chute) and a chimney catch balls slower than these. */
const KICKOUT_CATCH_SPEED = 722;
const CHIMNEY_CATCH_SPEED = 900;
/** How long a ball takes through a chimney, out of the lit one. */
const CHIMNEY_TRAVEL = 1;
/** The lit snow globe pulls balls within this far, this hard at its middle. */
const GLOBE_PULL_REACH = 170;
const GLOBE_PULL = 1500;
/** A ball barely moving for this long gets nudged, as a player would nudge a real table. */
const STILL_SPEED = 35;
const NUDGE_AFTER = 1.2;
const FLIPPER_ZONE = 850;
/** A player's nudge: how hard, how fast the table's shake settles, and how much shake tilts it. */
const NUDGE_SPEED = 180;
const SHAKE_SETTLES = 1 / 1.5;
const SHAKE_WARNING = 3;
const SHAKE_TILT = 5;
/** A target hit again within this long is the same hit. */
const DEBOUNCE = 0.25;
const SERVE_DELAY = 1;
/** After the last ball, the bonus shows this long before the game's over. */
const GAME_OVER_DELAY = 2.5;
/** Each ball is saved if it drains this soon after it's in play (or multiball's start). */
const BALL_SAVE = 6;
const MULTIBALL_SAVE = 10;
/** A launch still on its way round the arch after this long is in play anyway. */
const LAUNCH_SECONDS = 4;
/** The sleigh ramp soon after a launch is a reflex shot. */
const REFLEX_SECONDS = 10;
/** Bumper levels and the score multiplier drop back one this often; lit awards last this long. */
const BUMPER_LEVEL_SECONDS = 60;
const MULTIPLIER_SECONDS = 30;
const LIT_SECONDS = 60;
const AURORA_LEVEL_SECONDS = 60;
const EXTRA_BALL_LIT_SECONDS = 55;
/** The center post stays up this long, then this much longer flashing. */
const CENTER_POST_SECONDS = 30;
const CENTER_POST_WARNING = 10;
const CENTER_POST_SEGMENT = segment(CENTER_POST.x, CENTER_POST.y - 6, CENTER_POST.x, CENTER_POST.y + 6);
/** Cookies: the gauge's size, and how often one goes while a mission's on. */
export const COOKIE_GAUGE = 6;
const COOKIE_SECONDS = 10;
const LOCKS_FOR_MULTIBALL = 3;
const MULTIBALL_BALLS = 3;
const MAX_MULTIPLIER = 4;
const MAX_BUMPER_LEVEL = 3;
const BONUS_START = 25000;
const JACKPOT_START = 20000;
/** Each pop bumper hit adds this to the jackpot. */
const JACKPOT_PER_BUMPER = 250;

/** Everything that happens on the table, for the sounds and the missions. */
export type IPinballEvent =
	| "flip"
	| "launch"
	| "skillShot"
	| "attackBumper"
	| "starBumper"
	| "workshopBumper"
	| "slingshot"
	| "rebound"
	| "joyLane"
	| "joyLanesLit"
	| "toyLane"
	| "toyLanesLit"
	| "cookieRollover"
	| "sleighBell"
	| "stockingLane"
	| "returnLane"
	| "outlane"
	| "spinner"
	| "reindeerTarget"
	| "reindeerBank"
	| "goldStarTarget"
	| "goldStarBank"
	| "giftTarget"
	| "giftBank"
	| "cookieTarget"
	| "cookieBank"
	| "letterTarget"
	| "icicleTarget"
	| "icicleBank"
	| "snowflakeTarget"
	| "snowflakeBank"
	| "weathervane"
	| "ramp"
	| "auroraChute"
	| "aurora"
	| "globe"
	| "coal"
	| "chimney"
	| "greenChimney"
	| "redChimney"
	| "goldChimney"
	| "lock"
	| "multiball"
	| "jackpot"
	| "missionSelected"
	| "missionStart"
	| "missionStep"
	| "missionDone"
	| "missionFailed"
	| "rankUp"
	| "kickback"
	| "ballSaved"
	| "drain"
	| "extraBall"
	| "nudge"
	| "tiltWarning"
	| "tilt";

/** The events a hit on each bank's targets fires, and completing the bank. */
const TARGET_EVENTS: Record<ITargetBank, [IPinballEvent, IPinballEvent | null]> = {
	reindeer: ["reindeerTarget", "reindeerBank"],
	goldStars: ["goldStarTarget", "goldStarBank"],
	gifts: ["giftTarget", "giftBank"],
	cookies: ["cookieTarget", "cookieBank"],
	letters: ["letterTarget", null],
	icicles: ["icicleTarget", "icicleBank"],
	snowflakes: ["snowflakeTarget", "snowflakeBank"],
	weathervane: ["weathervane", null],
};
/** Points for a hit on each bank's targets. */
const TARGET_POINTS: Record<ITargetBank, number> = {
	reindeer: 500,
	goldStars: 1500,
	gifts: 500,
	cookies: 750,
	letters: 1000,
	icicles: 750,
	snowflakes: 750,
	weathervane: 500,
};
/** Points for the bumpers at each level. */
const ATTACK_BUMPER_POINTS = [500, 1000, 1500, 2000];
const WORKSHOP_BUMPER_POINTS = [1500, 2500, 3500, 4500];
/** The reindeer's awards, in turn: lit spinners, the jackpot, the bonus, then bonus hold. */
export const REINDEER_AWARDS = ["Spinners lit", "Jackpot lit", "Bonus lit", "Bonus held"];
/** The gold stars' awards, completion by completion (then an extra ball). */
const GOLD_STAR_POINTS = [10000, 50000];
/** The aurora's levels: its kickout pays 10,000, the jackpot, the center post, extra balls, then the snow globe. */
export const AURORA_LEVELS = 4;

export type IBall = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** On the plunger, loose on the table, in a kickout, down a chimney, or riding the ramp. */
	at: "plunger" | "table" | "kickout" | "chimney" | "ramp";
	/** In a kickout or chimney: which. */
	hole: IKickoutId | IChimneyId | null;
	/** In a kickout or chimney: when it comes out. After: when it did, so it isn't caught again at once. */
	until: number;
	/** Riding the ramp: how far along, and how fast. */
	ramp: { along: number; speed: number } | null;
	/** Launched and still on its way up the lane and round the arch: when, and how far round it got. */
	launch: { at: number; furthest: number } | null;
	/** How long it's been barely moving (for the nudge). */
	stillFor: number;
};

export type IControl = IFlipperSide | "launch";
export type INudge = "left" | "right" | "up";

export type IPinballState = {
	time: number;
	balls: IBall[];
	/** Balls still to come, counting the one in play. */
	ballsLeft: number;
	ballNumber: number;
	score: number;
	flippers: Record<IFlipperSide, { angle: number; omega: number }>;
	held: Record<IControl, boolean>;
	/** How far back the plunger's pulled, 0 to 1. */
	pull: number;
	/** When things were last hit, by name (for the flashes and the debounce). */
	hitAt: Record<string, number>;
	joyLanes: boolean[];
	toyLanes: boolean[];
	/** The bumpers' levels (0 to 3), and when each drops back one. */
	attackLevel: number;
	attackDropsAt: number;
	workshopLevel: number;
	workshopDropsAt: number;
	/** Which targets are down (drop targets) or lit (standups), bank by bank. */
	targets: Record<ITargetBank, boolean[]>;
	/** How many of the reindeer's awards have been given, and how many gold star completions. */
	reindeerAwards: number;
	goldStarCompletions: number;
	spinnersLitUntil: number;
	jackpotLitUntil: number;
	bonusLitUntil: number;
	bonusHeld: boolean;
	/** Score multiplier (1 to 4), and when it drops back one. */
	multiplier: number;
	multiplierDropsAt: number;
	cookies: number;
	cookieDropsAt: number;
	kickbacks: Record<IFlipperSide, boolean>;
	destination: IChimneyId | null;
	locks: number;
	multiball: boolean;
	jackpot: number;
	aurora: number;
	auroraDropsAt: number;
	globeLit: boolean;
	extraBallLitUntil: number;
	centerPostUntil: number;
	ballSaveUntil: number;
	reflexUntil: number;
	/** The mission chosen but not yet accepted, and the one running (on which step, how many to go). */
	selected: IMission | null;
	mission: { mission: IMission; step: number; toGo: number } | null;
	rank: number;
	progress: number;
	/** The end-of-ball bonus so far. */
	bonus: number;
	/** How shaken the table is (from nudges), and whether it's tilted. */
	shake: number;
	tilted: boolean;
	/** The last nudge, for the drawing's shake. */
	nudge: { direction: INudge; at: number } | null;
	/** When the next ball goes on the plunger, while one's on its way. */
	serveAt: number | null;
	endsAt: number | null;
	/** A message for the display (big ones over the table too), until a time. */
	message: { text: string; until: number; big: boolean } | null;
	/** A burst of the table's lights, from big moments, until a time. */
	lightShow: { kind: "flash" | "chase"; until: number } | null;
	/** What's happened since the caller last cleared them, for the sounds. */
	events: IPinballEvent[];
	/** Whether extra balls can be earned (not in Elf Fling's chimney, where there's one ball, ever). */
	extraBalls: boolean;
	over: boolean;
};

export function newPinball(balls = 3, extraBalls = true): IPinballState {
	return {
		time: 0,
		balls: [],
		ballsLeft: balls,
		ballNumber: 0,
		score: 0,
		flippers: {
			left: { angle: FLIPPERS.left.rest, omega: 0 },
			right: { angle: FLIPPERS.right.rest, omega: 0 },
		},
		held: { left: false, right: false, launch: false },
		pull: 0,
		hitAt: {},
		joyLanes: JOY_LANES.map(() => false),
		toyLanes: TOY_LANES.map(() => false),
		attackLevel: 0,
		attackDropsAt: Infinity,
		workshopLevel: 0,
		workshopDropsAt: Infinity,
		targets: unlitTargets(),
		reindeerAwards: 0,
		goldStarCompletions: 0,
		spinnersLitUntil: -Infinity,
		jackpotLitUntil: -Infinity,
		bonusLitUntil: -Infinity,
		bonusHeld: false,
		multiplier: 1,
		multiplierDropsAt: Infinity,
		cookies: COOKIE_GAUGE,
		cookieDropsAt: Infinity,
		kickbacks: { left: false, right: false },
		destination: null,
		locks: 0,
		multiball: false,
		jackpot: JACKPOT_START,
		aurora: 0,
		auroraDropsAt: Infinity,
		globeLit: false,
		extraBallLitUntil: -Infinity,
		centerPostUntil: -Infinity,
		ballSaveUntil: -Infinity,
		reflexUntil: -Infinity,
		selected: null,
		mission: null,
		rank: 0,
		progress: 0,
		bonus: BONUS_START,
		shake: 0,
		tilted: false,
		nudge: null,
		serveAt: 0.3,
		endsAt: null,
		message: null,
		lightShow: null,
		events: [],
		extraBalls,
		over: false,
	};
}

function unlitTargets(): IPinballState["targets"] {
	return Object.fromEntries(
		TARGET_BANKS.map((bank) => [bank, TARGETS[bank].map(() => false)]),
	) as IPinballState["targets"];
}

/** Whether a ball is waiting on the plunger with nothing else in play (so any press launches). */
export function waitingToLaunch(state: IPinballState): boolean {
	return state.balls.length > 0 && state.balls.every((ball) => ball.at === "plunger");
}

/** Whether the center post is up, and whether it's about to drop. */
export function centerPostUp(state: IPinballState): { up: boolean; ending: boolean } {
	const left = state.centerPostUntil - state.time;

	return { up: left > 0, ending: left > 0 && left < CENTER_POST_WARNING };
}

/** Press or let go of a flipper button or the plunger. A flipper press moves the J-O-Y lights along. */
export function hold(state: IPinballState, control: IControl, down: boolean): IPinballState {
	if (state.held[control] === down) {
		return state;
	}

	const next = { ...state, held: { ...state.held, [control]: down } };

	if (down && control !== "launch" && !state.tilted) {
		const lanes = state.joyLanes;
		next.joyLanes =
			control === "left" ? [...lanes.slice(1), lanes[0]] : [lanes[lanes.length - 1], ...lanes.slice(0, -1)];
		next.events = [...state.events, "flip"];
	}

	return next;
}

/** Nudge the table: the balls get a shove, and too much shaking tilts it. */
export function nudge(state: IPinballState, direction: INudge): IPinballState {
	if (state.tilted || state.over) {
		return state;
	}

	const shove = { left: { x: NUDGE_SPEED, y: 0 }, right: { x: -NUDGE_SPEED, y: 0 }, up: { x: 0, y: -NUDGE_SPEED } }[
		direction
	];
	const next: IPinballState = {
		...state,
		balls: state.balls.map((ball) =>
			ball.at === "table" ? { ...ball, vx: ball.vx + shove.x, vy: ball.vy + shove.y } : ball,
		),
		shake: state.shake + 1,
		nudge: { direction, at: state.time },
		events: [...state.events, "nudge"],
	};

	if (next.shake >= SHAKE_TILT) {
		next.tilted = true;
		next.held = { ...next.held, left: false, right: false };
		next.events.push("tilt");
		next.message = { text: "Tilt", until: state.time + 3, big: true };
	} else if (next.shake >= SHAKE_WARNING) {
		next.events.push("tiltWarning");
		next.message = { text: "Danger", until: state.time + 1.5, big: false };
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
		balls: state.balls.map((ball) => ({
			...ball,
			ramp: ball.ramp && { ...ball.ramp },
			launch: ball.launch && { ...ball.launch },
		})),
		flippers: moveFlippers(state, dt),
		joyLanes: [...state.joyLanes],
		toyLanes: [...state.toyLanes],
		targets: Object.fromEntries(
			TARGET_BANKS.map((bank) => [bank, [...state.targets[bank]]]),
		) as IPinballState["targets"],
		kickbacks: { ...state.kickbacks },
		hitAt: { ...state.hitAt },
		mission: state.mission && { ...state.mission },
		shake: Math.max(0, state.shake - dt * SHAKE_SETTLES),
		events: [...state.events],
	};
	const firstEvent = s.events.length;

	if (s.endsAt !== null && s.time >= s.endsAt) {
		return { ...s, over: true };
	}

	if (s.serveAt !== null && s.time >= s.serveAt) {
		s.serveAt = null;
		s.ballNumber++;
		s.balls.push(newBall(PLUNGER.x, PLUNGER.y, "plunger"));
	}

	runClocks(s);
	pullPlunger(s, dt);
	const drained: IBall[] = [];

	for (const ball of s.balls) {
		if (ball.at === "ramp") {
			rideRamp(s, ball, dt);
		} else if (ball.at === "kickout" || ball.at === "chimney") {
			if (s.time >= ball.until) {
				leaveHole(ball, random);
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

	countMission(s, firstEvent, random);

	return s;
}

function newBall(x: number, y: number, at: IBall["at"]): IBall {
	return { x, y, vx: 0, vy: 0, at, hole: null, until: -Infinity, ramp: null, launch: null, stillFor: 0 };
}

function moveFlippers(state: IPinballState, dt: number): IPinballState["flippers"] {
	const move = (side: IFlipperSide) => {
		const { rest, raised } = FLIPPERS[side];
		const target = state.held[side] && !state.tilted ? raised : rest;
		const { angle } = state.flippers[side];
		const room = target - angle;
		const turn = Math.sign(room) * Math.min(Math.abs(room), FLIPPER_SPEED * dt);

		return { angle: angle + turn, omega: turn / dt };
	};

	return { left: move("left"), right: move("right") };
}

/** Scores `points` (times the multiplier) unless the table's tilted, and adds a tenth to the bonus. */
function fire(s: IPinballState, event: IPinballEvent, points = 0) {
	s.events.push(event);

	if (!s.tilted) {
		s.score += points * s.multiplier;
		s.bonus += Math.round(points / 10);
	}
}

function say(s: IPinballState, text: string, seconds: number, big = false) {
	s.message = { text, until: s.time + seconds, big };
}

function show(s: IPinballState, kind: "flash" | "chase", seconds: number) {
	s.lightShow = { kind, until: s.time + seconds };
}

/** Timed things: levels and the multiplier dropping back, the cookies going while a mission's on. */
function runClocks(s: IPinballState) {
	if (s.time >= s.attackDropsAt) {
		s.attackLevel = Math.max(0, s.attackLevel - 1);
		s.attackDropsAt = s.attackLevel > 0 ? s.time + BUMPER_LEVEL_SECONDS : Infinity;
	}

	if (s.time >= s.workshopDropsAt) {
		s.workshopLevel = Math.max(0, s.workshopLevel - 1);
		s.workshopDropsAt = s.workshopLevel > 0 ? s.time + BUMPER_LEVEL_SECONDS : Infinity;
	}

	if (s.time >= s.multiplierDropsAt) {
		s.multiplier = Math.max(1, s.multiplier - 1);
		s.multiplierDropsAt = s.multiplier > 1 ? s.time + MULTIPLIER_SECONDS : Infinity;
	}

	if (s.time >= s.auroraDropsAt) {
		s.aurora = Math.max(0, s.aurora - 1);
		s.auroraDropsAt = s.aurora > 0 ? s.time + AURORA_LEVEL_SECONDS : Infinity;
	}

	if (s.mission && s.time >= s.cookieDropsAt) {
		s.cookies = Math.max(0, s.cookies - 1);
		s.cookieDropsAt = s.time + COOKIE_SECONDS;

		if (s.cookies === 0) {
			s.mission = null;
			fire(s, "missionFailed");
			say(s, "Out of cookies: mission over", 2.5);
		}
	}
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
		ball.launch = { at: s.time, furthest: 0 };
		s.pull = 0;
		s.reflexUntil = s.time + REFLEX_SECONDS;
		fire(s, "launch");
	}
}

function moveBall(s: IPinballState, ball: IBall, dt: number, random: () => number) {
	const from = { x: ball.x, y: ball.y };

	if (s.globeLit) {
		pullTowardsGlobe(ball, dt);
	}

	ball.vy += GRAVITY * dt;
	ball.x += ball.vx * dt;
	ball.y += ball.vy * dt;
	collide(s, ball, random);

	const speed = Math.hypot(ball.vx, ball.vy);

	if (speed > MAX_SPEED) {
		ball.vx *= MAX_SPEED / speed;
		ball.vy *= MAX_SPEED / speed;
	}

	// Back down the plunger lane (a weak launch): onto the plunger again.
	if (ball.x > PLUNGER.left && ball.y >= PLUNGER.y - 4 && Math.abs(ball.vy) < 110) {
		Object.assign(ball, { x: PLUNGER.x, y: PLUNGER.y, vx: 0, vy: 0, at: "plunger", launch: null });

		return;
	}

	// Stuck somewhere? A nudge, up and to one side, gets it going again. Not down at the flippers,
	// where a ball held still is the player's (cradled on a raised flipper).
	ball.stillFor = speed < STILL_SPEED && ball.y < FLIPPER_ZONE ? ball.stillFor + dt : 0;

	if (ball.stillFor > NUDGE_AFTER) {
		ball.vx += (random() < 0.5 ? -1 : 1) * 167;
		ball.vy -= 194;
		ball.stillFor = 0;
	}

	if (ball.launch) {
		followLaunch(s, ball);
	}

	rollovers(s, ball, from);
	spinners(s, ball, from, speed);

	if (fallIntoHole(s, ball, speed)) {
		return;
	}

	if (ball.vy < -RAMP_ENTRY_SPEED && inBox(ball, RAMP.mouth)) {
		boardRamp(s, ball, speed);

		return;
	}

	for (const side of FLIPPER_SIDES) {
		const outlane = LOWER_LANES.middle - LOWER_LANES.outlane;
		const inOutlane = side === "left" ? ball.x < LOWER_LANES.middle - outlane : ball.x > LOWER_LANES.middle + outlane;

		if (s.kickbacks[side] && inOutlane && ball.y > KICKBACK_Y) {
			ball.vx = side === "left" ? 20 : -20;
			ball.vy = -KICKBACK_SPEED;
			s.kickbacks[side] = false;
			fire(s, "kickback");
			say(s, "Kickback!", 1.2);
		}
	}
}

/** The lit snow globe's pull (Space Cadet's gravity well): stronger the nearer the ball. */
function pullTowardsGlobe(ball: IBall, dt: number) {
	const { x, y } = KICKOUTS.globe;
	const dx = x - ball.x;
	const dy = y - ball.y;
	const distance = Math.hypot(dx, dy);

	if (distance < GLOBE_PULL_REACH && distance > 1) {
		const pull = GLOBE_PULL * (1 - distance / GLOBE_PULL_REACH);
		ball.vx += (dx / distance) * pull * dt;
		ball.vy += (dy / distance) * pull * dt;
	}
}

/** Bounces the ball off everything it's touching, scoring as it goes. */
function collide(s: IPinballState, ball: IMovingBall, random: () => number) {
	for (const wall of WALLS) {
		bounceOffSegment(ball, wall, BALL_RADIUS, 0.45);
	}

	bounceOffGate(ball, GATE, BALL_RADIUS);

	if (centerPostUp(s).up) {
		bounceOffSegment(ball, CENTER_POST_SEGMENT, BALL_RADIUS + CENTER_POST.radius, 0.5);
	}

	SLINGSHOTS.forEach((sling, index) => {
		if (bounceOffSegment(ball, sling, BALL_RADIUS, 0.5, SLINGSHOT_KICK) && fresh(s, `sling${index}`)) {
			fire(s, "slingshot", 500);
		}
	});

	REBOUNDS.forEach((rebound, index) => {
		if (bounceOffSegment(ball, rebound, BALL_RADIUS, 0.5, SLINGSHOT_KICK) && fresh(s, `rebound${index}`)) {
			fire(s, "rebound", 500);
		}
	});

	[...BAUBLE_BUMPERS, STAR_BUMPER].forEach((bumper, index) => {
		if (bounceOffBumper(ball, bumper, BALL_RADIUS, BUMPER_KICK)) {
			scatter(ball, random);
			s.hitAt[`attack${index}`] = s.time;
			s.jackpot += JACKPOT_PER_BUMPER;

			if (bumper === STAR_BUMPER) {
				s.events.push("starBumper");
			}

			fire(s, "attackBumper", ATTACK_BUMPER_POINTS[s.attackLevel]);
		}
	});

	WORKSHOP_BUMPERS.forEach((bumper, index) => {
		if (bounceOffBumper(ball, bumper, BALL_RADIUS, WORKSHOP_KICK)) {
			scatter(ball, random);
			s.hitAt[`workshop${index}`] = s.time;
			fire(s, "workshopBumper", WORKSHOP_BUMPER_POINTS[s.workshopLevel]);
		}
	});

	for (const bank of TARGET_BANKS) {
		TARGETS[bank].forEach((target, index) => {
			if (DROP_BANKS.includes(bank) && s.targets[bank][index]) {
				return;
			}

			if (bounceOffSegment(ball, target, BALL_RADIUS, 0.5) && fresh(s, `${bank}${index}`)) {
				hitTarget(s, bank, index);
			}
		});
	}

	for (const side of FLIPPER_SIDES) {
		const { pivot, radius } = FLIPPERS[side];
		const flipper = s.flippers[side];
		bounceOffFlipper(ball, pivot, flipperTip(side, flipper.angle), flipper.omega, BALL_RADIUS + radius);
	}
}

/**
 * A pop bumper's kick is never quite straight out from its middle on a real table: turned a
 * few degrees either way, so a ball can't bounce between two in a perfect line forever.
 */
function scatter(ball: IMovingBall, random: () => number) {
	const turn = (random() - 0.5) * BUMPER_SCATTER;
	const cos = Math.cos(turn);
	const sin = Math.sin(turn);
	Object.assign(ball, { vx: ball.vx * cos - ball.vy * sin, vy: ball.vx * sin + ball.vy * cos });
}

/** Whether a hit on `name` is a new one (not the same hit, still touching), noting it. */
function fresh(s: IPinballState, name: string): boolean {
	const isNew = s.time - (s.hitAt[name] ?? -Infinity) > DEBOUNCE;
	s.hitAt[name] = s.time;

	return isNew;
}

/** A target hit: lit (or knocked down), and what completing its bank does. */
function hitTarget(s: IPinballState, bank: ITargetBank, index: number) {
	const [hitEvent, bankEvent] = TARGET_EVENTS[bank];
	fire(s, hitEvent, TARGET_POINTS[bank]);

	if (bank === "letters") {
		selectMission(s, index);

		return;
	}

	if (bank === "weathervane") {
		const next = s.destination === null ? 0 : (CHIMNEY_IDS.indexOf(s.destination) + 1) % CHIMNEY_IDS.length;
		s.destination = CHIMNEY_IDS[next];
		say(s, `Delivering to the ${s.destination} chimney`, 1.5);

		return;
	}

	s.targets[bank][index] = true;

	if (!s.targets[bank].every(Boolean) || bankEvent === null) {
		return;
	}

	s.targets[bank] = s.targets[bank].map(() => false);

	if (bank === "reindeer") {
		completeReindeer(s);
	} else if (bank === "goldStars") {
		const completion = s.goldStarCompletions++;

		// Without extra balls, the third and later pay the second's points again.
		if (completion < GOLD_STAR_POINTS.length || !s.extraBalls) {
			const points = GOLD_STAR_POINTS[Math.min(completion, GOLD_STAR_POINTS.length - 1)];
			fire(s, bankEvent, points);
			say(s, `Gold stars: ${points.toLocaleString()}`, 1.8);
		} else {
			fire(s, bankEvent);
			extraBall(s);
		}
	} else if (bank === "gifts") {
		s.multiplier = Math.min(MAX_MULTIPLIER, s.multiplier + 1);
		s.multiplierDropsAt = s.time + MULTIPLIER_SECONDS;
		fire(s, bankEvent, 1500);
		say(s, `Score ${s.multiplier}x`, 1.8, true);
	} else if (bank === "cookies") {
		s.cookies = COOKIE_GAUGE;
		fire(s, bankEvent, 5000);
		say(s, "Cookies full", 1.5);
	} else {
		const side = bank === "icicles" ? "left" : "right";
		s.kickbacks[side] = true;
		fire(s, bankEvent, 5000);
		say(s, `${side === "left" ? "Left" : "Right"} kickback lit`, 1.8);
	}
}

/** All the reindeer down (booster targets): the next of their awards. */
function completeReindeer(s: IPinballState) {
	const award = s.reindeerAwards % REINDEER_AWARDS.length;
	s.reindeerAwards++;

	if (award === 0) {
		s.spinnersLitUntil = s.time + LIT_SECONDS;
	} else if (award === 1) {
		s.jackpotLitUntil = s.time + LIT_SECONDS;
	} else if (award === 2) {
		s.bonusLitUntil = s.time + LIT_SECONDS;
	} else {
		s.bonusHeld = true;
	}

	fire(s, "reindeerBank", 5000);
	say(s, REINDEER_AWARDS[award], 1.8);
}

/** The rollovers the ball crossed since `from`: lanes, the plunger lane's cookies, the stocking lane. */
function rollovers(s: IPinballState, ball: IBall, from: { x: number; y: number }) {
	const crossed = (y: number) => (from.y - y) * (ball.y - y) <= 0 && from.y !== ball.y;

	if (crossed(JOY_TRIGGER_Y)) {
		const lane = JOY_LANES.findIndex((x) => Math.abs(ball.x - x) < 15);

		if (lane >= 0) {
			s.joyLanes[lane] = true;
			fire(s, "joyLane", 2000);

			if (s.joyLanes.every(Boolean)) {
				s.joyLanes = s.joyLanes.map(() => false);
				s.attackLevel = Math.min(MAX_BUMPER_LEVEL, s.attackLevel + 1);
				s.attackDropsAt = s.time + BUMPER_LEVEL_SECONDS;
				fire(s, "joyLanesLit", 5000);
				say(s, `Bumpers to level ${s.attackLevel + 1}`, 1.5);
			}
		}
	}

	if (crossed(TOY_TRIGGER_Y) && ball.x < STOCKING_LANE.right && ball.vy > 0) {
		const lane = TOY_LANES.findIndex((x) => Math.abs(ball.x - x) < 17);

		if (lane >= 0) {
			s.toyLanes[lane] = true;
			fire(s, "toyLane", 500);

			if (s.toyLanes.every(Boolean)) {
				s.toyLanes = s.toyLanes.map(() => false);
				s.workshopLevel = Math.min(MAX_BUMPER_LEVEL, s.workshopLevel + 1);
				s.workshopDropsAt = s.time + BUMPER_LEVEL_SECONDS;
				fire(s, "toyLanesLit", 5000);
				say(s, `Workshop to level ${s.workshopLevel + 1}`, 1.5);
			}
		}
	}

	// Up the plunger lane, over the cookies.
	if (ball.x > PLUNGER.left && ball.vy < 0) {
		for (const y of COOKIE_ROLLOVERS) {
			if (crossed(y)) {
				s.cookies = Math.min(COOKIE_GAUGE, s.cookies + 1);
				s.hitAt[`cookieRollover${y}`] = s.time;
				fire(s, "cookieRollover", 500);
			}
		}
	}

	if (crossed(SLEIGH_BELL_ROLLOVER.y) && ball.x < SLEIGH_BELL_ROLLOVER.right && fresh(s, "sleighBell")) {
		fire(s, "sleighBell", 10000);
	}

	if (crossed(STOCKING_LANE.y) && ball.x < STOCKING_LANE.right && ball.vy > 0) {
		if (s.time < s.bonusLitUntil) {
			s.bonusLitUntil = -Infinity;
			fire(s, "stockingLane", s.bonus);
			say(s, `Bonus collected: ${s.bonus.toLocaleString()}`, 2);
			s.bonus = BONUS_START;
		} else {
			fire(s, "stockingLane", 10000);
		}
	}

	if (crossed(LOWER_LANES.y) && ball.vy > 0) {
		const fromMiddle = Math.abs(ball.x - LOWER_LANES.middle);

		if (fromMiddle > LOWER_LANES.middle - LOWER_LANES.outlane) {
			s.hitAt[ball.x < LOWER_LANES.middle ? "leftOutlane" : "rightOutlane"] = s.time;
			fire(s, "outlane", 10000);

			if (s.time < s.extraBallLitUntil) {
				s.extraBallLitUntil = -Infinity;
				extraBall(s);
			}
		} else if (fromMiddle > LOWER_LANES.middle - LOWER_LANES.returnLane) {
			s.hitAt[ball.x < LOWER_LANES.middle ? "leftReturnLane" : "rightReturnLane"] = s.time;
			fire(s, "returnLane", 5000);
		}
	}
}

/** Through a spinner: it spins for how fast the ball went, each turn scoring. */
function spinners(s: IPinballState, ball: IBall, from: { x: number; y: number }, speed: number) {
	for (const id of SPINNER_IDS) {
		const { a, b } = SPINNERS[id];

		if ((from.y - a.y) * (ball.y - a.y) <= 0 && from.y !== ball.y && ball.x > a.x && ball.x < b.x) {
			const turns = Math.max(1, Math.round(speed / 200));
			s.hitAt[`spinner-${id}`] = s.time;
			s.hitAt[`spinner-${id}-turns`] = turns;

			for (let turn = 0; turn < turns; turn++) {
				fire(s, "spinner", s.time < s.spinnersLitUntil ? 2500 : 500);
			}

			if (id === "aurora" && ball.vy < 0) {
				shootAuroraChute(s);
			}
		}
	}
}

/** Up the aurora chute: the next aurora light. */
function shootAuroraChute(s: IPinballState) {
	s.aurora = Math.min(AURORA_LEVELS, s.aurora + 1);
	s.auroraDropsAt = s.time + AURORA_LEVEL_SECONDS;
	fire(s, "auroraChute", 5000);
	say(s, `Aurora level ${s.aurora}`, 1.2);
}

/** The launched ball on its way round: how far round the arch it's got, and the skill shot once it's in play. */
function followLaunch(s: IPinballState, ball: IBall) {
	const launch = ball.launch!;

	if (ball.y < 170) {
		launch.furthest = Math.max(launch.furthest, archAngle(ball));
	}

	if ((ball.x < PLUNGER.left && ball.y > 240) || s.time - launch.at > LAUNCH_SECONDS) {
		ball.launch = null;
		s.ballSaveUntil = Math.max(s.ballSaveUntil, s.time + BALL_SAVE);
		const lit = 1 + SKILL_GATES.archAngles.filter((angle) => launch.furthest >= angle).length;
		fire(s, "skillShot", SKILL_SHOT_POINTS[lit - 1]);
		say(s, `Skill shot: ${SKILL_SHOT_POINTS[lit - 1].toLocaleString()}`, 1.6, lit === 3);
	}
}

/** Into a kickout or a chimney, if the ball's over one and slow enough. */
function fallIntoHole(s: IPinballState, ball: IBall, speed: number): boolean {
	const rested = s.time > ball.until + KICKOUT_REST;

	for (const id of KICKOUT_IDS) {
		const hole = KICKOUTS[id];
		const slowEnough = id === "aurora" || speed < KICKOUT_CATCH_SPEED;

		if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius && slowEnough && rested) {
			Object.assign(ball, {
				x: hole.x,
				y: hole.y,
				vx: 0,
				vy: 0,
				at: "kickout",
				hole: id,
				until: s.time + KICKOUT_HOLD,
			});
			kickout(s, id);

			return true;
		}
	}

	for (const id of CHIMNEY_IDS) {
		const chimney = CHIMNEYS[id];

		if (Math.hypot(ball.x - chimney.x, ball.y - chimney.y) < chimney.radius && speed < CHIMNEY_CATCH_SPEED && rested) {
			downChimney(s, ball, id);

			return true;
		}
	}

	return false;
}

/** A kickout's award. */
function kickout(s: IPinballState, id: IKickoutId) {
	if (id === "coal") {
		fire(s, "coal", 20000);
		say(s, "Coal bin", 1.2);
	} else if (id === "aurora") {
		auroraKickout(s);
	} else if (s.globeLit) {
		s.globeLit = false;
		s.multiplier = Math.min(MAX_MULTIPLIER, s.multiplier + 1);
		s.multiplierDropsAt = s.time + MULTIPLIER_SECONDS;
		fire(s, "globe", 100000);
		say(s, `Snow globe! Score ${s.multiplier}x`, 2, true);
		show(s, "chase", 1.5);
	} else {
		fire(s, "globe", 50000);
		say(s, "Snow globe", 1.2);
	}
}

/** The aurora kickout (hyperspace kickout): its award by the level lit. */
function auroraKickout(s: IPinballState) {
	const level = s.aurora;

	if (level === 0) {
		fire(s, "aurora", 10000);
		say(s, "Aurora", 1.2);
	} else if (level === 1) {
		fire(s, "aurora", s.jackpot);
		say(s, `Aurora jackpot: ${s.jackpot.toLocaleString()}`, 2, true);
		s.jackpot = JACKPOT_START;
		show(s, "flash", 1);
	} else if (level === 2) {
		s.centerPostUntil = s.time + CENTER_POST_SECONDS + CENTER_POST_WARNING;
		fire(s, "aurora", 20000);
		say(s, "Center post up", 1.8);
	} else if (level === 3) {
		fire(s, "aurora", 50000);

		if (s.extraBalls) {
			s.extraBallLitUntil = s.time + EXTRA_BALL_LIT_SECONDS;
			say(s, "Extra ball lit in the outlanes", 2);
		} else {
			say(s, "Aurora: 50,000", 1.5);
		}
	} else {
		s.aurora = 0;
		s.auroraDropsAt = Infinity;
		s.globeLit = true;
		fire(s, "aurora", 150000);
		say(s, "Northern lights! Snow globe lit", 2.5, true);
		show(s, "chase", 2);
	}
}

/**
 * Down a chimney (wormhole): out of the lit one a moment later (or the same, if none is lit).
 * The lit one pays more and locks a ball; the third lock is multiball. In multiball, it's the
 * jackpot.
 */
function downChimney(s: IPinballState, ball: IBall, id: IChimneyId) {
	const exit = s.destination ?? id;
	const out = CHIMNEYS[exit];
	Object.assign(ball, { x: out.x, y: out.y, vx: 0, vy: 0, at: "chimney", hole: exit, until: s.time + CHIMNEY_TRAVEL });
	s.events.push(`${id}Chimney` as IPinballEvent);

	if (s.destination === null) {
		fire(s, "chimney", 2500);
	} else if (s.destination !== id) {
		fire(s, "chimney", 7500);
		say(s, `Out of the ${s.destination} chimney`, 1.2);
	} else if (s.multiball) {
		fire(s, "chimney", 5000);
		fire(s, "jackpot", s.jackpot);
		say(s, `Jackpot! ${s.jackpot.toLocaleString()}`, 2, true);
		s.jackpot = JACKPOT_START;
		show(s, "flash", 1.2);
	} else {
		fire(s, "chimney", 5000);
		s.locks++;
		// The next delivery's to the next chimney along.
		s.destination = CHIMNEY_IDS[(CHIMNEY_IDS.indexOf(id) + 1) % CHIMNEY_IDS.length];

		if (s.locks < LOCKS_FOR_MULTIBALL) {
			fire(s, "lock", 10000);
			say(s, `Present ${s.locks} delivered`, 1.8);

			return;
		}

		s.locks = 0;
		s.multiball = true;
		s.ballSaveUntil = s.time + MULTIBALL_SAVE;

		// The other balls come out of the other chimneys, one after another.
		CHIMNEY_IDS.filter((other) => other !== exit)
			.slice(0, MULTIBALL_BALLS - 1)
			.forEach((other, index) => {
				const hole = CHIMNEYS[other];
				s.balls.push({
					...newBall(hole.x, hole.y, "chimney"),
					hole: other,
					until: s.time + CHIMNEY_TRAVEL + (index + 1) * 0.8,
				});
			});

		fire(s, "multiball", 50000);
		say(s, "Multiball!", 2.5, true);
		show(s, "flash", 2.5);
	}
}

/** Out of a kickout or chimney, along its way out (give or take a little). */
function leaveHole(ball: IBall, random: () => number) {
	const hole = ball.at === "kickout" ? KICKOUTS[ball.hole as IKickoutId] : CHIMNEYS[ball.hole as IChimneyId];
	const wobble = 1 + (random() - 0.5) * 0.15;
	Object.assign(ball, { at: "table", vx: hole.out.x * wobble, vy: hole.out.y * wobble, hole: null });
}

/**
 * Onto the sleigh ramp (launch ramp): points, the reflex shot soon after a launch, the jackpot
 * when the reindeer lit it, a full cookie gauge, and it accepts a chosen mission.
 */
function boardRamp(s: IPinballState, ball: IBall, speed: number) {
	ball.at = "ramp";
	ball.ramp = { along: 0, speed: Math.max(RAMP_MIN_SPEED, speed * 0.8) };
	ball.launch = null;
	s.cookies = COOKIE_GAUGE;

	if (s.time < s.reflexUntil) {
		s.reflexUntil = -Infinity;
		fire(s, "ramp", 25000);
		say(s, "Reflex shot: 25,000", 1.5);
	} else {
		fire(s, "ramp", 5000);
	}

	if (s.time < s.jackpotLitUntil) {
		s.jackpotLitUntil = -Infinity;
		fire(s, "jackpot", s.jackpot);
		say(s, `Jackpot! ${s.jackpot.toLocaleString()}`, 2, true);
		s.jackpot = JACKPOT_START;
		show(s, "flash", 1);
	}

	if (s.selected && !s.mission) {
		s.mission = { mission: s.selected, step: 0, toGo: s.selected.steps[0].goal };
		s.selected = null;
		s.cookieDropsAt = s.time + COOKIE_SECONDS;
		fire(s, "missionStart");
		say(s, `Mission: ${s.mission.mission.name}`, 2.5, true);
	}
}

/** Along the ramp at its own pace, then off the end into the workshop. */
function rideRamp(s: IPinballState, ball: IBall, dt: number) {
	const along = ball.ramp!.along + ball.ramp!.speed * dt;
	s.hitAt.ramp = s.time;

	if (along >= RAMP.length) {
		const end = RAMP.path[RAMP.path.length - 1];
		Object.assign(ball, { at: "table", ramp: null, x: end.x, y: end.y, vx: 0, vy: RAMP_EXIT_SPEED });

		return;
	}

	ball.ramp!.along = along;
	Object.assign(ball, rampPoint(along), { stillFor: 0 });
}

/** A letter target: the mission it chooses at this rank, to accept on the ramp. */
function selectMission(s: IPinballState, index: number) {
	if (s.mission) {
		return;
	}

	s.selected = missionsAtRank(s.rank)[index];
	s.targets.letters = s.targets.letters.map((_, letter) => letter === index);
	fire(s, "missionSelected");
	say(s, `${s.selected.name}: shoot the ramp to accept`, 2.5);
}

/** The running mission, counted on by this step's events: a step done, the mission done, a rank up. */
function countMission(s: IPinballState, firstEvent: number, random: () => number) {
	if (!s.mission || s.tilted) {
		return;
	}

	const { mission } = s.mission;
	const { events } = mission.steps[s.mission.step];
	s.mission.toGo -= s.events.slice(firstEvent).filter((event) => events.includes(event)).length;

	if (s.mission.toGo > 0) {
		return;
	}

	if (s.mission.step + 1 < mission.steps.length) {
		s.mission.step++;
		s.mission.toGo = mission.steps[s.mission.step].goal;
		fire(s, "missionStep");
		say(s, mission.steps[s.mission.step].hint, 2);

		return;
	}

	s.mission = null;
	s.targets.letters = s.targets.letters.map(() => false);
	fire(s, "missionDone", mission.points);
	say(s, `Mission done: ${mission.points.toLocaleString()}`, 2.5, true);
	show(s, "chase", 2);
	s.progress += mission.progress;

	while (s.progress >= PROGRESS_RING.count && s.rank < RANKS.length - 1) {
		s.progress -= PROGRESS_RING.count;
		s.rank++;
		fire(s, "rankUp");
		say(s, `Promoted to ${RANKS[s.rank]}`, 3, true);
		show(s, "flash", 2.5);
	}

	s.progress = Math.min(s.progress, PROGRESS_RING.count);

	// Near the top, now and then a secret delivery comes next, ready to accept.
	if (mission !== CHRISTMAS_EVE && s.rank >= RANKS.length - 2 && random() < 1 / 3) {
		s.selected = SECRET_MISSIONS[Math.floor(random() * SECRET_MISSIONS.length)];
		say(s, `${s.selected.name}: shoot the ramp`, 3);
	}
}

function extraBall(s: IPinballState) {
	s.ballsLeft++;
	fire(s, "extraBall");
	say(s, "Extra ball!", 2, true);
	show(s, "flash", 1.5);
}

/**
 * Balls down past the flippers. Saved ones come back; otherwise they're gone, multiball ends
 * when one's left, and when none are, so is the ball: the bonus is paid (not on a tilt), and
 * the next one goes on the plunger (or that was the last).
 */
function drain(s: IPinballState, drained: IBall[]) {
	s.balls = s.balls.filter((ball) => !drained.includes(ball));

	if (s.time < s.ballSaveUntil && !s.tilted) {
		drained.forEach(() => {
			fire(s, "ballSaved");
			say(s, "Shoot again!", 1.5);

			if (s.multiball) {
				const exit = s.destination ?? "gold";
				const hole = CHIMNEYS[exit];
				s.balls.push({ ...newBall(hole.x, hole.y, "chimney"), hole: exit, until: s.time + 0.6 });
			} else {
				s.balls.push(newBall(PLUNGER.x, PLUNGER.y, "plunger"));
			}
		});

		return;
	}

	if (s.multiball && s.balls.length <= 1) {
		s.multiball = false;
		say(s, "Multiball over", 1.5);
	}

	if (s.balls.length > 0) {
		return;
	}

	const bonus = s.tilted ? 0 : s.bonus;
	s.events.push("drain");
	s.score += bonus;
	say(s, s.tilted ? "Tilted: no bonus" : `Bonus ${bonus.toLocaleString()}`, 2.2);

	if (s.mission) {
		s.mission = null;
		s.events.push("missionFailed");
	}

	s.bonus = s.bonusHeld ? s.bonus : BONUS_START;
	s.bonusHeld = false;
	s.tilted = false;
	s.shake = 0;
	s.centerPostUntil = -Infinity;
	s.ballsLeft--;

	if (s.ballsLeft > 0) {
		s.serveAt = s.time + SERVE_DELAY;
	} else {
		s.endsAt = s.time + GAME_OVER_DELAY;
	}
}
