/**
 * Elf Fling's sound effects, made on the spot with the browser's Web Audio (no sound files to
 * download): short, soft synth sounds for the swing, hits, coins, crackers and so on.
 *
 * Off until the player turns it on, and remembered per device. Browsers only allow sound
 * after a tap or click, which turning it on always is.
 */

import { fireworksSoFar } from "Components/ElfFling/journey";
import { ROCKET_SECONDS, type IGameState } from "Components/ElfFling/physics";
import { inGust, inUpdraft, JET_STREAM_HEIGHT } from "Components/ElfFling/weather";

const STORAGE_KEY = "secret-santa-elf-fling-sound";
const VOLUME = 0.35;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

export function readSoundOn(): boolean {
	try {
		return window.localStorage.getItem(STORAGE_KEY) === "on";
	} catch {
		return false;
	}
}

export function saveSoundOn(on: boolean) {
	try {
		window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
	} catch {
		// Not remembered this time; it still applies until the page closes.
	}
}

/** The audio clock (seconds), for scheduling music ahead; null without audio. */
export function audioNow(): number | null {
	return audio()?.currentTime ?? null;
}

/** Starts (or wakes) the audio. Call from the tap or click that turns sound on. */
export function wakeAudio() {
	audio()
		?.resume()
		.catch(() => {});
}

function audio(): AudioContext | null {
	if (!context) {
		const AudioContextClass =
			window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

		if (!AudioContextClass) {
			return null;
		}

		context = new AudioContextClass();
		master = context.createGain();
		master.gain.value = VOLUME;
		master.connect(context.destination);
	}

	return context;
}

/** A volume of its own for some music, on the way out (so it can fade); null without audio. */
export function musicBus(): GainNode | null {
	const ctx = audio();

	if (!ctx || !master) {
		return null;
	}

	const bus = ctx.createGain();
	bus.connect(master);

	return bus;
}

/** A second of white noise, made once, for the hissy and crackly sounds. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
	if (!noise) {
		noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
		const data = noise.getChannelData(0);

		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}

	return noise;
}

/**
 * A tone that starts at `from` Hz, slides to `to`, and fades out over `length` seconds, `delay`
 * seconds from now (through `output`, if given, rather than straight out). Shared with
 * pinball's sounds and music (Components/Pinball/pinballSound.ts).
 */
export function tone(
	type: OscillatorType,
	from: number,
	to: number,
	length: number,
	volume: number,
	delay = 0,
	output?: AudioNode,
) {
	const ctx = audio();

	if (!ctx || !master) {
		return;
	}

	const start = ctx.currentTime + delay;
	const oscillator = ctx.createOscillator();
	const gain = ctx.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(from, start);
	oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + length);
	gain.gain.setValueAtTime(volume, start);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
	oscillator.connect(gain).connect(output ?? master);
	oscillator.start(start);
	oscillator.stop(start + length + 0.02);
}

/** A burst of filtered noise, fading out over `length` seconds, `delay` seconds from now. Shared too. */
export function hiss(
	filter: BiquadFilterType,
	frequency: number,
	length: number,
	volume: number,
	delay = 0,
	sweepTo?: number,
	output?: AudioNode,
) {
	const ctx = audio();

	if (!ctx || !master) {
		return;
	}

	const start = ctx.currentTime + delay;
	const source = ctx.createBufferSource();
	const shape = ctx.createBiquadFilter();
	const gain = ctx.createGain();
	source.buffer = noiseBuffer(ctx);
	source.loop = length > 1;
	shape.type = filter;
	shape.frequency.setValueAtTime(frequency, start);

	if (sweepTo) {
		shape.frequency.exponentialRampToValueAtTime(sweepTo, start + length);
	}

	gain.gain.setValueAtTime(volume, start);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
	source
		.connect(shape)
		.connect(gain)
		.connect(output ?? master);
	source.start(start);
	source.stop(start + length + 0.02);
}

/**
 * Hopping off the presents: a quick springy "hup" as the flyer pushes off, then a soft
 * cartoon falling whistle that slides down as it drops toward the bat (faded out before the
 * swing, so it never covers the crack).
 */
export function playHop() {
	tone("triangle", 520, 860, 0.07, 0.35);
	tone("sine", 1100, 520, 0.9, 0.12, 0.08);
}

/** The candy cane whooshing round. */
export function playSwing() {
	hiss("bandpass", 500, 0.16, 0.5, 0, 1600);
}

