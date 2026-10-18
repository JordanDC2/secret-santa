import type { IPinballEvent } from "Components/Pinball/pinball";

/**
 * Christmas pinball's missions and ranks, after Space Cadet's. A letter target chooses a
 * mission from those at the player's rank, and the sleigh ramp accepts it; it runs on cookies
 * (Space Cadet's fuel), which go one by one while it's on. Each mission is steps of hitting
 * things: `goal` of any of `events`. Done, it pays `points` and fills `progress` of the
 * progress lights round the snow globe; a full ring is a rank up.
 */

export type IMission = {
	name: string;
	steps: Array<{ goal: number; events: IPinballEvent[]; hint: string }>;
	points: number;
	progress: number;
};

const ROLLOVERS: IPinballEvent[] = [
	"joyLane",
	"toyLane",
	"cookieRollover",
	"sleighBell",
	"stockingLane",
	"returnLane",
	"outlane",
];
const DROP_TARGETS: IPinballEvent[] = ["reindeerTarget", "goldStarTarget", "giftTarget"];
const STANDUPS: IPinballEvent[] = ["cookieTarget", "letterTarget", "icicleTarget", "snowflakeTarget", "weathervane"];
const BUMPERS: IPinballEvent[] = ["attackBumper"];

function mission(name: string, points: number, progress: number, ...steps: IMission["steps"]): IMission {
	return { name, steps, points, progress };
}

/**
 * The missions by tier, three to a tier, one for each letter target. The tier is the
 * player's rank: Elf, then two ranks to each tier after.
 */
export const MISSION_TIERS: IMission[][] = [
	[
		// Practice mission, launch training, re-entry training.
		mission("Practice run", 500000, 6, { goal: 8, events: BUMPERS, hint: "Hit the bumpers" }),
		mission("Sleigh training", 500000, 6, { goal: 3, events: ["ramp"], hint: "Ride the sleigh ramp" }),
		mission("Rooftop landing", 500000, 6, { goal: 3, events: ["joyLane"], hint: "Roll through the J-O-Y lanes" }),
	],
	[
		// Science mission, stray comet, black hole threat.
		mission("Toy testing", 750000, 9, { goal: 9, events: DROP_TARGETS, hint: "Knock down drop targets" }),
		mission(
			"Stray reindeer",
			1000000,
			8,
			{ goal: 1, events: ["snowflakeBank"], hint: "Hit all the snowflakes" },
			{ goal: 1, events: ["aurora"], hint: "Shoot the aurora" },
		),
		mission(
			"Coal crisis",
			1000000,
			8,
			{ goal: 1, events: ["toyLanesLit"], hint: "Light the toy lanes" },
			{ goal: 1, events: ["coal"], hint: "Sink the coal bin" },
		),
	],
	[
		// Space radiation, bug hunt, alien menace.
		mission(
			"Blizzard warning",
			1000000,
			8,
			{ goal: 1, events: ["icicleBank"], hint: "Hit all the icicles" },
			{ goal: 1, events: ["chimney"], hint: "Go down a chimney" },
		),
		mission("Elf on the shelf", 750000, 7, {
			goal: 15,
			events: [...DROP_TARGETS, ...STANDUPS],
			hint: "Hit any targets",
		}),
		mission(
			"Grinch raid",
			750000,
			7,
			{ goal: 1, events: ["starBumper"], hint: "Hit the star" },
			{ goal: 8, events: BUMPERS, hint: "Hit the bumpers" },
		),
	],
	[
		// Rescue, satellite, reconnaissance.
		mission(
			"Rescue Rudolph",
			750000,
			7,
			{ goal: 1, events: ["reindeerBank"], hint: "Knock down all the reindeer" },
			{ goal: 2, events: ["aurora"], hint: "Shoot the aurora" },
		),
		mission("Star topper", 1250000, 9, { goal: 3, events: ["starBumper"], hint: "Hit the star" }),
		mission("Checking the list", 1250000, 9, { goal: 15, events: ROLLOVERS, hint: "Roll over any lanes" }),
	],
	[
		// Doomsday machine, cosmic plague, time warp.
		mission("Workshop meltdown", 1250000, 9, { goal: 3, events: ["outlane"], hint: "Go down the outlanes" }),
		mission(
			"Snowball fight",
			1750000,
			11,
			{ goal: 75, events: ["spinner"], hint: "Spin the spinners" },
			{ goal: 1, events: ["sleighBell"], hint: "Ring the sleigh bells" },
		),
		mission(
			"Christmas countdown",
			2000000,
			12,
			{ goal: 25, events: ["slingshot", "rebound"], hint: "Hit the rebounds" },
			{ goal: 1, events: ["ramp"], hint: "Ride the sleigh ramp" },
		),
	],
];

/** Secret missions: one may follow a mission done at the top tier, down one chimney. */
export const SECRET_MISSIONS: IMission[] = [
	mission("Secret delivery: green", 1500000, 10, { goal: 1, events: ["greenChimney"], hint: "The green chimney" }),
	mission("Secret delivery: red", 1500000, 10, { goal: 1, events: ["redChimney"], hint: "The red chimney" }),
	mission("Secret delivery: gold", 1500000, 10, { goal: 1, events: ["goldChimney"], hint: "The gold chimney" }),
];

/** Maelstrom: the last mission, chosen by any letter at the top rank. */
export const CHRISTMAS_EVE = mission(
	"Christmas Eve",
	5000000,
	18,
	{ goal: 3, events: DROP_TARGETS, hint: "Knock down drop targets" },
	{ goal: 3, events: STANDUPS, hint: "Hit standup targets" },
	{ goal: 5, events: ROLLOVERS, hint: "Roll over any lanes" },
	{ goal: 1, events: ["sleighBell"], hint: "Ring the sleigh bells" },
	{ goal: 1, events: ["ramp"], hint: "Ride the sleigh ramp" },
	{ goal: 1, events: ["spinner"], hint: "Spin a spinner" },
	{ goal: 1, events: ["chimney"], hint: "Go down a chimney" },
	{ goal: 1, events: ["aurora"], hint: "Shoot the aurora" },
);

/** The ranks (Space Cadet's run Cadet to Fleet Admiral): the rank lights round the snow globe. */
export const RANKS = [
	"Elf",
	"Toy maker",
	"Gift wrapper",
	"Reindeer handler",
	"Sleigh pilot",
	"Head elf",
	"Workshop chief",
	"Santa's deputy",
	"Santa",
];

/** The missions a letter target can choose at a rank. */
export function missionsAtRank(rank: number): IMission[] {
	if (rank >= RANKS.length - 1) {
		return [CHRISTMAS_EVE, CHRISTMAS_EVE, CHRISTMAS_EVE];
	}

	return MISSION_TIERS[Math.min(MISSION_TIERS.length - 1, Math.ceil(rank / 2))];
}
