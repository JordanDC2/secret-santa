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
	paintGlow,
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
	sausage: ["#2a0c08", "#541810", "#7e2a1a", "#a44228", "#c45e3a"],
	snow: ["#06100c", "#0c1a16", "#14261f", "#1c342a"],
	glow: ["#3a1e0a", "#5a2e10", "#8a4818", "#c06a20", "#f09a30"],
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
	sausage: ["#d06040", "#f09060", "#ffc090", "#ffe8c8"],
	shadow: ["#16301f", "#244a30", "#3a6e46"],
};

const CANDLE = { x: 58, y: 56 };

/** Old knitted wool: rows of stitches. */
const knit: ITexture = (x, y) => 0.06 * Math.sin(x * 1.6 + (y % 2) * 1.5) + 0.05 * (hash(x, y) - 0.5);
/** Scraggly hair and beard: tufts. */
const scraggle: ITexture = (x, y) => 0.12 * Math.sin(x * 1.2 + 2 * fbm(x * 0.15, y * 0.1)) + 0.08 * (hash(x, y) - 0.5);

/** Where his cape's torn edge hangs to, across him. */
const capeEdge = (x: number) => 90 + Math.round(hash(Math.floor(x / 3), 5) * 6);

/** The stolen candle brightening what's near it. */
const candlelight = (x: number, y: number) => 0.26 * clamp(1 - Math.hypot(x - CANDLE.x, y - CANDLE.y) / 55);

/**
 * His belly, round and bulging out over his belt, hanging down over the middle of it: lit from the
 * candle above it on the left, its light fading into his tunic at its sides, turning under into
 * shadow at its bottom and casting a shadow just below that.
 */
const BELLY = { x: 86, y: 112, rx: 23, ry: 19 };
const bellyAt = (x: number, y: number) => {
	const u = (x + 0.5 - BELLY.x) / BELLY.rx;
	const v = (y + 0.5 - BELLY.y) / BELLY.ry;

	return { u, v, d: u * u + v * v };
};
const belly = (x: number, y: number) => {
	const { u, v, d } = bellyAt(x, y);

	if (d < 1) {
		return Math.sqrt(1 - d) * (0.14 - 0.06 * u - 0.08 * v) - 0.12 * clamp((v - 0.4) / 0.6);
	}

	return v > 0.7 && d < 1.3 ? -0.12 : 0;
};

/** The farm's lit windows, down on the horizon: where each is. */
const WINDOWS = [
	{ x: 134, y: 124 },
	{ x: 180, y: 125 },
];

/** His brothers in the dark behind him: where each one's hood is, how big he is, which way his hood droops. */
const BROTHERS: Array<[number, number, number, number]> = [
	[24, 92, 7, -1],
	[160, 90, 7.5, 1],
	[204, 94, 6.5, 1],
	[240, 91, 7, -1],
];