/** Bat meets elf: a crack, brighter and with a little ring for a perfect hit. */
export function playHit(perfect: boolean) {
	hiss("highpass", 1800, 0.07, 0.9);
	tone("triangle", 220, 90, 0.12, 0.6);

	if (perfect) {
		tone("sine", 1320, 1320, 0.25, 0.25, 0.03);
		tone("sine", 1980, 1980, 0.3, 0.18, 0.06);
	}
}

/** A coin: a bright two-note blip, higher and longer for the valuable ones. */
export function playCoin(value: number) {
	const base = value >= 10 ? 1760 : value >= 3 ? 1480 : 1320;
	tone("triangle", base, base, 0.08, 0.3);
	tone("triangle", base * 1.5, base * 1.5, value >= 3 ? 0.22 : 0.12, 0.25, 0.06);
}

/** Gems: a quick, high, glassy run of four notes with a shimmer. */
export function playGem() {
	[1568, 1976, 2349, 3136].forEach((pitch, i) => tone("sine", pitch, pitch, 0.3, 0.22, i * 0.05));
	hiss("highpass", 6000, 0.35, 0.12, 0.05);
}

/** A Christmas cracker going bang. */
export function playPop() {
	hiss("lowpass", 2400, 0.09, 1);
	tone("sine", 320, 70, 0.14, 0.7);
}

/** A glass ornament shattering: a scatter of high tinkles over a hiss. */
export function playShatter() {
	hiss("highpass", 4000, 0.25, 0.4);

	for (let i = 0; i < 5; i++) {
		const pitch = 2600 + Math.random() * 2400;
		tone("sine", pitch, pitch * 0.98, 0.18, 0.15, i * 0.035);
	}
}

/** Bumping into a snowman: a soft, snowy thud. */
export function playThud() {
	tone("sine", 110, 45, 0.25, 0.8);
	hiss("lowpass", 600, 0.18, 0.4);
}

/** The elf's jump: a springy boing. */
/** Coming down on the snow: a soft whump, louder the harder the landing. */
export function playLanding(speed: number) {
	const volume = Math.min(1, 0.25 + speed / 30);
	hiss("lowpass", 900, 0.2, volume * 0.7, 0, 250);
	tone("sine", 150, 55, 0.18, volume * 0.6);
}

/** Into a gust of wind: a whoosh sweeping up and away. */
export function playGust() {
	hiss("bandpass", 500, 0.9, 0.5, 0, 2200);
	hiss("bandpass", 1600, 0.6, 0.25, 0.15, 600);
}

/** Into an updraft: a longer whoosh, rising. */
export function playUpdraft() {
	hiss("bandpass", 300, 1.3, 0.55, 0, 3000);
	tone("sine", 180, 420, 1.1, 0.08);
}

export function playJump() {
	tone("sine", 240, 620, 0.16, 0.45);
}

/** The firework rocket fizzing for as long as it burns. */
export function playRocket(seconds: number) {
	hiss("bandpass", 2800, seconds, 0.45);
	tone("sawtooth", 140, 260, seconds, 0.05);
}

/** Climbing aboard the sleigh: a run of sleigh bells. */
export function playSleighBells() {
	for (let i = 0; i < 8; i++) {
		const pitch = 2200 + (i % 3) * 330;
		tone("sine", pitch, pitch, 0.14, 0.18, i * 0.08);
		tone("sine", pitch * 2.4, pitch * 2.4, 0.08, 0.06, i * 0.08);
	}
}

/**
 * Soft sleigh bells for as long as the player holds "wrap up Christmas": quiet, scattered
 * jingles that come quicker and a little louder as the hold goes on. Returns a function that
 * stops them.
 */
export function startSleighBellAmbience(seconds: number): () => void {
	const started = performance.now();
	let timer = 0;

	const jingle = () => {
		const progress = Math.min(1, (performance.now() - started) / (seconds * 1000));
		const pitch = 2000 + Math.random() * 900;
		tone("sine", pitch, pitch, 0.14, 0.05 + 0.06 * progress);
		tone("sine", pitch * 2.4, pitch * 2.4, 0.07, 0.02 + 0.02 * progress);
		timer = window.setTimeout(jingle, 240 - 150 * progress + Math.random() * 60);
	};

	jingle();

	return () => window.clearTimeout(timer);
}

/** Grabbing a power-up: a quick rising sweep and a bright twinkle on top. */
export function playPowerUp() {
	tone("triangle", 520, 1560, 0.28, 0.35);
	[1568, 2093].forEach((pitch, i) => tone("sine", pitch, pitch, 0.25, 0.18, 0.18 + i * 0.07));
}

