/**
 * Silent Night's sounds and music, made on the spot with Web Audio through Elf Fling's sound
 * (the same on/off switch, remembered per device). The sounds: soft and short, and kept from
 * piling up when hundreds of things happen at once. The music: Silent Night itself, in a minor
 * key, as a song that builds part by part (a broken music box and a cold drone, once; then a
 * bass, a heartbeat, strings and a tolling bell; then arpeggios over a light kit; then melodic
 * death metal, twin leads tremolo-picked over a galloping rhythm guitar and double kick; then a
 * climax of sweeps over blast beats; then a long solo over it all, guitar, keys and drums each
 * taking their turn, ending on one last hit), with fills leading from part to part, going round
 * again from the strings, played another way each time and lifted a whole tone every other pair
 * of times, so a night hears four different passes before any comes round again; the band in,
 * whatever the part, while a boss is about; and, as in Rogue Tower, its soft version (the music
 * box and strings) in step while the night waits on a choice.
 */

import { audioNow, hiss as playHiss, musicBus, readSoundOn, tone as playTone } from "Components/ElfFling/sound";
import { ENEMY_KINDS } from "Components/SilentNight/constants";
import { readSettings } from "Components/SilentNight/settings";
import type { IEnemyKind, IEvents, IGunId } from "Components/SilentNight/types";

/**
 * How loud the music and the sound effects are (settings.ts): the effects through a volume of
 * their own (every tone and hiss here that isn't given somewhere to go), each piece of music
 * through its own bus at the music's volume, kept up to date while it plays.
 */
let { music: musicVolume, effects: effectsVolume } = readSettings();
let effectsBus: GainNode | null = null;
const musicBuses = new Set<GainNode>();

function effectsOut(): AudioNode | undefined {
	effectsBus ??= musicBus();

	if (effectsBus) {
		effectsBus.gain.value = effectsVolume;
	}

	return effectsBus ?? undefined;
}

/** A bus for some music, at the music's volume, followed until it's `released`. */
function musicOut(): GainNode | null {
	const bus = musicBus();

	if (bus) {
		bus.gain.value = musicVolume;
		musicBuses.add(bus);
	}

	return bus;
}

export function setVolumes(music: number, effects: number) {
	musicVolume = music;
	effectsVolume = effects;
	const now = audioNow() ?? 0;

	for (const bus of musicBuses) {
		bus.gain.setTargetAtTime(music, now, 0.05);
	}

	effectsBus?.gain.setTargetAtTime(effects, now, 0.05);
}

/** A tone or hiss (Elf Fling's), through the effects' volume unless it's given somewhere else to go (the music). */
const tone: typeof playTone = (type, from, to, length, volume, delay = 0, output = effectsOut()) =>
	playTone(type, from, to, length, volume, delay, output);
const hiss: typeof playHiss = (filter, frequency, length, volume, delay = 0, sweepTo, output = effectsOut()) =>
	playHiss(filter, frequency, length, volume, delay, sweepTo, output);

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

/**
 * How far the song is lifted while it's being arranged: 1, or a whole tone up for the passes in D
 * minor (a key change, as metal songs lift for their last choruses). Drums don't care.
 */
let lift = 1;

