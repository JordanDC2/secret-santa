/**
 * Saint Lucia, the light-bearer of Sweden, as her portrait (portraitKit.ts): in a white gown with
 * a red sash, a crown of lingonberry leaves and lit candles on her head, eyes lowered to the candle
 * in her hands. Her crown is the light: it gilds her hair and shoulders from above, and sparks
 * drift up from it into the dark.
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
	strands,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#3a2420", "#6a4236", "#9a6a54", "#c49278", "#e2b49a", "#f6d4bc"],
	hair: ["#1a1008", "#3a2610", "#5e4018", "#8a6224", "#b88a38", "#e0b858"],
	gown: ["#1c1a22", "#3a3642", "#6a6470", "#a09aa4", "#d0ccd0", "#f4f0ec"],
	red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
	lip: ["#5a2a2a", "#8a4440", "#b06058", "#d08478", "#eaa898"],
	leaf: ["#05120c", "#0c2416", "#163b22", "#245630", "#387640", "#589a56"],
	wax: ["#4a3e34", "#8a7a68", "#c8b8a0", "#efe4cc", "#fff8e8"],
	flame: ["#a03010", "#ff7a20", "#ffc040", "#fff0a0", "#fffbe8"],
	eye: ["#0b0507", "#1e0f0a", "#3a2010", "#5a3418"],
};
// Candlelight from her crown, above and to the right of her.
const RIM: Record<string, string[]> = {
	skin: ["#c0704a", "#f0a070", "#ffd0a0", "#fff0d8"],
	hair: ["#c09040", "#f0c060", "#fff0a0", "#ffffff"],
	gown: ["#e0c8a0", "#fff0d8", "#ffffff", "#ffffff"],
	red: ["#d04040", "#ff7060", "#ffb090", "#ffe0c0"],
	lip: ["#d08070", "#f0a890", "#ffd0b0", "#ffe8d0"],
	leaf: ["#5a7a3a", "#9aa850", "#d0c870", "#f0e8a0"],
	wax: ["#fff0c8", "#ffffff", "#ffffff", "#ffffff"],
	eye: ["#3a2010", "#5a3418", "#8a5a30", "#c08a50"],
};

/** Where the crown's light is, and how much of it reaches a point. */
const CROWN = { x: 78, y: 26 };
const glow = (x: number, y: number, size: number) => clamp(1 - Math.hypot(x - CROWN.x, (y - CROWN.y) * 1.2) / size);

/** The crown's warmth on what's near it. */
const warmth = (x: number, y: number) => 0.18 * glow(x, y, 50);

