/**
 * The reindeer, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind
 * the choice): struck in a pose as JoJo's heroes strike them. Rearing up on its hind legs, its
 * forelegs pawing the air; its antlers branching wide; its nose glowing red; its pale shaggy mane
 * under its neck, harness bells hanging at its throat. Candlelight from below on the left; behind
 * it the menacing scene the cast share (poseScene.ts).
 */

import { clamp, figure, paintFigure, paintGlow } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	hide: ["#0c0806", "#1c120c", "#2e1e14", "#44301e", "#5c422a", "#76583a"],
	mane: ["#2a2420", "#4a423a", "#6e665a", "#968c7c", "#bcb2a0"],
	antler: ["#1a140c", "#3a2e1c", "#6a5634", "#9a8256", "#c8b080"],
	hoof: ["#050406", "#0d0b10", "#18151c", "#26222b"],
	nose: ["#7a1a08", "#e0302a", "#ff6a4a", "#ffb08a"],
	glow: ["#4a0a08", "#7a1410", "#b02018", "#e03424"],
	leather: ["#120806", "#26140c", "#3e2214", "#5a341e", "#784828"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	eye: ["#060406", "#2a1408", "#ffd080"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	hide: ["#c86a30", "#f09a50", "#ffc88a", "#ffe8c0"],
	mane: ["#e8d0b8", "#fff0dc", "#ffffff", "#ffffff"],
	antler: ["#e0c080", "#f8e0a8", "#fff4d8", "#ffffff"],
	hoof: ["#5a3a3a", "#8a5a4a", "#c08a64", "#f0c090"],
	leather: ["#c86a30", "#f09a50", "#ffc88a", "#ffe8c0"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
};

export function drawReindeerPose(): HTMLCanvasElement {
	const { ellipse, limb, petal, light } = figure(RAMPS, RIM);

	// --- The reindeer, back to front. ---

	// Its far antler, branching up and out to the right, tines forward.
	limb(108, 33, 116, 20, 2, 1.6, "antler", -0.08);
	limb(116, 20, 124, 9, 1.6, 1, "antler", -0.1);
	limb(115, 22, 123, 21, 1.2, 0.6, "antler", -0.08);
	limb(120, 14.5, 128, 14, 1, 0.5, "antler", -0.1);

	// Its far legs: the hind one on the ground, the fore one pawing high.
	limb(150, 112, 147, 128, 5, 3.6, "hide", -0.16);
	limb(147, 128, 157, 138, 3, 2.4, "hide", -0.18);
	limb(157, 138, 156, 151, 2.2, 2, "hide", -0.2);
	ellipse(156.5, 153, 3.4, 2.2, 0, "hoof", -0.06);
	limb(124, 78, 110, 72, 4, 3, "hide", -0.12);
	limb(110, 72, 101, 81, 2.6, 2.2, "hide", -0.14);
	ellipse(99.5, 82.5, 2.8, 2.2, 0.8, "hoof", -0.04);

	// Its body, rearing up from its haunches, a short white tail; its near hind leg, bent under it.
	ellipse(156, 117, 4, 3, 0.5, "mane", 0.06);
	ellipse(134, 92, 27, 13, 0.9, "hide", 0, (x, y) => 0.18 * clamp((x - y * 0.8 - 38) / 20));
	limb(144, 114, 136, 130, 6, 4, "hide", 0);
	limb(136, 130, 146, 140, 3.4, 2.6, "hide", -0.02);
	limb(146, 140, 140, 152, 2.4, 2, "hide", -0.04);
	ellipse(139, 154.5, 3.6, 2.2, 0, "hoof", 0.04);

	// Its neck, up from its chest, its pale shaggy mane under it, and its harness, bells hanging.
	limb(118, 74, 106, 44, 8, 5.4, "hide", 0.04);
	for (let i = 0; i < 7; i++) {
		const along = i / 6;
		petal(110 + 7 * along, 50 + 27 * along, 9, 2.6, 2.1 - 0.15 * along, "mane", 0.08 - 0.05 * (i % 2));
	}
	limb(105, 62, 123, 66, 1.8, 1.8, "leather", 0.08);

	for (const [x, y] of [
		[109, 67],
		[115, 69],
		[121, 69],
	]) {
		ellipse(x, y, 2.2, 2.6, 0, "gold", 0.12);
	}

	// Its head, turned down to the left, an ear back.
	ellipse(100, 41, 9, 5.6, -0.35, "hide", 0.06);
	limb(110, 36, 115, 33, 2.4, 1, "hide", -0.04);

	// Its near antler, branching up and out to the left, tines forward.
	limb(103, 33, 94, 20, 2.2, 1.7, "antler", 0.04);
	limb(94, 20, 88, 8, 1.7, 1, "antler", 0.02);
	limb(95, 22, 87, 22, 1.2, 0.6, "antler", 0.04);
	limb(91, 14.5, 83, 13, 1, 0.5, "antler", 0.02);
	limb(101, 30, 95, 31, 1, 0.5, "antler", 0.04);

	// Its near foreleg, folded, its hoof tucked.
	limb(118, 80, 104, 88, 4.4, 3.2, "hide", 0.06);
	limb(104, 88, 106, 101, 2.6, 2.2, "hide", 0.04);
	ellipse(106.5, 103, 2.8, 2.2, 0.2, "hoof", 0.08);

	// Its nose, glowing red.
	ellipse(91.5, 45, 2.6, 2.4, 0, "nose", 0.6);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.25 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 132) / 40) * 0.5,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); its runes: the elk, the ride, the horse, a god, the aurochs, the sun,
	// Tyr's spear and wealth. ---
	const { canvas, context } = poseScene(["algiz", "raidho", "ehwaz", "ansuz", "uruz", "sowilo", "tiwaz", "fehu"]);
	// The red glow of its nose in the dark.
	paintGlow(context, 91.5, 45, 16, RAMPS.glow, 1);
	paintFigure(context, colours);

	// Its eye, catching the candle.
	context.fillStyle = RAMPS.eye[2];
	context.fillRect(101, 38, 1, 1);

	return canvas;
}
