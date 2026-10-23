/**
 * The scene behind each of the cast struck in a pose, as the backdrop to choosing who plays
 * (drawElfPose.ts and the rest): a menacing red dark, rays bursting out of it from behind them,
 * and runes of the Elder Futhark drifting up through it on either side, theirs among them.
 */

import { canvasWith, clamp, fbm, paintLayer, shade, type IPut } from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	night: ["#030206", "#08040c", "#100612", "#1a081a", "#280c22", "#38102a"],
	ray: ["#180610", "#260a18", "#360e20"],
	rune: ["#1a0614", "#34102a", "#561a42", "#7a2a5c", "#a04276"],
};

/** Where the menace comes from: behind them, a little above their middle. */
const BURST = { x: 126, y: 70 };

/**
 * Runes of the Elder Futhark, as their strokes across a stave (x from 0 to 0.6, y from 0 at the
 * top to 1).
 */
const RUNES = {
	// ᚠ wealth.
	fehu: [
		[0.1, 0, 0.1, 1],
		[0.1, 0.3, 0.5, 0.05],
		[0.1, 0.55, 0.5, 0.3],
	],
	// ᚢ the aurochs, strength.
	uruz: [
		[0.05, 1, 0.05, 0],
		[0.05, 0, 0.55, 0.3],
		[0.55, 0.3, 0.55, 1],
	],
	// ᚦ the thorn.
	thurisaz: [
		[0.1, 0, 0.1, 1],
		[0.1, 0.25, 0.55, 0.5],
		[0.55, 0.5, 0.1, 0.75],
	],
	// ᚨ a god.
	ansuz: [
		[0.1, 0, 0.1, 1],
		[0.1, 0, 0.5, 0.25],
		[0.1, 0.3, 0.5, 0.55],
	],
	// ᚱ the ride.
	raidho: [
		[0.1, 0, 0.1, 1],
		[0.1, 0, 0.5, 0.22],
		[0.5, 0.22, 0.1, 0.45],
		[0.1, 0.45, 0.55, 1],
	],
	// ᚲ the torch.
	kenaz: [
		[0.5, 0.15, 0.1, 0.5],
		[0.1, 0.5, 0.5, 0.85],
	],
	// ᚷ the gift.
	gebo: [
		[0, 0.1, 0.6, 0.9],
		[0.6, 0.1, 0, 0.9],
	],
	// ᚹ joy.
	wunjo: [
		[0.1, 0, 0.1, 1],
		[0.1, 0, 0.5, 0.22],
		[0.5, 0.22, 0.1, 0.45],
	],
	// ᚺ hail.
	hagalaz: [
		[0, 0, 0, 1],
		[0.6, 0, 0.6, 1],
		[0, 0.35, 0.6, 0.65],
	],
	// ᚾ need.
	nauthiz: [
		[0.3, 0, 0.3, 1],
		[0.05, 0.35, 0.55, 0.6],
	],
	// ᛁ ice.
	isa: [[0.3, 0, 0.3, 1]],
	// ᛃ the year's turn.
	jera: [
		[0.3, 0.05, 0, 0.3],
		[0, 0.3, 0.3, 0.55],
		[0.3, 0.45, 0.6, 0.7],
		[0.6, 0.7, 0.3, 0.95],
	],
	// ᛇ the yew, death.
	eihwaz: [
		[0.3, 0, 0.3, 1],
		[0.3, 0, 0.6, 0.2],
		[0.3, 1, 0, 0.8],
	],
	// ᛉ the elk.
	algiz: [
		[0.3, 0, 0.3, 1],
		[0.3, 0.4, 0, 0.05],
		[0.3, 0.4, 0.6, 0.05],
	],
	// ᛊ the sun.
	sowilo: [
		[0.45, 0, 0.1, 0.4],
		[0.1, 0.4, 0.5, 0.6],
		[0.5, 0.6, 0.15, 1],
	],
	// ᛏ Tyr's spear.
	tiwaz: [
		[0.3, 0, 0.3, 1],
		[0.3, 0, 0, 0.3],
		[0.3, 0, 0.6, 0.3],
	],
	// ᛒ the birch, the mother.
	berkano: [
		[0.1, 0, 0.1, 1],
		[0.1, 0, 0.5, 0.25],
		[0.5, 0.25, 0.1, 0.5],
		[0.1, 0.5, 0.5, 0.75],
		[0.5, 0.75, 0.1, 1],
	],
	// ᛖ the horse.
	ehwaz: [
		[0, 0, 0, 1],
		[0.6, 0, 0.6, 1],
		[0, 0, 0.3, 0.35],
		[0.3, 0.35, 0.6, 0],
	],
	// ᛚ water.
	laguz: [
		[0.15, 0, 0.15, 1],
		[0.15, 0, 0.5, 0.3],
	],
	// ᛜ the seed.
	ingwaz: [
		[0.3, 0.2, 0.55, 0.5],
		[0.55, 0.5, 0.3, 0.8],
		[0.3, 0.8, 0.05, 0.5],
		[0.05, 0.5, 0.3, 0.2],
	],
	// ᛞ the day, the dawn.
	dagaz: [
		[0, 0, 0, 1],
		[0.6, 0, 0.6, 1],
		[0, 0, 0.6, 1],
		[0.6, 0, 0, 1],
	],
	// ᛟ the home.
	othala: [
		[0.3, 0, 0.05, 0.3],
		[0.3, 0, 0.55, 0.3],
		[0.05, 0.3, 0.6, 1],
		[0.55, 0.3, 0, 1],
	],
} satisfies Record<string, Array<[number, number, number, number]>>;