/** A Yule log firing: a deep wooden boom and a puff of smoke. */
export function playCannon() {
	tone("sine", 90, 35, 0.5, 0.9);
	tone("triangle", 160, 60, 0.25, 0.5);
	hiss("lowpass", 900, 0.45, 0.6, 0, 200);
}

/** The sleigh flying in: a few soft, distant bells, so you look for it. */
export function playSleighArrives() {
	for (let i = 0; i < 5; i++) {
		const pitch = 2400 + (i % 2) * 300;
		tone("sine", pitch, pitch, 0.16, 0.07, i * 0.11);
	}
}

/** A firework bursting up over the village: a soft pop and a trailing crackle, under the music. */
export function playFirework() {
	tone("sine", 220, 90, 0.12, 0.18);

	for (let crackle = 0; crackle < 4; crackle++) {
		hiss("highpass", 6000, 0.04, 0.08, 0.18 + crackle * 0.07 + Math.random() * 0.04);
	}
}

/** Note names to frequencies, for the welcome's music. */
const NOTES: Record<string, number> = {
	G2: 98,
	A2: 110,
	B2: 123.47,
	C3: 130.81,
	D3: 146.83,
	E3: 164.81,
	G3: 196,
	A3: 220,
	B3: 246.94,
	C4: 261.63,
	"C#4": 277.18,
	D4: 293.66,
	"D#4": 311.13,
	E4: 329.63,
	"F#4": 369.99,
	G4: 392,
	A4: 440,
	B4: 493.88,
	C5: 523.25,
	D5: 587.33,
	G5: 783.99,
	B5: 987.77,
	D6: 1174.66,
	G6: 1567.98,
};

const G = ["G3", "B3", "D4"];
const C = ["G3", "C4", "E4"];
const D = ["A3", "D4", "F#4"];
const D7 = ["A3", "C4", "F#4"];
const EM = ["G3", "B3", "E4"];

/**
 * We Wish You a Merry Christmas (traditional), in G, all of it: the chorus, then "Good tidings
 * we bring". Sixteen bars of three beats, each with its tune ([note, beats]), bass note and
 * chord on each of the second and third beats. The tune's pickup into each half sits at the end
 * of the bar before, so the song loops round.
 */
const MERRY_CHRISTMAS: Array<{ tune: Array<[string, number]>; bass: string; chords: [string[], string[]] }> = [
	{
		tune: [
			["G4", 1],
			["G4", 0.5],
			["A4", 0.5],
			["G4", 0.5],
			["F#4", 0.5],
		],
		bass: "G2",
		chords: [G, G],
	},
	{
		tune: [
			["E4", 1],
			["E4", 1],
			["E4", 1],
		],
		bass: "C3",
		chords: [C, C],
	},
	{
		tune: [
			["A4", 1],
			["A4", 0.5],
			["B4", 0.5],
			["A4", 0.5],
			["G4", 0.5],
		],
		bass: "A2",
		chords: [
			["A3", "C#4", "E4"],
			["A3", "C#4", "E4"],
		],
	},
	{
		tune: [
			["F#4", 1],
			["D4", 1],
			["D4", 1],
		],
		bass: "D3",
		chords: [D, D],
	},
	{
		tune: [
			["B4", 1],
			["B4", 0.5],
			["C5", 0.5],
			["B4", 0.5],
			["A4", 0.5],
		],
		bass: "B2",
		chords: [
			["B3", "D#4", "F#4"],
			["B3", "D#4", "F#4"],
		],
	},
	{
		tune: [
			["G4", 1],
			["E4", 1],
			["D4", 0.5],
			["D4", 0.5],
		],
		bass: "E3",
		chords: [EM, EM],
	},
	{
		tune: [
			["E4", 1],
			["A4", 1],
			["F#4", 1],
		],
		bass: "C3",
		chords: [C, D7],
	},
	{
		tune: [
			["G4", 2],
			["D4", 1],
		],
		bass: "G2",
		chords: [G, G],
	},
	{
		tune: [
			["G4", 1],
			["G4", 1],
			["G4", 1],
		],
		bass: "G2",
		chords: [G, G],
	},
	{
		tune: [
			["F#4", 2],
			["F#4", 1],
		],
		bass: "D3",
		chords: [D, D],
	},
	{
		tune: [
			["G4", 1],
			["F#4", 1],
			["E4", 1],
		],
		bass: "E3",
		chords: [EM, EM],
	},
	{
		tune: [
			["D4", 2],
			["A4", 1],
		],
		bass: "D3",
		chords: [D, D],
	},
	{
		tune: [
			["B4", 1],
			["A4", 1],
			["G4", 1],
		],
		bass: "G2",
		chords: [G, G],
	},
	{
		tune: [
			["D5", 1],
			["D4", 1],
			["D4", 0.5],
			["D4", 0.5],
		],
		bass: "D3",
		chords: [D, D],
	},
	{
		tune: [
			["E4", 1],
			["A4", 1],
			["F#4", 1],
		],
		bass: "C3",
		chords: [C, D7],
	},
	{
		tune: [
			["G4", 2],
			["D4", 1],
		],
		bass: "G2",
		chords: [G, G],
	},
];

