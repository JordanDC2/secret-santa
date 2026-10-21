/**
 * Silent Night's sounds and music, made on the spot with Web Audio through Elf Fling's sound
 * (the same on/off switch, remembered per device). The sounds: soft and short, and kept from
 * piling up when hundreds of things happen at once. The music: Silent Night itself, in a minor
 * key, as a song that builds part by part (a broken music box and a cold drone, once; then a
 * bass, a heartbeat, strings and a tolling bell; then arpeggios over a light kit; then melodic
 * death metal, twin leads tremolo-picked over a galloping rhythm guitar and double kick; then a
 * climax of sweeps over blast beats), with fills leading from part to part, falling back to the
 * music box to go round again from the strings; the band in, whatever the part, while a boss is
 * about; and, as in Rogue Tower, its soft version (the music box and strings) in step while the
 * night waits on a choice.
 */

import { audioNow, hiss, musicBus, readSoundOn, tone } from "Components/ElfFling/sound";
import { ENEMY_KINDS } from "Components/SilentNight/constants";
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

/** A note's pitch, from its name ("Eb4"), in Hz. */
function pitchOf(name: string): number {
	const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
	const [, letter, accidental, octave] = /^([A-G])(b|#)?(-?\d)$/.exec(name)!;
	const midi = 12 * (Number(octave) + 1) + SEMITONES[letter] + (accidental === "b" ? -1 : accidental === "#" ? 1 : 0);

	return 440 * 2 ** ((midi - 69) / 12);
}

/** C minor's notes (harmonic, with the flat seventh the tune also uses), in order up the scale. */
const SCALE = ["C", "D", "Eb", "F", "G", "Ab", "B"];

/** The note a third above in the scale, for the twin lead's harmony: twin guitars a third apart. */
function thirdAbove(name: string): number {
	const [, letter, octave] = /^([A-G]b?)(\d)$/.exec(name)!;
	const degree = Math.max(0, SCALE.indexOf(letter === "Bb" ? "B" : letter));
	const up = degree + 2;

	return pitchOf(`${SCALE[up % 7]}${Number(octave) + Math.floor(up / 7)}`);
}

/**
 * The song's parts, each once through the tune (twelve bars): the broken music box once, as the
 * night begins, then the rest over and over, building into melodic death metal and falling back to
 * the music box for the climax's last two bars before going round again from the strings.
 */
const PARTS = ["musicBox", "strings", "arpeggios", "metal", "climax"] as const;
type IPart = (typeof PARTS)[number];

/** A sixteenth (a sixth of a beat in the waltz's six-eight), and a thirty-second, for picking and the drums. */
const SIXTEENTH = EIGHTH / 2;
const THIRTY_SECOND = EIGHTH / 4;

/**
 * Which of the song's two versions a hit belongs to, as in Rogue Tower: the soft one (the music
 * box and the strings) plays while the night waits on a choice; the full one adds the band. Some
 * hits are in both; some are the soft version's own (the music box, under the twin leads).
 */
type IStem = "both" | "soft" | "full";
type IHit = { at: number; stem: IStem; bossOnly: boolean; play: (delay: number, out: IOutputs) => void };
/** Where a hit sounds: the clean mix, or the guitars' (through the distortion). */
type IOutputs = { clean: AudioNode; guitar: AudioNode };

/** The broken chord of a bar, for arpeggios: root, third and fifth, up an octave and another. */
function chordTones(index: number): number[] {
	const chord = CHORDS[index].map(pitchOf);
	const [root, third, fifth] = [chord[0] * 2, chord[1], chord[2]];

	return [root, third, fifth, root * 2, third * 2, fifth * 2, root * 4];
}

// The drum kit.
const kick = (delay: number, out: AudioNode, volume = 0.2) => {
	tone("sine", 125, 40, 0.13, volume, delay, out);
	tone("triangle", 62, 40, 0.1, volume * 0.5, delay, out);
};
const snare = (delay: number, out: AudioNode, volume = 0.1) => {
	hiss("bandpass", 1900, 0.15, volume, delay, undefined, out);
	tone("triangle", 220, 160, 0.08, volume * 0.6, delay, out);
};
const hat = (delay: number, out: AudioNode, volume = 0.018) =>
	hiss("highpass", 9000, 0.035, volume, delay, undefined, out);
const crash = (delay: number, out: AudioNode, volume = 0.07) => {
	hiss("highpass", 4500, 1.6, volume, delay, undefined, out);
	tone("sine", 3200, 3150, 0.9, volume * 0.12, delay, out);
	tone("sine", 4470, 4400, 0.7, volume * 0.1, delay, out);
};
const tom = (delay: number, out: AudioNode, pitch: number, volume = 0.16) => {
	tone("sine", pitch, pitch * 0.55, 0.22, volume, delay, out);
	hiss("lowpass", 800, 0.06, volume * 0.3, delay, undefined, out);
};

/** One time through the whole song: each part's hits, in quavers from the song's start. */
function arrangement(): IHit[] {
	const hits: IHit[] = [];
	const add = (at: number, stem: IStem, play: IHit["play"], bossOnly = false) =>
		hits.push({ at, stem, bossOnly, play });

	PARTS.forEach((part, partIndex) => {
		const heavy = part === "metal" || part === "climax";
		const atLeast = (other: IPart) => partIndex >= PARTS.indexOf(other);

		TUNE.forEach((bar, index) => {
			const start = (partIndex * TUNE.length + index) * BAR;
			// The climax's last two bars drop back to the music box, to lead round again.
			const fading = part === "climax" && index >= TUNE.length - 2;
			const band = heavy && !fading;
			const last = index === TUNE.length - 1;
			const [root, ...rest] = CHORDS[index];
			const rootPitch = pitchOf(root);
			let at = start;

			for (const [note, length] of bar) {
				const pitch = pitchOf(note) * 2;
				const time = length * EIGHTH;

				// The tune on a music box, as it always starts: high, plucked, dying away, a little out of
				// tune. Under the twin leads, the soft version's alone.
				add(at, band ? "soft" : "both", (delay, out) => {
					tone("sine", pitch, pitch * 0.997, Math.min(2.2, time * 2), 0.07, delay, out.clean);
					tone("sine", pitch * 3, pitch * 3, 0.25, 0.012, delay, out.clean);
				});

				// The twin lead, tremolo-picked: the tune and a third above it, distorted, an octave down.
				if (band) {
					const lead = pitch / 2;
					const harmony = thirdAbove(note);

					for (let pick = 0; pick < length * 4; pick++) {
						add(at + pick / 4, "full", (delay, out) => {
							tone("sawtooth", lead, lead, THIRTY_SECOND * 1.1, 0.03, delay, out.guitar);
							tone("sawtooth", harmony, harmony, THIRTY_SECOND * 1.1, 0.022, delay, out.guitar);
						});
					}
				}

				at += length;
			}

			// A cold drone under it all: the root, low, held through the bar.
			add(start, "both", (delay, out) =>
				tone("triangle", rootPitch / 2, rootPitch / 2, BAR * EIGHTH, 0.05, delay, out.clean),
			);

			if (atLeast("strings") && !fading) {
				// The strings: the chord held, swelling.
				add(start, "both", (delay, out) => {
					for (const note of rest) {
						const pitch = pitchOf(note);
						tone("sawtooth", pitch, pitch * 1.004, BAR * EIGHTH, 0.012, delay, out.clean);
						tone("triangle", pitch, pitch, BAR * EIGHTH, 0.03, delay, out.clean);
					}
				});

				// A bell tolling at the top of every other bar.
				if (index % 2 === 0) {
					add(start, "both", (delay, out) => {
						tone("sine", NOTE.C4, NOTE.C4, 3, 0.06, delay, out.clean);
						tone("sine", NOTE.C4 * 2.76, NOTE.C4 * 2.76, 1.6, 0.018, delay, out.clean);
					});
				}

				// The bass on each beat, and a heartbeat (under the guitars, the bass gallops with them instead).
				if (!heavy) {
					for (const beat of [0, 3]) {
						add(start + beat, "full", (delay, out) =>
							tone("triangle", rootPitch, rootPitch, BEAT * 0.9, 0.16, delay, out.clean),
						);
					}

					for (const beat of [0, 0.5, 3, 3.5]) {
						add(start + beat, "full", (delay, out) =>
							tone("sine", beat % 3 === 0 ? 90 : 70, 40, 0.18, beat % 3 === 0 ? 0.28 : 0.18, delay, out.clean),
						);
					}
				}
			}

			// Arpeggios: the bar's chord broken into sixteenths, up and back down, plucked.
			if (atLeast("arpeggios") && !fading) {
				const tones = chordTones(index);

				[0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].forEach((step, sixteenth) => {
					add(start + sixteenth / 2, "full", (delay, out) =>
						tone("triangle", tones[step], tones[step] * 0.999, SIXTEENTH * 1.6, 0.035, delay, out.clean),
					);
				});
			}

			// The rhythm guitar: a palm-muted gallop on the bar's root and fifth (da-da-dum, da-da-dum),
			// the bass doubling it.
			const gallop = (bossOnly: boolean) => {
				for (let sixteenth = 0; sixteenth < 12; sixteenth++) {
					const accent = sixteenth % 3 === 0;
					add(
						start + sixteenth / 2,
						"full",
						(delay, out) => {
							for (const pitch of [rootPitch / 2, (rootPitch / 2) * 1.5]) {
								tone(
									"sawtooth",
									pitch,
									pitch,
									SIXTEENTH * (accent ? 1.2 : 0.7),
									accent ? 0.05 : 0.03,
									delay,
									out.guitar,
								);
							}
						},
						bossOnly,
					);
				}

				add(
					start,
					"full",
					(delay, out) => tone("triangle", rootPitch / 2, rootPitch / 2, BAR * EIGHTH, 0.12, delay, out.clean),
					bossOnly,
				);
			};

			// The drums under the band: double kick on every sixteenth, the snare cracking on the
			// second beat (and, in the climax, blasting on every quaver), the hats on the quavers, a
			// crash at the top of each phrase and a fill of toms rolling down at its end.
			const metalDrums = (bossOnly: boolean, blast: boolean) => {
				for (let sixteenth = 0; sixteenth < 12; sixteenth++) {
					add(start + sixteenth / 2, "full", (delay, out) => kick(delay, out.clean, 0.17), bossOnly);
				}

				for (const eighth of blast ? [0, 1, 2, 3, 4, 5] : [3]) {
					add(start + eighth, "full", (delay, out) => snare(delay, out.clean, blast ? 0.07 : 0.11), bossOnly);
				}

				for (let eighth = 0; eighth < 6; eighth++) {
					add(start + eighth, "full", (delay, out) => hat(delay, out.clean), bossOnly);
				}

				if (index % (blast ? 2 : 4) === 0) {
					add(start, "full", (delay, out) => crash(delay, out.clean), bossOnly);
				}

				if (index % 4 === 3 && !last) {
					[260, 220, 190, 160, 130, 110].forEach((pitch, step) => {
						add(start + 3 + step / 2, "full", (delay, out) => tom(delay, out.clean, pitch), bossOnly);
					});
				}
			};

			if (band) {
				metalDrums(false, part === "climax");
				gallop(false);
			} else {
				// While a boss is about, the band comes in whatever part the song's at.
				metalDrums(true, false);
				gallop(true);
			}

			// The arpeggios' drums: a kick on the beats, a snare on the second, the hats on the quavers,
			// a crash as they come in.
			if (part === "arpeggios") {
				add(start, "full", (delay, out) => kick(delay, out.clean));
				add(start + 4.5, "full", (delay, out) => kick(delay, out.clean, 0.14));
				add(start + 3, "full", (delay, out) => snare(delay, out.clean, 0.08));

				for (let eighth = 0; eighth < 6; eighth++) {
					add(start + eighth, "full", (delay, out) => hat(delay, out.clean, 0.012));
				}

				if (index === 0) {
					add(start, "full", (delay, out) => crash(delay, out.clean, 0.05));
				}
			}

			// The fills leading from one part into the next, growing as the song does: a timpani roll
			// swelling out of the music box; a tom fill out of the strings; and out of the arpeggios
			// into the metal, a whole bar of snare rolling faster and louder and the toms tumbling down.
			if (last && part === "musicBox") {
				for (let step = 0; step < 12; step++) {
					add(start + 3 + step / 4, "full", (delay, out) => tom(delay, out.clean, 70, 0.03 + step * 0.012));
				}
			}

			if (last && part === "strings") {
				[220, 190, 160, 140, 120, 100].forEach((pitch, step) => {
					add(start + 3 + step / 2, "full", (delay, out) => tom(delay, out.clean, pitch, 0.12 + step * 0.01));
				});
			}

			if (part === "arpeggios" && index === TUNE.length - 2) {
				for (let sixteenth = 6; sixteenth < 12; sixteenth++) {
					add(start + sixteenth / 2, "full", (delay, out) => snare(delay, out.clean, 0.03 + (sixteenth - 6) * 0.01));
				}
			}

			if (last && part === "arpeggios") {
				for (let step = 0; step < 12; step++) {
					add(start + step / 4, "full", (delay, out) => snare(delay, out.clean, 0.05 + step * 0.006));
				}

				[300, 260, 220, 190, 160, 140, 120, 100, 90, 80, 70, 60].forEach((pitch, step) => {
					add(start + 3 + step / 4, "full", (delay, out) => {
						tom(delay, out.clean, pitch, 0.14);
						kick(delay, out.clean, 0.1);
					});
				});
			}

			// The climax: a sweep at the end of every bar, up the chord and back, in thirty-seconds.
			if (part === "climax" && !fading) {
				const tones = chordTones(index);

				[0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0].forEach((step, sweep) => {
					add(start + 3 + sweep / 4, "full", (delay, out) =>
						tone("sawtooth", tones[step], tones[step], THIRTY_SECOND * 1.4, 0.025, delay, out.guitar),
					);
				});
			}
		});
	});

	return hits;
}

/** A distorted guitar sound: everything through it is driven hard, then rounded off at the top. */
function guitarChain(context: BaseAudioContext, output: AudioNode): AudioNode {
	const drive = context.createGain();
	drive.gain.value = 6;
	const shaper = context.createWaveShaper();
	const curve = new Float32Array(1024);

	for (let i = 0; i < curve.length; i++) {
		const x = (i / (curve.length - 1)) * 2 - 1;
		curve[i] = Math.tanh(x * 3);
	}

	shaper.curve = curve;
	shaper.oversample = "4x";
	const filter = context.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 3200;
	const level = context.createGain();
	level.gain.value = 0.14;
	drive.connect(shaper).connect(filter).connect(level).connect(output);

	return drive;
}

const LOOKAHEAD = 0.35;
const TICK_MS = 120;
/** How long the soft and full versions take to cross over (seconds, to about two thirds of the way). */
const CROSSFADE = 0.4;

/**
 * Starts the music. In the night: the music box once, then the rest of the song over and over,
 * starting where the night's clock (`night().time`) says; the full version while playing, the soft
 * one while the night waits on a choice (`night().soft`), crossing over in step; the band in
 * whatever part it's at while a boss is about. In the menu (`menu`): the song's gentle start, the
 * music box and the strings, over and over. Returns a function that stops it, fading out.
 */
export function startNightMusic(night: () => { time: number; boss: boolean; soft: boolean }, menu = false): () => void {
	const started = audioNow();
	const bus = musicBus();

	if (started === null || !bus) {
		return () => {};
	}

	const context = bus.context;
	const makeStem = () => {
		const gain = context.createGain();
		gain.connect(bus);

		return { gain, outputs: { clean: gain, guitar: guitarChain(context, gain) } };
	};
	const stems: Record<IStem, ReturnType<typeof makeStem>> = { both: makeStem(), soft: makeStem(), full: makeStem() };
	const crossFade = (toSoft: boolean, at: number, instantly = false) => {
		const values = { soft: toSoft ? 1 : 0, full: toSoft ? 0 : 1 };

		for (const name of ["soft", "full"] as const) {
			if (instantly) {
				stems[name].gain.gain.setValueAtTime(values[name], at);
			} else {
				stems[name].gain.gain.setTargetAtTime(values[name], at, CROSSFADE / 3);
			}
		}
	};

	const hits = arrangement();
	const partLength = TUNE.length * BAR * EIGHTH;
	// The music box plays once, then the song goes round from the strings (the menu: the first two parts, round and round).
	const introLength = menu ? 0 : partLength;
	const loopLength = (menu ? 2 : PARTS.length - 1) * partLength;
	const songTime = night().time;
	const position = songTime < introLength ? songTime : introLength + ((songTime - introLength) % loopLength);
	const origin = started + 0.2 - position;
	let scheduledTo = started + 0.2;
	let soft = night().soft;
	crossFade(soft, started, true);

	const schedule = () => {
		const now = audioNow();

		if (now === null) {
			return;
		}

		const until = now + LOOKAHEAD;
		const current = night();

		if (current.soft !== soft) {
			soft = current.soft;
			crossFade(soft, now);
		}

		const firstLoop = Math.max(0, Math.floor((scheduledTo - origin - introLength) / loopLength));

		// The first time round always (it holds the intro, which comes before the loop starts).
		for (let loop = firstLoop; loop === 0 || origin + introLength + loop * loopLength < until; loop++) {
			for (const hit of hits) {
				const at = hit.at * EIGHTH;

				// The intro's hits only the first time round; the rest, each time.
				if (at >= introLength + loopLength || (at < introLength && loop > 0)) {
					continue;
				}

				const when = origin + at + (at < introLength ? 0 : loop * loopLength);

				if ((!hit.bossOnly || current.boss) && when >= scheduledTo && when < until && when >= now) {
					hit.play(when - now, stems[hit.stem].outputs);
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
