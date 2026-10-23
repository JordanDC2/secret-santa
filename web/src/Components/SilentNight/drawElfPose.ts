/**
 * The elf, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind the
 * choice): drawn tall and dangerous, struck in a pose as JoJo's heroes strike them. His hips cocked
 * and his legs crossed, his weight on the far one; one hand pulling the brim of his crumpled hat
 * down, its elbow high, his face in its shadow but for his eyes; the other holding the candy cane
 * gun up beside his head. Candlelight from below on the left; behind him the menacing scene the
 * cast share (poseScene.ts).
 */

import { clamp, fbm, figure, hash, paintFigure, shade, type ITexture } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	skin: ["#160c0a", "#301c14", "#4e3020", "#704630", "#946044", "#b47e5c"],
	felt: ["#120304", "#280609", "#460c10", "#681218", "#8a1a20", "#a8262c"],
	fur: ["#221e20", "#3e3a3a", "#605a58", "#86807a", "#aaa49c"],
	tunic: ["#030806", "#08140c", "#0e2214", "#16321e", "#204428", "#2c5834"],
	patch: ["#0a0c04", "#161c08", "#24300e", "#344418", "#465a22"],
	hose: ["#050307", "#0d0a0f", "#18131a", "#241d27", "#322a35"],
	leather: ["#0e0604", "#1e100a", "#341c10", "#4e2c1a", "#6a3e24"],
	wood: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	cane: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	caneWhite: ["#3e3a42", "#6a6470", "#9a929a", "#c6bcba", "#e6dcd4"],
	eye: ["#060406", "#4a1c06", "#ffb040"],
	mouth: ["#0a0404", "#1a0a08", "#2a1410"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#a04a2c", "#d8784a", "#f8a874", "#ffd0a8"],
	felt: ["#a02434", "#d84c4c", "#f8806a", "#ffb898"],
	fur: ["#c8beb8", "#ece2d8", "#fff8f0", "#ffffff"],
	tunic: ["#3a4a26", "#62703a", "#909a58", "#c0c080"],
	patch: ["#4a5428", "#76803c", "#a4a85a", "#d0cc84"],
	hose: ["#4a3030", "#76483c", "#a86c50", "#d89870"],
	leather: ["#a85828", "#d88444", "#f8b070", "#ffd8a8"],
	wood: ["#a86a34", "#d0944c", "#f0c07a", "#fff0c0"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	cane: ["#c02e40", "#e85a60", "#ff9080", "#ffc8b8"],
	caneWhite: ["#f0e4d8", "#fff8f0", "#ffffff", "#ffffff"],
};

/** Coarse old wool: its weave, and grime worked into it in blotches. */
const wool: ITexture = (x, y) =>
	0.05 * Math.sin(x * 1.4 + (y % 2) * 1.6) +
	0.06 * (hash(x, y) - 0.5) -
	0.12 * clamp((fbm(x * 0.12, y * 0.12) - 0.55) * 4);
/** Knitted hose: ribbed. */
const knit: ITexture = (x, y) => 0.05 * Math.sin(x * 2.4 + y * 0.3) + 0.04 * (hash(x, y) - 0.5);
/** Worn leather: creased and scuffed. */
const worn: ITexture = (x, y) => 0.08 * (fbm(x * 0.4, y * 0.4) - 0.5) + 0.05 * (hash(x, y) - 0.5);

/** Where his tunic's ragged hem hangs to. */
const hem = (x: number) => 104 + 3 * Math.abs(((x + 2) % 6) / 3 - 1) + 3 * hash(Math.floor(x / 3), 9);

export function drawElfPose(): HTMLCanvasElement {
	const { put, ellipse, limb, petal, fill, light } = figure(RAMPS, RIM);
	// A crease in cloth: a dark line, lit along one side.
	const crease = (x1: number, y1: number, x2: number, y2: number, material: string, depth = 0.18) => {
		limb(x1, y1, x2, y2, 0.6, 0.5, material, -depth);
		limb(x1 - 0.8, y1 - 0.8, x2 - 0.8, y2 - 0.8, 0.5, 0.4, material, depth * 0.4);
	};

	// --- The elf, back to front. ---

	// His hat's tip, blown back behind him to the right, creased, its bobble swinging.
	limb(130, 22, 144, 16.5, 6, 4.2, "felt", -0.1, wool);
	limb(144, 16.5, 153, 20, 4.2, 2.6, "felt", -0.16, wool);
	ellipse(156, 22.5, 3.6, 3.4, 0, "fur", -0.1, worn);
	crease(136, 18, 139, 24, "felt");

	// His far leg, his weight on it, straight under his hip: thigh, knee, calf and shin in dark ribbed
	// hose, and his boot, worn, its toe curled.
	limb(137, 101, 139, 125, 6.6, 5.2, "hose", -0.14, knit);
	ellipse(139.6, 133, 4.6, 6.2, 0.05, "hose", -0.12, knit);
	limb(139, 128, 137, 147, 4.6, 3.4, "hose", -0.18, knit);
	crease(136, 124, 141, 126, "hose");
	ellipse(132.5, 151.5, 8, 4.2, -0.05, "leather", -0.1, worn);
	limb(125.5, 152.5, 120, 146, 2.2, 0.9, "leather", -0.08);
	limb(126, 155, 139, 155, 1, 1, "leather", -0.3);
	limb(134, 147, 139, 149, 0.9, 0.9, "leather", 0.1);

	// His near leg crossing in front of it: thigh, a patch at the knee, calf, shin; its boot pointed
	// down beyond, strapped.
	limb(122, 104, 131, 126, 6.8, 5.4, "hose", 0, knit);
	ellipse(136.5, 134, 4.4, 5.8, -0.9, "hose", -0.02, knit);
	limb(131, 127, 148, 145, 5, 3.6, "hose", -0.02, knit);
	ellipse(130.5, 126, 3.6, 3.2, 0.4, "leather", 0.06, worn);
	crease(126, 117, 130, 121, "hose");
	crease(142, 141, 146, 139, "hose");
	ellipse(152, 149.5, 7.4, 4, 0.5, "leather", 0.02, worn);
	limb(157.5, 152.5, 163, 147.5, 2.2, 0.9, "leather", 0.04);
	limb(147, 147, 151, 144, 0.9, 0.9, "leather", 0.16);

	// His tunic of coarse old wool, belted: broad at the chest, drawn in at the waist, his hips cocked to
	// the right; folds pulled across him by the twist, a patch sewn on, its hem ragged.
	fill(
		58,
		112,
		(y) => {
			const half = y < 63 ? 12 + (y - 58) * 1.3 : y < 74 ? 18.5 : y < 87 ? 18.5 - (y - 74) * 0.5 : 12 + (y - 87) * 0.32;
			const middle = 124.5 + (y - 58) * 0.14;

			return [middle - half, middle + half];
		},
		"tunic",
		(x, y, left, right) => {
			if (y > hem(x)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const fold = Math.sin((x - 125) * 0.45 + (y - 80) * 0.38);
			// His chest swelling out above the belt, the cloth shadowed under it.
			const chest = y < 82 ? 0.08 * Math.sqrt(Math.max(0, 1 - ((y - 70) / 12) ** 2)) : -0.06;

			return (
				0.28 -
				0.2 * across +
				0.22 * Math.sqrt(Math.max(0, 1 - across * across)) +
				0.06 * fold +
				chest +
				wool(x, y) -
				(y > hem(x) - 2 ? 0.12 : 0)
			);
		},
	);
	fill(
		66,
		75,
		(y) => [131 + (y - 66) * 0.1, 139 + (y - 66) * 0.1],
		"patch",
		(x, y, left, right) =>
			(x === Math.ceil(left) || x === Math.floor(right) || y === 66 || y === 75) && (x + y) % 2 === 0
				? 0.6
				: 0.3 + wool(x, y),
	);

	for (const [x1, y1, x2, y2] of [
		[121, 92, 116, 104],
		[127, 93, 125, 106],
		[133, 92, 137, 105],
		[118, 66, 128, 80],
		[113, 72, 120, 82],
	]) {
		crease(x1, y1, x2, y2, "tunic", 0.14);
	}

	// His shoulders, the near one high with his arm raised.
	ellipse(110.5, 61, 7, 5.8, 0.4, "tunic", 0.06, wool);
	ellipse(141.5, 64, 6.8, 5.8, -0.3, "tunic", -0.06, wool);

	// A bandolier across his chest, peppermint rounds in its loops.
	limb(112, 60, 142, 90, 2, 2, "leather", 0.06, worn);

	for (let i = 0; i < 6; i++) {
		const x = 116 + i * 4.2;
		const y = 64.2 + i * 4.2;
		ellipse(x, y, 1.6, 1.6, 0, i % 2 === 0 ? "cane" : "caneWhite", 0.12);
	}

	// His belt, sloping with his hips, its brass buckle, and a pouch at his hip.
	limb(118.5, 86, 143, 89.5, 2.3, 2.3, "leather", 0.08, worn);
	ellipse(131, 88, 2.4, 2.4, 0, "gold", 0.14);
	ellipse(143.5, 95, 4, 4.6, 0.1, "leather", -0.04, worn);
	limb(140, 91.5, 147, 92.5, 1.2, 1.2, "leather", 0.1);

	// The far arm bent up: its shoulder, upper arm and forearm, the sleeve creased at the elbow, a
	// leather bracer bound round the forearm; its hand round the gun's grip.
	limb(142, 64, 160, 78, 5.8, 4.6, "tunic", -0.08, wool);
	limb(160, 78, 155.5, 60, 4.8, 3.4, "tunic", -0.04, wool);
	crease(157, 74, 162, 75, "tunic");
	crease(155, 77, 159, 80, "tunic");

	for (const y of [64, 67.5, 71]) {
		limb(153, y, 160, y + 1.4, 1.2, 1.2, "leather", 0.02, worn);
	}

	// The candy cane gun, up beside his head: its wooden stock and grip banded in brass, the barrel
	// striped red and white, worn, its muzzle ringed.
	ellipse(155.5, 52, 3.6, 6, -0.4, "wood", 0.02, worn);
	limb(152.5, 56, 150.5, 63, 2, 1.8, "wood", -0.02, worn);

	for (const along of [0, 0.5]) {
		limb(152 + along * 4, 47 + along * 9, 159.5 + along * 4, 50 + along * 9, 0.8, 0.8, "gold", -0.12);
	}

	for (let i = 0; i <= 30; i++) {
		const along = i / 30;
		const cx = 158 + 12 * along;
		const cy = 46 - 24 * along;
		ellipse(
			cx,
			cy,
			3.2,
			3.2,
			0,
			Math.floor((cy + 60) / 3.4) % 2 === 0 ? "cane" : "caneWhite",
			-0.02 - 0.08 * along + worn(cx, cy),
		);
	}

	ellipse(170.5, 21, 3.8, 2.4, 0.4, "gold", -0.14);
	ellipse(170.8, 20.4, 1.6, 1, 0.4, "mouth", 0);

	ellipse(154, 56.5, 3.6, 3.2, 0.2, "skin", -0.04);

	for (const y of [54.6, 56.6, 58.4]) {
		limb(151.6, y, 156.4, y + 0.6, 0.85, 0.75, "skin", 0.04);
	}

	// His neck, sinewy, and his head bowed: a long sharp face, its cheekbones and pointed chin lit from
	// below, the rest in the shadow of his hat; his long pointed ears.
	limb(125, 51, 126, 58, 3.4, 3.6, "skin", -0.18);
	crease(124, 52, 125, 57, "skin", 0.12);
	ellipse(125, 43, 7.2, 9, 0.12, "skin", -0.08, (_x, y) => -0.3 * clamp((45 - y) / 7));
	petal(126, 47, 6, 3.4, 1.75, "skin", -0.08);
	limb(119.5, 46, 123, 49, 1, 0.8, "skin", 0.16);
	limb(118, 44, 100, 40, 2.6, 0.4, "skin", -0.06);
	limb(117, 44, 104, 41.2, 1.1, 0.3, "skin", -0.3);
	limb(132, 44, 149, 38.5, 2.6, 0.4, "skin", -0.18);
	limb(133, 44, 145, 39.8, 1.1, 0.3, "skin", -0.34);

	// A sneer, and a long sharp nose.
	for (const [x, y] of [
		[123, 49],
		[124, 49],
		[125, 49],
		[126, 48],
	]) {
		put(x, y, "mouth", 0.4);
	}

	limb(126, 43, 129.5, 48.5, 1.4, 0.7, "skin", 0.06);

	// His hat: crumpled felt, creased, over a dingy fur brim, pulled low.
	limb(125, 33, 130, 22, 7.4, 6, "felt", -0.02, wool);
	crease(121, 30, 125, 25, "felt");
	crease(128, 31, 131, 25, "felt");
	ellipse(125, 35.5, 11.5, 3.4, 0.12, "fur", 0.02, worn);

	// The near arm raised: its shoulder, its elbow high and out, the sleeve creased; a bracer round the
	// forearm; its hand on the brim, fingers over it, pulling it down.
	limb(110, 61, 88, 47, 5.8, 4.6, "tunic", 0.04, wool);
	limb(88, 47, 110, 37, 4.8, 3.4, "tunic", 0.08, wool);
	crease(90, 50, 94, 47, "tunic");
	crease(92, 45, 96, 44, "tunic");

	for (const x of [100, 103.5, 107]) {
		limb(x, 40.5 + (107 - x) * 0.35, x + 0.6, 45.5 + (107 - x) * 0.35, 1.2, 1.2, "leather", 0.08, worn);
	}

	ellipse(113, 35.6, 3.8, 3, -0.3, "skin", 0.08);

	for (const [x1, y1, x2, y2] of [
		[111.5, 33, 117.5, 32.4],
		[111.8, 34.9, 118, 34.6],
		[112, 36.8, 117.6, 36.8],
	]) {
		limb(x1, y1, x2, y2, 0.85, 0.75, "skin", 0.14);
	}

	limb(111, 38.5, 114.5, 40.5, 0.9, 0.8, "skin", 0.1);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.2 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 128) / 40) * 0.55,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); his runes: hail, ice, gift, the year's turn, elk, thorn, yew and Tyr's spear. ---
	const { canvas, context } = poseScene(["hagalaz", "isa", "gebo", "jera", "algiz", "thurisaz", "eihwaz", "tiwaz"]);
	paintFigure(context, colours);

	// His eyes, glinting under the brim.
	for (const [x, y] of [
		[122, 43],
		[129, 44],
	]) {
		context.fillStyle = RAMPS.eye[2];
		context.fillRect(x, y, 1, 1);
		context.fillStyle = shade(x, y, 0.5, RAMPS.eye);
		context.fillRect(x - 1, y, 1, 1);
	}

	return canvas;
}
