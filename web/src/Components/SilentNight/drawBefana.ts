/**
 * La Befana of Italy, as her portrait (portraitKit.ts): an old woman with a kind, crinkled smile
 * and a long nose, in a wine-red headscarf knotted under her chin and a black shawl patched in
 * every colour, her broom over her shoulder. Moonlight from behind her, over the rooftops and
 * chimneys of a sleeping town, a teal night, and wrapped sweets tumbling round her.
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
	type ITexture,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#2a1810", "#4e2c1e", "#76462e", "#9c6244", "#bc805c", "#d49e78"],
	scarf: ["#1e0610", "#3a0c1c", "#5a1428", "#7c2036", "#9c3046", "#b84858"],
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
	candyRed: ["#4a0810", "#9a1828", "#e04050", "#ff8a90"],
	candyGreen: ["#08300e", "#1a6a28", "#38a848", "#80e080"],
	candyGold: ["#4a3008", "#a07018", "#f0c040", "#fff0a0"],
	candyTeal: ["#083028", "#186a5a", "#30b0a0", "#90f0e0"],
};
// Moonlight from behind her, high on the right: cold and pale.
const RIM: Record<string, string[]> = {
	skin: ["#7aa8a0", "#b8dcd4", "#e8fff8", "#ffffff"],
	scarf: ["#a07888", "#d0a8b4", "#f0d8e0", "#ffffff"],
	shawl: ["#4a6a6a", "#7aa0a0", "#b8dcd8", "#e8fff8"],
	patchTeal: ["#6ac0b4", "#a8e8dc", "#e8fff8"],
	patchOchre: ["#b8b080", "#e0d8b0", "#fff8e0"],
	patchRed: ["#b07a7a", "#d8b0b0", "#fff0f0"],
	grey: ["#b8d0cc", "#e0f0ec", "#ffffff"],
	wood: ["#6a8a84", "#a0c0b8", "#d8f0e8"],
	straw: ["#b0c098", "#d8e8c0", "#f8fff0"],
	white: ["#e8fff8", "#ffffff", "#ffffff"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
};

const MOON = { x: 196, y: 32 };

/** Wool: a coarse weave. */
const weave: ITexture = (x, y) => 0.05 * Math.sin(x * 1.4 + (y % 2) * 1.6) + 0.06 * (hash(x, y) - 0.5);
/** Twigs: the broom's bristles, streaked. */
const twigs: ITexture = (x, y) => 0.12 * Math.sin((x - y) * 0.9) + 0.06 * (hash(x, y) - 0.5);

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

	// --- The figure, back to front. ---

	// Her broom's head, over her shoulder (its handle, in her hand, comes later, in front of her).
	// The bristles: a bundle of twigs, bound tight at the handle and spreading to the end.
	limb(120, 28, 131, 6, 2.4, 7, "straw", 0.06, twigs);

	for (const offset of [-5, -2, 2, 5]) {
		limb(128 + offset * 0.4, 12, 133 + offset, 2, 1, 0.6, "straw", 0.1, twigs);
	}

	limb(118, 31, 122, 25, 2.8, 2.8, "patchRed", 0.2);

	// Her headscarf behind her head, hanging to her shoulders.
	ellipse(78, 50, 15.5, 17, 0, "scarf", -0.06, weave);

	// Her black shawl, over her shoulders and round her, falling wide.
	fill(
		62,
		160,
		(y) => {
			const half = y < 72 ? 11 + (y - 62) * 1.3 : 24 + (y - 72) * 0.12;

			return [78 - half, 78 + half];
		},
		"shawl",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return (
				0.3 +
				0.16 * -across +
				0.24 * Math.sqrt(Math.max(0, 1 - across * across)) +
				weave(x, y) +
				0.05 * Math.sin((x - 78) * 0.5 + y * 0.05)
			);
		},
	);

	// Patches sewn on in every colour, with big stitches.
	for (const [px, py, w, h, material] of [
		[62, 86, 8, 7, "patchTeal"],
		[86, 98, 9, 8, "patchOchre"],
		[66, 112, 7, 9, "patchRed"],
		[90, 122, 8, 7, "patchTeal"],
		[72, 132, 9, 6, "patchOchre"],
	] as const) {
		for (let y = py; y < py + h; y++) {
			for (let x = px; x < px + w; x++) {
				const edge = x === px || y === py || x === px + w - 1 || y === py + h - 1;
				put(
					x,
					y,
					edge && (x + y) % 2 === 0 ? "white" : material,
					edge && (x + y) % 2 === 0 ? 0.3 : 0.32 + weave(x, y) + (x - px) * -0.01,
				);
			}
		}
	}

	// A few grey curls escaping the scarf at her temples.
	ellipse(67.5, 47, 2.2, 4, 0.2, "grey", 0.1, strands);
	ellipse(88.5, 47, 2.2, 4, -0.2, "grey", 0.02, strands);

	// Her face: long and lined.
	ellipse(78, 50, 10.5, 13, 0, "skin", 0.14, (_x, y) => -0.1 * clamp((y - 61.5) / 2));

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

	// Her eyes: crinkled up in her smile, a glint in each, lines at their corners.
	for (const [cx, out] of [
		[73, -1],
		[83, 1],
	]) {
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, Math.abs(dx) === 2 ? 49 : 48, "eye", 0.08);
		}

		put(cx - 1, 49, "white", 0.85);
		put(cx, 49, "eye", 0.3);
		put(cx + 1, 49, "eye", 0.45);

		// The lower lids pushed up by her cheeks, and the lines at the corners.
		for (let dx = -1; dx <= 1; dx++) {
			put(cx + dx, 50, "skin", 0.3);
		}

		put(cx + out * 3, 50, "skin", 0.2);
		put(cx + out * 4, 51, "skin", 0.24);
		put(cx + out * 3, 47, "skin", 0.24);

		// Thin grey brows.
		for (let inner = -2; inner <= 2; inner++) {
			put(cx - out * inner, inner === -2 ? 46 : 45, "grey", 0.45);
		}
	}

	// Her long nose, hooked at the tip: lit down its near side, shadowed down the far.
	for (let y = 49; y <= 55; y++) {
		put(78, y, "skin", 0.68);
		put(80, y, "skin", 0.14);
	}

	ellipse(78.6, 56, 2.4, 1.9, 0, "skin", 0.28);
	put(78, 55, "skin", 0.75);
	put(76, 57, "skin", 0.12);
	put(80, 57, "skin", 0.1);
	put(78, 58, "skin", 0.08);

	// Rosy cheeks, the deep lines of her smile, and her thin lips smiling.
	for (const [x, y] of [
		[70, 54],
		[71, 54],
		[85, 54],
		[86, 54],
	]) {
		put(x, y, "lip", 0.75);
	}

	put(73, 56, "skin", 0.14);
	put(73, 57, "skin", 0.14);
	put(74, 58, "skin", 0.16);
	put(84, 56, "skin", 0.14);
	put(84, 57, "skin", 0.14);
	put(83, 58, "skin", 0.16);

	for (const [x, y, t] of [
		[74, 59, 0.1],
		[83, 59, 0.1],
		[75, 60, 0.02],
		[76, 60, 0],
		[77, 60, 0],
		[78, 60, 0],
		[79, 60, 0],
		[80, 60, 0],
		[81, 60, 0],
		[82, 60, 0.02],
		[77, 61, 0.8],
		[78, 61, 0.85],
		[79, 61, 0.8],
		[80, 61, 0.7],
	]) {
		put(x, y, "lip", t);
	}

	// The broom's handle, straight across in front of her up to its head over her shoulder; her
	// arm in its black sleeve, from her shoulder to her hand round the handle at her chest.
	limb(52, 132, 120, 28, 1.8, 1.6, "wood", 0.08);
	limb(92, 72, 97, 90, 5.4, 4.6, "shawl", -0.02, weave);
	limb(97, 90, 81, 96, 4.6, 3.8, "shawl", 0.04, weave);
	ellipse(76.5, 95, 4.4, 3.6, 0.3, "skin", 0.06);
	put(74, 94, "skin", 0.18);
	put(76, 95, "skin", 0.18);
	put(78, 95, "skin", 0.18);

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
			// The moon catches the tops of the roofs.
			const edge = y - roofline(x) < 2 ? 0.55 : 0;

			return shade(x, y, edge + 0.4 + fbm(x * 0.2, y * 0.2) * 0.3, edge ? RAMPS.night : RAMPS.roof);
		}

		const mist = fbm(x * 0.03 + 31, y * 0.06);
		const glow = clamp(1 - Math.hypot((x - MOON.x) / 120, (y - MOON.y) / 90));
		const dark = clamp(1 - Math.abs(x - 140) / 240);

		return shade(x, y, (glow * 0.8 + mist * 0.26 - 0.06) * dark, RAMPS.night);
	});

	// The moon, and wrapped sweets tumbling through the dark, the far ones dim.
	paintLayer(
		context,
		(keep) => {
			ellipse(MOON.x, MOON.y, 14, 14, 0, "moon", 0.3, (x, y) => -0.15 * fbm(x * 0.3, y * 0.3), keep);
		},
		RAMPS,
		null,
	);

	const sweets = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				const kinds = ["candyRed", "candyGreen", "candyGold", "candyTeal"];

				for (let i = 0; i < 18; i++) {
					if ((i % 4 === 1) !== front) {
						continue;
					}

					const angle = i * 0.9 + 0.3;
					const radius = 40 + i * 3.6;
					const x = Math.round(80 + Math.cos(angle) * radius * 1.4);
					const y = Math.round(70 + Math.sin(angle) * radius * 0.6);
					const material = kinds[i % 4];
					const t = front ? 0.6 : 0.3;
					// A sweet: its middle, and its wrapper twisted at each end.
					keep(x, y, material, t + 0.2);
					keep(x + 1, y, material, t);
					keep(x, y + 1, material, t - 0.1);
					keep(x + 1, y + 1, material, t - 0.1);
					keep(x - 1, y - 1, material, t + 0.1);
					keep(x + 2, y + 2, material, t + 0.1);
				}
			},
			RAMPS,
			null,
		);

	sweets(false);
	paintFigure(context, colours);
	sweets(true);

	return canvas;
}