export function drawLucia(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// --- The figure, back to front. ---

	// Her long fair hair behind her, falling past her shoulders.
	ellipse(78, 52, 17, 20, 0, "hair", -0.02, (x, y) => strands(x, y) + warmth(x, y));
	ellipse(65, 80, 7.5, 24, 0.12, "hair", -0.1, strands);
	ellipse(91, 80, 7.5, 24, -0.12, "hair", -0.08, strands);

	// Her white gown, from her shoulders down, flaring out, in soft folds.
	fill(
		70,
		160,
		(y) => {
			const half = y < 76 ? 9 + (y - 70) * 0.8 : 13.8 + (y - 76) * 0.24;

			return [78 - half, 78 + half];
		},
		"gown",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const folds = 0.04 * Math.sin((x - 78) * 0.45) * clamp((y - 100) / 30) * (1 - clamp((y - 118) / 20));

			return 0.3 + 0.16 * -across + 0.28 * Math.sqrt(Math.max(0, 1 - across * across)) + folds + warmth(x, y) * 0.6;
		},
	);

	// Long white sleeves, her arms bent to bring her hands together at her chest.
	limb(68, 76, 62, 94, 5, 4.6, "gown", -0.02);
	limb(88, 76, 94, 94, 5, 4.6, "gown", -0.06);
	limb(62, 94, 73, 100, 4.6, 4, "gown", 0.02);
	limb(94, 94, 83, 100, 4.6, 4, "gown", -0.02);

	// The red sash round her waist, its ends hanging down her right side.
	fill(
		104,
		108,
		(y) => {
			const half = 13.8 + (y - 76) * 0.24;

			return [78 - half, 78 + half];
		},
		"red",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.38 - 0.18 * across + (y === 104 ? 0.08 : 0);
		},
	);
	limb(85, 108, 88, 132, 2.4, 2, "red", -0.04);
	limb(88, 108, 93, 128, 2.2, 1.8, "red", -0.1);

	// Her neck, a little in shadow, and her head.
	ellipse(78, 66, 3.6, 5, 0, "skin", -0.12, (_x, y) => (y < 65 ? -0.1 : 0));
	ellipse(78, 50, 11.5, 14.5, 0, "skin", 0.04, (x, y) => warmth(x, y) * 0.5);

	// Her hair over the top of her head, parted in the middle, and down past her cheeks.
	for (let y = 35; y <= 50; y++) {
		for (let x = 62; x <= 94; x++) {
			const dx = (x + 0.5 - 78) / 12.6;
			const dy = (y + 0.5 - 50) / 15.4;

			if (dx * dx + dy * dy <= 1 && y <= 41 + Math.abs(x + 0.5 - 78) * 0.42) {
				put(x, y, "hair", 0.42 + (x < 78 ? 0.06 : -0.02) + strands(x, y) + warmth(x, y));
			}
		}
	}

	ellipse(66.8, 55, 2.4, 11, 0.06, "hair", 0, strands);
	ellipse(89.2, 55, 2.4, 11, -0.06, "hair", -0.06, strands);

	// Her face: eyes closed, lowered to the candle; soft brows; a shaded nose; a gentle smile.
	for (const [cx, out] of [
		[73, -1],
		[84, 1],
	]) {
		// The closed lid: a lashed curve, dipping in the middle, and a soft shadow over it.
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 48, "skin", 0.32);
			put(cx + dx, Math.abs(dx) === 2 ? 50 : 51, "eye", 0.12);
		}

		put(cx + out * 3, 50, "eye", 0.05);
		put(cx + out * 3, 51, "eye", 0.1);

		for (let dx = -1; dx <= 1; dx++) {
			put(cx + dx, 50, "skin", 0.38);
		}

		// The brow: fine and gently arched, a little darker than her hair.
		for (const [inner, y, t] of [
			[2, 46, 0.3],
			[1, 45, 0.3],
			[0, 45, 0.32],
			[-1, 45, 0.34],
			[-2, 46, 0.36],
			[-3, 46, 0.4],
		]) {
			put(cx - out * inner, y, "hair", t);
		}
	}

	// The nose: a shadow down the side away from the light, a soft tip, nostrils.
	for (let y = 51; y <= 55; y++) {
		put(80, y, "skin", 0.24);
	}

	put(79, 56, "skin", 0.27);
	put(78, 56, "skin", 0.62);
	put(77, 57, "skin", 0.22);
	put(79, 57, "skin", 0.2);
	put(78, 58, "skin", 0.28);

	// The mouth: a soft, closed smile.
	for (const [x, y, t] of [
		[75, 60, 0.2],
		[81, 60, 0.2],
		[76, 61, 0.18],
		[77, 61, 0.14],
		[78, 61, 0.12],
		[79, 61, 0.14],
		[80, 61, 0.18],
		[77, 62, 0.62],
		[78, 62, 0.7],
		[79, 62, 0.62],
	]) {
		put(x, y, "lip", t);
	}

	put(78, 63, "skin", 0.3);

	// A blush on each cheek.
	for (const cx of [70, 85]) {
		put(cx, 55, "lip", 0.8);
		put(cx + 1, 55, "lip", 0.85);
		put(cx + 2, 55, "lip", 0.8);
	}

	// The candle in her hands, and her hands round it.
	limb(78, 86, 78, 101, 2.3, 2.3, "wax", 0.12);
	ellipse(75.5, 99, 3.8, 3.2, -0.35, "skin", 0.06);
	ellipse(80.5, 99, 3.8, 3.2, 0.35, "skin", 0.04);
	put(75, 98, "skin", 0.16);
	put(77, 99, "skin", 0.16);
	put(79, 99, "skin", 0.16);
	put(81, 98, "skin", 0.16);

	// Her crown: a wreath of lingonberry leaves, red berries in it, and five candles standing in it.
	for (let i = 0; i < 16; i++) {
		const a = (i / 16) * Math.PI * 2;
		const x = 78 + Math.cos(a) * 13.5;
		const y = 37 + Math.sin(a) * 3;

		if (Math.sin(a) > -0.35) {
			petal(x, y, 5.5, 2.2, i % 2 === 0 ? Math.PI + 0.5 : -0.4, "leaf", Math.sin(a) * 0.1 + 0.02);
		}
	}

	for (const [x, y] of [
		[68, 39],
		[74, 40],
		[83, 40],
		[88, 39],
		[79, 41],
	]) {
		put(x, y, "red", 0.62);
		put(x + 1, y, "red", 0.5);
	}

	for (const [x, base, height] of [
		[66, 37, 13],
		[72, 36, 15],
		[78, 35, 17],
		[84, 36, 15],
		[90, 37, 13],
	]) {
		limb(x, base, x, base - height, 1.6, 1.6, "wax", 0.1 + (x - 78) * -0.004);
	}

	// --- Light: from her crown above her (and the candle she carries); a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 30) / 140) * clamp((x - 48) / 36),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.55,
		outlineAbove: 128,
	});

	// --- The scene: the crown's gold light in the dark; a cold blue night far off on the right. ---
	const warmBg = ["#050308", "#120a08", "#22140a", "#3a220e", "#5a3612", "#80501a"];
	const coldBg = ["#030508", "#070a12", "#0c121e", "#121c2c", "#18263a", "#20324a"];
	const { canvas, context } = canvasWith((x, y) => {
		const fog = fbm(x * 0.035 + 11, y * 0.06);
		const warm = clamp(1 - Math.hypot((x - CROWN.x) / 110, (y - CROWN.y) / 90));
		const cold = clamp(1 - Math.hypot((x - 220) / 100, (y - 70) / 80)) * (0.6 + fog * 1.2);
		const dark = clamp(1 - y / 210) * clamp(1 - Math.abs(x - 128) / 260);
		const ramp = warm * 1.1 > cold ? warmBg : coldBg;

		return shade(x, y, (Math.max(warm * 0.95, cold * 0.6) + fog * 0.24 - 0.08) * dark, ramp);
	});

	// Sparks rising from her crown behind her.
	const sparks = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 40; i++) {
					if ((i % 5 === 0) !== front) {
						continue;
					}

					const x = Math.round(CROWN.x + (hash(i, 1) - 0.5) * 120 + Math.sin(i) * 8);
					const y = Math.round(CROWN.y - 18 + hash(i, 2) * 120 - (hash(i, 3) > 0.5 ? 30 : 0));
					const t = 0.5 + hash(i, 4) * 0.5;
					keep(x, y, "flame", t);

					if (front || hash(i, 5) > 0.7) {
						keep(x, y - 1, "flame", t * 0.7);
					}
				}
			},
			RAMPS,
			null,
		);

	sparks(false);
	paintFigure(context, colours);

	// The flames: on the five candles of her crown and the one in her hands, bright in the dark.
	paintLayer(
		context,
		(keep) => {
			for (const [x, top] of [
				[66, 24],
				[72, 21],
				[78, 18],
				[84, 21],
				[90, 24],
				[78, 86],
			]) {
				petal(x + 0.5, top, 7, 2.2, -Math.PI / 2, "flame", -0.05, keep);
				keep(x, top - 2, "flame", 0.85);
				keep(x, top - 3, "flame", 0.75);
				keep(x, top - 1, "flame", 0.95);
			}
		},
		RAMPS,
		null,
	);
	sparks(true);

	return canvas;
}
