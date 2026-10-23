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
	settle,
	locksFrom,
	paintSwirl,
	paintGlow,
	dither,
	type ISwirlItem,
	type IPut,
	type ITexture,
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
	gownWarm: ["#2a1e1a", "#5a4236", "#8e6e58", "#c09c80", "#e8c8a8", "#fff0dc"],
	lace: ["#4a4644", "#8a8480", "#c8c0b8", "#f4ece2", "#ffffff"],
	halo: ["#5a3612", "#80501a", "#b07224", "#e0a040", "#ffd070"],
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
	lace: ["#fff0d8", "#ffffff", "#ffffff", "#ffffff"],
	gownWarm: ["#ffd8a0", "#fff0d0", "#ffffff", "#ffffff"],
};

/** Where the crown's light is, and how much of it reaches a point. */
const CROWN = { x: 78, y: 26 };
const glow = (x: number, y: number, size: number) => clamp(1 - Math.hypot(x - CROWN.x, (y - CROWN.y) * 1.2) / size);

/** The crown's warmth on what's near it. */
const warmth = (x: number, y: number) => 0.18 * glow(x, y, 50);

/** The candle in her hands, lighting her from below. */
const HELD = { x: 78, y: 84 };
const underlight = (x: number, y: number) => 0.22 * clamp(1 - Math.hypot(x - HELD.x, (y - HELD.y) * 0.9) / 34);

/** Her gown's folds: creases falling from the sash (a fine shadow, lit beside it), and small gathers under her collar. */
const folds = (x: number, y: number) => {
	const crease = (((x - 78) % 6) + 6) % 6;

	return (
		(y >= 106 ? (crease === 0 ? -0.14 : crease === 1 ? 0.06 : 0) : 0) +
		0.05 * Math.sin(x * 1.6) * clamp((80 - y) / 8) * clamp((y - 69) / 3)
	);
};

/** Her hair falling from her parting in locks, gilded by her crown; on top of her head, parted. */
const falling = locksFrom(78, 14, 0.073);
const sheen: ITexture = (x, y) => falling(x, y) + warmth(x, y);
const parted = locksFrom(78, 30, 0.2);

