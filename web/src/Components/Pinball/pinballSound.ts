/**
 * Christmas pinball's sounds, made on the spot with Web Audio like Elf Fling's: classic table
 * noises (the flipper's clack, the bumper's pop, bells, the knocker for an extra ball) and a
 * trap-style chiptune of Jingle Bells (public domain, 1857) looping under the game.
 */

import { audioNow, hiss, tone } from "Components/ElfFling/sound";
import type { IPinballEvent } from "Components/Pinball/pinball";

/** A run of tones one after another: [pitch, at (seconds)]. */
function run(type: OscillatorType, notes: Array<[number, number]>, length: number, volume: number) {
	notes.forEach(([pitch, at]) => tone(type, pitch, pitch, length, volume, at));
}

/** A thunk: the knocker, a kickback, a ball locked. */
function knock(delay = 0) {
	tone("sine", 75, 38, 0.25, 0.9, delay);
	hiss("lowpass", 500, 0.12, 0.6, delay);
}

// The classic table noises, synthesised.
/** A flipper's solenoid: a short, hard clack. */
function clack() {
	hiss("lowpass", 1400, 0.05, 0.6);
	tone("square", 110, 60, 0.06, 0.25);
}

/** A pop bumper: the bright electronic pop of an old table. */
function pop(pitch = 920) {
	tone("square", pitch, pitch / 2, 0.09, 0.22);
	hiss("highpass", 3000, 0.04, 0.4);
}

function blip(pitch: number) {
	run(
		"square",
		[
			[pitch, 0],
			[pitch * 1.33, 0.05],
		],
		0.06,
		0.12,
	);
}

/** A drop target going down: a thunk. */
function drop() {
	tone("square", 300, 120, 0.08, 0.2);
	hiss("lowpass", 900, 0.06, 0.4);
}

/** A bell: a two-tone ding (higher for glassy things). */
function ding(pitch = 1568) {
	tone("sine", pitch, pitch, 0.45, 0.22);
	tone("sine", pitch * 1.5, pitch * 1.5, 0.35, 0.12, 0.01);
}

/** Up a run of notes. */
function arpeggio(notes: number[], gap = 0.07, length = 0.12) {
	run(
		"square",
		notes.map((pitch, index) => [pitch, index * gap]),
		length,
		0.14,
	);
}

/** A ramp or chute: a rising whirr. */
function whirr(from: number, to: number) {
	tone("sawtooth", from, to, 0.6, 0.07);
	hiss("bandpass", 1400, 0.6, 0.12, 0, 3600);
}

/** Into a hole: a thud and a rattle. */
function thud(pitch = 140) {
	tone("sine", pitch, pitch * 0.43, 0.2, 0.5);
	hiss("bandpass", 600, 0.25, 0.3);
}

/** A buzzer, for the tilt. */
function buzz(length: number) {
	tone("sawtooth", 110, 104, length, 0.18);
	tone("square", 55, 52, length, 0.12);
}

const FANFARE = [523, 659, 784, 1047, 784, 1047];

