/**
 * The Christkind of Germany and Austria, as their portrait (portraitKit.ts): a young figure in
 * a white robe brocaded with gold, golden curls under a little crown, great white wings spread
 * behind them, a star cupped in their hands. A violet night behind them (set apart from Saint
 * Lucia's warm candlelight), rays of light through it, motes of gold drifting.
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
	dither,
	settle,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#3a2420", "#6a4236", "#9a6a54", "#c49278", "#e2b49a", "#f6d4bc"],
	hair: ["#2a1806", "#5a3a0c", "#8a5e14", "#b8861e", "#e0b034", "#fbd860"],
	robe: ["#1c1a22", "#3a3642", "#6a6470", "#a09aa4", "#d0ccd0", "#f4f0ec"],
	feather: ["#2a2632", "#4e4a58", "#7e7888", "#aea8b8", "#d8d2e0", "#f6f2fa"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060", "#fff0a8"],
	red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
	lip: ["#5a2a2a", "#8a4440", "#b06058", "#d08478", "#eaa898"],
	eye: ["#080a14", "#162038", "#2a4064", "#4a6a98"],
	white: ["#8a7a72", "#c9b8ac", "#f2e6da"],
	star: ["#a06010", "#ffc030", "#ffe070", "#fff6c8", "#ffffff"],
	robeWarm: ["#2a2018", "#5a4632", "#8e7254", "#c0a07a", "#e8cca2", "#fff4d8"],
	halo: ["#3a2a40", "#5a4040", "#8a6838", "#c09a40", "#f0d070"],
};
// Pale light from behind them, high on the right: lilac on the robe and wings.
const RIM: Record<string, string[]> = {
	skin: ["#c0704a", "#f0a070", "#ffd0a0", "#fff0d8"],
	hair: ["#d0a040", "#ffd060", "#fff0a0", "#ffffff"],
	robe: ["#b8a8e0", "#e4dcff", "#ffffff", "#ffffff"],
	feather: ["#b8a8e0", "#e4dcff", "#ffffff", "#ffffff"],
	robeWarm: ["#ffe0a0", "#fff4d8", "#ffffff", "#ffffff"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	red: ["#d04040", "#ff7060", "#ffb090", "#ffe0c0"],
	lip: ["#d08070", "#f0a890", "#ffd0b0", "#ffe8d0"],
	white: ["#f2e6da", "#ffffff", "#ffffff", "#ffffff"],
};

const STAR = { x: 78, y: 92 };

/** The robe's creases, falling from under their hands: a fine shadow, lit beside it. */
const crease = (x: number, y: number) => {
	const across = (((x - 78) % 7) + 7) % 7;

	return y >= 100 ? (across === 3 ? -0.12 : across === 4 ? 0.05 : 0) : 0;
};

/** Curls: ringlets, light and shadow in little loops. */
const curls: ITexture = (x, y) =>
	0.13 * Math.sin(x * 0.85 + Math.sin(y * 0.45) * 2) * Math.sin(y * 0.7 + Math.sin(x * 0.3) * 1.5) +
	0.04 * (hash(x, y) - 0.5);

/** The star in their hands brightening what's near it. */
const starlight = (x: number, y: number) => 0.2 * clamp(1 - Math.hypot(x - STAR.x, y - STAR.y) / 26);

