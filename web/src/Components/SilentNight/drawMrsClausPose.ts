/**
 * Mrs. Claus, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind the
 * choice): struck in a pose as JoJo's heroes strike them. Her hips cocked, her long red dress and
 * work-worn apron falling to the floor; one hand pushing her spectacles up, the lenses flashing in
 * the candlelight so you can't see her eyes; the other holding out a mug of cocoa, steaming; her
 * green wool shawl round her shoulders, her grey hair up in a bun. Candlelight from below on the
 * left; behind her the menacing scene the cast share (poseScene.ts).
 */

import { clamp, fbm, figure, hash, paintFigure, paintLayer, type ITexture } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	skin: ["#180c0a", "#341a14", "#563024", "#7a4834", "#9c644a", "#b88264"],
	hair: ["#222226", "#3c3c42", "#5e5e64", "#86868c", "#acacb0"],
	dress: ["#0e0206", "#20040c", "#380812", "#520e1a", "#6e1624", "#88202e"],
	apron: ["#2a2620", "#46403a", "#686054", "#8a8172", "#aaa090"],
	shawl: ["#030806", "#08140c", "#0e2214", "#16321e", "#204428", "#2c5834"],
	brass: ["#241806", "#44300e", "#664818", "#886224", "#a67c32"],
	wood: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	mug: ["#2a2630", "#4a4652", "#6e6876", "#948e98", "#b8b2b8"],
	cocoa: ["#140804", "#2a1408", "#42220e", "#5c3418"],
	steam: ["#3a3438", "#5a5258", "#7a7278"],
	glint: ["#8ab0c0", "#d0e8f0", "#ffffff"],
	mouth: ["#0a0404", "#1a0a08", "#2a1410"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#a04a2c", "#d8784a", "#f8a874", "#ffd0a8"],
	hair: ["#c8beb8", "#ece2d8", "#fff8f0", "#ffffff"],
	dress: ["#a02434", "#d84c4c", "#f8806a", "#ffb898"],
	apron: ["#d8c0a0", "#f0dcc0", "#fff4e4", "#ffffff"],
	shawl: ["#3a4a26", "#62703a", "#909a58", "#c0c080"],
	brass: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	wood: ["#a86a34", "#d0944c", "#f0c07a", "#fff0c0"],
	mug: ["#e0d8d0", "#f8f0e8", "#ffffff", "#ffffff"],
};

/** Knitted wool: its rows, and grime worked into it in blotches. */
const knit: ITexture = (x, y) =>
	0.06 * Math.sin(x * 1.5 + (y % 2) * 1.6) +
	0.05 * (hash(x, y) - 0.5) -
	0.1 * clamp((fbm(x * 0.12, y * 0.12) - 0.55) * 4);
/** Old cloth: worn, grime in it. */
const cloth: ITexture = (x, y) => 0.04 * (hash(x, y) - 0.5) - 0.1 * clamp((fbm(x * 0.1 + 3, y * 0.1) - 0.55) * 4);