/** Each event's sound. */
const SOUNDS: Record<IPinballEvent, () => void> = {
	flip: clack,
	// The plunger's spring letting go.
	launch: () => {
		hiss("bandpass", 900, 0.18, 0.5, 0, 300);
		tone("triangle", 220, 90, 0.15, 0.3);
	},
	skillShot: () => arpeggio([784, 1047, 1319, 1568, 2093], 0.1, 0.18),
	attackBumper: () => pop(),
	starBumper: () => ding(2093),
	// The workshop's toy drums: a lower pop.
	workshopBumper: () => pop(520),
	slingshot: () => tone("square", 620, 300, 0.05, 0.18),
	rebound: () => tone("square", 700, 340, 0.05, 0.16),
	joyLane: () => blip(1320),
	joyLanesLit: () => arpeggio([1047, 1319, 1568, 2093]),
	toyLane: () => blip(880),
	toyLanesLit: () => arpeggio([659, 784, 988, 1319]),
	cookieRollover: () => blip(1760),
	// Sleigh bells: a jingle of quick bright bursts.
	sleighBell: () => {
		for (let shake = 0; shake < 4; shake++) {
			hiss("highpass", 6000, 0.08, 0.3, shake * 0.07);
			tone("sine", 2637, 2637, 0.12, 0.06, shake * 0.07);
		}
	},
	stockingLane: () => blip(1175),
	returnLane: () => blip(988),
	outlane: () => tone("square", 330, 110, 0.4, 0.15),
	// A spinner's tick.
	spinner: () => hiss("highpass", 5000, 0.02, 0.25),
	reindeerTarget: drop,
	reindeerBank: () => arpeggio([523, 659, 784, 1047], 0.08, 0.14),
	goldStarTarget: () => {
		drop();
		ding(2349);
	},
	goldStarBank: () => arpeggio([1047, 1319, 1568, 2093, 2637]),
	giftTarget: drop,
	giftBank: () => arpeggio([784, 988, 1175, 1568]),
	cookieTarget: () => tone("triangle", 400, 300, 0.08, 0.25),
	cookieBank: () => arpeggio([587, 784, 988]),
	letterTarget: () => ding(1319),
	icicleTarget: () => ding(2637),
	icicleBank: () => arpeggio([1568, 2093, 2637, 3136], 0.06, 0.2),
	snowflakeTarget: () => ding(2349),
	snowflakeBank: () => arpeggio([1397, 1865, 2349, 2794], 0.06, 0.2),
	// The weathervane turning: a creak.
	weathervane: () => tone("sawtooth", 260, 180, 0.25, 0.08),
	ramp: () => whirr(140, 620),
	auroraChute: () => whirr(300, 1200),
	aurora: () => {
		thud(160);
		run(
			"sine",
			[
				[1568, 0.1],
				[2093, 0.2],
				[2637, 0.3],
			],
			0.4,
			0.12,
		);
	},
	globe: () => {
		thud(120);
		ding(1760);
	},
	// The coal bin: a deep, heavy thud.
	coal: () => thud(70),
	// Down a chimney: a falling whoosh.
	chimney: () => {
		tone("triangle", 900, 120, 0.5, 0.15);
		hiss("bandpass", 1200, 0.5, 0.2, 0, 300);
	},
	greenChimney: () => {},
	redChimney: () => {},
	goldChimney: () => {},
	lock: () => {
		knock();
		run(
			"square",
			[
				[392, 0.15],
				[523, 0.3],
			],
			0.15,
			0.14,
		);
	},
	// Multiball: a siren winding up.
	multiball: () => {
		for (let rise = 0; rise < 3; rise++) {
			tone("sawtooth", 300, 1200, 0.35, 0.08, rise * 0.35);
		}
	},
	jackpot: () => {
		arpeggio(FANFARE, 0.1, 0.16);
		knock(0.3);
	},
	missionSelected: () =>
		run(
			"square",
			[
				[880, 0],
				[880, 0.12],
			],
			0.08,
			0.12,
		),
	missionStart: () =>
		run(
			"square",
			[
				[880, 0],
				[880, 0.15],
				[1320, 0.3],
			],
			0.1,
			0.14,
		),
	missionStep: () => arpeggio([988, 1319], 0.1),
	missionDone: () => arpeggio([659, 784, 1047, 1319, 1568], 0.1, 0.2),
	missionFailed: () =>
		run(
			"square",
			[
				[440, 0],
				[370, 0.15],
				[294, 0.3],
			],
			0.18,
			0.12,
		),
	rankUp: () => {
		arpeggio([...FANFARE, 1319, 1568, 2093], 0.09, 0.2);
		knock();
		knock(0.2);
	},
	kickback: () => knock(),
	ballSaved: () =>
		run(
			"square",
			[
				[784, 0],
				[1175, 0.1],
			],
			0.12,
			0.14,
		),
	// A ball draining: a long, sad slide down.
	drain: () => tone("square", 420, 70, 0.7, 0.18),
	// An extra ball: the knocker, twice.
	extraBall: () => {
		knock();
		knock(0.18);
	},
	// A nudge: the cabinet's thump.
	nudge: () => tone("sine", 90, 50, 0.12, 0.5),
	tiltWarning: () => buzz(0.2),
	tilt: () => buzz(1.2),
};

/** The sounds for whatever's happened on the table (each once, however many times it happened). */
export function playPinballEvents(events: IPinballEvent[]) {
	new Set(events).forEach((event) => SOUNDS[event]());
}

// The music: Jingle Bells' chorus at 140 beats a minute over a half-time trap beat.
const BEAT = 60 / 140;
const BARS = 16;
/** Note names to frequencies, for the tune. */
const NOTE: Record<string, number> = {
	C4: 261.63,
	D4: 293.66,
	E4: 329.63,
	F4: 349.23,
	G4: 392,
	C2: 65.41,
	F1: 43.65,
	G1: 49,
};