/** The welcome's tempo. */
const WELCOME_BEAT = 60 / 160;

type IMusicHit = { at: number; play: (delay: number, output: AudioNode) => void };

/**
 * One time through the song as a little band, as hits in beats from its start: the tune on a
 * bright lead (doubled an octave up, softly), oom-pah-pah bass and chords with a kick and a
 * light snare, sleigh bells on and between every beat, and a glockenspiel run as each half
 * comes home.
 */
function merryChristmas(): IMusicHit[] {
	const hits: IMusicHit[] = [];

	MERRY_CHRISTMAS.forEach(({ tune, bass, chords }, bar) => {
		const start = bar * 3;
		let beat = start;

		for (const [note, beats] of tune) {
			const pitch = NOTES[note];
			hits.push({
				at: beat,
				play: (delay, output) => {
					tone("square", pitch, pitch, beats * WELCOME_BEAT * 0.9, 0.07, delay, output);
					tone("triangle", pitch * 2, pitch * 2, beats * WELCOME_BEAT * 0.6, 0.05, delay, output);
				},
			});
			beat += beats;
		}

		// Oom: the bass and a kick.
		hits.push({
			at: start,
			play: (delay, output) => {
				tone("triangle", NOTES[bass], NOTES[bass], WELCOME_BEAT * 0.9, 0.35, delay, output);
				tone("sine", 140, 50, 0.12, 0.45, delay, output);
			},
		});

		// Pah-pah: the chord, and a light snare.
		chords.forEach((chord, step) => {
			hits.push({
				at: start + 1 + step,
				play: (delay, output) => {
					for (const note of chord) {
						tone("triangle", NOTES[note], NOTES[note], WELCOME_BEAT * 0.45, 0.06, delay, output);
					}

					hiss("bandpass", 2200, 0.08, 0.12, delay, undefined, output);
				},
			});
		});

		// Sleigh bells on every beat, and between them.
		for (let step = 0; step < 3; step++) {
			hits.push({
				at: start + step,
				play: (delay, output) => {
					hiss("highpass", 7000, 0.06, 0.16, delay, undefined, output);
					hiss("highpass", 8000, 0.04, 0.08, delay + WELCOME_BEAT / 2, undefined, output);
				},
			});
		}

		// Home at the end of each half ("and a happy New Year"): a glockenspiel run.
		if (bar === 7 || bar === 15) {
			hits.push({
				at: start,
				play: (delay, output) =>
					["G5", "B5", "D6", "G6"].forEach((note, i) =>
						tone("sine", NOTES[note], NOTES[note], 0.5, 0.18, delay + i * 0.09, output),
					),
			});
		}
	});

	return hits;
}

/** How far ahead the music is scheduled, and how often the scheduler looks. */
const MUSIC_LOOKAHEAD = 0.35;
const MUSIC_TICK_MS = 120;

/** The welcome's music while it plays: how to stop it (fading out over so many seconds). */
let welcomeMusic: ((fade: number) => void) | null = null;

/**
 * The end of the journey: We Wish You a Merry Christmas, round and round for as long as the
 * welcome lasts, on its own volume so it can fade out (stopJourneysEndMusic).
 */
