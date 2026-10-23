/**
 * Mrs. Claus, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind the
 * choice): struck in a pose as JoJo's heroes strike them. Her hips cocked, her long red dress and
 * work-worn apron falling to the floor; one hand pushing her spectacles up, the lenses flashing in
 * the candlelight so you can't see her eyes; the other holding out a mug of cocoa, steaming; her
 * green wool shawl round her shoulders, her grey hair up in a bun. Candlelight from below on the
 * left; behind her the menacing scene the cast share (poseScene.ts).
 */

import { clamp, figure, hash, paintFigure, paintLayer, type ITexture } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	skin: ["#1e0e0c", "#40201a", "#66382a", "#8e543e", "#b07258", "#cc9274"],
	hair: ["#2a2a2e", "#4a4a50", "#727278", "#a0a0a6", "#c8c8cc"],
	dress: ["#140308", "#2e0610", "#4e0a18", "#701222", "#941c2e", "#b0283a"],
	apron: ["#3a3632", "#5e5850", "#86807a", "#aea69c", "#d0c8bc"],
	shawl: ["#040c08", "#0a1a10", "#12301c", "#1c4628", "#285e36", "#387a46"],
	brass: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	mug: ["#3a3640", "#6e6874", "#a8a0a8", "#d8d0d4", "#f4eeee"],
	cocoa: ["#1a0c06", "#3a1d0c", "#5e3214", "#86501f"],
	steam: ["#3a3438", "#5a5258", "#7a7278"],
	glint: ["#ffffff", "#ffffff", "#ffffff"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#b85a3a", "#f08c56", "#ffbe84", "#ffe0c0"],
	hair: ["#d6ccc8", "#fff4e8", "#ffffff", "#ffffff"],
	dress: ["#b0283a", "#f05a5a", "#ff9a7a", "#ffd0b0"],
	apron: ["#e8d0b8", "#fff0dc", "#ffffff", "#ffffff"],
	shawl: ["#3a6a3a", "#7a9a4a", "#c0c070", "#f0e8a0"],
	brass: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	mug: ["#fff4e8", "#ffffff", "#ffffff", "#ffffff"],
};

/** Wool: a coarse weave. */
const weave: ITexture = (x, y) => 0.05 * Math.sin(x * 1.4 + (y % 2) * 1.6) + 0.06 * (hash(x, y) - 0.5);