export function drawChristkind(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);
	// Their skin settled on its shades, in clean shapes, where it would speckle as its light falls off.
	const smooth: IPut = (x, y, material, t) => put(x, y, material, t + settle(t, RAMPS[material].length));

	// Feathers drifting down from their wings, tumbling as they fall.
	const drawThing = (keep: IPut, { x, y, size, angle, front }: ISwirlItem) => {
		petal(x, y, size * 2, size * 0.5, angle, "feather", front ? 0.5 : 0.32, keep);
		limb(
			x,
			y,
			x + Math.cos(angle) * size * 1.7,
			y + Math.sin(angle) * size * 1.7,
			0.4,
			0.3,
			"feather",
			front ? 0.05 : -0.1,
			null,
			keep,
		);
	};
	const things: ISwirlItem[] = Array.from({ length: 16 }, (_, index) => {
		// Off one wing or the other, falling further the longer they've been falling.
		const side = index % 2 === 0 ? -1 : 1;
		const fall = hash(index, 91);

		return {
			x: 78 + side * (26 + hash(index, 92) * 40) + Math.sin(fall * 9) * 6,
			y: 52 + fall * 100,
			size: 4.5 + hash(index, 93) * 3,
			angle: Math.PI / 2 + Math.sin(fall * 7 + index) * 0.9,
			front: index % 4 === 1,
			index,
		};
	});

	// --- The figure, back to front. ---

	// Wings, spread behind: long flight feathers behind, shorter coverts over them, each wing in rows.
	for (const side of [-1, 1]) {
		const sx = 78 + side * 9;
		const sy = 74;

		// The wing's leading edge arches up and out from the shoulder to the wrist; feathers hang from it,
		// longest at the wrist: long flight feathers behind, shorter coverts over them.
		const edge = (t: number) => ({
			x: (1 - t) * (1 - t) * sx + 2 * t * (1 - t) * (sx + side * 16) + t * t * (sx + side * 34),
			y: (1 - t) * (1 - t) * sy + 2 * t * (1 - t) * 26 + t * t * 34,
		});
		const hang = (t: number, out: number) => (side === 1 ? Math.PI / 2 - out : Math.PI / 2 + out);
		const dim = side === 1 ? -0.06 : 0;

		for (let i = 0; i <= 12; i++) {
			const t = i / 12;
			const { x, y } = edge(t);
			petal(x, y, 22 + t * 34, 4.6, hang(t, 0.25 + t * 0.75), "feather", -0.04 + dim);
		}

		for (let i = 0; i <= 12; i++) {
			const t = i / 12;
			const { x, y } = edge(t);
			petal(x, y, 12 + t * 12, 4, hang(t, 0.2 + t * 0.6), "feather", 0.2 + dim);
		}

		for (let i = 0; i < 16; i++) {
			const a = edge(i / 16);
			const b2 = edge((i + 1) / 16);
			limb(a.x, a.y, b2.x, b2.y, 3.4 - i * 0.1, 3.3 - i * 0.1, "feather", 0.1 + dim);
		}
	}

	// Their halo: a ring of gold behind their head, the curls in front of it.
	for (let i = 0; i < 40; i++) {
		const a1 = (i / 40) * Math.PI * 2;
		const a2 = ((i + 1) / 40) * Math.PI * 2;
		limb(
			78 + Math.cos(a1) * 19,
			44 + Math.sin(a1) * 19,
			78 + Math.cos(a2) * 19,
			44 + Math.sin(a2) * 19,
			0.9,
			0.9,
			"gold",
			0.42 + 0.2 * Math.cos(a1 - 0.8),
		);
	}

	// Golden curls behind the head, to the shoulders.
	// (In shadow behind the neck, so the neck stands clear of it.)
	const behindNeck = (x: number, y: number) =>
		curls(x, y) - 0.3 * clamp(1 - Math.abs(x - 78) / 11) * clamp((y - 57) / 5);
	ellipse(78, 52, 16.5, 19, 0, "hair", 0, behindNeck);
	ellipse(66, 66, 5.4, 8, 0.2, "hair", -0.1, curls);
	ellipse(90, 66, 5.4, 8, -0.2, "hair", -0.14, curls);

	// The white robe, from the shoulders down, its sleeves wide.
	fill(
		66,
		160,
		(y) => {
			const half = y < 71 ? 8 + (y - 66) * 1.3 : 14.5 + (y - 71) * 0.2;

			return [78 - half, 78 + half];
		},
		"robe",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.3 + 0.16 * -across + 0.28 * Math.sqrt(Math.max(0, 1 - across * across)) + starlight(x, y) + crease(x, y);
		},
	);

	// Close round the star, its light warms the robe: a small, round glow, its edge dithered into
	// the white.
	fill(
		66,
		160,
		(y) => {
			const half = y < 71 ? 8 + (y - 66) * 1.3 : 14.5 + (y - 71) * 0.2;

			return [78 - half, 78 + half];
		},
		"robeWarm",
		(x, y, left, right) => {
			if (Math.hypot(x + 0.5 - STAR.x, y + 0.5 - STAR.y) > 9 + 1.2 * (dither(x, y) - 0.5)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const t =
				0.42 + 0.16 * -across + 0.28 * Math.sqrt(Math.max(0, 1 - across * across)) + starlight(x, y) + crease(x, y);

			return t + settle(t, RAMPS.robeWarm.length);
		},
	);

	// Gold embroidery: a band of scrolling vine down either side of the robe's front, and stars
	// stitched across it.
	for (const side of [-1, 1]) {
		for (let y = 72; y < 156; y++) {
			put(78 + side * 4, y, "gold", 0.42);
			put(Math.round(78 + side * (6 + 1.6 * Math.sin(y * 0.55))), y, "gold", 0.5 + 0.1 * Math.cos(y * 0.55));
		}
	}

	for (const [cx, cy] of [
		[68, 104],
		[89, 112],
		[70, 126],
		[87, 134],
		[72, 146],
	]) {
		for (const [dx, dy, t] of [
			[0, 0, 0.75],
			[-1, 0, 0.5],
			[1, 0, 0.5],
			[0, -1, 0.5],
			[0, 1, 0.5],
		]) {
			put(cx + dx, cy + dy, "gold", t);
		}
	}

	// Gold trim down the front of the robe.
	for (let y = 68; y < 160; y++) {
		put(78, y, "gold", 0.5);
		put(79, y, "gold", 0.36);
	}

	limb(67, 72, 63, 94, 5.2, 6, "robe", -0.02);
	limb(89, 72, 93, 94, 5.2, 6, "robe", -0.06);
	limb(63, 94, 72, 96, 6, 5, "robe", 0.02, starlight);
	limb(93, 94, 84, 96, 6, 5, "robe", -0.02, starlight);

	// The neckline trimmed in gold.
	for (let x = 70; x <= 86; x++) {
		put(x, 66 + Math.round(Math.abs(x - 78) * -0.25 + 2), "gold", 0.6);
	}

	// Neck and face.
	// A slim neck, deep in the shadow of the jaw, lighter lower down.
	ellipse(78, 64.5, 3, 3.5, 0, "skin", -0.2, (_x, y) => -0.22 * clamp((66 - y) / 3), smooth);
	// The head, the underside of the jaw turning away from the light.
	ellipse(78, 49, 11, 13.5, 0, "skin", 0.18, (x, y) => starlight(x, y) - 0.14 * clamp((y - 59.5) / 3), smooth);

	// Curls over the top of the head, swept to the sides, and down past the cheeks.
	for (let y = 34; y <= 49; y++) {
		for (let x = 62; x <= 94; x++) {
			const dx = (x + 0.5 - 78) / 12.4;
			const dy = (y + 0.5 - 49) / 15;

			if (dx * dx + dy * dy <= 1 && y <= 40 + Math.abs(x + 0.5 - 79) * 0.36) {
				put(x, y, "hair", 0.44 + (x < 78 ? 0.06 : -0.02) + curls(x, y));
			}
		}
	}

	ellipse(66.5, 52, 2.8, 8.5, 0.06, "hair", 0.02, curls);
	ellipse(89.5, 52, 2.8, 8.5, -0.06, "hair", -0.04, curls);

	// Their face: eyes wide and kind, looking out; fine brows; a little smile. (Every shade in the
	// eyes and brows is exactly one of its ramp's: the dither's pattern isn't mirrored, so shades
	// between two would draw each eye differently.)
	for (const [cx, out] of [
		[73, -1],
		[83, 1],
	]) {
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 46, "eye", 0);
		}

		put(cx + out * 3, 46, "eye", 0);
		put(cx - 2, 47, "white", 0);
		put(cx + 2, 47, "white", 0);
		put(cx - 1, 47, "white", 1);
		put(cx, 47, "eye", 2 / 3);
		put(cx + 1, 47, "eye", 2 / 3);
		put(cx - 1, 48, "eye", 1 / 3);
		put(cx, 48, "eye", 2 / 3);
		put(cx + 1, 48, "eye", 2 / 3);
		put(cx - 1, 49, "skin", 1 / 5);
		put(cx, 49, "skin", 2 / 5);
		put(cx + 1, 49, "skin", 1 / 5);

		for (const [inner, y] of [
			[2, 43],
			[1, 43],
			[0, 43],
			[-1, 43],
			[-2, 44],
		]) {
			put(cx - out * inner, y, "hair", 2 / 5);
		}
	}

	for (let y = 49; y <= 51; y++) {
		put(80, y, "skin", 0.26);
	}

	put(79, 52, "skin", 0.28);
	put(78, 52, "skin", 0.64);
	put(77, 53, "skin", 0.24);
	put(79, 53, "skin", 0.22);

	for (const [x, y, t] of [
		[75, 56, 0.2],
		[81, 56, 0.2],
		[76, 57, 0.18],
		[77, 57, 0.14],
		[78, 57, 0.12],
		[79, 57, 0.14],
		[80, 57, 0.18],
		[77, 58, 0.62],
		[78, 58, 0.7],
		[79, 58, 0.62],
	]) {
		put(x, y, "lip", t);
	}

	// A touch of blush on each cheek.
	for (const cx of [71, 84]) {
		put(cx, 53, "lip", 3 / 4);
		put(cx + 1, 53, "lip", 3 / 4);
	}

	// Hands cupped round the star: their left over their right, its fingers wrapped across the
	// front, their thumbs raised beside the star.
	ellipse(82.5, 97, 4, 3.2, 0.3, "skin", 0.06, starlight, smooth);
	ellipse(73.5, 97, 4, 3.2, -0.3, "skin", 0.08, starlight, smooth);

	for (const y of [96.6, 98.3, 100]) {
		limb(74, y, 81.5, y + 0.3, 0.85, 0.75, "skin", 0.12, starlight, smooth);
	}

	limb(71.2, 97, 72.2, 94, 0.8, 0.7, "skin", 0.14, starlight, smooth);
	limb(84.8, 97.2, 83.8, 94.2, 0.8, 0.7, "skin", 0.1, starlight, smooth);

	// A little crown of gold, set with red stones.
	fill(
		29,
		34,
		(y) => [68 + (34 - y) * 0.1, 88 - (34 - y) * 0.1],
		"gold",
		(x, _y, left, right) => 0.6 - 0.3 * (((x + 0.5 - left) / (right - left)) * 2 - 1),
	);

	for (const x of [69, 74, 78, 82, 87]) {
		for (let y = 25 + (x === 78 ? -1 : 0); y < 29; y++) {
			put(x, y, "gold", 0.65);
		}

		put(x, 31, "red", 0.7);
	}

	// --- Light: warm, from behind them high on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 30) / 140) * clamp((x - 40) / 50),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.55,
		outlineAbove: 128,
	});

	// --- The scene: a violet glow behind them, rays of it through the dark, motes of gold drifting. ---
	const violetBg = ["#05030a", "#0c0818", "#16102a", "#221840", "#302258", "#423070"];
	const { canvas, context } = canvasWith((x, y) => {
		const haze = fbm(x * 0.03 + 21, y * 0.05);
		const glow = clamp(1 - Math.hypot((x - 80) / 120, (y - 50) / 95));
		const angle = Math.atan2(y - 50, x - 80);
		const rays = 0.1 * Math.max(0, Math.sin(angle * 9)) * glow;
		const dark = clamp(1 - y / 210) * clamp(1 - Math.abs(x - 110) / 250);

		return shade(x, y, (glow * 0.85 + rays + haze * 0.22 - 0.1) * dark, violetBg);
	});

	const motes = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 46; i++) {
					if ((i % 5 === 0) !== front) {
						continue;
					}

					const x = Math.round(hash(i, 11) * 256);
					const y = Math.round(hash(i, 12) * 150);
					keep(x, y, "star", front ? 0.9 : 0.3 + hash(i, 13) * 0.4);

					if (front) {
						keep(x + 1, y, "star", 0.6);
						keep(x - 1, y, "star", 0.6);
						keep(x, y - 1, "star", 0.6);
						keep(x, y + 1, "star", 0.6);
					}
				}
			},
			RAMPS,
			null,
		);

	// A glow round their head, behind the halo.
	paintGlow(context, 78, 44, 30, RAMPS.halo, 0.8);
	motes(false);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	// The star's light hanging in the air over their hands.
	paintGlow(context, STAR.x, STAR.y, 14, RAMPS.star, 0.55);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

	// The star in their hands, shining.
	paintLayer(
		context,
		(keep) => {
			for (let i = 0; i < 5; i++) {
				petal(STAR.x, STAR.y, 7, 2.6, (i / 5) * Math.PI * 2 - Math.PI / 2, "star", 0.3, keep);
			}

			keep(STAR.x, STAR.y, "star", 1);
			keep(STAR.x - 1, STAR.y, "star", 1);
		},
		RAMPS,
		null,
	);
	motes(true);

	return canvas;
}
