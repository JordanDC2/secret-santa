/**
 * The reindeer, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind
 * the choice): struck in a pose as JoJo's heroes strike them. Rearing up on its hind legs, its
 * forelegs pawing the air; its antlers branching wide; its nose glowing red; its pale shaggy mane
 * under its neck, harness bells hanging at its throat. Candlelight from below on the left; behind
 * it the menacing scene the cast share (poseScene.ts).
 */

import {
	clamp,
	fbm,
	figure,
	hash,
	paintFigure,
	paintGlow,
	paintLayer,
	type ITexture,
} from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	hide: ["#0a0604", "#180e0a", "#281a10", "#3a2818", "#4e3822", "#64482e"],
	mane: ["#221e1a", "#3c3630", "#5c544a", "#7e7466", "#a09684"],
	antler: ["#14100a", "#2e2416", "#52442c", "#7a6a48", "#a49268"],
	velvet: ["#1a0a08", "#341410", "#4e2018"],
	hoof: ["#050406", "#0d0b10", "#18151c", "#26222b"],
	nose: ["#7a1a08", "#d02a22", "#f85a40", "#ffa080"],
	glow: ["#4a0a08", "#7a1410", "#b02018", "#e03424"],
	leather: ["#0e0604", "#1e100a", "#341c10", "#4e2c1a", "#6a3e24"],
	gold: ["#241806", "#44300e", "#664818", "#886224", "#a67c32"],
	eye: ["#060406", "#2a1408", "#ffd080"],
	steam: ["#4a4450", "#6a6470", "#8a8490"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	hide: ["#a85828", "#d88444", "#f8b070", "#ffd8a8"],
	mane: ["#e0c8a8", "#f8e8cc", "#fff8ec", "#ffffff"],
	antler: ["#d8b880", "#f0d8a8", "#fff0d0", "#ffffff"],
	hoof: ["#4a3030", "#76483c", "#a86c50", "#d89870"],
	leather: ["#a85828", "#d88444", "#f8b070", "#ffd8a8"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
};

/** Its coat: hair lying in strokes, grime in it. */
const hair: ITexture = (x, y) =>
	0.07 * Math.sin(x * 0.9 - y * 1.6) + 0.06 * (hash(x, y) - 0.5) - 0.08 * clamp((fbm(x * 0.1, y * 0.1) - 0.55) * 4);
/** Old antler: ridged, rough, stained. */
const rough: ITexture = (x, y) => 0.1 * Math.sin(x * 2 + y * 1.4) + 0.06 * (hash(x, y) - 0.5);

export function drawReindeerPose(): HTMLCanvasElement {
	const { ellipse, limb, petal, light } = figure(RAMPS, RIM);
	// A leg's lower part, thin and jointed, ending in its split hoof.
	const hoof = (x: number, y: number, turn: number, bias: number) => {
		ellipse(x - 1.4, y, 2, 2.2, turn, "hoof", bias);
		ellipse(x + 1.4, y + 0.2, 2, 2.2, turn, "hoof", bias - 0.04);
	};

	// --- The reindeer, back to front. ---

	// Its far antler, branching up and out to the right, rough, tines forward.
	limb(108, 33, 116, 20, 2.6, 2, "antler", -0.1, rough);
	limb(116, 20, 124, 8, 2, 1.1, "antler", -0.12, rough);
	limb(115, 22, 124, 20.5, 1.4, 0.6, "antler", -0.1, rough);
	limb(120, 14, 129, 12.5, 1.2, 0.5, "antler", -0.12, rough);
	limb(110, 30, 117, 28, 1.1, 0.5, "antler", -0.1, rough);

	// Its far legs: the hind one on the ground, its hock bent; the fore one pawing high.
	limb(150, 112, 147, 128, 6.4, 4, "hide", -0.18, hair);
	limb(147, 128, 157, 138, 3, 2.2, "hide", -0.2, hair);
	limb(157, 138, 156, 150, 2, 1.7, "hide", -0.22, hair);
	hoof(156.5, 152.5, 0, -0.08);
	limb(124, 78, 110, 72, 4.8, 3.2, "hide", -0.14, hair);
	limb(110, 72, 101, 81, 2.2, 1.8, "hide", -0.16, hair);
	hoof(99.5, 83, 0.8, -0.06);

	// Its body, rearing up from its haunches: the haunch heavy with muscle, the chest deep, its belly
	// paler underneath; a short white tail, dark on top.
	ellipse(156, 117, 4.2, 3.2, 0.5, "mane", 0.02, hair);
	ellipse(155.5, 115.5, 3, 1.4, 0.5, "hide", -0.1);
	ellipse(134, 92, 27, 15, 0.9, "hide", -0.02, (x, y) => hair(x, y) + 0.18 * clamp((x - y * 0.8 - 36) / 20));
	ellipse(147, 110, 13, 15, 0.5, "hide", -0.02, hair);
	ellipse(120, 79, 11, 12, 0.2, "hide", 0.02, hair);

	// Its near hind leg, bent under it: the thigh's muscle, the hock, the thin cannon down to its hoof.
	limb(144, 114, 136, 130, 7.4, 4.4, "hide", 0, hair);
	limb(136, 130, 146, 140, 3.2, 2.4, "hide", -0.02, hair);
	limb(146, 140, 140, 151, 2.1, 1.7, "hide", -0.04, hair);
	hoof(139.5, 154, 0, 0);

	// Its neck, thick, up from its chest; its pale mane hanging ragged under it; its harness, a
	// thick leather collar, tarnished bells hanging from it.
	limb(118, 74, 106, 44, 9.4, 6.6, "hide", 0.02, hair);

	for (let i = 0; i < 9; i++) {
		const along = i / 8;
		petal(
			109.5 + 8 * along,
			49 + 29 * along,
			10 + 3 * hash(i, 12),
			2.6,
			2.05 - 0.15 * along,
			"mane",
			0.06 - 0.06 * (i % 2),
		);
	}

	limb(104.5, 61.5, 124.5, 66.5, 2.6, 2.6, "leather", 0.06);

	for (const [x, y] of [
		[109, 68],
		[115, 70],
		[121, 70],
	]) {
		ellipse(x, y, 2.4, 2.8, 0, "gold", 0.02);
		limb(x - 1.2, y + 1.6, x + 1.2, y + 1.6, 0.5, 0.5, "hoof", 0);
	}

	// Its head, turned down to the left: long, its muzzle dark, an ear laid back.
	ellipse(100.5, 40.5, 10, 6, -0.35, "hide", 0.04, hair);
	ellipse(93, 44.2, 4.6, 3.6, -0.35, "hide", -0.12, hair);
	petal(110, 36, 7, 2.2, -0.45, "hide", -0.06);

	// Its near antler, branching up and out to the left, rough, tines forward, rags of velvet hanging.
	limb(103, 33, 95, 20.5, 2.8, 2.2, "antler", 0.02, rough);
	limb(95, 20.5, 88, 7, 2.2, 1.2, "antler", 0, rough);
	limb(95.5, 22.5, 85.5, 21.5, 1.5, 0.6, "antler", 0.02, rough);
	limb(91.5, 14.5, 81.5, 11.5, 1.3, 0.5, "antler", 0, rough);
	limb(100.5, 29.5, 92.5, 30.5, 1.2, 0.5, "antler", 0.02, rough);
	limb(86.5, 22, 85.5, 28, 0.6, 0.4, "velvet", 0.1);
	limb(93, 16, 92, 23, 0.6, 0.4, "velvet", 0.06);

	// Its near foreleg, folded: the forearm's muscle, the knee, the thin cannon and its hoof tucked.
	limb(118, 80, 104, 88, 5.4, 3.4, "hide", 0.04, hair);
	limb(104, 88, 106, 100, 2.2, 1.8, "hide", 0.02, hair);
	hoof(106.5, 102.5, 0.2, 0.04);

	// Its nose, glowing red.
	ellipse(90, 45.5, 2.8, 2.6, 0, "nose", 0.5);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.2 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 128) / 40) * 0.55,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); its runes: the elk, the ride, the horse, a god, the aurochs, the sun,
	// Tyr's spear and wealth. ---
	const { canvas, context } = poseScene(["algiz", "raidho", "ehwaz", "ansuz", "uruz", "sowilo", "tiwaz", "fehu"]);
	// The red glow of its nose in the dark.
	paintGlow(context, 90, 45.5, 16, RAMPS.glow, 1);
	paintFigure(context, colours);

	// Its eye, catching the candle; its breath steaming from its nostrils in the cold.
	context.fillStyle = RAMPS.eye[2];
	context.fillRect(101, 38, 1, 1);
	paintLayer(
		context,
		(keep) => {
			for (let i = 0; i < 18; i++) {
				const x = Math.round(86 - i * 0.9);
				const y = Math.round(47 + Math.sin(i * 0.5) * 1.8 - i * 0.25);

				for (let dy = -1; dy <= 1; dy++) {
					if (hash(x, y + dy) < 0.75 - i * 0.035) {
						keep(x, y + dy, "steam", 0.75 - i * 0.03);
					}
				}
			}
		},
		RAMPS,
		null,
	);

	return canvas;
}
