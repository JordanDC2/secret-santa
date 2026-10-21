/**
 * Silent Night's sounds and music, made on the spot with Web Audio through Elf Fling's sound
 * (the same on/off switch, remembered per device). The sounds: soft and short, and kept from
 * piling up when hundreds of things happen at once. The music: Silent Night itself, in a minor
 * key, slow, building as the night goes on (a broken music box and a cold drone at first, then a
 * bass, then a heartbeat and strings, then a tolling bell), with drums while a boss is about.
 */

import { audioNow, hiss, musicBus, readSoundOn, tone } from "Components/ElfFling/sound";
import { ENEMY_KINDS, NIGHT_SECONDS } from "Components/SilentNight/constants";
import type { IEnemyKind, IEvents, IGunId } from "Components/SilentNight/types";

/** Whether sound's on, for the sounds played outside the night's loop (the menus, a chest). */
let soundOn = readSoundOn();

export function enableSounds(on: boolean) {
	soundOn = on;
}

/** Adds a step's events to a frame's. */
export function addEvents(into: IEvents, from: IEvents) {
	into.shots += from.shots;
	into.gun ??= from.gun;
	into.reloading ||= from.reloading;
	into.volley ||= from.volley;
	into.broken |= from.broken;
	into.froze ||= from.froze;
	into.ignited ||= from.ignited;
	into.bounced ||= from.bounced;
	into.elite ||= from.elite;
	into.hits += from.hits;
	into.kills += from.kills;
	into.pickups += from.pickups;
	into.blasts += from.blasts;
	into.hurt ||= from.hurt;
	into.dashed ||= from.dashed;
	into.reloaded ||= from.reloaded;
	into.levelUp ||= from.levelUp;
	into.shrine ||= from.shrine;
	into.chest ||= from.chest;
	into.healed ||= from.healed;
	into.won ||= from.won;
	into.boss ??= from.boss;
}

/** When each kind of sound last played (audio clock), so a crowd of them plays as a few. */
const lastPlayed = new Map<string, number>();

function ready(kind: string, gap: number): boolean {
	const now = audioNow();

	if (now === null || now - (lastPlayed.get(kind) ?? -1) < gap) {
		return false;
	}

	lastPlayed.set(kind, now);

	return true;
}

/** Notes, in Hz. */
const NOTE: Record<string, number> = {
	C2: 65.41,
	D2: 73.42,
	Eb2: 77.78,
	F2: 87.31,
	G2: 98.0,
	Ab2: 103.83,
	Bb2: 116.54,
	C3: 130.81,
	D3: 146.83,
	Eb3: 155.56,
	F3: 174.61,
	G3: 196.0,
	Ab3: 207.65,
	B3: 246.94,
	C4: 261.63,
	D4: 293.66,
	Eb4: 311.13,
	E4: 329.63,
	F4: 349.23,
	G4: 392.0,
	Ab4: 415.3,
	Bb4: 466.16,
	B4: 493.88,
	C5: 523.25,
	D5: 587.33,
	Eb5: 622.25,
	E5: 659.25,
	F5: 698.46,
	G5: 783.99,
	Ab5: 830.61,
	C6: 1046.5,
};

/** Each gun's shot, and how close together they can sound. */
const GUN_SOUNDS: Record<IGunId, { gap: number; play: () => void }> = {
	gun: {
		gap: 0.06,
		play: () => {
			tone("square", 880, 440, 0.05, 0.035);
			hiss("bandpass", 3000, 0.03, 0.03);
		},
	},
	// A boom, and the shells rattling out.
	blunderbuss: {
		gap: 0.1,
		play: () => {
			tone("sine", 130, 45, 0.18, 0.2);
			hiss("lowpass", 2600, 0.2, 0.14, 0, 300);
			hiss("highpass", 5000, 0.05, 0.03, 0.03);
		},
	},
	// The string's twang, and the bolt's whistle.
	crossbow: {
		gap: 0.1,
		play: () => {
			tone("triangle", 950, 320, 0.09, 0.07);
			tone("sine", 210, 180, 0.16, 0.05);
			hiss("highpass", 4000, 0.12, 0.03, 0.02, 9000);
		},
	},
	// A little click and a bell.
	pistols: {
		gap: 0.045,
		play: () => {
			const pitch = 2300 + Math.random() * 400;
			tone("square", 1600, 1200, 0.02, 0.018);
			tone("sine", pitch, pitch, 0.07, 0.018, 0.01);
		},
	},
	// A whoosh up, and a crackle.
	romanCandle: {
		gap: 0.1,
		play: () => {
			hiss("bandpass", 700, 0.16, 0.07, 0, 3200);
			tone("sawtooth", 280, 620, 0.1, 0.02);
			hiss("highpass", 6000, 0.08, 0.025, 0.1);
		},
	},
	// A deep, soft whump.
	snowCannon: {
		gap: 0.15,
		play: () => {
			tone("sine", 95, 42, 0.22, 0.22);
			hiss("lowpass", 700, 0.2, 0.1, 0, 120);
		},
	},
};