/** A note's pitch, from its name ("Eb4"), in Hz (lifted with the song). */
function pitchOf(name: string): number {
	const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
	const [, letter, accidental, octave] = /^([A-G])(b|#)?(-?\d)$/.exec(name)!;
	const midi = 12 * (Number(octave) + 1) + SEMITONES[letter] + (accidental === "b" ? -1 : accidental === "#" ? 1 : 0);

	return 440 * 2 ** ((midi - 69) / 12) * lift;
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
 * night begins, then the rest over and over, building into melodic death metal, to a climax and a
 * long solo over everything (SOLOS), which ends on one last hit and goes round again from the strings.
 */
const PARTS = [
	"musicBox",
	"strings",
	"arpeggios",
	"metal",
	"climax",
	"solo",
	"keys",
	"trade",
	"breakdown",
	"finale",
] as const;
type IPart = (typeof PARTS)[number];

/**
 * The tune's bars each part plays, in order: all twelve, but for the solo, which plays the tune
 * through to "sleep in heavenly peace" over its chords before going on from its third bar, eight
 * bars longer.
 */
function partBars(part: IPart): number[] {
	const all = TUNE.map((_, index) => index);

	return part === "solo" ? [...all.slice(0, 10), ...all.slice(2)] : all;
}

/** How long the whole song is, in bars, every part played once. */
const SONG_BARS = PARTS.reduce((total, part) => total + partBars(part).length, 0);

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
/** Where a hit sounds: the clean mix; through the guitars' distortion, the solo's (darker) or the bass guitar's; or the keys' (a lead synth, driven nearly as hard as the solo guitar so the two mesh). */
type IOutputs = { clean: AudioNode; guitar: AudioNode; lead: AudioNode; bass: AudioNode; keys: AudioNode };

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
const ride = (delay: number, out: AudioNode, volume = 0.016) => {
	tone("sine", 5200, 5150, 0.25, volume * 0.6, delay, out);
	hiss("highpass", 6500, 0.14, volume, delay, undefined, out);
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

/** A note of the solo, by its step up C minor's scale from middle C (0; 7 is the C above). */
function soloPitch(degree: number): number {
	return pitchOf(`${SCALE[((degree % 7) + 7) % 7]}${4 + Math.floor(degree / 7)}`);
}

/** A note of a solo line: its step up the scale (soloPitch) or a note by name, its length in thirty-seconds, and how it's played (sing); null steps are rests. */
type ISoloNote = [number | string | null, number, string?];
/** One voice's part in a bar of the solo: the guitar's or the keys', a second guitar or keys `under` it (in steps), and how loud. */
type ISoloLine = { voice: "guitar" | "keys"; notes: ISoloNote[]; under?: number; volume?: number };
/**
 * The band in a bar of the solo: the drums (double kick, blast beats, half time, building with
 * `level`, or soloing alone at `level`) and the rhythm guitar (galloping, a held chord, one hit
 * and then silence, or out).
 */
type ISoloBar = {
	lines: ISoloLine[];
	drums: "double" | "blast" | "half" | "build" | "break" | "none";
	level?: number;
	rhythm: "gallop" | "chord" | "hit" | "none";
	/** A crash on the bar's first beat, whatever the drums are doing. */
	crash?: boolean;
};

/** Each step from `from` to `to` (up or down), each `length` thirty-seconds long. */
const steps = (from: number, to: number, length = 1): ISoloNote[] =>
	Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => [from + Math.sign(to - from) * i, length]);
/**
 * A note of the tune swept into, neoclassical style: the chord (`chord`, as steps) run up from
 * below in thirty-seconds, landing on the note and holding it (three notes of the run for a long
 * note, one for a short; none for the shortest). Notes by name (the tune's B flat) are just played.
 */
const swept = (note: number | string, length: number, chord: number[], ways = ""): ISoloNote[] => {
	if (typeof note === "string" || length < 4) {
		return [[note, length, ways]];
	}

	const run = length >= 6 ? 3 : 1;
	// (In order up: the octaves low to high, each chord's steps low to high.)
	const below = [-14, -7, 0, 7]
		.flatMap((octave) => chord.map((step) => step + octave))
		.filter((step) => step < note)
		.slice(-run);

	return [...below.map((step): ISoloNote => [step, 1]), [note, length - run, ways]];
};
/** F minor and C minor, as steps from middle C, for sweeping the tune. */
const F_MINOR = [3, 5, 7];
const C_MINOR = [0, 2, 4];

/** Each of `degrees`, each `length` thirty-seconds long. */
const each = (degrees: number[], length: number): ISoloNote[] => degrees.map((degree) => [degree, length]);
const guitar = (notes: ISoloNote[], under?: number): ISoloLine => ({ voice: "guitar", notes, under });
const keys = (notes: ISoloNote[], under?: number): ISoloLine => ({ voice: "keys", notes, under });
/** The keys holding a bar's chord under the rest. */
const pad = (degrees: number[]): ISoloLine[] =>
	degrees.map((degree) => ({ voice: "keys", notes: [[degree, 24, "v"]], volume: 0.014 }));
const measure = (
	lines: ISoloLine[],
	drums: ISoloBar["drums"],
	rhythm: ISoloBar["rhythm"] = "gallop",
	level?: number,
): ISoloBar => ({
	lines,
	drums,
	rhythm,
	level,
});

/** The tune's bar `index` as the guitar sings it in the breakdown: an octave up, bent into, held notes with vibrato. */
const sung = (index: number): ISoloNote[] =>
	TUNE[index].map(([note, length], i) => [
		note.replace(/\d$/, (octave) => String(Number(octave) + 1)),
		length * 4,
		`${i === 0 ? "b" : ""}${length >= 2 ? "v" : ""}`,
	]);

/**
 * The guitar solo after the climax, as five parts over the tune's twelve chords, long and varied
 * in the way of Wintersun's "Winter Madness" (its shape, not its notes): the guitar alone; the keys'
 * turn, neoclassical; the two trading phrases, shorter and shorter, to a unison sweep; the band
 * stopping dead for the drums alone, a half-time breakdown with the guitar singing Silent Night
 * itself, and a build; and a finale of harmonised runs, the tune again over half time, pedal licks
 * against the keys' sweeps, and the twin guitars' last notes diving onto the band's last hit. Every
 * phrase runs on into the next by step or a short leap.
 */
const SOLOS = {
	// The guitar: the tune sung with bends ("Silent night, holy night, all is calm, all is bright",
	// over its own chords: this part's eight bars longer); "round yon virgin, mother and child, holy
	// infant so tender and mild" swept into note by note, the second line an octave up; a breakdown
	// for "sleep in heavenly peace", a flourish up out of it, and a crash back into the solo; up to a bent high B and back down;
	// to a bent high C; pedal licks off it and off G; sweeps; up to a bent high D; a lyrical hand-off.
	// (A crash at the top of every bar through its sung and swept opening.)
	solo: [
		{
			...measure(
				[
					guitar([
						[4, 6, "b"],
						[5, 2],
						[4, 4],
						[2, 12, "v"],
					]),
				],
				"double",
			),
			crash: true,
		},
		{
			...measure(
				[
					guitar([
						[4, 6, "b"],
						[5, 2],
						[4, 4],
						[2, 12, "v"],
					]),
				],
				"double",
			),
			crash: true,
		},
		{
			...measure(
				[
					guitar([
						[8, 8, "b"],
						[8, 4],
						[6, 12, "v"],
					]),
				],
				"double",
			),
			crash: true,
		},
		{
			...measure(
				[
					guitar([
						[7, 8, "b"],
						[7, 4],
						[4, 12, "v"],
					]),
				],
				"double",
			),
			crash: true,
		},
		// "Round yon virgin, mother and child", every long note swept into...
		{
			...measure(
				[
					guitar([
						...swept(5, 8, F_MINOR, "v"),
						...swept(5, 4, F_MINOR),
						...swept(7, 6, F_MINOR),
						["Bb4", 2],
						...swept(5, 4, F_MINOR),
					]),
				],
				"double",
			),
			crash: true,
		},
		{
			...measure(
				[guitar([...swept(4, 6, C_MINOR, "b"), [5, 2], ...swept(4, 4, C_MINOR), ...swept(2, 12, C_MINOR, "v")])],
				"double",
			),
			crash: true,
		},
		// ...and "holy infant so tender and mild" the same, an octave up.
		{
			...measure(
				[
					guitar([
						...swept(12, 8, F_MINOR, "v"),
						...swept(12, 4, F_MINOR),
						...swept(14, 6, F_MINOR),
						["Bb5", 2],
						...swept(12, 4, F_MINOR),
					]),
				],
				"double",
			),
			crash: true,
		},
		{
			...measure(
				[guitar([...swept(11, 6, C_MINOR, "b"), [12, 2], ...swept(11, 4, C_MINOR), ...swept(9, 12, C_MINOR, "v")])],
				"double",
			),
			crash: true,
		},
		// A breakdown: "sleep in heavenly" over heavy held chords in half time; "peace" held over a
		// snare roll swelling, with a flourish up into the rest of the solo.
		measure(
			[
				guitar([
					[8, 8, "b"],
					[8, 4],
					[10, 6, "v"],
					[8, 2],
					[6, 4],
				]),
				...pad([4, 6, 8]),
			],
			"half",
			"chord",
		),
		measure(
			[guitar([[7, 12, "bv"], [9, 8, "v"], ...each([11, 9, 11, 12], 1)]), ...pad([0, 2, 4])],
			"build",
			"chord",
			3,
		),
		{ ...measure([guitar([[13, 8, "bv"], ...each([12, 11, 10, 9, 8, 6, 7, 8], 2)])], "double"), crash: true },
		measure([guitar([[7, 12, "v"], ...each([9, 10, 11], 2), [14, 6, "b"]])], "double"),
		measure([guitar(each([14, 12, 14, 11, 14, 10, 14, 9, 14, 8, 14, 7], 2))], "double"),
		measure([guitar(each([11, 9, 11, 8, 11, 7, 11, 6, 11, 7, 9, 12], 2))], "double"),
		measure(
			[guitar(each([14, 12, 10, 7, 5, 3, 5, 7, 10, 12, 14, 12, 14, 12, 10, 7, 5, 3, 5, 7, 10, 12, 14, 12], 1))],
			"double",
		),
		measure([guitar([...each([14, 11, 9, 7, 4, 2, 0, 2, 4, 7, 9, 11], 1), [14, 12, "bv"]])], "double"),
		measure(
			[
				guitar([
					[11, 4],
					[13, 4],
					[15, 16, "bv"],
				]),
			],
			"double",
		),
		measure([guitar(each([14, 12, 11, 9, 7, 6, 7, 9, 11, 12, 14, 15], 2))], "double"),
		measure(
			[
				guitar([
					[14, 6, "b"],
					[13, 6],
					[11, 6],
					[10, 6, "v"],
				]),
			],
			"double",
		),
		measure(
			[
				guitar([
					[11, 12, "v"],
					[7, 12, "v"],
				]),
			],
			"double",
		),
	],
	// The keys' turn: broken chords; runs up and down the scale; a trill and a turn; falling
	// sequences; sweeps; and, over blast beats, faster runs climbing in fours to a high G.
	keys: [
		measure([keys(each([7, 11, 9, 11, 7, 11, 9, 11, 7, 11, 9, 11], 2))], "double"),
		measure([keys(each([7, 11, 9, 11, 9, 14, 11, 14, 11, 16, 14, 16], 2))], "double"),
		measure([keys([...steps(15, 4), ...steps(5, 16)])], "double"),
		measure([keys([...steps(16, 7), ...steps(8, 15), [14, 6, "v"]])], "double"),
		measure([keys(each([12, 10, 12, 10, 12, 10, 9, 10, 12, 14, 12, 10], 2))], "double"),
		measure([keys(each([9, 11, 10, 9, 10, 9, 8, 9, 8, 7, 8, 7], 2))], "double"),
		measure(
			[keys(each([7, 10, 12, 14, 17, 14, 12, 10, 7, 5, 3, 5, 7, 10, 12, 14, 17, 14, 12, 10, 7, 5, 3, 5], 1))],
			"double",
		),
		measure([keys([...each([2, 4, 7, 9, 11, 14, 16, 18, 16, 14, 11, 9], 1), [7, 12, "v"]])], "double"),
		measure([keys([...steps(6, 17), ...steps(16, 5)])], "blast"),
		measure(
			[keys(each([7, 8, 9, 10, 8, 9, 10, 11, 9, 10, 11, 12, 10, 11, 12, 13, 11, 12, 13, 14, 12, 13, 14, 15], 1))],
			"blast",
		),
		measure(
			[
				keys([
					[13, 4],
					[15, 4],
					[17, 4],
					[18, 12, "v"],
				]),
			],
			"blast",
		),
		measure(
			[
				keys([[14, 24, "v"]]),
				guitar([
					[null, 12],
					[9, 6, "b"],
					[11, 6, "v"],
				]),
			],
			"blast",
		),
	],
	// Trading: two bars each, then a bar, then a beat each, then together in a unison sweep.
	trade: [
		measure(
			[
				guitar([
					[11, 6, "b"],
					[12, 2],
					[11, 4],
					[9, 12, "v"],
				]),
			],
			"blast",
		),
		measure(
			[
				guitar([
					[7, 4],
					[9, 4],
					[11, 4],
					[14, 12, "bv"],
				]),
			],
			"blast",
		),
		measure([keys([...steps(15, 4), ...steps(6, 17)])], "blast"),
		measure(
			[
				keys([
					[16, 6],
					[14, 6],
					[11, 6],
					[14, 6, "v"],
				]),
			],
			"blast",
		),
		measure(
			[
				guitar([
					[12, 8, "bv"],
					[10, 4],
					[12, 4],
					[14, 8, "v"],
				]),
			],
			"blast",
		),
		measure([keys(each([14, 13, 11, 9, 7, 9, 11, 13, 14, 16, 14, 13], 2))], "blast"),
		measure([guitar(each([14, 12, 14, 10, 14, 9, 14, 10, 14, 12, 14, 15], 2))], "blast"),
		measure([keys(each([16, 14, 16, 12, 16, 11, 16, 12, 16, 14, 16, 17], 2))], "blast"),
		measure(
			[
				guitar([
					[15, 6, "b"],
					[13, 6],
					[null, 12],
				]),
				keys([
					[null, 12],
					[15, 4],
					[13, 4],
					[11, 4],
				]),
			],
			"double",
		),
		measure(
			[
				guitar([
					[12, 12, "bv"],
					[null, 12],
				]),
				keys([[null, 12], ...each([14, 12, 11, 9, 7, 4], 2)]),
			],
			"double",
		),
		measure(
			[
				guitar(each([4, 6, 8, 10, 11, 13, 15, 13, 11, 10, 8, 6, 4, 6, 8, 10, 11, 13, 15, 17, 15, 13, 11, 10], 1)),
				keys(each([4, 6, 8, 10, 11, 13, 15, 13, 11, 10, 8, 6, 4, 6, 8, 10, 11, 13, 15, 17, 15, 13, 11, 10], 1)),
			],
			"double",
		),
		measure([guitar([[14, 24, "bv"]]), keys([[7, 24, "v"]])], "double"),
	],
	// The drums alone, the band stopped dead on one hit; a half-time breakdown, the guitar singing
	// Silent Night over held chords; and a build, the snare doubling bar by bar, the keys climbing
	// and the guitar tremolo-picking higher.
	breakdown: [
		measure([], "break", "hit", 0),
		measure([], "break", "none", 1),
		measure([], "break", "none", 2),
		measure([], "break", "none", 3),
		measure([guitar(sung(4)), ...pad([3, 5, 7])], "half", "chord"),
		measure([guitar(sung(5)), ...pad([0, 2, 4])], "half", "chord"),
		measure([guitar(sung(6)), ...pad([3, 5, 7])], "half", "chord"),
		measure([guitar(sung(7)), ...pad([0, 2, 4])], "half", "chord"),
		measure(
			[
				guitar(Array.from({ length: 24 }, (): ISoloNote => [11, 1])),
				keys(each([4, 8, 6, 8, 4, 8, 6, 8, 4, 8, 6, 8], 2)),
			],
			"build",
			"gallop",
			0,
		),
		measure(
			[
				guitar(Array.from({ length: 24 }, (): ISoloNote => [11, 1])),
				keys(each([7, 11, 9, 11, 7, 11, 9, 11, 7, 11, 9, 11], 2)),
			],
			"build",
			"gallop",
			1,
		),
		measure(
			[
				guitar(Array.from({ length: 24 }, (): ISoloNote => [13, 1])),
				keys(each([11, 15, 13, 15, 11, 15, 13, 17, 13, 15, 13, 17], 2)),
			],
			"build",
			"gallop",
			2,
		),
		measure(
			[
				guitar(Array.from({ length: 24 }, (): ISoloNote => [14, 1])),
				keys(each([14, 18, 16, 18, 14, 18, 16, 18, 14, 18, 16, 18], 2)),
			],
			"build",
			"gallop",
			3,
		),
	],
	// The finale: runs up and down with the keys a third above; the tune again over half time;
	// pedal licks against the keys' sweeps; then the twin guitars: cascading to the B under middle C,
	// "sleep in heavenly peace" sung long, climbing in thirds, and a bent high C diving onto the last hit.
	finale: [
		measure([guitar([...steps(0, 11), ...steps(12, 1)]), keys([...steps(2, 13), ...steps(14, 3)])], "blast"),
		measure([guitar([...steps(2, 13), ...steps(14, 3)]), keys([...steps(4, 15), ...steps(16, 5)])], "blast"),
		measure([guitar([...steps(4, 15), ...steps(16, 5)]), keys([...steps(6, 17), ...steps(18, 7)])], "blast"),
		measure(
			[
				guitar([
					[7, 4],
					[9, 4],
					[11, 4],
					[14, 12, "bv"],
				]),
				keys([
					[9, 4],
					[11, 4],
					[14, 4],
					[16, 12, "v"],
				]),
			],
			"blast",
		),
		measure(
			[
				guitar([
					[12, 8, "bv"],
					[12, 4],
					[14, 6],
					[12, 2],
					[11, 4],
				]),
				...pad([3, 5, 7]),
			],
			"half",
			"chord",
		),
		measure(
			[
				guitar([
					[11, 6, "b"],
					[12, 2],
					[11, 4],
					[9, 12, "v"],
				]),
				...pad([0, 2, 4]),
			],
			"half",
			"chord",
		),
		measure(
			[
				guitar(each([14, 10, 14, 9, 14, 7, 14, 5, 14, 7, 14, 10], 2)),
				keys(each([3, 5, 7, 10, 12, 14, 17, 14, 12, 10, 7, 5, 3, 5, 7, 10, 12, 14, 17, 14, 12, 10, 7, 5], 1)),
			],
			"blast",
		),
		measure(
			[
				guitar(each([11, 9, 11, 7, 11, 4, 11, 7, 11, 9, 12, 13], 2)),
				keys(each([0, 2, 4, 7, 9, 11, 14, 11, 9, 7, 4, 2, 0, 2, 4, 7, 9, 11, 14, 11, 9, 7, 4, 2], 1)),
			],
			"blast",
		),
		measure([guitar([...steps(15, 4), ...each([5, 6, 8], 2), [6, 6, "v"]], -2), ...pad([4, 6, 8])], "blast"),
		measure(
			[
				guitar(
					[
						[7, 12, "bv"],
						[9, 12, "bv"],
					],
					-2,
				),
				...pad([0, 2, 4]),
			],
			"blast",
		),
		measure([guitar(each([6, 8, 7, 9, 8, 10, 9, 11, 10, 12, 11, 13], 2), -2), ...pad([4, 6, 10])], "blast"),
		measure([guitar([[14, 24, "bvd"]], -3)], "none", "none"),
	],
} satisfies Record<string, ISoloBar[]>;
type ISoloPart = keyof typeof SOLOS;

/**
 * A sung note, for the solo (the guitar's or the keys'): picked, sustained and
 * dying away, bent up into its pitch from a tone below (`ways` "b"), with vibrato coming in as it's
 * held ("v"), and dived an octave over its last third ("d").
 */
function sing(output: AudioNode, delay: number, pitch: number, length: number, volume: number, ways: string) {
	const context = output.context;
	const start = context.currentTime + delay;
	const end = start + length;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = "sawtooth";
	const bendTime = Math.min(0.1, length * 0.4);
	oscillator.frequency.setValueAtTime(ways.includes("b") ? pitch * 2 ** (-2 / 12) : pitch, start);
	oscillator.frequency.exponentialRampToValueAtTime(pitch, start + bendTime);

	if (ways.includes("d")) {
		oscillator.frequency.setValueAtTime(pitch, start + length * 0.66);
		oscillator.frequency.exponentialRampToValueAtTime(pitch / 2, end);
	}

	if (ways.includes("v")) {
		const wobble = context.createOscillator();
		const depth = context.createGain();
		wobble.frequency.value = 5.5;
		depth.gain.setValueAtTime(0, start);
		depth.gain.linearRampToValueAtTime(pitch * 0.015, start + Math.min(0.4, length * 0.5));
		wobble.connect(depth).connect(oscillator.frequency);
		wobble.start(start);
		wobble.stop(end);
	}

	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
	gain.gain.exponentialRampToValueAtTime(volume * 0.55, Math.max(start + 0.01, end - 0.04));
	gain.gain.exponentialRampToValueAtTime(0.0001, end);
	oscillator.connect(gain).connect(output);
	oscillator.start(start);
	oscillator.stop(end + 0.02);
}

/**
 * One time through the whole song: each part's hits, in quavers from the song's start. Its
 * `variant` (0 or 1) is how it's played this time round, so the night doesn't hear the same song
 * twice running: the second plays the strings plucked as well as held, the arpeggios falling
 * first, the gallop pushed onto the last of each three, a ride for the hats, the twin leads a sixth
 * apart (under the tune) with the keys doubling it high, the climax's sweeps on the keys, the
 * guitar and keys swapping parts in the solo, and the drums' break in another order.
 */
function arrangement(variant: number): IHit[] {
	const hits: IHit[] = [];
	const add = (at: number, stem: IStem, play: IHit["play"], bossOnly = false) =>
		hits.push({ at, stem, bossOnly, play });

	// Where each part starts, in quavers (they're twelve bars long, but for the solo).
	let partStart = 0;

	PARTS.forEach((part, partIndex) => {
		const solo: ISoloBar[] | null = part in SOLOS ? SOLOS[part as ISoloPart] : null;
		const heavy = part === "metal" || part === "climax" || solo !== null;
		const atLeast = (other: IPart) => partIndex >= PARTS.indexOf(other);
		const bars = partBars(part);

		// `index`: which of the tune's bars (its notes and chord); `position`: which bar of the part it is.
		bars.forEach((index, position) => {
			const bar = TUNE[index];
			const start = partStart + position * BAR;
			const last = position === bars.length - 1;
			// The song's last bar: the band's one last hit, under the solo's last note, the strings ringing on.
			const ending = part === "finale" && last;
			const soloBar = solo?.[position] ?? null;
			const band = heavy && !ending;
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

				// The twin lead, tremolo-picked: the tune and a third above it, distorted, an octave under
				// the music box.
				// (In the solo, the solo plays instead.)
				if (band && !solo) {
					const lead = pitch / 2;
					const harmony = variant === 1 ? thirdAbove(note) / 2 : thirdAbove(note);

					for (let pick = 0; pick < length * 4; pick++) {
						add(at + pick / 4, "full", (delay, out) => {
							tone("sawtooth", lead, lead, THIRTY_SECOND * 1.1, 0.03, delay, out.guitar);
							tone("sawtooth", harmony, harmony, THIRTY_SECOND * 1.1, 0.022, delay, out.guitar);
						});
					}

					if (variant === 1) {
						add(at, "full", (delay, out) => sing(out.keys, delay, pitch, time, 0.014, "v"));
					}
				}

				at += length;
			}

			// A cold drone under it all: the root, low, held through the bar.
			add(start, "both", (delay, out) =>
				tone("triangle", rootPitch / 2, rootPitch / 2, BAR * EIGHTH, 0.05, delay, out.clean),
			);

			if (atLeast("strings")) {
				// The strings: the chord held, swelling.
				// (Its pitches worked out now, while the song's being arranged, so they're lifted with it.)
				const held = rest.map(pitchOf);
				add(start, "both", (delay, out) => {
					for (const pitch of held) {
						tone("sawtooth", pitch, pitch * 1.004, BAR * EIGHTH, 0.012, delay, out.clean);
						tone("triangle", pitch, pitch, BAR * EIGHTH, 0.03, delay, out.clean);
					}
				});

				// The strings plucked as well, the second time round: the chord's notes in turn on each quaver.
				if (variant === 1 && !heavy) {
					for (let eighth = 0; eighth < 6; eighth++) {
						const pitch = pitchOf(rest[eighth % rest.length]) * 2;
						add(start + eighth, "full", (delay, out) => tone("triangle", pitch, pitch, 0.18, 0.025, delay, out.clean));
					}
				}

				// A bell tolling at the top of every other bar.
				const bell = pitchOf("C4");

				if (position % 2 === 0) {
					add(start, "both", (delay, out) => {
						tone("sine", bell, bell, 3, 0.06, delay, out.clean);
						tone("sine", bell * 2.76, bell * 2.76, 1.6, 0.018, delay, out.clean);
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
			if (atLeast("arpeggios") && !solo) {
				const tones = chordTones(index);

				(variant === 1 ? [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]).forEach(
					(step, sixteenth) => {
						add(start + sixteenth / 2, "full", (delay, out) =>
							tone("triangle", tones[step], tones[step] * 0.999, SIXTEENTH * 1.6, 0.035, delay, out.clean),
						);
					},
				);
			}

			// The rhythm guitar: a palm-muted gallop on the bar's root and fifth (da-da-dum, da-da-dum),
			// the bass doubling it.
			const gallop = (bossOnly: boolean) => {
				for (let sixteenth = 0; sixteenth < 12; sixteenth++) {
					// Da-da-dum, or the second time round, dum-da-da.
					const accent = sixteenth % 3 === (variant === 1 ? 2 : 0);
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

				// The bass guitar, picked with the gallop on the root, gritty; and a sub note under it, held.
				for (let sixteenth = 0; sixteenth < 12; sixteenth++) {
					add(
						start + sixteenth / 2,
						"full",
						(delay, out) => tone("sawtooth", rootPitch / 2, rootPitch / 2, SIXTEENTH * 0.9, 0.09, delay, out.bass),
						bossOnly,
					);
				}

				add(
					start,
					"full",
					(delay, out) => tone("sine", rootPitch / 4, rootPitch / 4, BAR * EIGHTH, 0.16, delay, out.clean),
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
					add(start + eighth, "full", (delay, out) => (variant === 1 ? ride : hat)(delay, out.clean), bossOnly);
				}

				if (position % (blast ? 2 : 4) === 0 && !soloBar?.crash) {
					add(start, "full", (delay, out) => crash(delay, out.clean), bossOnly);
				}

				if (position % 4 === 3 && !last) {
					[260, 220, 190, 160, 130, 110].forEach((pitch, step) => {
						add(start + 3 + step / 2, "full", (delay, out) => tom(delay, out.clean, pitch), bossOnly);
					});
				}
			};

			// The band's power chord held through the bar, and the bass and sub under it (the solo's
			// half time, and the hit it stops dead on for the drums).
			const chord = (withCrash: boolean, length = 1) =>
				add(start, "full", (delay, out) => {
					if (withCrash) {
						crash(delay, out.clean, 0.1);
						kick(delay, out.clean, 0.24);
						snare(delay, out.clean, 0.12);
					}

					for (const pitch of [rootPitch / 2, (rootPitch / 2) * 1.5, rootPitch]) {
						tone("sawtooth", pitch, pitch, length * BAR * EIGHTH, 0.05, delay, out.guitar);
					}

					tone("sawtooth", rootPitch / 2, rootPitch / 2, length * BAR * EIGHTH, 0.09, delay, out.bass);
					tone("sine", rootPitch / 4, rootPitch / 4, length * BAR * EIGHTH, 0.16, delay, out.clean);
				});

			// The solo's drums, as its bar says: double kick, blast beats, half time (a kick and a huge
			// snare, a crash every bar), a build (the snare doubling at each level, to a roll), or the
			// drums alone (`level` 0 to 3: toms rolling down; snare and toms trading; a double-kick
			// rumble into tumbling toms; a snare roll swelling).
			const at32 = (step: number) => start + step / 4;
			const soloDrums = (mode: ISoloBar["drums"], level: number) => {
				switch (mode) {
					case "double":
					case "blast":
						metalDrums(false, mode === "blast");
						break;
					case "half":
						for (const eighth of [0, 0.5, 3.5]) {
							add(start + eighth, "full", (delay, out) => kick(delay, out.clean, 0.22));
						}

						add(start + 3, "full", (delay, out) => snare(delay, out.clean, 0.15));
						add(start, "full", (delay, out) => crash(delay, out.clean, 0.08));

						for (let eighth = 0; eighth < 6; eighth++) {
							add(start + eighth, "full", (delay, out) => hat(delay, out.clean, 0.02));
						}

						break;
					case "build": {
						const snares = [
							[3],
							[0, 1, 2, 3, 4, 5],
							Array.from({ length: 12 }, (_, i) => i / 2),
							Array.from({ length: 24 }, (_, i) => i / 4),
						][level];

						for (let sixteenth = 0; sixteenth < 12; sixteenth++) {
							add(start + sixteenth / 2, "full", (delay, out) => kick(delay, out.clean, 0.16));
						}

						snares.forEach((eighth, i) => {
							add(start + eighth, "full", (delay, out) =>
								snare(delay, out.clean, 0.06 + (level === 3 ? (i / snares.length) * 0.1 : 0.04)),
							);
						});

						if (level === 0) {
							add(start, "full", (delay, out) => crash(delay, out.clean));
						}

						break;
					}
					case "break":
						// The cymbals over the drums alone: hats on every sixteenth, opening on the beats, a
						// ride's bell through the snare and toms' trading, a crash halfway through the rumble.
						for (let sixteenth = level === 0 ? 1 : 0; sixteenth < 12; sixteenth++) {
							const open = sixteenth % 6 === 0;
							add(start + sixteenth / 2, "full", (delay, out) =>
								open ? hiss("highpass", 7000, 0.22, 0.03, delay, undefined, out.clean) : hat(delay, out.clean, 0.022),
							);
						}

						if (level === 1) {
							for (let eighth = 0; eighth < 6; eighth++) {
								add(start + eighth, "full", (delay, out) => ride(delay, out.clean, 0.03));
							}
						}

						if (level === 2) {
							add(start + 3, "full", (delay, out) => crash(delay, out.clean, 0.08));
						}

						if (level === 0) {
							[300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100].forEach((pitch, i) => {
								add(start + (i + 1) / 2, "full", (delay, out) => {
									tom(delay, out.clean, pitch, 0.16);
									kick(delay, out.clean, 0.1);
								});
							});
						} else if (level === 1) {
							for (let step = 0; step < 24; step++) {
								add(at32(step), "full", (delay, out) =>
									step % 2 === 0
										? snare(delay, out.clean, 0.05 + step * 0.003)
										: tom(delay, out.clean, 260 - step * 6, 0.13),
								);
							}

							for (let eighth = 0; eighth < 6; eighth++) {
								add(start + eighth, "full", (delay, out) => kick(delay, out.clean, 0.18));
							}
						} else if (level === 2) {
							for (let step = 0; step < 12; step++) {
								add(at32(step), "full", (delay, out) => kick(delay, out.clean, 0.15 + step * 0.006));
							}

							[300, 270, 240, 210, 180, 160, 140, 120, 100, 85, 70, 60].forEach((pitch, i) => {
								add(at32(12 + i), "full", (delay, out) => tom(delay, out.clean, pitch, 0.15));
							});
						} else {
							for (let step = 0; step < 24; step++) {
								add(at32(step), "full", (delay, out) => snare(delay, out.clean, 0.03 + step * 0.005));
							}

							for (let sixteenth = 6; sixteenth < 12; sixteenth++) {
								add(start + sixteenth / 2, "full", (delay, out) => kick(delay, out.clean, 0.18));
							}
						}

						break;
					case "none":
						break;
				}
			};

			if (soloBar?.crash) {
				add(start, "full", (delay, out) => crash(delay, out.clean, 0.1));
			}

			if (soloBar && !ending) {
				// The drums' break in another order the second time round, its snare roll still last.
				soloDrums(
					soloBar.drums,
					variant === 1 && soloBar.drums === "break" ? [2, 1, 0, 3][soloBar.level ?? 0] : (soloBar.level ?? 0),
				);

				if (soloBar.rhythm === "gallop") {
					gallop(false);
				} else if (soloBar.rhythm === "chord" || soloBar.rhythm === "hit") {
					chord(soloBar.rhythm === "hit");
				}
			} else if (band) {
				metalDrums(false, part === "climax");
				gallop(false);
			} else if (ending) {
				// The last hit rings on into the silence after the song (TAIL_BARS), dying away before it goes round again.
				chord(true, 1 + TAIL_BARS * 0.8);
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

				if (position === 0) {
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

			if (part === "arpeggios" && position === bars.length - 2) {
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

			// The solo's lines for this bar: the guitar (through the darker lead) and the keys (a lead
			// synth, a little brighter), each perhaps with a second voice `under` it.
			// The second time round, in the guitar's and keys' parts and the breakdown, the two swap
			// (the guitar taking the keys' lines an octave down).
			const swapped = variant === 1 && (part === "solo" || part === "keys" || part === "trade" || part === "breakdown");

			for (const line of soloBar?.lines ?? []) {
				let step = start;
				// (The keys' held chords stay on the keys.)
				const keyed = line.volume !== undefined || (swapped ? line.voice === "guitar" : line.voice === "keys");
				const shift = swapped && line.voice === "keys" && line.volume === undefined ? -7 : 0;

				for (const [note, length, ways = ""] of line.notes) {
					if (note !== null) {
						const pitch = typeof note === "number" ? soloPitch(note + shift) : pitchOf(note);
						const second =
							typeof note === "number" && line.under !== undefined ? soloPitch(note + shift + line.under) : null;
						const volume = line.volume ?? (keyed ? 0.035 : 0.05);
						add(step, "full", (delay, out) => {
							const output = keyed ? out.keys : out.lead;
							sing(output, delay, pitch, length * THIRTY_SECOND, volume, ways);

							if (second) {
								sing(output, delay, second, length * THIRTY_SECOND, volume * 0.65, ways);
							}
						});
					}

					step += length / 4;
				}
			}

			// The climax: a sweep at the end of every bar, up the chord and back, in thirty-seconds.
			if (part === "climax") {
				const tones = chordTones(index);

				[0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0].forEach((step, sweep) => {
					add(start + 3 + sweep / 4, "full", (delay, out) =>
						variant === 1
							? sing(out.keys, delay, tones[step], THIRTY_SECOND * 1.4, 0.03, "")
							: tone("sawtooth", tones[step], tones[step], THIRTY_SECOND * 1.4, 0.025, delay, out.guitar),
					);
				});
			}
		});

		partStart += bars.length * BAR;
	});

	return hits;
}

/** A distorted guitar sound: everything through it driven (by `gain`) into clipping, then rounded off above `cutoff` Hz. */
function guitarChain(context: BaseAudioContext, output: AudioNode, gain = 6, cutoff = 3200, volume = 0.14): AudioNode {
	const drive = context.createGain();
	drive.gain.value = gain;
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
	filter.frequency.value = cutoff;
	const level = context.createGain();
	level.gain.value = volume;
	drive.connect(shaper).connect(filter).connect(level).connect(output);

	return drive;
}

/** Bars of silence after the song's last hit, for it to ring out and die away before the song goes round again. */
const TAIL_BARS = 2;

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
	const bus = musicOut();

	if (started === null || !bus) {
		return () => {};
	}

	const context = bus.context;
	const makeStem = () => {
		const gain = context.createGain();
		gain.connect(bus);

		return {
			gain,
			outputs: {
				clean: gain,
				guitar: guitarChain(context, gain),
				lead: guitarChain(context, gain, 5, 2000, 0.13),
				bass: guitarChain(context, gain, 2.5, 650, 0.3),
				keys: guitarChain(context, gain, 4, 2600, 0.11),
			},
		};
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

	// Each time round the loop is played another way (arrangement's variant), and every other pair
	// of times round a whole tone up: four different passes before any comes round again. The menu
	// only ever plays the first. Each pass's hits are kept by bar, to find those due quickly.
	const barLength = BAR * EIGHTH;
	const passes = [0, 1, 2, 3].map((pass) => {
		lift = pass >= 2 ? 2 ** (2 / 12) : 1;
		const bars: IHit[][] = [];

		for (const hit of arrangement(pass % 2)) {
			const index = Math.floor((hit.at * EIGHTH) / barLength);
			(bars[index] ??= []).push(hit);
		}

		lift = 1;

		return bars;
	});
	const partLength = TUNE.length * barLength;
	// The music box plays once, then the song goes round from the strings (the menu: the first two parts, round and round).
	const introLength = menu ? 0 : partLength;
	const loopLength = menu ? 2 * partLength : (SONG_BARS - TUNE.length + TAIL_BARS) * barLength;
	// Where in the song the night is: the clock says how far it's come, so it carries on there.
	const origin = started + 0.2 - night().time;
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

		const from = Math.max(scheduledTo, now);
		const firstLoop = Math.max(0, Math.floor((from - origin - introLength) / loopLength));

		// The first time round always (it holds the intro, which comes before the loop starts).
		for (let loop = firstLoop; loop === 0 || origin + introLength + loop * loopLength < until; loop++) {
			const bars = passes[menu ? 0 : loop % passes.length];
			// This time round, the loop's hits sound `shift` later (the intro's only the first time).
			const shift = loop * loopLength;
			const earliest = Math.max(loop === 0 ? 0 : introLength, from - origin - shift);
			const latest = Math.min(introLength + loopLength, until - origin - shift);

			for (let index = Math.floor(earliest / barLength); index * barLength < latest; index++) {
				for (const hit of bars[index] ?? []) {
					const time = hit.at * EIGHTH;
					const when = origin + time + (time < introLength ? 0 : shift);

					if (time >= earliest && time < latest && when >= from && (!hit.bossOnly || current.boss)) {
						hit.play(when - now, stems[hit.stem].outputs);
					}
				}
			}
		}

		scheduledTo = Math.max(scheduledTo, until);
	};

	schedule();
	const timer = window.setInterval(schedule, TICK_MS);

	return () => {
		window.clearInterval(timer);
		musicBuses.delete(bus);
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

/**
 * The night beginning, as the curtain rises (about three seconds, before the night's own music):
 * a low drone and a C minor chord swelling up out of nothing, a broken chord falling slowly from
 * high to low on a music box, and a bell tolling twice.
 */
export function playNightBegins() {
	const bus = soundOn ? musicOut() : null;

	if (!bus) {
		return;
	}

	const context = bus.context;
	const now = context.currentTime + 0.05;
	// A note that swells in and dies away (`tone` only dies away).
	const swell = (wave: OscillatorType, pitch: number, start: number, length: number, volume: number) => {
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = wave;
		oscillator.frequency.value = pitch;
		gain.gain.setValueAtTime(0.0001, now + start);
		gain.gain.exponentialRampToValueAtTime(volume, now + start + length * 0.45);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
		oscillator.connect(gain).connect(bus);
		oscillator.start(now + start);
		oscillator.stop(now + start + length + 0.05);
	};

	swell("sine", NOTE.C2, 0, 3.4, 0.2);
	swell("triangle", NOTE.C3, 0.1, 3.2, 0.06);

	for (const note of ["C4", "Eb4", "G4"]) {
		swell("sawtooth", NOTE[note], 0.2, 3, 0.012);
		swell("triangle", NOTE[note], 0.2, 3, 0.03);
	}

	["G5", "Eb5", "C5", "G4", "Eb4", "C4"].forEach((note, i) =>
		tone("sine", NOTE[note], NOTE[note] * 0.997, 1.6, 0.06, 0.3 + i * 0.28, bus),
	);

	for (const at of [0, 1.9]) {
		tone("sine", NOTE.C3, NOTE.C3, 3, 0.12, at, bus);
		tone("sine", NOTE.C3 * 2.76, NOTE.C3 * 2.76, 1.8, 0.03, at, bus);
		tone("sine", NOTE.C3 * 5.4, NOTE.C3 * 5.4, 1, 0.015, at, bus);
	}

	window.setTimeout(() => {
		musicBuses.delete(bus);
		bus.disconnect();
	}, 4000);
}