export function drawLucia(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);
	// Her skin settled on its shades, in clean shapes, where it would speckle as its light falls off.
	const smooth: IPut = (x, y, material, t) => put(x, y, material, t + settle(t, RAMPS[material].length));

	// A procession of candles, floating: from close by on the left, winding up behind her and away into the dark on the right, smaller as they go.
	const drawThing = (keep: IPut, { x, y, size, front }: ISwirlItem) => {
		limb(x, y, x, y - size * 1.3, size * 0.28, size * 0.28, "wax", front ? 0.15 : -0.1, null, keep);
		petal(x, y - size * 1.3, size * 1.1, size * 0.32, -Math.PI / 2, "flame", front ? 0.05 : -0.15, keep);
	};
	const things: ISwirlItem[] = Array.from({ length: 18 }, (_, index) => {
		const t = index / 17;

		return {
			x: 12 + 204 * t,
			y: 146 - 126 * t - 36 * Math.sin(Math.PI * t) + Math.sin(index * 2.3) * 3,
			size: 8.5 * (1 - 0.68 * t) * (0.85 + 0.3 * hash(index, 21)),
			angle: 0,
			front: t < 0.15,
			index,
		};
	});

	// --- The figure, back to front. ---

	// Her long fair hair behind her, falling past her shoulders, in shadow behind her neck.
	ellipse(
		78,
		52,
		17,
		20,
		0,
		"hair",
		-0.02,
		(x, y) => sheen(x, y) - 0.3 * clamp(1 - Math.abs(x - 78) / 11) * clamp((y - 58) / 5),
	);
	ellipse(65, 80, 7.5, 24, 0.12, "hair", -0.1, sheen);
	ellipse(91, 80, 7.5, 24, -0.12, "hair", -0.08, sheen);
	ellipse(62, 100, 5, 12, 0.2, "hair", -0.16, sheen);
	ellipse(94, 100, 5, 12, -0.2, "hair", -0.14, sheen);

	// Her white gown, from her shoulders down, flaring out in folds that fan from her waist, gilded
	// at the top by her crown and lit from below by her candle.
	fill(
		67,
		160,
		(y) => {
			const half = y < 72 ? 8 + (y - 67) * 1.3 : 14.5 + (y - 72) * 0.17;

			return [78 - half, 78 + half];
		},
		"gown",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return (
				0.3 +
				0.16 * -across +
				0.28 * Math.sqrt(Math.max(0, 1 - across * across)) +
				folds(x, y) +
				warmth(x, y) * 0.6 +
				underlight(x, y)
			);
		},
	);

	// Close round her candle, its light warms the gown: a small, round glow, its edge dithered into
	// the white.
	fill(
		67,
		160,
		(y) => {
			const half = y < 72 ? 8 + (y - 67) * 1.3 : 14.5 + (y - 72) * 0.17;

			return [78 - half, 78 + half];
		},
		"gownWarm",
		(x, y, left, right) => {
			if (Math.hypot(x + 0.5 - HELD.x, y + 0.5 - HELD.y) > 7 + 1.2 * (dither(x, y) - 0.5)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			const t =
				0.42 +
				0.16 * -across +
				0.28 * Math.sqrt(Math.max(0, 1 - across * across)) +
				folds(x, y) +
				warmth(x, y) * 0.6 +
				underlight(x, y);

			return t + settle(t, RAMPS.gownWarm.length);
		},
	);

	// Long white sleeves, gathered at the shoulder, her arms bent to bring her hands together at her chest.
	limb(67, 73, 62, 94, 5, 4.6, "gown", -0.02, (x, y) => 0.05 * Math.sin((x + y) * 0.8) + underlight(x, y));
	limb(89, 73, 94, 94, 5, 4.6, "gown", -0.06, (x, y) => 0.05 * Math.sin((x - y) * 0.8) + underlight(x, y));
	limb(62, 94, 72, 99, 4.6, 4, "gown", 0.02, underlight);
	limb(94, 94, 84, 99, 4.6, 4, "gown", -0.02, underlight);

	// Lace at her cuffs, scalloped.
	for (const [cx, cy, turn] of [
		[72.5, 98.5, 0.4],
		[83.5, 98.5, -0.4],
	]) {
		ellipse(
			cx,
			cy,
			2.2,
			4.2,
			turn,
			"lace",
			0.3 + 0.05 * turn,
			(x, y) => ((x + y) % 2 === 0 ? 0.08 : -0.04) + underlight(x, y),
		);
	}

	// The red sash round her waist, tied in a bow at her right hip, its tails hanging.
	fill(
		104,
		108,
		(y) => {
			const half = 14.5 + (y - 72) * 0.17;

			return [78 - half, 78 + half];
		},
		"red",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.36 - 0.18 * across + (y === 104 ? 0.1 : y === 108 ? -0.1 : 0) + 0.04 * Math.sin(x * 0.9);
		},
	);
	limb(87, 108, 90, 133, 2.4, 2.2, "red", -0.04, (x, y) => 0.06 * Math.sin(y * 0.7));
	limb(89, 108, 95, 129, 2.2, 1.8, "red", -0.12, (x, y) => 0.06 * Math.sin(y * 0.7 + 1));
	petal(88, 106, 9, 3.4, -0.5, "red", 0.06);
	petal(88, 106, 8, 3.2, -2.4, "red", -0.02);
	ellipse(88, 106, 2, 2, 0, "red", 0.16);

	// Her neck, slim and deep in the shadow of her jaw, and her head.
	ellipse(78, 65.5, 3, 3.5, 0, "skin", -0.2, (x, y) => -0.22 * clamp((67 - y) / 3) + underlight(x, y) * 0.6, smooth);
	ellipse(
		78,
		50,
		11.5,
		14.5,
		0,
		"skin",
		0.06,
		(x, y) => warmth(x, y) * 0.5 + underlight(x, y) - 0.12 * clamp((y - 62) / 3),
		smooth,
	);

	// The lace collar of her gown round her neck, scalloped.
	for (let x = 68; x <= 88; x++) {
		const scallop = Math.abs(((x - 68) % 4) - 2) < 1 ? 1 : 0;
		put(x, 67 + Math.round(Math.abs(x - 78) * 0.12), "lace", 0.62 + (x < 78 ? 0.08 : -0.04));
		put(x, 68 + Math.round(Math.abs(x - 78) * 0.12) + scallop, "lace", 0.48);
	}

	// Her hair over the top of her head, parted in the middle, and down past her cheeks, a strand
	// or two loose across her brow.
	for (let y = 35; y <= 50; y++) {
		for (let x = 62; x <= 94; x++) {
			const dx = (x + 0.5 - 78) / 12.6;
			const dy = (y + 0.5 - 50) / 15.4;

			if (dx * dx + dy * dy <= 1 && y <= 41 + Math.abs(x + 0.5 - 78) * 0.42) {
				put(x, y, "hair", 0.44 + (x < 78 ? 0.06 : -0.02) + parted(x, y) + warmth(x, y));
			}
		}
	}

	const leftLock = locksFrom(69, 0, 0.073);
	const rightLock = locksFrom(87, 0, 0.073);
	ellipse(66.8, 53, 2.4, 9, 0.06, "hair", 0, (x, y) => leftLock(x, y) + warmth(x, y));
	ellipse(89.2, 53, 2.4, 9, -0.06, "hair", -0.06, (x, y) => rightLock(x, y) + warmth(x, y));
	limb(73, 41, 70, 46, 0.5, 0.4, "hair", 0.5);
	limb(86, 42, 88, 48, 0.5, 0.4, "hair", 0.36);

	// Her face: eyes closed, lowered to the candle; soft brows; a shaded nose; a gentle smile.
	for (const [cx, out] of [
		[73, -1],
		[84, 1],
	]) {
		// The closed lid: a lashed curve, dipping in the middle, a soft shadow over it, and a
		// little light under it from the candle.
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 48, "skin", 2 / 5);
			put(cx + dx, Math.abs(dx) === 2 ? 50 : 51, "eye", 0);
		}

		put(cx + out * 3, 50, "eye", 0);
		put(cx + out * 3, 51, "eye", 0);
		put(cx - 2, 51, "skin", 3 / 5);
		put(cx + 2, 51, "skin", 3 / 5);

		for (let dx = -1; dx <= 1; dx++) {
			put(cx + dx, 50, "skin", 2 / 5);
			put(cx + dx, 52, "skin", 3 / 5);
		}

		// The brow: fine and gently arched, a little darker than her hair.
		for (const [inner, y] of [
			[2, 46],
			[1, 45],
			[0, 45],
			[-1, 45],
			[-2, 46],
			[-3, 46],
		]) {
			put(cx - out * inner, y, "hair", 2 / 5);
		}
	}

	// The nose: a shadow down the side away from the light, a soft tip lit from below, nostrils.
	for (let y = 51; y <= 55; y++) {
		put(80, y, "skin", 0.24);
	}

	put(79, 56, "skin", 0.3);
	put(78, 56, "skin", 0.66);
	put(77, 57, "skin", 0.26);
	put(79, 57, "skin", 0.24);
	put(78, 58, "skin", 0.5);

	// The mouth: a soft, closed smile.
	for (const [x, y, t] of [
		[75, 60, 0.26],
		[81, 60, 0.26],
		[76, 61, 0.24],
		[77, 61, 0.2],
		[78, 61, 0.18],
		[79, 61, 0.2],
		[80, 61, 0.24],
		[77, 62, 0.56],
		[78, 62, 0.64],
		[79, 62, 0.56],
	]) {
		put(x, y, "lip", t);
	}

	put(78, 63, "skin", 0.5);

	// A touch of blush on each cheek.
	for (const cx of [71, 85]) {
		put(cx, 55, "lip", 3 / 4);
		put(cx + 1, 55, "lip", 3 / 4);
	}

	// The candle in her hands, and her hands cupped round it, lit by it: her left over her right,
	// its fingers wrapped round the front of the candle, her thumbs raised along it.
	limb(78, 86, 78, 101, 2.3, 2.3, "wax", 0.16);
	put(77, 87, "wax", 0.95);
	ellipse(80.5, 99.5, 3.6, 3, 0.35, "skin", 0.04, underlight, smooth);
	ellipse(75.5, 99, 3.6, 3, -0.35, "skin", 0.08, underlight, smooth);

	for (const y of [97.2, 98.9, 100.6]) {
		limb(75.5, y, 80.8, y + 0.3, 0.85, 0.75, "skin", 0.12, underlight, smooth);
	}

	limb(75.4, 97.6, 75.9, 94.8, 0.8, 0.7, "skin", 0.14, underlight, smooth);
	limb(80.6, 97.8, 80.1, 95, 0.8, 0.7, "skin", 0.1, underlight, smooth);

	// Her crown: a full wreath of lingonberry leaves in two rows, red berries among them, and five
	// candles standing in it, wax running down them.
	for (let row = 0; row < 2; row++) {
		for (let i = 0; i < 18; i++) {
			const a = ((i + row * 0.5) / 18) * Math.PI * 2;
			const x = 78 + Math.cos(a) * (13 + row * 1.5);
			const y = 37 + row * 1.2 + Math.sin(a) * 3.2;

			if (Math.sin(a) > -0.4) {
				petal(
					x,
					y,
					5 + row,
					2 + row * 0.3,
					(i % 2 === 0 ? Math.PI + 0.5 : -0.4) + row * 0.3,
					"leaf",
					Math.sin(a) * 0.12 + 0.02 - row * 0.08,
				);
			}
		}
	}

	for (const [x, y] of [
		[67, 39],
		[71, 41],
		[75, 40],
		[81, 41],
		[85, 40],
		[89, 39],
		[78, 42],
	]) {
		put(x, y, "red", 0.66);
		put(x + 1, y, "red", 0.52);
		put(x, y + 1, "red", 0.4);
	}

	for (const [x, base, height] of [
		[66, 37, 13],
		[72, 36, 15],
		[78, 35, 17],
		[84, 36, 15],
		[90, 37, 13],
	]) {
		limb(x, base, x, base - height, 1.6, 1.6, "wax", 0.1 + (x - 78) * -0.004);
		// A drip of wax running down from the top.
		limb(x + 1, base - height + 1, x + 1, base - height + 4 + (x % 3), 0.5, 0.6, "wax", 0.4);
	}

	// --- Light: from her crown above her (and the candle she carries); a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 30) / 140) * clamp((x - 48) / 36),
		fade: (_x, y) => clamp((y - 104) / 52) * 0.75,
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

	// A halo of light round each flame of her crown, and round each candle in the procession.
	for (const [x, y] of [
		[66, 21],
		[72, 18],
		[78, 15],
		[84, 18],
		[90, 21],
	]) {
		paintGlow(context, x, y, 10, RAMPS.halo, 0.9);
	}

	for (const { x, y, size } of things) {
		paintGlow(context, x, y - size * 1.6, size * 1.6, RAMPS.halo, 0.75);
	}

	sparks(false);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

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