/** How each kind of enemy sounds as it breaks (a biscuit crunch, unless it's something else). */
const BREAKS: Partial<Record<IEnemyKind, () => void>> = {
	// A spring going: boing.
	windup: () => {
		tone("square", 500, 1800, 0.1, 0.025);
		tone("triangle", 1300, 260, 0.14, 0.03, 0.06);
	},
	// Rubble.
	golem: () => {
		tone("sine", 75, 32, 0.32, 0.15);
		hiss("lowpass", 500, 0.3, 0.1, 0, 100);
	},
	// A wail, cut short and falling.
	caroller: () => {
		tone("sine", 560, 250, 0.32, 0.04);
		tone("sine", 840, 375, 0.28, 0.015);
	},
	// Porcelain shattering.
	angel: () => {
		hiss("highpass", 6500, 0.16, 0.08);
		tone("sine", 2700, 2650, 0.12, 0.03);
		tone("sine", 3400, 3380, 0.1, 0.025, 0.03);
	},
	// A shriek.
	imp: () => {
		tone("sawtooth", 900, 1500, 0.08, 0.025);
	},
};

/** What happened this frame, as sound. */
export function playNightEvents(events: IEvents) {
	if (events.gun && ready("shot", GUN_SOUNDS[events.gun].gap)) {
		GUN_SOUNDS[events.gun].play();
	}

	// A grenade lobbed: a soft whoosh.
	if (events.shots > 0 && !events.gun && ready("lob", 0.2)) {
		hiss("bandpass", 400, 0.16, 0.04, 0, 1200);
	}

	if (events.volley && ready("volley", 0.12)) {
		// A toy musket's crack, and a puff.
		tone("square", 750, 220, 0.04, 0.03);
		hiss("bandpass", 2200, 0.06, 0.03);
	}

	if (events.reloading) {
		// The magazine out: a clack.
		tone("square", 210, 170, 0.035, 0.05);
		hiss("bandpass", 1800, 0.03, 0.03);
	}

	if (events.hits > 0 && ready("hit", 0.05)) {
		hiss("bandpass", 1400, 0.04, 0.05);
	}

	if (events.kills > 0 && ready("kill", 0.07)) {
		const special = ENEMY_KINDS.find((kind, i) => BREAKS[kind] && events.broken & (1 << i));

		if (special && ready(`break-${special}`, 0.12)) {
			BREAKS[special]!();
		} else {
			// A crunch, like a biscuit snapping.
			hiss("lowpass", 1800, 0.07, 0.09, 0, 400);
			tone("triangle", 260, 110, 0.06, 0.06);
		}
	}

	if (events.froze && ready("froze", 0.15)) {
		// Ice cracking over.
		tone("sine", 3200, 2000, 0.08, 0.03);
		hiss("highpass", 8000, 0.12, 0.04);
	}

	if (events.ignited && ready("ignited", 0.25)) {
		hiss("bandpass", 600, 0.22, 0.05, 0, 1800);
	}

	if (events.bounced && ready("bounced", 0.08)) {
		tone("sine", 1800, 2700, 0.05, 0.03);
	}

	if (events.elite) {
		// Something big coming: a low horn.
		tone("sawtooth", NOTE.C2, NOTE.C2, 1, 0.05);
		tone("sine", NOTE.C3, NOTE.C3 * 0.98, 1, 0.08);
	}

	if (events.pickups > 0 && ready("pickup", 0.04)) {
		const pitch = 1500 + Math.random() * 900;
		tone("sine", pitch, pitch * 1.02, 0.09, 0.04);
	}

	if (events.blasts > 0 && ready("blast", 0.12)) {
		tone("sine", 140, 40, 0.35, 0.22);
		hiss("lowpass", 900, 0.3, 0.12, 0, 150);
	}

	if (events.hurt && ready("hurt", 0.2)) {
		tone("sawtooth", 170, 70, 0.22, 0.09);
		tone("sine", 90, 45, 0.25, 0.2);
	}

	if (events.dashed) {
		hiss("bandpass", 500, 0.18, 0.08, 0, 2600);
	}

	if (events.reloaded) {
		tone("square", 300, 260, 0.03, 0.05);
		tone("square", 520, 480, 0.03, 0.05, 0.09);
	}

	if (events.healed && ready("heal", 0.5)) {
		tone("sine", NOTE.G5, NOTE.G5, 0.4, 0.06);
		tone("sine", NOTE.C6, NOTE.C6, 0.5, 0.05, 0.08);
	}

	if (events.levelUp) {
		// A rising run, minor and sparkling.
		["C5", "Eb5", "G5", "C6"].forEach((note, i) => tone("sine", NOTE[note], NOTE[note], 0.5, 0.12, i * 0.07));
		tone("triangle", NOTE.C4, NOTE.C4, 0.8, 0.06);
	}

	if (events.chest) {
		["G4", "C5", "Eb5", "G5", "C6"].forEach((note, i) => tone("sine", NOTE[note], NOTE[note], 0.7, 0.12, i * 0.09));
		hiss("highpass", 7000, 0.6, 0.05, 0.1);
	}

	if (events.shrine) {
		// A held chord, like a distant choir.
		for (const note of ["C4", "Eb4", "G4", "C5"]) {
			tone("sine", NOTE[note], NOTE[note] * 1.003, 2.2, 0.05);
			tone("triangle", NOTE[note] * 2, NOTE[note] * 2, 1.6, 0.012, 0.05);
		}
	}

	if (events.boss) {
		// A great bell tolling, and something low underneath.
		tone("sine", NOTE.C3, NOTE.C3, 4, 0.22);
		tone("sine", NOTE.C3 * 2.76, NOTE.C3 * 2.76, 2.5, 0.06);
		tone("sine", NOTE.C3 * 5.4, NOTE.C3 * 5.4, 1.4, 0.03);
		tone("triangle", NOTE.C2, NOTE.C2 * 0.97, 4, 0.18);
		hiss("lowpass", 300, 3, 0.08);
	}

	if (events.won) {
		// Dawn: the tune comes home in a major key.
		["C4", "E4", "G4", "C5", "E5", "G5", "C6"].forEach((note, i) =>
			tone("sine", NOTE[note], NOTE[note], 1.6, 0.1, i * 0.12),
		);
	}
}