export function drawMrsClausPose(): HTMLCanvasElement {
	const { put, ellipse, limb, petal, fill, light } = figure(RAMPS, RIM);
	// A crease in cloth or skin: a dark line, lit along one side.
	const crease = (x1: number, y1: number, x2: number, y2: number, material: string, depth = 0.18) => {
		limb(x1, y1, x2, y2, 0.6, 0.5, material, -depth);
		limb(x1 - 0.8, y1 - 0.8, x2 - 0.8, y2 - 0.8, 0.5, 0.4, material, depth * 0.4);
	};
	const middleAt = (y: number) => (y < 86 ? 126 + (y - 56) * 0.05 : 127.5 + Math.min(1, (y - 86) / 20) * 4);

	// --- Mrs. Claus, back to front. ---

	// Her long dress, from her bodice to the floor: fitted to her bust and waist, her hips cocked to the
	// right, the skirt full and falling in deep folds, sooty at its hem.
	fill(
		56,
		156,
		(y) => {
			const half = y < 62 ? 9 + (y - 56) * 1.5 : y < 70 ? 18 : y < 86 ? 18 - (y - 70) * 0.48 : 10.4 + (y - 86) * 0.33;

			return [middleAt(y) - half, middleAt(y) + half];
		},
		"dress",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			// Her bust, lit above, shadowed under.
			const bust = y > 62 && y < 76 ? 0.1 * Math.sin((Math.PI * (y - 62)) / 14) - 0.06 * clamp((y - 72) / 4) : 0;
			// The skirt's folds: deep, rounded, lit along their crests.
			const folds = y > 92 ? 0.12 * Math.sin((x - middleAt(y)) * 0.55 + Math.sin(y * 0.05)) * clamp((y - 92) / 14) : 0;

			return (
				0.26 -
				0.2 * across +
				0.22 * Math.sqrt(Math.max(0, 1 - across * across)) +
				bust +
				folds +
				cloth(x, y) -
				0.16 * clamp((y - 146) / 8)
			);
		},
	);

	// Her boots, worn, peeking out from under her hem.
	ellipse(121, 156.5, 5.8, 2.8, 0, "wood", -0.2);
	ellipse(141, 157, 5.8, 2.8, 0, "wood", -0.24);

	// Her apron over it, old linen yellowed and stained, a pocket with a wooden spoon in it, tied at her
	// waist with a bow at her side.
	fill(
		86,
		143,
		(y) => {
			const half = 10 + (y - 86) * 0.12;

			return [middleAt(y) - half, middleAt(y) + half];
		},
		"apron",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			// Its hem ragged.
			if (y > 139 + 3 * hash(x, 3)) {
				return null;
			}

			const folds = 0.08 * Math.sin((x - middleAt(y)) * 0.6) * clamp((y - 96) / 12);
			const stain = clamp((fbm(x * 0.2 + 9, y * 0.2) - 0.6) * 5) * 0.2;

			return 0.34 - 0.14 * across + 0.18 * Math.sqrt(Math.max(0, 1 - across * across)) + folds + cloth(x, y) - stain;
		},
	);
	limb(116, 86, 140, 87, 2, 2, "apron", 0.08, cloth);
	petal(141, 88, 6, 2.4, 0.9, "apron", 0.02);
	petal(141, 88, 6, 2.4, 1.9, "apron", -0.04);
	limb(130, 98, 138, 111, 1.6, 1.4, "wood", 0.04);
	ellipse(129, 96, 2.6, 2, -0.9, "wood", 0.08);
	fill(
		104,
		116,
		(y) => [128 + (y - 104) * 0.1, 140 + (y - 104) * 0.1],
		"apron",
		(x, y, left, right) =>
			y === 104 ? 0.12 : x === Math.ceil(left) || x === Math.floor(right) ? 0.2 : 0.3 + cloth(x, y),
	);

	// The arm holding out her cocoa: a puffed sleeve, the forearm, a cuff; the stoneware mug in her
	// hand, chipped at its rim, her fingers through its handle.
	ellipse(142, 61, 6, 6.6, -0.5, "dress", -0.02, cloth);
	limb(142, 62, 156, 73, 5, 4, "dress", -0.06, cloth);
	limb(156, 73, 168, 68.5, 4.2, 3.2, "dress", -0.02, cloth);
	crease(153, 70, 157, 74, "dress");
	limb(166, 68.8, 168.5, 67.6, 3.6, 3.4, "apron", 0.06);
	ellipse(176, 64, 4.8, 6, 0, "mug", 0, cloth);
	ellipse(176, 58.6, 4.4, 1.5, 0, "cocoa", 0.2);
	put(179, 58, "mug", 0.1);
	limb(181.5, 61, 183.5, 66, 1.3, 1.3, "mug", -0.04);
	ellipse(171, 66.6, 3.2, 3, 0.3, "skin", 0.02);

	for (const y of [63.6, 65.4, 67.2]) {
		limb(171.5, y, 174.5, y - 0.4, 0.75, 0.65, "skin", 0.08);
	}

	// Her green knitted shawl round her shoulders, thick, its ends crossed over her bodice, its fringe
	// hanging.
	ellipse(126, 60, 20, 7.4, 0, "shawl", 0, knit);
	limb(115, 62, 132, 82, 4.6, 3.2, "shawl", -0.04, knit);
	limb(137, 62, 121, 82, 4.6, 3.2, "shawl", 0.02, knit);

	for (const [x, y] of [
		[119, 84],
		[121.5, 85],
		[124, 84.5],
		[129.5, 84.5],
		[132, 85],
		[134.5, 84],
	]) {
		limb(x, y, x + (hash(x, y) - 0.5) * 1.6, y + 3.5, 0.5, 0.4, "shawl", -0.02);
	}

	// Her neck, her face, lined, a sly smile; her grey hair up in a bun, strands loose, a pin through it.
	limb(126, 48, 126, 55, 3, 3.2, "skin", -0.16);
	ellipse(126, 40, 7.6, 9, 0.05, "skin", -0.02, (_x, y) => 0.06 * clamp((y - 42) / 5));
	petal(126.5, 44, 5, 3.6, 1.6, "skin", -0.04);
	ellipse(
		126,
		34.5,
		8.6,
		5.8,
		0.05,
		"hair",
		0,
		(x, y) => 0.1 * Math.sin(x * 1.1 + y * 0.4) + 0.04 * (hash(x, y) - 0.5),
	);
	ellipse(128.5, 27, 5.8, 5.2, 0, "hair", 0.04, (x, y) => 0.12 * Math.sin(Math.hypot(x - 128.5, y - 27) * 1.6));
	limb(124, 25, 134, 29, 0.6, 0.6, "wood", 0.1);
	limb(119, 38, 117.5, 45, 0.6, 0.5, "hair", 0.08);
	limb(133.5, 37, 135, 43, 0.5, 0.4, "hair", 0.02);
	crease(122.5, 47.5, 123.5, 49, "skin", 0.12);
	crease(130, 47.5, 129, 49, "skin", 0.12);

	for (const [x, y] of [
		[124, 46],
		[125, 47],
		[126, 47],
		[127, 47],
		[128, 46],
		[129, 45],
	]) {
		put(x, y, "mouth", 0.4);
	}

	// Her little spectacles: brass rims, the lenses flaring white across in the candlelight.
	for (const cx of [122.5, 130]) {
		ellipse(cx, 41.5, 2.7, 2.4, 0, "brass", 0.06);
		ellipse(cx, 41.5, 1.7, 1.5, 0, "glint", 0.5, (x, y) => 0.6 * clamp(1 - Math.abs(x - cx + (y - 41.5)) / 1.2) - 0.1);
	}

	limb(124.8, 41.5, 127.8, 41.5, 0.5, 0.5, "brass", 0.14);

	// The arm raised: a puffed sleeve, the elbow out, a cuff; a finger pushing her spectacles up, the
	// rest curled.
	ellipse(110.5, 61, 6, 6.6, 0.5, "dress", 0.04, cloth);
	limb(111, 62, 98, 72, 5, 4, "dress", 0.02, cloth);
	limb(98, 72, 116, 47, 4.2, 3.2, "dress", 0.06, cloth);
	crease(98, 68, 101, 71, "dress");
	limb(114.5, 49.5, 116.5, 47, 3.6, 3.4, "apron", 0.1);
	ellipse(118.5, 45, 3, 2.8, -0.5, "skin", 0.08);
	limb(119.5, 43.5, 125.5, 40.5, 0.8, 0.7, "skin", 0.16);

	for (const [x1, y1, x2, y2] of [
		[118, 46, 121.5, 46.5],
		[117.5, 47.5, 120.5, 48.4],
	]) {
		limb(x1, y1, x2, y2, 0.75, 0.65, "skin", 0.1);
	}

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.2 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 128) / 40) * 0.55,
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