export function drawMrsClausPose(): HTMLCanvasElement {
	const { put, ellipse, limb, fill, light } = figure(RAMPS, RIM);

	// --- Mrs. Claus, back to front. ---

	// Her long red dress, from her bodice to the floor, her hips cocked to the right and the skirt
	// flaring in folds.
	fill(
		56,
		156,
		(y) => {
			const half = y < 62 ? 9 + (y - 56) * 1.4 : y < 86 ? 17.4 - (y - 62) * 0.3 : 10.2 + (y - 86) * 0.29;
			const middle = y < 86 ? 126 + (y - 56) * 0.05 : 127.5 + Math.min(1, (y - 86) / 20) * 4;

			return [middle - half, middle + half];
		},
		"dress",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const fold = y > 100 ? (((x - 120) % 9) + 9) % 9 : 4;

			return (
				0.3 -
				0.16 * across +
				0.22 * Math.sqrt(Math.max(0, 1 - across * across)) +
				(fold === 0 ? -0.12 : fold === 1 ? 0.05 : 0)
			);
		},
	);

	// Her boots, peeking out from under her hem.
	ellipse(121, 156.5, 5.5, 2.6, 0, "dress", -0.3);
	ellipse(141, 157, 5.5, 2.6, 0, "dress", -0.3);

	// Her work-worn apron over it, tied at her waist.
	fill(
		86,
		142,
		(y) => {
			const middle = 127.5 + Math.min(1, (y - 86) / 20) * 4;
			const half = 10 + (y - 86) * 0.1;

			return [middle - half, middle + half];
		},
		"apron",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			// Its hem ragged, a stain or two.
			if (y > 138 + 3 * hash(x, 3)) {
				return null;
			}

			return (
				0.36 -
				0.12 * across +
				0.18 * Math.sqrt(Math.max(0, 1 - across * across)) +
				weave(x, y) -
				(hash(Math.floor(x / 3), Math.floor(y / 4)) > 0.93 ? 0.14 : 0)
			);
		},
	);
	limb(116, 86, 140, 87, 2, 2, "apron", 0.14);

	// The arm holding out her cocoa: the mug in her hand, steaming.
	limb(141, 60, 156, 73, 4.2, 3.6, "dress", -0.04);
	limb(156, 73, 169, 68, 3.6, 3, "dress", 0);
	ellipse(176, 64, 4.6, 5.8, 0, "mug", 0.06);
	ellipse(176, 59, 4.2, 1.4, 0, "cocoa", 0.2);
	limb(181, 61, 183, 66, 1.2, 1.2, "mug", 0.02);
	ellipse(171, 67, 3, 2.8, 0.3, "skin", 0.04);

	// Her green wool shawl round her shoulders, its ends crossed over her bodice.
	ellipse(126, 60, 19, 6.5, 0, "shawl", 0.02, weave);
	limb(116, 62, 132, 80, 4, 3, "shawl", -0.02, weave);
	limb(136, 62, 122, 80, 4, 3, "shawl", 0.04, weave);

	// Her neck, her face, and her grey hair up in a bun.
	limb(126, 48, 126, 55, 3, 3.2, "skin", -0.14);
	ellipse(126, 40, 7.5, 9, 0.05, "skin", 0);
	ellipse(126, 34.5, 8.4, 5.6, 0.05, "hair", 0.02, (x, y) => 0.1 * Math.sin(x * 1.1 + y * 0.4));
	ellipse(128.5, 27, 5.6, 5, 0, "hair", 0.06, (x, y) => 0.12 * Math.sin(Math.hypot(x - 128.5, y - 27) * 1.6));
	limb(119, 38, 117.5, 45, 0.6, 0.5, "hair", 0.1);

	// A knowing smile.
	for (const [x, y] of [
		[124, 46],
		[125, 47],
		[126, 47],
		[127, 47],
		[128, 46],
	]) {
		put(x, y, "skin", 0.12);
	}

	// Her little spectacles: brass rims, the lenses flashing white.
	for (const cx of [122.5, 130]) {
		ellipse(cx, 41.5, 2.6, 2.3, 0, "brass", 0.2);
		ellipse(cx, 41.5, 1.6, 1.4, 0, "glint", 1);
	}

	limb(124.8, 41.5, 127.8, 41.5, 0.5, 0.5, "brass", 0.3);

	// The arm raised, its elbow out, a finger pushing her spectacles up.
	limb(111, 60, 98, 72, 4.2, 3.6, "dress", 0.06);
	limb(98, 72, 117, 46, 3.6, 3, "dress", 0.1);
	ellipse(118.5, 45, 2.8, 2.6, -0.5, "skin", 0.12);
	limb(119.5, 43.5, 125.5, 40.5, 0.8, 0.7, "skin", 0.18);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.25 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 132) / 40) * 0.5,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); her runes: the birch, the hearth's torch, joy, water, home, the seed,
	// the year's turn and gift. ---
	const { canvas, context } = poseScene(["berkano", "kenaz", "wunjo", "laguz", "othala", "ingwaz", "jera", "gebo"]);
	paintFigure(context, colours);

	// The steam off her cocoa, curling up and thinning.
	paintLayer(
		context,
		(keep) => {
			for (const [x0, phase] of [
				[173, 0],
				[178, 2],
			]) {
				for (let y = 56; y > 34; y--) {
					const x = Math.round(x0 + 2.4 * Math.sin((56 - y) * 0.3 + phase) + (56 - y) * 0.12);

					if (hash(x, y) < 0.8 - (56 - y) * 0.025) {
						keep(x, y, "steam", 0.6 - (56 - y) * 0.02);
					}
				}
			}
		},
		RAMPS,
		null,
	);

	return canvas;
}
