/**
 * La Befana of Italy, as her portrait (portraitKit.ts): an old woman with a kind, crinkled smile
 * and a long nose, in a wine-red headscarf knotted under her chin and a black shawl patched in
 * every colour, her broom standing at her side. Moonlight from behind her, over the rooftops and
 * chimneys of a sleeping town, a teal night, and wrapped sweets tumbling round her.
 */

import {
	canvasWith,
	clamp,
	fbm,
	figure,
	hash,
	paintFigure,
	paintGlow,
	paintLayer,
	shade,
	strands,
	type ITexture,
	paintSwirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#2a1810", "#4e2c1e", "#76462e", "#9c6244", "#bc805c", "#d49e78"],
	scarf: ["#1e0610", "#3a0c1c", "#5a1428", "#7c2036", "#9c3046", "#b84858"],
	skirt: ["#0c0606", "#1c0e0c", "#2e1814", "#42241c", "#583226", "#704232"],
	shawl: ["#08060a", "#141016", "#221c24", "#322a34", "#443a46", "#5a4e5a"],
	patchTeal: ["#082220", "#10403a", "#1c605a", "#2c847a"],
	patchOchre: ["#2a1a06", "#503410", "#7a5418", "#a07424"],
	patchRed: ["#2a0808", "#501414", "#782020", "#a02e2a"],
	grey: ["#2a2a2e", "#4a4a50", "#727278", "#a0a0a6", "#c8c8cc"],
	wood: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	straw: ["#2a1e08", "#4e3a12", "#7a5c1e", "#a6802c", "#c8a040"],
	lip: ["#2a0c10", "#5a1c22", "#8a3a3a", "#b85a58", "#d47a70"],
	eye: ["#060406", "#140c0a", "#2e1c12", "#4a301c"],
	white: ["#7a7470", "#b8b0a8", "#ece4da"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	night: ["#020608", "#05100f", "#0a1c1a", "#102a27", "#173a36", "#204c46"],
	moon: ["#5a8a84", "#9ac8be", "#d8f4ec", "#ffffff"],
	roof: ["#010304", "#03080a", "#060e10"],
	window: ["#3a1c08", "#7a4010", "#c07020", "#ffb040", "#ffe090"],
	stitch: ["#3a2e1a", "#6e5a34", "#a08a5a"],
	candyRed: ["#4a0810", "#9a1828", "#e04050", "#ff8a90"],
	candyGreen: ["#08300e", "#1a6a28", "#38a848", "#80e080"],
	candyGold: ["#4a3008", "#a07018", "#f0c040", "#fff0a0"],
	candyTeal: ["#083028", "#186a5a", "#30b0a0", "#90f0e0"],
};
// Moonlight from behind her, high on the right: cold and pale.
const RIM: Record<string, string[]> = {
	skin: ["#7aa8a0", "#b8dcd4", "#e8fff8", "#ffffff"],
	scarf: ["#a07888", "#d0a8b4", "#f0d8e0", "#ffffff"],
	skirt: ["#6a6a62", "#a0a092", "#d8dccc", "#f8fff0"],
	shawl: ["#4a6a6a", "#7aa0a0", "#b8dcd8", "#e8fff8"],
	patchTeal: ["#6ac0b4", "#a8e8dc", "#e8fff8"],
	patchOchre: ["#b8b080", "#e0d8b0", "#fff8e0"],
	patchRed: ["#b07a7a", "#d8b0b0", "#fff0f0"],
	grey: ["#b8d0cc", "#e0f0ec", "#ffffff"],
	wood: ["#6a8a84", "#a0c0b8", "#d8f0e8"],
	straw: ["#b0c098", "#d8e8c0", "#f8fff0"],
	white: ["#e8fff8", "#ffffff", "#ffffff"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	// The sweets in front of her, moonlit as her patches are.
	candyRed: ["#b07a7a", "#d8b0b0", "#fff0f0"],
	candyGreen: ["#8ab890", "#c0e0c4", "#f0fff0"],
	candyGold: ["#b8b080", "#e0d8b0", "#fff8e0"],
	candyTeal: ["#6ac0b4", "#a8e8dc", "#e8fff8"],
};

const MOON = { x: 196, y: 32 };

/** Wool: a coarse weave. */
const weave: ITexture = (x, y) => 0.05 * Math.sin(x * 1.4 + (y % 2) * 1.6) + 0.06 * (hash(x, y) - 0.5);
/** Twigs: the broom's bristles, streaked. */
const twigs: ITexture = (x, y) => 0.12 * Math.sin(x * 1.9 - y * 0.12) + 0.06 * (hash(x, y) - 0.5);

/** The folds of her shawl, falling from her shoulders: a crease every so often, fanning out as it falls. */
const folds = (x: number, y: number) => {
	const fan = ((x - 78) / Math.max(1, y - 50)) * 9 + 20;
	const crease = fan - Math.floor(fan);

	return (crease < 0.12 ? -0.13 : crease < 0.24 ? 0.06 : 0) * clamp((y - 74) / 8);
};

/** Where her shawl's fringed hem hangs to, lowest at its point in front. */
const hem = (x: number) => 106 + 12 * clamp(1 - Math.abs(x - 78) / 34);

/** Whether a patch, its corner at (px, py), `w` by `h`, sewn on a little askew by `tilt`, covers (x, y). */
const onPatch = (x: number, y: number, px: number, py: number, w: number, h: number, tilt: number) => {
	const u = x - px - (y - py) * tilt;
	const v = y - py + (x - px) * tilt;

	return u >= 0 && u < w && v >= 0 && v < h ? { u, v } : null;
};

const gauss = (d: number) => Math.exp(-d * d);

/**
 * How far her face's features stand out at (u, v), across it from its middle (-1 to 1) and down
 * it (her eyes near -0.12, the tip of her nose 0.35, her chin 0.92): round cheeks raised in a smile, a
 * long nose, the lines of her smile, her chin, her eyes a little sunk.
 */
function kindRelief(u: number, v: number): number {
	const across = Math.abs(u);
	// The lines of her smile, from beside her nose round the corners of her mouth.
	const along = clamp(((across - 0.18) * 0.24 + (v - 0.38) * 0.28) / (0.24 ** 2 + 0.28 ** 2));
	const smile = Math.hypot(across - 0.18 - 0.24 * along, v - 0.38 - 0.28 * along);

	return (
		0.35 * gauss(Math.hypot((across - 0.5) / 0.22, (v - 0.22) / 0.16)) +
		0.3 * gauss(u / 0.08) * clamp((v + 0.2) / 0.1) * clamp((0.37 - v) / 0.08) +
		0.35 * gauss(Math.hypot(u / 0.13, (v - 0.35) / 0.09)) -
		0.22 * gauss(smile / 0.035) -
		0.2 * gauss(Math.hypot((across - 0.45) / 0.18, (v + 0.12) / 0.08)) +
		0.25 * gauss(Math.hypot(u / 0.22, (v - 0.92) / 0.12)) -
		0.1 * gauss(Math.hypot(u / 0.3, (v - 0.62) / 0.08))
	);
}

const kindAt = (x: number, y: number) => kindRelief((x - 78) / 10.5, (y - 50) / 13);

/** The light on her face at (x, y): what stands out catching it from the front left, rounded. */
const kindly = (x: number, y: number) => {
	const across = (x + 0.5 - 78) / 10.5;

	return (
		0.4 +
		0.45 * kindAt(x + 0.5, y + 0.5) +
		0.45 * (kindAt(x + 1.2, y + 1.2) - kindAt(x - 0.2, y - 0.2)) +
		0.08 * Math.sqrt(Math.max(0, 1 - across * across)) +
		0.04 * across
	);
};

// Each house a pitched roof (some taller), with a chimney on its slope.
const roofline = (x: number) => {
	const house = Math.floor(x / 30);
	const across = x - house * 30;
	const eaves = 120 - Math.round(hash(house, 41) * 12);
	const chimney = across >= 8 && across < 12 ? 8 : 0;

	return eaves - Math.round((15 - Math.abs(across - 15)) * 0.7) - chimney;
};

export function drawBefana(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// Wrapped sweets flung from her side, arcing up over her and scattering as they go.
	const drawThing = (keep: IPut, { x, y, size, angle, front, index }: ISwirlItem) => {
		const material = ["candyRed", "candyGreen", "candyGold", "candyTeal"][index % 4];
		const along = { x: Math.cos(angle), y: Math.sin(angle) };
		ellipse(x, y, size * 0.6, size * 0.42, angle, material, front ? 0.05 : -0.22, null, keep);

		for (const end of [-1, 1]) {
			petal(
				x + along.x * size * 0.5 * end,
				y + along.y * size * 0.5 * end,
				size * 0.7,
				size * 0.35,
				angle + (end === 1 ? 0 : Math.PI),
				material,
				(front ? 0.05 : -0.22) + 0.1,
				keep,
			);
		}
	};
	const things: ISwirlItem[] = Array.from({ length: 16 }, (_, index) => {
		const t = index / 15;
		const scatter = 6 + t * 26;

		return {
			x: 126 - 112 * t + (hash(index, 94) - 0.5) * scatter,
			y: 92 - 64 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 30 * t + (hash(index, 95) - 0.5) * scatter,
			size: 7 - t * 2,
			angle: index * 1.7,
			front: index < 2,
			index,
		};
	});

	// --- The figure, back to front. ---

	// Her headscarf behind her head, hanging to her shoulders.
	ellipse(78, 50, 15.5, 17, 0, "scarf", -0.06, weave);

	// Her black shawl, from her neck round over her shoulders, falling wide over her dress to its
	// fringed hem.
	fill(
		63,
		hem(78),
		(y) => {
			const half = y < 76 ? 8 + 17 * Math.sin(((y - 63) / 13) * (Math.PI / 2)) : 25 + (y - 76) * 0.25;

			return [78 - half, 78 + half];
		},
		"shawl",
		(x, y, left, right) => {
			if (y > hem(x)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.3 + 0.16 * -across + 0.24 * Math.sqrt(Math.max(0, 1 - across * across)) + weave(x, y) + folds(x, y);
		},
	);

	// Her skirt below the shawl's hem, of old brown wool, falling straight in heavy folds.
	fill(
		100,
		160,
		(y) => {
			const half = 21 + (y - 100) * 0.2;

			return [78 - half, 78 + half];
		},
		"skirt",
		(x, y, left, right) => {
			if (y < hem(x)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const crease = (((x - 70) % 7) + 7) % 7;

			return (
				0.3 +
				0.16 * -across +
				0.24 * Math.sqrt(Math.max(0, 1 - across * across)) +
				weave(x, y) +
				(crease === 0 ? -0.12 : crease === 1 ? 0.06 : 0) -
				(y - hem(x) < 2 ? 0.14 : 0)
			);
		},
	);

	// The fringe along the shawl's hem, hanging in tassels.
	for (let x = 46; x <= 110; x += 2) {
		const length = 3 + Math.round(hash(x, 13) * 3);
		limb(x, hem(x), x + 0.4, hem(x) + length, 0.6, 0.5, "shawl", 0.22);
	}

	// Patches sewn on in every colour, a little askew, following her folds, with big stitches of
	// coarse thread round them.
	for (const [px, py, w, h, tilt, material] of [
		[61, 86, 8, 7, 0.12, "patchTeal"],
		[86, 98, 9, 8, -0.1, "patchOchre"],
		[65, 112, 7, 9, -0.08, "patchRed"],
		[90, 121, 8, 7, 0.1, "patchTeal"],
		[71, 132, 9, 6, 0.06, "patchOchre"],
	] as const) {
		for (let y = py - 2; y < py + h + 2; y++) {
			for (let x = px - 2; x < px + w + 2; x++) {
				const at = onPatch(x, y, px, py, w, h, tilt);

				if (!at) {
					continue;
				}

				const edge = at.u < 1 || at.v < 1 || at.u >= w - 1 || at.v >= h - 1;

				if (edge && (x + y) % 3 === 0) {
					put(x, y, "stitch", 0.55);
				} else {
					put(x, y, material, 0.3 + weave(x, y) - (at.u / w) * 0.12 + folds(x, y) - (edge ? 0.06 : 0));
				}
			}
		}
	}

	// Her hand clutching her shawl closed at her chest, its edges overlapping in a fold below. Her arm
	// in its black sleeve: her upper arm only a soft shape from halfway down, never a dark crease, her
	// shoulder the shawl's own as on her broom side; her elbow at her side and her forearm across to
	// her hand; her fingers curled round the fold, her thumb over them.
	limb(73, 84, 70.5, 104, 1.2, 1.6, "shawl", -0.12, weave);
	const draped: IPut = (x, y, material, t) => put(x, y, material, Math.max(t, 0.42 + weave(x, y)));
	limb(60.5, 80, 56, 87, 4.8, 4.4, "shawl", -0.08, weave, draped);
	limb(56, 87, 70, 83.5, 4.4, 3.4, "shawl", 0.04, weave);
	ellipse(73, 81, 3.4, 2.8, 0.2, "skin", 0.02);

	for (const y of [79.6, 81, 82.4]) {
		limb(70.8, y, 75.6, y + 0.3, 0.75, 0.65, "skin", 0.1);
	}

	limb(75.4, 80.4, 73.4, 78.6, 0.7, 0.6, "skin", 0.14);

	// A few grey curls escaping the scarf at her temples.
	ellipse(67.5, 47, 2.2, 4, 0.2, "grey", 0.1, strands);
	ellipse(88.5, 47, 2.2, 4, -0.2, "grey", 0.02, strands);

	// Her face: long and lined, carved by the light (kindly): round cheeks raised in her smile, a long
	// nose, smile lines, her chin; shadowed under her jaw.
	ellipse(78, 49.5, 10.5, 12.5, 0, "skin", 0, (x, y) => kindly(x, y) - 0.1 * clamp((y - 60.5) / 2));

	// Her headscarf over her head, its edge low on her brow, knotted under her chin.
	for (let y = 32; y <= 52; y++) {
		for (let x = 60; x <= 96; x++) {
			const dx = (x + 0.5 - 78) / 13;
			const dy = (y + 0.5 - 48) / 16;

			if (dx * dx + dy * dy <= 1 && (y <= 41 - Math.abs(x + 0.5 - 78) * -0.12 || Math.abs(x + 0.5 - 78) > 10.5)) {
				put(x, y, "scarf", 0.36 + (x < 78 ? 0.06 : -0.04) + weave(x, y) + ((x * 7 + y * 3) % 11 === 0 ? 0.3 : 0));
			}
		}
	}

	ellipse(78, 65, 4, 2.6, 0, "scarf", 0.12, weave);
	petal(77, 66, 9, 2.6, Math.PI / 2 + 0.4, "scarf", 0.02);
	petal(79, 66, 8, 2.4, Math.PI / 2 - 0.3, "scarf", -0.04);

	// Her eyes: thin crescents, crinkled up by the smile in her cheeks, the lines at their corners.
	for (const [cx, out] of [
		[73, -1],
		[83, 1],
	]) {
		put(cx - 2, 49, "eye", 0.12);
		put(cx - 1, 48, "eye", 0.08);
		put(cx, 48, "eye", 0.02);
		put(cx + 1, 48, "eye", 0.08);
		put(cx + 2, 49, "eye", 0.12);

		// The lower lids pushed up into them by her cheeks, and the lines at the corners.
		for (let dx = -1; dx <= 1; dx++) {
			put(cx + dx, 49, "skin", 0.72);
			put(cx + dx, 50, "skin", 0.6);
		}

		put(cx + out * 3, 48, "skin", 0.18);
		put(cx + out * 3, 50, "skin", 0.18);
		put(cx + out * 4, 51, "skin", 0.22);

		// Thin grey brows, raised kindly.
		for (let inner = -2; inner <= 2; inner++) {
			put(cx - out * inner, inner === 2 ? 46 : 45, "grey", 0.45);
		}
	}

	// Her long nose, lit down its near side and shadowed down its far one, hooked at the tip, a
	// nostril under it.
	for (let y = 49; y <= 52; y++) {
		put(78, y, "skin", 0.58);
		put(79, y, "skin", 0.26);
	}

	put(77, 53, "skin", 0.5);
	put(78, 53, "skin", 0.72);
	put(79, 53, "skin", 0.4);
	put(78, 54, "skin", 0.56);
	put(79, 54, "skin", 0.2);
	put(78, 55, "skin", 0.16);
	put(77, 55, "skin", 0.24);

	// Rosy cheeks, round with her smile.
	for (const [x, y, t] of [
		[71, 53, 0.55],
		[72, 54, 0.62],
		[71, 55, 0.5],
		[85, 53, 0.5],
		[84, 54, 0.58],
		[85, 55, 0.45],
	]) {
		put(x, y, "lip", t);
	}

	// Her smile, wide and turned up at its corners, one tooth left in it, her lower lip catching the light.
	for (const [x, y, material, t] of [
		[74, 56, "lip", 0.22],
		[82, 56, "lip", 0.22],
		[75, 57, "lip", 0.26],
		[76, 57, "lip", 0.34],
		[77, 57, "lip", 0.36],
		[78, 57, "lip", 0.36],
		[79, 57, "lip", 0.34],
		[80, 57, "lip", 0.3],
		[81, 57, "lip", 0.24],
		[75, 58, "eye", 0.1],
		[76, 58, "eye", 0.06],
		[77, 58, "white", 0.85],
		[78, 58, "eye", 0.06],
		[79, 58, "eye", 0.06],
		[80, 58, "eye", 0.1],
		[81, 58, "eye", 0.14],
		[76, 59, "lip", 0.5],
		[77, 59, "lip", 0.62],
		[78, 59, "lip", 0.64],
		[79, 59, "lip", 0.6],
		[80, 59, "lip", 0.48],
	] as const) {
		put(x, y, material, t);
	}

	// Her broom, standing at her side: the handle up past her shoulder, and its twigs bound with
	// cord at the bottom, flaring out to ragged ends on the ground.
	limb(107, 24, 112, 120, 1.8, 1.8, "wood", 0.08);
	fill(
		118,
		156,
		(y) => {
			const half = 3 + (y - 118) * 0.42;
			const middle = 112.3 + (y - 118) * 0.06;

			return [middle - half, middle + half];
		},
		"straw",
		(x, y, left, right) => {
			// Ragged at the end, each twig its own length.
			if (y > 148 && hash(x, 7) * 8 < y - 148) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.36 - 0.18 * across + 0.18 * Math.sqrt(Math.max(0, 1 - across * across)) + twigs(x, y);
		},
	);
	limb(109.5, 119.5, 115.5, 120.5, 1.2, 1.2, "patchRed", 0.25);
	limb(109.2, 123, 116, 124, 1, 1, "patchRed", 0.15);

	// Her arm in its black sleeve, from her shoulder down to her hand round the broom's handle.
	limb(92, 72, 100, 86, 5.4, 4.6, "shawl", -0.02, weave);
	limb(100, 86, 106, 90, 4.6, 3.8, "shawl", 0.04, weave);
	// Her hand round it: the back of it, her fingers wrapped round the handle, her thumb over them.
	ellipse(109.5, 90, 3.4, 3.6, 0, "skin", 0);

	for (const y of [88, 89.6, 91.2, 92.8]) {
		limb(107.3, y, 112.3, y + 0.3, 0.8, 0.7, "skin", 0.1);
	}

	limb(107.5, 87.6, 110.6, 86.4, 0.75, 0.65, "skin", 0.14);

	// --- Light: the moon, behind her high on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 30) / 150) * clamp((x - 50) / 40),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.55,
		outlineAbove: 128,
	});

	// --- The scene: a teal night, the moon, the rooftops and chimneys of the town asleep. ---
	const { canvas, context } = canvasWith((x, y) => {
		if (y > roofline(x)) {
			// Snow on the roofs, catching the moon; and a window lit here and there, where someone is still up.
			if (y - roofline(x) < 2) {
				return shade(x, y, 0.75 + fbm(x * 0.2, y * 0.2) * 0.3, RAMPS.night);
			}

			const house = Math.floor(x / 30);
			const across = x - house * 30;
			const eaves = 120 - Math.round(hash(house, 41) * 12);

			if (hash(house, 43) > 0.55 && across >= 18 && across < 22 && y >= eaves + 4 && y < eaves + 9) {
				return shade(x, y, across === 20 || y === eaves + 6 ? 0.15 : 0.7, RAMPS.window);
			}

			return shade(x, y, 0.4 + fbm(x * 0.2, y * 0.2) * 0.3, RAMPS.roof);
		}

		const mist = fbm(x * 0.03 + 31, y * 0.06);
		const glow = clamp(1 - Math.hypot((x - MOON.x) / 120, (y - MOON.y) / 90));
		const dark = clamp(1 - Math.abs(x - 140) / 240);

		// A paler band of sky down at the rooftops, for the town to stand dark against.
		const horizon = 0.22 * clamp(1 - (roofline(x) - y) / 30);

		return shade(x, y, (glow * 0.8 + mist * 0.26 - 0.06) * dark + horizon, RAMPS.night);
	});

	// The moon.
	paintLayer(
		context,
		(keep) => {
			ellipse(MOON.x, MOON.y, 14, 14, 0, "moon", 0.3, (x, y) => -0.15 * fbm(x * 0.3, y * 0.3), keep);
		},
		RAMPS,
		null,
	);

	// The lit windows' glow, and smoke curling from the chimneys of the houses still warm.
	for (let house = 0; house < 9; house++) {
		const eaves = 120 - Math.round(hash(house, 41) * 12);

		if (hash(house, 43) > 0.55) {
			paintGlow(context, house * 30 + 20, eaves + 6.5, 8, RAMPS.window, 0.4);
		}
	}

	paintLayer(
		context,
		(keep) => {
			for (let house = 0; house < 9; house++) {
				if (hash(house, 44) < 0.5) {
					continue;
				}

				const top = roofline(house * 30 + 10);

				for (let i = 0; i < 26; i++) {
					const y = top - 1 - i;
					const x = house * 30 + 10 + Math.sin(i * 0.3 + house) * (1 + i * 0.25) + i * 0.4;
					const t = 0.5 - i * 0.016;

					for (let dx = -1; dx <= 1; dx++) {
						if (hash(Math.round(x) + dx, y) < 0.7 - i * 0.02) {
							keep(Math.round(x) + dx, y, "night", t + 0.2);
						}
					}
				}
			}
		},
		RAMPS,
		null,
	);

	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

	return canvas;
}