export function startJourneysEndMusic() {
	stopJourneysEndMusic(0);
	const ctx = audio();
	const started = audioNow();
	const bus = musicBus();

	if (!ctx || !bus || started === null) {
		return;
	}

	const hits = merryChristmas();
	const loopLength = MERRY_CHRISTMAS.length * 3 * WELCOME_BEAT;
	// The pickup ("We") first, then the song from its first full bar, round and round.
	tone("square", NOTES.D4, NOTES.D4, WELCOME_BEAT * 0.9, 0.07, 0.05, bus);
	const origin = started + 0.05 + WELCOME_BEAT;
	let scheduledTo = origin;

	const schedule = () => {
		const now = audioNow();

		if (now === null) {
			return;
		}

		const until = now + MUSIC_LOOKAHEAD;

		for (let loop = Math.floor((scheduledTo - origin) / loopLength); origin + loop * loopLength < until; loop++) {
			for (const hit of hits) {
				const when = origin + loop * loopLength + hit.at * WELCOME_BEAT;

				if (when >= scheduledTo && when < until && when >= now) {
					hit.play(when - now, bus);
				}
			}
		}

		scheduledTo = Math.max(scheduledTo, until);
	};

	schedule();
	const timer = window.setInterval(schedule, MUSIC_TICK_MS);

	welcomeMusic = (fade) => {
		window.clearInterval(timer);
		const now = ctx.currentTime;
		bus.gain.setValueAtTime(bus.gain.value, now);
		bus.gain.linearRampToValueAtTime(0, now + Math.max(0.01, fade));
		window.setTimeout(() => bus.disconnect(), (Math.max(0.01, fade) + 0.5) * 1000);
	};
}

/** Stops the welcome's music, if it's playing, fading it out over `fade` seconds. */
export function stopJourneysEndMusic(fade = 1.5) {
	welcomeMusic?.(fade);
	welcomeMusic = null;
}

/** A new best: a little rising fanfare. */
export function playFanfare() {
	[523, 659, 784, 1047].forEach((pitch, i) => tone("triangle", pitch, pitch, i === 3 ? 0.6 : 0.16, 0.4, i * 0.12));
}

/** In a gust, or up in the jet stream. */
function inWind(state: IGameState): boolean {
	return (
		inGust(state.gusts, state.elf.x, state.elf.y) || (state.upgrades.highWinds > 0 && state.elf.y > JET_STREAM_HEIGHT)
	);
}

/**
 * The sounds for whatever just happened in the game, from one moment to the next: the hop off
 * the presents, the swing,
 * the hit, coins, crackers, ornaments, snowmen, landings, gusts and updrafts, power-ups, Yule logs, jumps, the rocket and the sleigh.
 */
export function playStateChanges(previous: IGameState, next: IGameState) {
	if ((previous.phase === "ready" || previous.phase === "celebrating") && next.phase === "dropping") {
		playHop();
	}

	// The end of the journey: the music, round and round until the elf's off for the next round.
	if (previous.phase !== "celebrating" && next.phase === "celebrating") {
		startJourneysEndMusic();
	}

	if (previous.phase === "celebrating" && next.phase !== "celebrating") {
		stopJourneysEndMusic();
	}

	if (fireworksSoFar(next.celebration, next.time) > fireworksSoFar(previous.celebration, previous.time)) {
		playFirework();
	}

	if (previous.swingTime === null && next.swingTime !== null) {
		playSwing();
	}

	if (!previous.swingResolved && next.swingResolved && next.phase === "flying") {
		playHit(next.outcome === "perfect");
	}

	if (next.coinsCollected > previous.coinsCollected) {
		playCoin(next.coinsCollected - previous.coinsCollected);
	}

	if (next.pops > previous.pops) {
		playPop();
	}

	if (next.smashes > previous.smashes) {
		playShatter();
	}

	if (next.bonks > previous.bonks) {
		playThud();
	}

	if (next.landings > previous.landings) {
		playLanding(next.landingSpeed);
	}

	// Into the wind (a gust, or up into the jet stream), or an updraft.
	const entered = (inside: (state: IGameState) => boolean) => !inside(previous) && inside(next);

	if (entered(inWind)) {
		playGust();
	}

	if (entered((state) => inUpdraft(state.updrafts, state.elf.x, state.elf.y))) {
		playUpdraft();
	}

	if (next.jumpsLeft < previous.jumpsLeft) {
		playJump();
	}

	if (previous.rocketUntil === null && next.rocketUntil !== null) {
		playRocket(ROCKET_SECONDS);
	}

	if (next.grabs > previous.grabs) {
		playPowerUp();
	}

	if (next.logFires > previous.logFires) {
		playCannon();
	}

	// The snowball popping the elf back up.
	if (
		previous.phase === "sliding" &&
		next.phase === "flying" &&
		next.active.giantSnowball === null &&
		previous.active.giantSnowball !== null
	) {
		playJump();
	}

	if (previous.sleigh === null && next.sleigh !== null) {
		playSleighArrives();
	}

	if (previous.sleigh?.boardedAt == null && next.sleigh?.boardedAt != null) {
		playSleighBells();
	}
}
