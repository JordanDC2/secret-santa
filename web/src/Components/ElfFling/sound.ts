/**
 * Elf Fling's sound effects, made on the spot with the browser's Web Audio (no sound files to
 * download): short, soft synth sounds for the swing, hits, coins, crackers and so on.
 *
 * Off until the player turns it on, and remembered per device. Browsers only allow sound
 * after a tap or click, which turning it on always is.
 */

import { ROCKET_SECONDS, type IGameState } from "Components/ElfFling/physics";

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
 * seconds from now. Shared with pinball's sounds and music (Components/Pinball/pinballSound.ts).
 */
export function tone(type: OscillatorType, from: number, to: number, length: number, volume: number, delay = 0) {
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
	oscillator.connect(gain).connect(master);
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
	source.connect(shape).connect(gain).connect(master);
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

/** A new best: a little rising fanfare. */
export function playFanfare() {
	[523, 659, 784, 1047].forEach((pitch, i) => tone("triangle", pitch, pitch, i === 3 ? 0.6 : 0.16, 0.4, i * 0.12));
}

/**
 * The sounds for whatever just happened in the game, from one moment to the next: the hop off
 * the presents, the swing,
 * the hit, coins, crackers, ornaments, snowmen, power-ups, Yule logs, jumps, the rocket and the sleigh.
 */
export function playStateChanges(previous: IGameState, next: IGameState) {
	if (previous.phase === "ready" && next.phase === "dropping") {
		playHop();
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
