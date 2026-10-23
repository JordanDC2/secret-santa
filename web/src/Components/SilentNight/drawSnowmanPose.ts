/**
 * The snowman, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind
 * the choice): struck in a pose as JoJo's heroes strike them. Three lumpy balls of old snow, grimy
 * at the bottom, leaning back; his forked twig arms flung wide, one high, the other holding up a
 * snow globe; his head thrown back, a crooked coal grin under his carrot nose, his coal eyes
 * glinting cold; his frayed red scarf flying. Candlelight from below on the left; behind him the
 * menacing scene the cast share (poseScene.ts).
 */

import { clamp, fbm, figure, hash, paintFigure, type ITexture } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	snow: ["#181c26", "#2e3446", "#4c5468", "#727c92", "#9ea8ba", "#c8d0dc"],
	ice: ["#2a4a62", "#4a7a98", "#7aaac8", "#b4d8ec"],
	coal: ["#040305", "#0a080c", "#141017", "#201b24", "#2e2834"],
	carrot: ["#220a02", "#481a06", "#70300c", "#9a4a16", "#b8621e"],
	scarf: ["#16030a", "#320710", "#520c18", "#741422", "#961e2e"],
	twig: ["#0c0604", "#1a0e08", "#2c1a0e", "#422816", "#5a3820"],
	glass: ["#0c1824", "#182c40", "#2c4a64", "#5a7e98", "#9cbccc"],
	wood: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	eye: ["#7ac0e8", "#c8ecff", "#ffffff"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	snow: ["#b07a5a", "#d8a07c", "#f4c8a4", "#ffe8d4"],
	ice: ["#e8d0b8", "#fff0dc", "#ffffff", "#ffffff"],
	coal: ["#4a3030", "#76483c", "#a86c50", "#d89870"],
	carrot: ["#d07a34", "#f0a050", "#ffc880", "#ffe8c0"],
	scarf: ["#c02e40", "#e85a60", "#ff9080", "#ffc8b8"],
	twig: ["#a86a34", "#d0944c", "#f0c07a", "#fff0c0"],
	glass: ["#e8f8ff", "#ffffff", "#ffffff", "#ffffff"],
	wood: ["#a86a34", "#d0944c", "#f0c07a", "#fff0c0"],
};

/** Old snow: lumpy, packed and pitted, grime worked into it. */
const lumpy: ITexture = (x, y) =>
	0.12 * (fbm(x * 0.18, y * 0.18) - 0.5) +
	0.05 * (hash(x, y) - 0.5) -
	0.08 * clamp((fbm(x * 0.07 + 5, y * 0.07) - 0.6) * 4);
/** Knitted wool: its rows, and stripes knitted across it. */
const knit: ITexture = (x, y) =>
	0.06 * Math.sin(x * 1.6 + (y % 2) * 1.5) + 0.05 * (hash(x, y) - 0.5) - (Math.floor(x / 4) % 3 === 0 ? 0.12 : 0);
/** Bark: ridged and rough. */
const bark: ITexture = (x, y) => 0.1 * Math.sin(x * 2.2 + y * 1.3) + 0.06 * (hash(x, y) - 0.5);