/** The tempo: a dotted crotchet (one of the waltz's two beats a bar) of this many seconds. */
const BEAT = 1.2;
/** A quaver (an eighth), the tune's step. */
const EIGHTH = BEAT / 3;
const BAR = 6;

/**
 * Silent Night, in C minor (its thirds, sixths and sevenths flattened), as [note, quavers]: each
 * bar six quavers long.
 */
const TUNE: Array<Array<[string, number]>> = [
	[
		["G4", 1.5],
		["Ab4", 0.5],
		["G4", 1],
		["Eb4", 3],
	],
	[
		["G4", 1.5],
		["Ab4", 0.5],
		["G4", 1],
		["Eb4", 3],
	],
	[
		["D5", 2],
		["D5", 1],
		["B4", 3],
	],
	[
		["C5", 2],
		["C5", 1],
		["G4", 3],
	],
	[
		["Ab4", 2],
		["Ab4", 1],
		["C5", 1.5],
		["Bb4", 0.5],
		["Ab4", 1],
	],
	[
		["G4", 1.5],
		["Ab4", 0.5],
		["G4", 1],
		["Eb4", 3],
	],
	[
		["Ab4", 2],
		["Ab4", 1],
		["C5", 1.5],
		["Bb4", 0.5],
		["Ab4", 1],
	],
	[
		["G4", 1.5],
		["Ab4", 0.5],
		["G4", 1],
		["Eb4", 3],
	],
	[
		["D5", 2],
		["D5", 1],
		["F5", 1.5],
		["D5", 0.5],
		["B4", 1],
	],
	[
		["C5", 3],
		["Eb5", 3],
	],
	[
		["C5", 1.5],
		["G4", 0.5],
		["Eb4", 1],
		["G4", 1.5],
		["F4", 0.5],
		["D4", 1],
	],
	[["C4", 6]],
];

