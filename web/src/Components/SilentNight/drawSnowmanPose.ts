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
	snow: ["#141824", "#2a3246", "#4a566e", "#76849c", "#a6b2c6", "#d4dcea"],
	coal: ["#050406", "#0d0b10", "#18151c", "#26222b", "#3a3440"],
	carrot: ["#2a0e04", "#5a2008", "#8a3a10", "#b85a1c", "#d87a2c"],
	scarf: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	twig: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	glass: ["#102030", "#203c58", "#406a8a", "#80a8c0", "#c8e4f0"],
	eye: ["#7ac0e8", "#c8ecff", "#ffffff"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	snow: ["#c88a64", "#f0b48a", "#ffd8b8", "#fff0e0"],
	coal: ["#5a3a3a", "#8a5a4a", "#c08a64", "#f0c090"],
	carrot: ["#e08a40", "#ffb060", "#ffd090", "#fff0c8"],
	scarf: ["#d73648", "#f2666a", "#ff9a8a", "#ffd0c0"],
	twig: ["#c08040", "#e0b060", "#f8d890", "#fff0c8"],
	glass: ["#e8f8ff", "#ffffff", "#ffffff", "#ffffff"],
};

/** Old snow: lumpy, packed and pitted. */
const lumpy: ITexture = (x, y) => 0.14 * (fbm(x * 0.18, y * 0.18) - 0.5) + 0.05 * (hash(x, y) - 0.5);

export function drawSnowmanPose(): HTMLCanvasElement {
	const { ellipse, limb, light } = figure(RAMPS, RIM);

	// --- The snowman, back to front. ---

	// His scarf's ends, flying out behind him to the right, frayed.
	limb(130, 72, 150, 61, 3.6, 3, "scarf", -0.06);
	limb(150, 61, 165, 64, 3, 2.4, "scarf", -0.1);

	for (let i = 0; i < 4; i++) {
		limb(164 + i * 0.4, 64 + i * 1.2, 170 + i * 0.8, 65 + i * 2, 0.6, 0.4, "scarf", -0.12);
	}

	// His bottom ball, grimy where it sits on the ground.
	ellipse(128, 130, 25, 22, 0, "snow", 0, (x, y) => lumpy(x, y) - 0.3 * clamp((y - 136) / 16));

	// His twig arm flung up high, forked at the end.
	limb(108, 86, 84, 58, 1.8, 1.1, "twig", 0.04);
	limb(84, 58, 78, 49, 1.1, 0.6, "twig", 0.06);
	limb(84, 58, 75, 59, 1, 0.5, "twig", 0.04);
	limb(93, 69, 88, 74, 0.8, 0.5, "twig", 0.02);

	// His middle ball, three coal buttons down it.
	ellipse(124, 92, 18, 16, 0, "snow", 0.04, lumpy);

	for (const [x, y] of [
		[124.5, 85],
		[125.5, 93],
		[126.5, 101],
	]) {
		ellipse(x, y, 1.8, 1.6, 0, "coal", 0.2);
	}

	// His scarf, wrapped round his neck.
	ellipse(121, 73.5, 14.5, 4.2, -0.08, "scarf", 0.06, (x) => 0.06 * Math.sin(x * 0.9));

	// His head, thrown back.
	ellipse(119, 60, 13, 12, -0.1, "snow", 0.06, lumpy);

	// His crooked coal grin, curling up at one end.
	for (const [x, y] of [
		[109.5, 64.5],
		[112.5, 66.5],
		[116, 67.2],
		[119.5, 67],
		[122.8, 65.6],
		[125.4, 63],
	]) {
		ellipse(x, y, 1.3, 1.2, 0, "coal", 0.16);
	}

	// His coal eyes.
	ellipse(113.5, 56, 2, 2.2, 0, "coal", 0.12);
	ellipse(123, 55, 2, 2.2, 0, "coal", 0.12);

	// His carrot nose, pointing up and away.
	limb(118, 60.5, 102, 54.5, 2.4, 0.5, "carrot", 0.1, (x) => 0.08 * Math.sin(x * 2.2));

	// His other twig arm flung out, holding up a snow globe: glass, a little snowy scene inside.
	limb(140, 88, 166, 80, 1.8, 1.1, "twig", -0.04);
	limb(166, 80, 170, 84, 1, 0.6, "twig", -0.02);
	limb(166, 80, 166, 85.5, 1, 0.6, "twig", -0.04);
	ellipse(172.5, 87.5, 5.5, 2.2, 0, "twig", -0.1);
	ellipse(172.5, 78, 7.5, 7.5, 0, "glass", 0.02);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.25 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 132) / 40) * 0.5,
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