export function drawYuleLads(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);
	// What hangs from his belt, behind his belly where it bulges out over it.
	const behindBelly: IPut = (x, y, material, t) => {
		if (bellyAt(x, y).d >= 1) {
			put(x, y, material, t);
		}
	};

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
		const width = inner ? 46 : 70;
		const rise = inner ? 30 : 46;

		return {
			x: 87 - width / 2 + width * t,
			y: 62 - rise * Math.sin(Math.PI * t),
			size: inner ? 6 : 7,
			angle: index * 1.3,
			front: false,
			index,
		};
	});

	// --- His brothers, in the dark behind him: hunched in their hoods, the hoods' points drooping,
	// one with a sack over his shoulder, one with a pot, their edges caught by the northern lights. ---
	for (const [cx, cy, size, droop] of BROTHERS) {
		// Hunched shoulders and back, bent forward.
		ellipse(cx, cy + size * 3.2, size * 2, size * 2.8, droop * 0.25, "shadow", 0.1);
		ellipse(cx + droop * size * 0.4, cy + size * 1.4, size * 1.6, size * 1.3, 0, "shadow", 0.1);
		// The hood, its point drooping.
		ellipse(cx, cy, size, size * 0.95, 0, "shadow", 0.1);
		limb(
			cx + droop * size * 0.3,
			cy - size * 0.7,
			cx + droop * size * 1.3,
			cy - size * 0.4,
			size * 0.55,
			size * 0.3,
			"shadow",
			0.1,
		);
		limb(
			cx + droop * size * 1.3,
			cy - size * 0.4,
			cx + droop * size * 1.6,
			cy + size * 0.6,
			size * 0.3,
			size * 0.15,
			"shadow",
			0.1,
		);
	}

	// Sausage-Swiper's sack over his shoulder, and Pot-Scraper's pot under his arm.
	ellipse(150, 86, 6.5, 5, 0.4, "shadow", 0.12);
	limb(146, 90, 152, 98, 1.4, 1.4, "shadow", 0.1);
	ellipse(246, 112, 5, 3.6, 0, "shadow", 0.12);
	limb(241, 109, 237, 108, 0.8, 0.8, "shadow", 0.1);

	// --- Candle-Stealer, back to front. ---

	// His shoulders, hunched in a patched wool tunic, a rope round his middle: his belly bulging
	// over it, the rope pulling the tunic in, and the tunic hanging a little wider below it in folds.
	fill(
		76,
		160,
		(y) => {
			const half =
				y < 90
					? 14 + (y - 76) * 1.2
					: y < 126
						? 30.8 + 4.5 * Math.sin((Math.PI * (y - 90)) / 36)
						: 30 + (y - 126) * 0.12;

			return [86 - half, 86 + half];
		},
		"wool",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			// The cape's ragged edge shadowing the tunic just under it.
			const under = y - capeEdge(x);
			// Folds falling from under the rope: a crease, lit along one side.
			const fold = (((x - 86) % 7) + 7) % 7;

			return (
				0.26 +
				0.16 * across +
				0.2 * Math.sqrt(Math.max(0, 1 - across * across)) +
				knit(x, y) +
				candlelight(x, y) -
				(under >= 0 && under < 3 ? 0.14 : 0) +
				belly(x, y) +
				(fold === 0 ? -0.1 : fold === 1 ? 0.04 : 0) * clamp((y - 128) / 8)
			);
		},
	);

	// Patches sewn on, darker.
	for (const [px, py, w, h] of [
		[70, 104, 8, 7],
		[98, 96, 7, 9],
	]) {
		for (let y = py; y < py + h; y++) {
			for (let x = px; x < px + w; x++) {
				put(x, y, "hood", 0.26 + knit(x, y) + belly(x, y) + ((x === px || y === py) && (x + y) % 2 === 0 ? -0.12 : 0));
			}
		}
	}

	// Big stitches round each patch.
	for (const [px, py, w, h] of [
		[70, 104, 8, 7],
		[98, 96, 7, 9],
	]) {
		for (let i = 0; i < w; i += 2) {
			put(px + i, py - 1, "rope", 0.55);
			put(px + i, py + h, "rope", 0.45);
		}

		for (let i = 1; i < h; i += 2) {
			put(px - 1, py + i, "rope", 0.55);
			put(px + w, py + i, "rope", 0.45);
		}
	}

	// A rope belt, knotted, its end hanging; a pouch on it, stolen sausages poking out.
	for (let x = 56; x <= 116; x++) {
		behindBelly(x, 126 + Math.round(Math.sin(x * 0.2)), "rope", 0.45 + 0.15 * Math.sin(x * 1.4));
		behindBelly(x, 127 + Math.round(Math.sin(x * 0.2)), "rope", 0.3 + 0.15 * Math.sin(x * 1.4 + 1));
	}

	ellipse(80, 127, 2.2, 2, 0, "rope", 0.5, null, behindBelly);
	limb(80, 128, 78, 140, 0.9, 0.7, "rope", 0.4, (x, y) => 0.12 * Math.sin(y * 1.4), behindBelly);
	limb(81, 128, 84, 138, 0.9, 0.7, "rope", 0.3, (x, y) => 0.12 * Math.sin(y * 1.4 + 1), behindBelly);
	ellipse(103, 130, 6, 6.5, 0, "hood", 0.08, knit, behindBelly);
	limb(97, 125, 109, 125, 1, 1, "rope", 0.45, null, behindBelly);

	// A string of stolen sausages spilling out of it, hanging over its edge, tied off link by link.
	const links = [
		[104, 124],
		[109, 126],
		[112, 131],
		[113, 137],
		[111, 143],
	];

	for (let i = 0; i < links.length - 1; i++) {
		const [x1, y1] = links[i];
		const [x2, y2] = links[i + 1];
		ellipse(
			(x1 + x2) / 2,
			(y1 + y2) / 2,
			3.4,
			2.2,
			Math.atan2(y2 - y1, x2 - x1),
			"sausage",
			0.26 - i * 0.03,
			null,
			behindBelly,
		);
		behindBelly(x2, y2, "rope", 0.35);
	}

	// His hood's long point, drooping down behind him on the right, a tassel on its end.
	limb(98, 44, 116, 47, 7, 4.6, "hood", -0.06, knit);
	limb(116, 47, 128, 60, 4.6, 2.6, "hood", -0.1, knit);
	ellipse(129.5, 62.5, 2.8, 2.8, 0, "hood", -0.06, knit);

	// His arms: from his shoulders down under his cape to his elbows, below its edge, then raised in
	// front of it (drawn over it, below).
	limb(72, 82, 60, 96, 6, 5.2, "wool", 0.02, (x, y) => knit(x, y) + candlelight(x, y));
	limb(100, 82, 112, 94, 6, 5.2, "wool", -0.06, knit);

	// A ragged cape of wool over his shoulders, the hood's, its edge torn.
	fill(
		72,
		96,
		(y) => {
			const half = 15 + (y - 72) * 0.95;

			return [86 - half, 86 + half];
		},
		"hood",
		(x, y, left, right) => {
			if (y > capeEdge(x)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.3 + 0.14 * across + 0.2 * Math.sqrt(Math.max(0, 1 - across * across)) + knit(x, y) + candlelight(x, y);
		},
	);

	// One arm raised high, gripping the stolen candle, a fat tallow stub; the other up, open,
	// catching a spoon as it comes down.
	limb(60, 96, 56, 79, 5.2, 4.6, "wool", 0.04, (x, y) => knit(x, y) + candlelight(x, y));
	limb(58, 58, 58, 72, 2.6, 2.6, "wax", 0.14);
	limb(59, 61, 59, 66, 0.6, 0.7, "wax", 0.45);
	ellipse(57.5, 75, 4.6, 4, 0, "skin", 0.08, candlelight);
	limb(112, 94, 117, 76, 5.2, 4.6, "wool", -0.04, knit);
	ellipse(117.5, 71.5, 4.2, 3.4, 0.2, "skin", 0.02);

	for (const [dx, lean] of [
		[-3, -0.3],
		[-1, -0.1],
		[1, 0.1],
		[3, 0.3],
	]) {
		limb(117.5 + dx, 70, 117.5 + dx * 1.3 + lean * 2, 65.5, 0.8, 0.7, "skin", 0.04);
	}

	for (const y of [73, 75, 77]) {
		put(61, y, "skin", 0.2);
	}

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
		// Curtains of light hanging down from the band, rippling.
		const streaks =
			0.3 * Math.max(0, Math.sin(x * 0.9 + fbm(x * 0.08, 7) * 9)) * clamp(1 - Math.abs(y - 48 - wave) / 26);
		// The lights' glow low on the horizon, for the farm and his brothers to stand dark against.
		const horizon = 0.3 * clamp(1 - Math.abs(y - 108) / 26) * (0.7 + 0.5 * fbm(x * 0.03, 11));
		const sky = clamp(band + curtain + streaks) * clamp(1 - y / 110) + horizon;

		// The ground: snow, and the turf houses of the farm, a window lit in one.
		if (y > 132 + Math.round(fbm(x * 0.04, 2) * 5)) {
			return shade(x, y, 0.3 + fbm(x * 0.1, y * 0.1) * 0.15, RAMPS.snow);
		}

		const house = Math.floor((x + 12) / 46);
		const across = x + 12 - house * 46;
		const roof = 120 - Math.round((14 - Math.abs(across - 20) * 0.7) * (house % 2 === 0 ? 1 : 0.8));

		if (across < 40 && y > roof) {
			const window = WINDOWS.some((lit) => x >= lit.x && x < lit.x + 4 && y >= lit.y && y < lit.y + 4);

			if (window) {
				return shade(x, y, x % 2 === 1 && y % 2 === 1 ? 0.1 : 0.55, RAMPS.flame);
			}

			// Snow lying on the turf roofs, catching the lights.
			return y < roof + 2 ? shade(x, y, 0.75, RAMPS.snow) : shade(x, y, 0.05, RAMPS.shadow);
		}

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
	paintGlow(context, CANDLE.x, CANDLE.y - 2, 26, RAMPS.glow, 0.85);

	for (const lit of WINDOWS) {
		paintGlow(context, lit.x + 2, lit.y + 2, 9, RAMPS.glow, 0.45);
	}

	paintSwirl(context, things, false, drawThing, RAMPS, RIM, -1);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM, -1);

	// The brothers' eyes, catching the candle's light; and the flame itself.
	paintLayer(
		context,
		(keep) => {
			for (const [cx, cy, size] of BROTHERS) {
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
