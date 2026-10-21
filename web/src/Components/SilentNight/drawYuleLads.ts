/**
 * The Yule Lads of Iceland, as their portrait (portraitKit.ts): Candle-Stealer, the last of the
 * thirteen troll brothers, grinning in his old wool hood with a stolen candle held up to his face,
 * and in the dark behind him, more of his brothers, only their eyes catching the light. Over them,
 * the northern lights.
 */

import {
	canvasWith,
	clamp,
	fbm,
	figure,
	hash,
	paintFigure,
	paintLayer,
	shade,
	type ITexture,
	paintSwirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#1c1412", "#3a2a24", "#5a4234", "#7a5a46", "#9a765a", "#b8946e"],
	nose: ["#24100e", "#44201a", "#6a3428", "#8c4a3a", "#a8604a"],
	wool: ["#0a0908", "#1a1714", "#2a2520", "#3c342c", "#504538", "#665846"],
	hood: ["#0c0806", "#1e140e", "#322218", "#4a3424", "#644832", "#7e5e42"],
	hair: ["#0c0806", "#1c120c", "#2e2016", "#443222", "#5c4630"],
	rope: ["#2a1e10", "#4a3a20", "#6e5830", "#927a44"],
	wood: ["#1a1008", "#3a2614", "#5e4020", "#82602e", "#a6803e", "#c49c56"],
	wax: ["#4a3e34", "#8a7a68", "#c8b8a0", "#efe4cc", "#fff8e8"],
	tooth: ["#4a4440", "#8a8278", "#cac0b0", "#efe6d6"],
	eye: ["#060406", "#120c0a", "#2a1c14", "#ffe0a0"],
	shadow: ["#030405", "#06080a", "#0a0d10"],
	flame: ["#a03010", "#ff7a20", "#ffc040", "#fff0a0", "#fffbe8"],
	aurora: ["#030a08", "#061a12", "#0c2e1e", "#16482c", "#246a3e", "#4a9a5a", "#8ac874"],
};
// The stolen candle's warm light, on the left.
const RIM: Record<string, string[]> = {
	skin: ["#c07040", "#f0a060", "#ffd090", "#fff0c8"],
	nose: ["#d07050", "#f09a70", "#ffc8a0", "#ffe8d0"],
	wool: ["#a07050", "#d0a070", "#f0d0a0", "#fff0d0"],
	hood: ["#a07050", "#d0a070", "#f0d0a0", "#fff0d0"],
	hair: ["#a07040", "#d0a060", "#f0d090", "#fff0c8"],
	rope: ["#c09050", "#e0c070", "#f8e0a0", "#fff4d0"],
	wax: ["#fff0c8", "#ffffff", "#ffffff", "#ffffff"],
	wood: ["#c08040", "#e0b060", "#f8d890", "#fff0c8"],
	tooth: ["#fff0d0", "#ffffff", "#ffffff", "#ffffff"],
};

const CANDLE = { x: 58, y: 56 };

/** Old knitted wool: rows of stitches. */
const knit: ITexture = (x, y) => 0.06 * Math.sin(x * 1.6 + (y % 2) * 1.5) + 0.05 * (hash(x, y) - 0.5);
/** Scraggly hair and beard: tufts. */
const scraggle: ITexture = (x, y) => 0.12 * Math.sin(x * 1.2 + 2 * fbm(x * 0.15, y * 0.1)) + 0.08 * (hash(x, y) - 0.5);

/** The stolen candle brightening what's near it. */
const candlelight = (x: number, y: number) => 0.26 * clamp(1 - Math.hypot(x - CANDLE.x, y - CANDLE.y) / 55);