export function drawSnowmanPose(): HTMLCanvasElement {
	const { ellipse, limb, petal, light } = figure(RAMPS, RIM);
	// Lumps of old snow round a ball's edge, so it isn't round; drips run down it.
	const lumps = (cx: number, cy: number, rx: number, ry: number, count: number, seed: number, bias: number) => {
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2 + hash(i, seed) * 0.7;
			const x = cx + Math.cos(angle) * rx * 0.92;
			const y = cy + Math.sin(angle) * ry * 0.92;
			ellipse(
				x,
				y,
				rx * (0.13 + 0.06 * hash(i, seed + 1)),
				ry * (0.12 + 0.06 * hash(i, seed + 2)),
				angle,
				"snow",
				bias,
				lumpy,
			);
		}
	};
	// A gnarled twig: its branch, bending, and the twigs forking off it.
	const twig = (points: Array<[number, number]>, forks: Array<[number, number, number, number]>, bias: number) => {
		for (let i = 0; i < points.length - 1; i++) {
			const [x1, y1] = points[i];
			const [x2, y2] = points[i + 1];
			limb(x1, y1, x2, y2, 2.2 - i * 0.5, 1.8 - i * 0.5, "twig", bias, bark);
		}

		for (const [x1, y1, x2, y2] of forks) {
			limb(x1, y1, x2, y2, 0.9, 0.4, "twig", bias + 0.02, bark);
		}
	};

	// --- The snowman, back to front. ---

	// His scarf's ends, flying out behind him to the right, knitted in stripes, frayed.
	limb(130, 72, 150, 61, 3.8, 3.2, "scarf", -0.08, knit);
	limb(150, 61, 165, 64, 3.2, 2.6, "scarf", -0.12, knit);

	for (let i = 0; i < 5; i++) {
		limb(164 + i * 0.4, 63 + i * 1.2, 169 + i * 0.9, 64 + i * 2.1, 0.6, 0.4, "scarf", -0.16);
	}

	// His bottom ball: lumpy, grimy, darkest where it sits on the ground; drips run down it.
	ellipse(128, 131, 25, 22, 0, "snow", -0.02, (x, y) => lumpy(x, y) - 0.34 * clamp((y - 134) / 16));
	lumps(128, 131, 25, 22, 7, 11, -0.04);

	for (const x of [114, 121, 133, 141]) {
		limb(x, 112 + hash(x, 3) * 4, x + 0.5, 122 + hash(x, 4) * 8, 0.6, 0.4, "snow", -0.12);
	}

	// His twig arm flung up high: gnarled, forking at its end.
	twig(
		[
			[108, 86],
			[96, 72],
			[84, 58],
		],
		[
			[84, 58, 78, 48],
			[84, 58, 74, 58],
			[92, 67, 86, 70],
			[80, 52, 76, 50],
		],
		0.02,
	);

	// His middle ball, its shadow on the bottom one under it; three coal buttons down it, chunky.
	ellipse(126, 109.5, 16, 3.2, 0, "snow", -0.36);
	ellipse(124, 92, 18, 16, 0, "snow", 0.02, lumpy);
	lumps(124, 92, 18, 16, 6, 21, 0);

	for (const [x, y, turn] of [
		[124.5, 85, 0.4],
		[125.5, 93, -0.6],
		[126.5, 101, 1.1],
	]) {
		ellipse(x, y, 2.1, 1.6, turn, "coal", 0.16);
	}

	// His scarf, wrapped thick round his neck, icicles hanging from it.
	ellipse(121, 73.5, 15, 4.6, -0.08, "scarf", 0.04, knit);

	for (const x of [110, 114, 129]) {
		petal(x, 77, 4 + hash(x, 7) * 3, 1, Math.PI / 2, "ice", 0.2);
	}

	// His head, thrown back: lumpy, pitted.
	ellipse(119, 60, 13, 12, -0.1, "snow", 0.04, lumpy);
	lumps(119, 60, 13, 12, 5, 31, 0.02);

	// His crooked coal grin, chunky, curling up at one end.
	for (const [x, y, turn, size] of [
		[109.5, 64.5, 0.3, 1.4],
		[112.6, 66.6, -0.5, 1.2],
		[116, 67.4, 0.9, 1.5],
		[119.6, 67.1, -0.2, 1.3],
		[122.9, 65.6, 0.6, 1.4],
		[125.4, 62.9, -0.8, 1.2],
	]) {
		ellipse(x, y, size, size * 0.8, turn, "coal", 0.14);
	}

	// His coal eyes, lumps of it, deep in the snow.
	ellipse(113.5, 56, 2.2, 2.4, 0.3, "coal", 0.08);
	ellipse(123, 55, 2.2, 2.4, -0.2, "coal", 0.08);

	// His carrot nose, pointing up and away: gnarled, ringed, bending at its tip.
	limb(118, 60.5, 108, 57, 2.6, 1.4, "carrot", 0.08, (x) => 0.1 * Math.sin(x * 2.2));
	limb(108, 57, 101.5, 53.5, 1.4, 0.4, "carrot", 0.04, (x) => 0.1 * Math.sin(x * 2.2));

	// His other twig arm flung out, gnarled, holding up a snow globe: its wooden base, the glass,
	// a little snowy scene inside.
	twig(
		[
			[140, 88],
			[154, 83],
			[166, 80],
		],
		[
			[166, 80, 170, 84.5],
			[166, 80, 166, 86],
			[152, 84, 156, 90],
		],
		-0.04,
	);
	ellipse(172.5, 87.5, 5.8, 2.4, 0, "wood", -0.08);
	ellipse(172.5, 78, 7.6, 7.6, 0, "glass", 0, (x, y) => 0.2 * clamp(1 - Math.hypot(x - 169.5, y - 74.5) / 3) - 0.1);
	ellipse(172.5, 82.5, 4.6, 1.6, 0, "snow", 0.14);
	limb(173, 81.5, 173, 78, 1.2, 1, "wood", -0.04);
	petal(173, 78.5, 3, 1.8, -Math.PI / 2, "wood", -0.02);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.2 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 128) / 40) * 0.55,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); his runes: ice, need, the yew, water, hail, the thorn, dawn and the aurochs. ---
	const { canvas, context } = poseScene(["isa", "nauthiz", "eihwaz", "laguz", "hagalaz", "thurisaz", "dagaz", "uruz"]);
	paintFigure(context, colours);

	// The snow whirling in his globe, and his coal eyes glinting cold.
	for (const [x, y, t] of [
		[170, 75, 0.9],
		[174, 77, 0.6],
		[171, 80, 0.7],
		[175, 81, 0.9],
		[172, 83, 0.5],
		[113, 55, 1],
		[122, 54, 1],
	]) {
		context.fillStyle = RAMPS.eye[Math.min(2, Math.floor(t * 3))];
		context.fillRect(x, y, 1, 1);
	}

	return canvas;
}