/** Each bar's chord (root first), in the same minor, with a major dominant to pull home. */
const CHORDS: string[][] = [
	["C3", "Eb3", "G3"],
	["C3", "Eb3", "G3"],
	["G2", "B3", "D4"],
	["C3", "Eb3", "G3"],
	["F2", "Ab3", "C4"],
	["C3", "Eb3", "G3"],
	["F2", "Ab3", "C4"],
	["C3", "Eb3", "G3"],
	["G2", "B3", "D4"],
	["C3", "Eb3", "G3"],
	["G2", "B3", "F4"],
	["C3", "Eb3", "G3"],
];

type IHit = { at: number; layer: number; play: (delay: number, output: AudioNode) => void };

/** One time through the song, as hits in quavers from its start, each in a layer (0, always, to 3, late). */
function arrangement(): IHit[] {
	const hits: IHit[] = [];

	TUNE.forEach((bar, index) => {
		const start = index * BAR;
		let at = start;

		// The tune on a music box: high, plucked, dying away; a little out of tune, as if broken.
		for (const [note, length] of bar) {
			const pitch = NOTE[note] * 2;
			hits.push({
				at,
				layer: 0,
				play: (delay, output) => {
					tone("sine", pitch, pitch * 0.997, Math.min(2.2, length * EIGHTH * 2), 0.07, delay, output);
					tone("sine", pitch * 3, pitch * 3, 0.25, 0.012, delay, output);
				},
			});
			at += length;
		}

		const [root, ...rest] = CHORDS[index];

		// A cold drone under it all: the root, low, held through the bar.
		hits.push({
			at: start,
			layer: 0,
			play: (delay, output) => tone("triangle", NOTE[root] / 2, NOTE[root] / 2, BAR * EIGHTH, 0.05, delay, output),
		});

		// The bass, on each beat.
		for (const beat of [0, 3]) {
			hits.push({
				at: start + beat,
				layer: 1,
				play: (delay, output) => tone("triangle", NOTE[root], NOTE[root], BEAT * 0.9, 0.16, delay, output),
			});
		}

		// A heartbeat, and the strings: the chord held, swelling.
		for (const beat of [0, 0.5, 3, 3.5]) {
			hits.push({
				at: start + beat,
				layer: 2,
				play: (delay, output) =>
					tone("sine", beat % 3 === 0 ? 90 : 70, 40, 0.18, beat % 3 === 0 ? 0.28 : 0.18, delay, output),
			});
		}

		hits.push({
			at: start,
			layer: 2,
			play: (delay, output) => {
				for (const note of rest) {
					tone("sawtooth", NOTE[note], NOTE[note] * 1.004, BAR * EIGHTH, 0.012, delay, output);
					tone("triangle", NOTE[note], NOTE[note], BAR * EIGHTH, 0.03, delay, output);
				}
			},
		});

		// A bell tolling at the top of every other bar.
		if (index % 2 === 0) {
			hits.push({
				at: start,
				layer: 3,
				play: (delay, output) => {
					tone("sine", NOTE.C4, NOTE.C4, 3, 0.07, delay, output);
					tone("sine", NOTE.C4 * 2.76, NOTE.C4 * 2.76, 1.6, 0.02, delay, output);
				},
			});
		}

		// Drums while a boss is about (layer 4): toms rolling into each beat.
		for (const beat of [0, 2, 3, 5]) {
			hits.push({
				at: start + beat,
				layer: 4,
				play: (delay, output) => {
					tone("sine", beat % 3 === 0 ? 110 : 150, 60, 0.2, 0.2, delay, output);
					hiss("lowpass", 600, 0.12, 0.08, delay, undefined, output);
				},
			});
		}
	});

	return hits;
}