export function drawYuleLads(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// Wooden spoons, licked clean, juggled in arcs over his head, tumbling end over end: a long
	// straight handle with a knob at its end, widening at the neck into an oval bowl, hollowed.
	const drawThing = (keep: IPut, { x, y, size, angle }: ISwirlItem) => {
		const along = { x: Math.cos(angle), y: Math.sin(angle) };
		const at = (distance: number) => ({ x: x + along.x * distance, y: y + along.y * distance });
		const end = at(-size * 1.3);
		const neck = at(size * 0.35);
		const bowl = at(size * 0.85);
		limb(end.x, end.y, neck.x, neck.y, 0.75, 0.75, "wood", 0.2, null, keep);
		ellipse(end.x, end.y, 1.1, 1.1, 0, "wood", 0.25, null, keep);
		ellipse(bowl.x, bowl.y, size * 0.6, size * 0.36, angle, "wood", 0.32, null, keep);
		ellipse(bowl.x + along.x * 0.4, bowl.y + along.y * 0.4, size * 0.34, size * 0.17, angle, "wood", 0.02, null, keep);
	};
	const things: ISwirlItem[] = Array.from({ length: 13 }, (_, index) => {
		// Two arcs, one inside the other, from hand to hand.
		const inner = index >= 8;
		const t = inner ? (index - 8) / 4 : index / 7;
		const width = inner ? 56 : 92;
		const rise = inner ? 26 : 40;

		return {
			x: 86 - width / 2 + width * t,
			y: 52 - rise * Math.sin(Math.PI * t),
			size: inner ? 6 : 7,
			angle: index * 1.3,
			front: false,
			index,
		};
	});

	// --- His brothers, in the dark behind him: hunched shapes, their hoods drooping. ---
	for (const [cx, cy, size, droop] of [
		[24, 70, 10, -1],
		[150, 62, 12, 1],
		[196, 74, 10, 1],
		[232, 66, 9, -1],
	]) {
		ellipse(cx, cy + size * 3.6, size * 1.9, size * 3, 0, "shadow", 0);
		ellipse(cx, cy, size, size * 0.95, 0, "shadow", 0);
		limb(
			cx + droop * size * 0.4,
			cy - size * 0.6,
			cx + droop * size * 1.4,
			cy - size * 0.2,
			size * 0.5,
			size * 0.25,
			"shadow",
			0,
		);
	}

	// --- Candle-Stealer, back to front. ---

	// His shoulders, hunched in a patched wool tunic, a rope round his middle.
	fill(
		76,
		160,
		(y) => {
			const half = y < 88 ? 14 + (y - 76) * 1.4 : 30.8 + (y - 88) * 0.1;

			return [86 - half, 86 + half];
		},
		"wool",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.26 + 0.16 * across + 0.2 * Math.sqrt(Math.max(0, 1 - across * across)) + knit(x, y) + candlelight(x, y);
		},
	);

	// Patches sewn on, darker.
	for (const [px, py, w, h] of [
		[70, 104, 8, 7],
		[98, 96, 7, 9],
	]) {
		for (let y = py; y < py + h; y++) {
			for (let x = px; x < px + w; x++) {
				put(x, y, "hood", 0.26 + knit(x, y) + ((x === px || y === py) && (x + y) % 2 === 0 ? -0.12 : 0));
			}
		}
	}

	for (let x = 58; x <= 116; x++) {
		put(x, 122 + Math.round(Math.sin(x * 0.2)), "rope", 0.45 + 0.15 * Math.sin(x * 1.4));
		put(x, 123 + Math.round(Math.sin(x * 0.2)), "rope", 0.3 + 0.15 * Math.sin(x * 1.4 + 1));
	}

	// His hood, the wool round his face, its long point drooping down behind on the right.
	limb(98, 46, 114, 56, 7, 5, "hood", -0.04, knit);
	limb(114, 56, 120, 76, 5, 3, "hood", -0.08, knit);
	ellipse(121, 79, 3, 3, 0, "hood", -0.04, knit);
	ellipse(86, 58, 19, 21, 0, "hood", 0, (x, y) => knit(x, y) + candlelight(x, y));

	// His big ears poking out, and wild hair at the edges of the hood.
	ellipse(69, 60, 3.2, 5.6, -0.4, "skin", 0.04, candlelight);
	ellipse(103, 60, 3.2, 5.6, 0.4, "skin", -0.04);

	// His face: broad and lumpy, under a heavy brow.
	ellipse(86, 60, 13.5, 13, 0, "skin", 0.02, candlelight);
	ellipse(86, 48, 12, 3.2, 0, "hair", 0.04, (x, y) => scraggle(x, y) + candlelight(x, y));

	// A scraggly beard round his jaw, his mouth clear of it.
	fill(
		62,
		82,
		(y) => {
			const half = y < 72 ? 13.5 - (y - 62) * 0.1 : 12.5 - (y - 72) * 1.2;

			return half > 0 ? [86 - half, 86 + half] : null;
		},
		"hair",
		(x, y) => (Math.abs(x - 86) < 9 - (y - 62) * 0.2 && y < 72 ? null : 0.32 + scraggle(x, y) + candlelight(x, y)),
	);

	// Little eyes glinting at the candle, under heavy brows.
	for (const [ex, side] of [
		[80, -1],
		[92, 1],
	]) {
		put(ex, 56, "eye", 0.1);
		put(ex + 1, 56, "eye", 0.1);
		put(ex - 1, 56, "eye", 0.15);
		put(ex, 57, "eye", 0.05);
		put(ex + 1, 57, "eye", 0.05);
		put(ex, 56, "eye", 1);

		for (let i = -1; i <= 3; i++) {
			put(ex - 1 + i, 53 + (side === -1 ? (i > 1 ? 1 : 0) : i < 1 ? 1 : 0), "hair", 0.24);
			put(ex - 1 + i, 54, "hair", 0.18);
		}
	}

	// A wide, gap-toothed grin.
	for (let dx = -7; dx <= 7; dx++) {
		const lift = Math.round(dx * dx * 0.05);
		put(86 + dx, 67 - lift, "eye", 0.06);

		if (Math.abs(dx) < 6) {
			put(86 + dx, 68 - lift, "eye", 0.04);
		}
	}

	for (const dx of [-4, -2, 1, 4]) {
		put(86 + dx, 67 - Math.round(dx * dx * 0.05), "tooth", 0.75);
	}

	put(78, 66, "skin", 0.2);
	put(94, 66, "skin", 0.2);

	// His big lumpy nose, hooked down, red with cold.
	ellipse(85, 59, 3, 4.6, 0.15, "nose", 0.06, candlelight);
	ellipse(84, 62.5, 3.4, 2.4, 0, "nose", 0.1, candlelight);
	put(82, 63, "nose", 0.05);
	put(86, 63, "nose", 0.05);

	// His hand, raised, gripping the stolen candle: a fat tallow stub.
	limb(56, 100, 52, 80, 6, 5, "wool", 0.04, (x, y) => knit(x, y) + candlelight(x, y));
	limb(58, 58, 58, 72, 2.6, 2.6, "wax", 0.14);
	ellipse(57.5, 75, 4.6, 4, 0, "skin", 0.08, candlelight);

	for (const y of [73, 75, 77]) {
		put(61, y, "skin", 0.2);
	}

	// --- Light: the candle's, warm, from the left; a fade into the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.3 - Math.hypot(x - CANDLE.x, y - CANDLE.y) / 80),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.6,
		outlineAbove: 128,
	});

	// --- The scene: the northern lights over a dark night. ---
	const { canvas, context } = canvasWith((x, y) => {
		const wave = Math.sin(x * 0.03 + fbm(x * 0.02, 3) * 4) * 12;
		const band = clamp(1 - Math.abs(y - 30 - wave) / 22) * (0.4 + fbm(x * 0.05, y * 0.08));
		const curtain =
			0.25 * Math.max(0, Math.sin(x * 0.35 + fbm(x * 0.1, 1) * 6)) * clamp(1 - Math.abs(y - 40 - wave) / 30);
		const sky = clamp(band + curtain) * clamp(1 - y / 110);

		return shade(x, y, sky * 0.85, RAMPS.aurora);
	});

	// Stars, between the lights.
	paintLayer(
		context,
		(keep) => {
			for (let i = 0; i < 50; i++) {
				keep(Math.round(hash(i, 21) * 256), Math.round(hash(i, 22) * 100), "aurora", 0.7 + hash(i, 23) * 0.3);
			}
		},
		RAMPS,
		null,
	);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM, -1);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM, -1);

	// The brothers' eyes, catching the candle's light; and the flame itself.
	paintLayer(
		context,
		(keep) => {
			for (const [cx, cy, size] of [
				[24, 70, 10],
				[150, 62, 12],
				[196, 74, 10],
				[232, 66, 9],
			]) {
				for (const side of [-1, 1]) {
					const ex = Math.round(cx + side * size * 0.35);
					keep(ex, cy - 1, "flame", 0.8);
					keep(ex + 1, cy - 1, "flame", 0.55);
				}
			}

			petal(CANDLE.x + 0.5, CANDLE.y + 2, 8, 2.6, -Math.PI / 2, "flame", -0.05, keep);
			keep(CANDLE.x, CANDLE.y, "flame", 0.95);
			keep(CANDLE.x, CANDLE.y - 1, "flame", 0.85);
		},
		RAMPS,
		null,
	);

	return canvas;
}