/** The chorus, bar by bar: [note, beats]. */
const TUNE: Array<Array<[string, number]>> = [
	[
		["E4", 1],
		["E4", 1],
		["E4", 2],
	],
	[
		["E4", 1],
		["E4", 1],
		["E4", 2],
	],
	[
		["E4", 1],
		["G4", 1],
		["C4", 1.5],
		["D4", 0.5],
	],
	[["E4", 4]],
	[
		["F4", 1],
		["F4", 1],
		["F4", 1.5],
		["F4", 0.5],
	],
	[
		["F4", 1],
		["E4", 1],
		["E4", 1],
		["E4", 0.5],
		["E4", 0.5],
	],
	[
		["E4", 1],
		["D4", 1],
		["D4", 1],
		["E4", 1],
	],
	[
		["D4", 2],
		["G4", 2],
	],
	[
		["E4", 1],
		["E4", 1],
		["E4", 2],
	],
	[
		["E4", 1],
		["E4", 1],
		["E4", 2],
	],
	[
		["E4", 1],
		["G4", 1],
		["C4", 1.5],
		["D4", 0.5],
	],
	[["E4", 4]],
	[
		["F4", 1],
		["F4", 1],
		["F4", 1.5],
		["F4", 0.5],
	],
	[
		["F4", 1],
		["E4", 1],
		["E4", 1],
		["E4", 0.5],
		["E4", 0.5],
	],
	[
		["G4", 1],
		["G4", 1],
		["F4", 1],
		["D4", 1],
	],
	[["C4", 4]],
];
/** Each bar's 808 note, under the tune's chords. */
const BASS = ["C2", "C2", "C2", "C2", "F1", "C2", "G1", "G1", "C2", "C2", "C2", "C2", "F1", "C2", "G1", "C2"];

type IHit = { at: number; play: (delay: number) => void };

/** One loop of the music, as hits in beats from its start (in no particular order). */
function arrangement(): IHit[] {
	const hits: IHit[] = [];

	for (let bar = 0; bar < BARS; bar++) {
		const start = bar * 4;
		let beat = start;

		// The tune, a square-wave lead an octave up.
		for (const [note, beats] of TUNE[bar]) {
			const pitch = NOTE[note] * 2;
			hits.push({
				at: beat,
				play: (delay) => tone("square", pitch, pitch, beats * BEAT * 0.85, 0.045, delay),
			});
			beat += beats;
		}

		// Kick and 808 together: a long, gliding sub bass.
		const root = NOTE[BASS[bar]];

		for (const at of [0, 1.75, 3.5]) {
			hits.push({
				at: start + at,
				play: (delay) => {
					tone("sine", 150, 45, 0.16, 0.5, delay);
					tone("sine", root * 2, root, at === 0 ? 1.2 : 0.6, 0.55, delay);
				},
			});
		}

		// The clap, half-time: on the third beat.
		hits.push({
			at: start + 2,
			play: (delay) => {
				for (const flam of [0, 0.012, 0.024]) {
					hiss("bandpass", 1500, 0.14, 0.32, delay + flam);
				}
			},
		});

		// Hi-hats in eighths, with a triplet roll at the end of every other bar and a 32nd roll
		// at the end of every fourth.
		const hats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
		const roll =
			bar % 4 === 3 ? [3, 3.125, 3.25, 3.375, 3.5, 3.625, 3.75, 3.875] : bar % 2 === 1 ? [3, 3.333, 3.667] : [];

		for (const at of [...hats.filter((hat) => roll.length === 0 || hat < 3), ...roll]) {
			hits.push({
				at: start + at,
				play: (delay) => hiss("highpass", 8000, 0.03, 0.12, delay),
			});
		}
	}

	return hits;
}

/** How far ahead the music is scheduled, and how often the scheduler looks. */
const LOOKAHEAD = 0.35;
const TICK_MS = 120;

/**
 * Starts the music looping, scheduling a little ahead on the audio clock. Returns a function
 * that stops it (anything already scheduled, under half a second, plays out).
 */
export function startPinballMusic(): () => void {
	const started = audioNow();

	if (started === null) {
		return () => {};
	}

	const hits = arrangement();
	const loopLength = BARS * 4 * BEAT;
	// Begin just after now. Each look schedules the hits between the last look's end and a
	// little ahead of now, loop after loop.
	const origin = started + 0.1;
	let scheduledTo = origin;

	const schedule = () => {
		const now = audioNow();

		if (now === null) {
			return;
		}

		const until = now + LOOKAHEAD;

		for (let loop = Math.floor((scheduledTo - origin) / loopLength); origin + loop * loopLength < until; loop++) {
			for (const hit of hits) {
				const when = origin + loop * loopLength + hit.at * BEAT;

				if (when >= scheduledTo && when < until && when >= now) {
					hit.play(when - now);
				}
			}
		}

		scheduledTo = Math.max(scheduledTo, until);
	};

	schedule();
	const timer = window.setInterval(schedule, TICK_MS);

	return () => window.clearInterval(timer);
}