const LOOKAHEAD = 0.35;
const TICK_MS = 120;

/**
 * Starts the music, building with the night: `night()` says how far into it the player is
 * (seconds) and whether a boss is about. Returns a function that stops it, fading out.
 */
export function startNightMusic(night: () => { time: number; boss: boolean }): () => void {
	const started = audioNow();
	const bus = musicBus();

	if (started === null || !bus) {
		return () => {};
	}

	const hits = arrangement();
	const loopLength = TUNE.length * BAR * EIGHTH;
	const origin = started + 0.2;
	let scheduledTo = origin;

	const schedule = () => {
		const now = audioNow();

		if (now === null) {
			return;
		}

		const until = now + LOOKAHEAD;
		const { time, boss } = night();
		// Layers come in a quarter of the way through the night, then halfway, then three quarters.
		const layers = 1 + Math.floor((time / NIGHT_SECONDS) * 4);

		for (let loop = Math.floor((scheduledTo - origin) / loopLength); origin + loop * loopLength < until; loop++) {
			for (const hit of hits) {
				const when = origin + loop * loopLength + hit.at * EIGHTH;
				const playing = hit.layer === 4 ? boss : hit.layer < layers;

				if (playing && when >= scheduledTo && when < until && when >= now) {
					hit.play(when - now, bus);
				}
			}
		}

		scheduledTo = Math.max(scheduledTo, until);
	};

	schedule();
	const timer = window.setInterval(schedule, TICK_MS);

	return () => {
		window.clearInterval(timer);
		const now = audioNow() ?? 0;
		bus.gain.setValueAtTime(bus.gain.value, now);
		bus.gain.linearRampToValueAtTime(0, now + 1);
		window.setTimeout(() => bus.disconnect(), 1500);
	};
}

/** A chest's reel clicking round as it spins. */
export function playReelTick() {
	if (soundOn && ready("reelTick", 0.06)) {
		tone("square", 1800, 1400, 0.025, 0.025);
	}
}

/** A reel landing on what it found: a bright chime, grander for an evolution. */
export function playReelStop(evolved: boolean) {
	if (!soundOn) {
		return;
	}

	tone("triangle", NOTE.G4, NOTE.G4, 0.12, 0.08);
	(evolved ? ["C5", "Eb5", "G5", "C6"] : ["C5", "G5"]).forEach((note, i) =>
		tone("sine", NOTE[note], NOTE[note], 0.5, 0.1, 0.04 + i * 0.07),
	);
}

/** Choosing something in a menu, or a card: a soft tick. */
export function playSelect() {
	if (soundOn) {
		tone("triangle", 1250, 1000, 0.05, 0.05);
	}
}

/** A gun's morph taken: a heavy, distorted chord. */
export function playMorph() {
	if (!soundOn) {
		return;
	}

	for (const note of ["C3", "G3", "C4"]) {
		tone("sawtooth", NOTE[note], NOTE[note] * 0.995, 0.7, 0.04);
	}

	tone("sine", NOTE.C2, NOTE.C2, 0.8, 0.12);
	hiss("lowpass", 2000, 0.4, 0.05, 0, 300);
}

/** Gear put on: wool rustling, a buckle clinking. */
export function playEquip() {
	if (!soundOn) {
		return;
	}

	hiss("bandpass", 1200, 0.14, 0.05);
	tone("sine", 2300, 2280, 0.12, 0.04, 0.08);
	tone("sine", 3100, 3080, 0.08, 0.02, 0.1);
}

/** Pausing (the night falling quiet) and carrying on. */
export function playPause(paused: boolean) {
	if (soundOn) {
		tone("sine", paused ? 660 : 330, paused ? 330 : 660, 0.14, 0.05);
	}
}