export type IRune = keyof typeof RUNES;

/** A bold stroke from (x1, y1) to (x2, y2), `width` thick, lit along its top edge. */
function stroke(keep: IPut, x1: number, y1: number, x2: number, y2: number, width: number) {
	const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2);

	for (let i = 0; i <= steps; i++) {
		const px = x1 + ((x2 - x1) * i) / steps;
		const py = y1 + ((y2 - y1) * i) / steps;

		for (let dy = -width; dy <= width; dy++) {
			for (let dx = -width; dx <= width; dx++) {
				if (dx * dx + dy * dy <= width * width) {
					keep(Math.round(px + dx), Math.round(py + dy), "rune", 0.6 - dy / width / 4);
				}
			}
		}
	}
}

/** A rune, `size` tall with its top left at (x, y), tipped by `tilt` as it drifts. */
function rune(keep: IPut, id: IRune, x: number, y: number, size: number, tilt: number) {
	const cos = Math.cos(tilt);
	const sin = Math.sin(tilt);
	const at = (u: number, v: number): [number, number] => {
		const dx = (u - 0.3) * size;
		const dy = (v - 0.5) * size;

		return [x + 0.3 * size + dx * cos - dy * sin, y + 0.5 * size + dx * sin + dy * cos];
	};

	for (const [u1, v1, u2, v2] of RUNES[id]) {
		stroke(keep, ...at(u1, v1), ...at(u2, v2), Math.max(1, size * 0.08));
	}
}

/** Where the runes drift, the left side's and then the right's, the nearest first: top left, size and tilt. */
const DRIFT = [
	[22, 108, 22, -0.12],
	[50, 82, 16, 0.1],
	[20, 58, 13, 0.18],
	[44, 26, 10, -0.08],
	[214, 104, 22, 0.1],
	[192, 74, 16, -0.14],
	[226, 50, 13, 0.06],
	[200, 20, 10, 0.16],
];

/** The scene, with eight runes drifting up through it (as DRIFT places them): the figure is painted over it. */
export function poseScene(runes: IRune[]): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
	const { canvas, context } = canvasWith((x, y) => {
		const dx = x - BURST.x;
		const dy = y - BURST.y;
		const near = clamp(1 - Math.hypot(dx / 150, dy / 110));
		const mist = fbm(x * 0.03 + 7, y * 0.05);
		const angle = Math.atan2(dy, dx);
		const ray = Math.sin(angle * 18 + Math.sin(angle * 5) * 1.5) > 0.55 && near > 0.15;

		if (ray) {
			return shade(x, y, 0.2 + 0.7 * near, RAMPS.ray);
		}

		return shade(x, y, near * 0.85 + mist * 0.22 - 0.05, RAMPS.night);
	});

	paintLayer(
		context,
		(keep) => DRIFT.forEach(([x, y, size, tilt], index) => rune(keep, runes[index], x, y, size, tilt)),
		RAMPS,
		null,
	);

	return { canvas, context };
}
