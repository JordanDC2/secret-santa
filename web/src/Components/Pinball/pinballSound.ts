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

/** Each event's sound: the classic table noises, synthesised. */
const SOUNDS: Record<IPinballEvent, () => void> = {
	// A flipper's solenoid: a short, hard clack.
	flip: () => {
		hiss("lowpass", 1400, 0.05, 0.6);
		tone("square", 110, 60, 0.06, 0.25);
	},
	// The plunger's spring letting go.
	launch: () => {
		hiss("bandpass", 900, 0.18, 0.5, 0, 300);
		tone("triangle", 220, 90, 0.15, 0.3);
	},
	// A bumper: the bright electronic pop of an old table.
	bumper: () => {
		tone("square", 920, 460, 0.09, 0.22);
		hiss("highpass", 3000, 0.04, 0.4);
	},
	slingshot: () => tone("square", 620, 300, 0.05, 0.18),
	rollover: () =>
		run(
			"square",
			[
				[1320, 0],
				[1760, 0.05],
			],
			0.06,
			0.12,
		),
	lanesLit: () =>
		run(
			"square",
			[
				[1047, 0],
				[1319, 0.07],
				[1568, 0.14],
				[2093, 0.21],
			],
			0.12,
			0.14,
		),
	skillShot: () =>
		run(
			"square",
			[
				[784, 0],
				[1047, 0.1],
				[1319, 0.2],
				[1568, 0.3],
				[2093, 0.42],
			],
			0.18,
			0.16,
		),
	drop: () => {
		tone("square", 300, 120, 0.08, 0.2);
		hiss("lowpass", 900, 0.06, 0.4);
	},
	reindeer: () =>
		run(
			"square",
			[
				[523, 0],
				[659, 0.08],
				[784, 0.16],
				[1047, 0.24],
			],
			0.14,
			0.16,
		),
	// A bell target: a two-tone ding.
	bell: () => {
		tone("sine", 1568, 1568, 0.45, 0.22);
		tone("sine", 2349, 2349, 0.35, 0.12, 0.01);
	},
	lockLit: () =>
		run(
			"sine",
			[
				[1568, 0],
				[2093, 0.12],
				[2637, 0.24],
			],
			0.4,
			0.2,
		),
	// Up a ramp: a rising whirr.
	sleigh: () => {
		tone("sawtooth", 180, 760, 0.7, 0.07);
		hiss("bandpass", 1800, 0.7, 0.12, 0, 4200);
	},
	ramp: () => {
		tone("sawtooth", 140, 620, 0.6, 0.07);
		hiss("bandpass", 1400, 0.6, 0.12, 0, 3600);
	},
	combo: () =>
		run(
			"square",
			[
				[1568, 0],
				[1568, 0.09],
				[2093, 0.18],
			],
			0.08,
			0.15,
		),
	jackpot: () => {
		run(
			"square",
			[
				[523, 0],
				[659, 0.1],
				[784, 0.2],
				[1047, 0.3],
				[784, 0.45],
				[1047, 0.55],
			],
			0.16,
			0.18,
		);
		knock(0.3);
	},
	// Into the chimney: a thud and a rattle.
	saucer: () => {
		tone("sine", 140, 60, 0.2, 0.5);
		hiss("bandpass", 600, 0.25, 0.3);
	},
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
	missionDone: () =>
		run(
			"square",
			[
				[659, 0],
				[784, 0.1],
				[1047, 0.2],
				[1319, 0.3],
				[1568, 0.45],
			],
			0.2,
			0.16,
		),
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
