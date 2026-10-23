/**
 * Santa, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind the
 * choice): huge and weathered, struck in a pose as JoJo's heroes strike them. Planted wide in his
 * old black boots, leaning back; the candy cane blade over his shoulder in one mitten, the other
 * thrust out at you; his hat flopping back, his great untidy beard over his coat, its fur gone grey.
 * Candlelight from below on the left; behind him the menacing scene the cast share (poseScene.ts).
 */

import { clamp, fbm, figure, hash, paintFigure, shade, type ITexture } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	skin: ["#160a08", "#321612", "#542a20", "#7a4030", "#9c5a44", "#b8765a"],
	nose: ["#2a0c0a", "#521814", "#7c2a20", "#a44030", "#c45a44"],
	coat: ["#100206", "#24040c", "#3e0812", "#5c0e1a", "#7c1624", "#981e2e"],
	patch: ["#1a0a08", "#341410", "#522018", "#702e22", "#8e3e2e"],
	fur: ["#1e1c1c", "#383434", "#585250", "#7a7470", "#9c9690"],
	beard: ["#2e2a2a", "#4e4846", "#746c66", "#9a928a", "#bcb4aa", "#d8d0c4"],
	black: ["#040305", "#0a080c", "#141016", "#1e1820", "#2a2228"],
	brass: ["#241806", "#44300e", "#664818", "#886224", "#a67c32"],
	grip: ["#0e0604", "#1e100a", "#341c10", "#4e2c1a", "#6a3e24"],
	cane: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	caneWhite: ["#3e3a42", "#6a6470", "#9a929a", "#c6bcba", "#e6dcd4"],
	eye: ["#060406", "#4a1c06", "#ffb040"],
	mouth: ["#0a0404", "#1a0a08", "#2a1410"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#a04a2c", "#d8784a", "#f8a874", "#ffd0a8"],
	nose: ["#c04a3a", "#e87058", "#ffa080", "#ffd0b8"],
	coat: ["#a02434", "#d84c4c", "#f8806a", "#ffb898"],
	patch: ["#a04a34", "#d0704c", "#f0a070", "#ffd0a8"],
	fur: ["#c8beb8", "#ece2d8", "#fff8f0", "#ffffff"],
	beard: ["#e0c8a8", "#f8e8cc", "#fff8ec", "#ffffff"],
	black: ["#4a3030", "#76483c", "#a86c50", "#d89870"],
	brass: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	grip: ["#a85828", "#d88444", "#f8b070", "#ffd8a8"],
	cane: ["#c02e40", "#e85a60", "#ff9080", "#ffc8b8"],
	caneWhite: ["#f0e4d8", "#fff8f0", "#ffffff", "#ffffff"],
};

/** His beard: untidy locks falling, waving. */
const locks: ITexture = (x, y) => 0.12 * Math.sin(x * 0.8 + 3 * fbm(x * 0.1, y * 0.04)) + 0.06 * (hash(x, y) - 0.5);
/** Heavy old wool: its weave, and grime worked into it in blotches. */
const wool: ITexture = (x, y) =>
	0.04 * Math.sin(x * 1.3 + (y % 2) * 1.6) +
	0.05 * (hash(x, y) - 0.5) -
	0.12 * clamp((fbm(x * 0.11, y * 0.11) - 0.55) * 4);
/** Fur trim gone grey and matted: tufts. */
const matted: ITexture = (x, y) => 0.1 * Math.sin(y * 1.7 + x * 0.5) + 0.08 * (hash(x, y) - 0.5);
/** Old leather: creased and scuffed. */
const worn: ITexture = (x, y) => 0.08 * (fbm(x * 0.4, y * 0.4) - 0.5) + 0.05 * (hash(x, y) - 0.5);

export function drawSantaPose(): HTMLCanvasElement {
	const { put, ellipse, limb, fill, petal, light } = figure(RAMPS, RIM);
	// A crease in cloth or skin: a dark line, lit along one side.
	const crease = (x1: number, y1: number, x2: number, y2: number, material: string, depth = 0.18) => {
		limb(x1, y1, x2, y2, 0.6, 0.5, material, -depth);
		limb(x1 - 0.8, y1 - 0.8, x2 - 0.8, y2 - 0.8, 0.5, 0.4, material, depth * 0.4);
	};

	// --- Santa, back to front. ---

	// His hat flopping back behind him, creased, its bobble matted.
	limb(120, 25, 137, 21, 8, 5.4, "coat", -0.1, wool);
	limb(137, 21, 147, 32, 5.4, 3.2, "coat", -0.16, wool);
	ellipse(149, 36.5, 4.4, 4.2, 0, "fur", -0.08, matted);
	crease(130, 20, 133, 26, "coat");

	// The candy cane blade over his shoulder, up and away behind him: broad and flat, striped red and
	// white across it, nicked and worn, its edge honed bright, its point.
	const blade = Math.atan2(-50, -32);

	for (let i = 0; i <= 44; i++) {
		const along = i / 44;
		const cx = 102 - 32 * along;
		const cy = 62 - 50 * along;
		ellipse(
			cx,
			cy,
			3.8,
			1.9,
			blade + Math.PI / 2,
			Math.floor((cy + 80) / 3.6) % 2 === 0 ? "cane" : "caneWhite",
			-0.04 - 0.1 * along + 0.6 * worn(cx, cy),
		);

		// Its edge, honed bright but for a nick here and there.
		if (hash(i, 31) > 0.12) {
			ellipse(cx - 2.6, cy + 1.6, 0.9, 0.9, 0, "caneWhite", 0.26);
		}
	}

	petal(70.5, 12.5, 7, 3.6, blade, "caneWhite", 0.08);

	// His legs, planted wide: trousers of black wool bunched over old black boots, their tops turned
	// down, scuffed.
	limb(114, 122, 100, 142, 8, 6.6, "black", 0.02, wool);
	crease(103, 136, 108, 139, "black");
	ellipse(97, 143, 7.6, 3.4, -0.1, "black", 0.1, worn);
	limb(97.5, 144, 96, 149, 6.4, 6.4, "black", 0.04, worn);
	ellipse(94, 152, 11.5, 5, -0.05, "black", 0.06, worn);
	limb(84, 156, 104, 156, 1.2, 1.2, "black", -0.3);
	limb(140, 122, 154, 142, 8, 6.6, "black", -0.1, wool);
	crease(147, 134, 151, 139, "black");
	ellipse(157, 143, 7.6, 3.4, 0.1, "black", -0.02, worn);
	limb(156.5, 144, 158, 149, 6.4, 6.4, "black", -0.06, worn);
	ellipse(160, 152, 11.5, 5, 0.05, "black", -0.04, worn);
	limb(150, 156, 170, 156, 1.2, 1.2, "black", -0.3);

	// His coat of heavy old wool, grimy: broad at the shoulders, round over his belly, flaring to its
	// hem, leaning back with him; a patch sewn on.
	const hemAt = 130;
	fill(
		54,
		hemAt,
		(y) => {
			const half =
				y < 60 ? 14 + (y - 54) * 1.6 : y < 92 ? 23.6 + 3.6 * Math.sin((Math.PI * (y - 60)) / 32) : 24 + (y - 92) * 0.3;
			const middle = 122 + (y - 54) * 0.1;

			return [middle - half, middle + half];
		},
		"coat",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			// His belly, round under the coat, lit from above on the left and shadowed under.
			const belly =
				y > 64 && y < 94
					? (0.18 - 0.1 * across - 0.14 * clamp((y - 82) / 10)) *
						Math.sqrt(Math.max(0, 1 - ((y - 79) / 15) ** 2)) *
						Math.sqrt(Math.max(0, 1 - across * across))
					: 0;

			return (
				0.26 -
				0.2 * across +
				0.22 * Math.sqrt(Math.max(0, 1 - across * across)) +
				belly +
				wool(x, y) -
				(y > 120 ? 0.06 : 0)
			);
		},
	);
	fill(
		104,
		113,
		(y) => [107 + (y - 104) * 0.05, 117 + (y - 104) * 0.05],
		"patch",
		(x, y, left, right) =>
			(x === Math.ceil(left) || x === Math.floor(right) || y === 104 || y === 113) && (x + y) % 2 === 0
				? 0.55
				: 0.28 + wool(x, y),
	);

	// Heavy folds in the skirt of it, falling from his belt.
	for (const [x1, y1, x2, y2] of [
		[108, 98, 103, 126],
		[116, 98, 113, 127],
		[137, 98, 141, 127],
		[145, 97, 152, 126],
	]) {
		crease(x1, y1, x2, y2, "coat", 0.16);
	}

	// The fur trim down the front of his coat and round its hem, gone grey and matted, fraying.
	limb(126, 94, 129.4, 128, 3.2, 3.2, "fur", 0, matted);
	limb(96, 129, 163, 129, 3, 3, "fur", 0.02, matted);

	for (let x = 98; x <= 161; x += 4 + Math.floor(hash(x, 4) * 3)) {
		limb(x, 131, x + (hash(x, 5) - 0.5) * 2, 131.5 + hash(x, 6) * 2, 0.7, 0.4, "fur", -0.16);
	}

	// His belt, sagging under his belly, and its big dull brass buckle.
	for (let x = 101; x <= 150; x++) {
		const sag = 2.6 * Math.sin((Math.PI * (x - 101)) / 49);

		for (let dy = -2; dy <= 2; dy++) {
			put(x, Math.round(92 + sag + dy), "black", 0.3 - Math.abs(dy) * 0.06 + worn(x, dy));
		}
	}

	fill(
		90,
		98,
		() => [120, 131],
		"brass",
		(x, y) =>
			x > 121 && x < 129 && y > 91 && y < 97 ? (x === 125 ? 0.3 : null) : 0.42 + (y === 90 ? 0.2 : 0) + worn(x, y),
	);

	// The arm thrust out at you: his shoulder, his thick arm in its sleeve, creased at the elbow; the
	// fur cuff gone grey; his mitten a fist, its thumb over his knuckles.
	ellipse(146, 61, 8.4, 7, -0.3, "coat", -0.04, wool);
	limb(146, 62, 165, 72, 7.8, 6.4, "coat", -0.06, wool);
	limb(165, 72, 180, 66, 6.6, 5.4, "coat", -0.02, wool);
	crease(162, 69, 166, 74, "coat");
	crease(167, 69, 168, 75, "coat");
	limb(178, 66.5, 183, 64.5, 6, 6, "fur", 0.02, matted);
	ellipse(189.5, 63, 6.8, 6, 0.2, "coat", 0.06, wool);
	limb(186.5, 58, 193, 59.5, 2, 1.8, "coat", 0.14, wool);

	for (const y of [61, 64.5]) {
		crease(191, y, 195, y + 0.6, "coat", 0.12);
	}

	// His great untidy beard, down over his chest, darker underneath, stray locks at its edges; his
	// moustache, bushy; his face above it, weathered: deep-set eyes under a scowl, his nose red and
	// bulbous, the lines at his eyes.
	ellipse(121, 44, 9.8, 10.5, 0, "skin", -0.04, (_x, y) => -0.26 * clamp((40 - y) / 6));
	ellipse(121, 64, 15.5, 19.5, 0.06, "beard", -0.02, (x, y) => locks(x, y) - 0.16 * clamp((y - 70) / 14));

	for (const [x, y, angle] of [
		[107, 66, 2.2],
		[109, 76, 1.9],
		[134, 68, 1.0],
		[132, 78, 1.25],
		[115, 82, 1.65],
		[127, 82, 1.5],
	]) {
		petal(x, y, 7, 1.6, angle, "beard", -0.04);
	}

	petal(117, 52, 10, 3.6, 2.75, "beard", 0.08);
	petal(125, 52, 10, 3.6, 0.4, "beard", -0.02);
	ellipse(121, 49.5, 3.2, 2.7, 0, "nose", 0.04);
	put(120, 48, "nose", 0.7);
	limb(112.5, 40.5, 119.5, 42.8, 2.2, 1.6, "beard", 0.08, locks);
	limb(122.5, 42.8, 129.5, 40.5, 2.2, 1.6, "beard", 0.02, locks);
	crease(113, 45, 115, 46.5, "skin", 0.14);
	crease(127, 46.5, 129, 45, "skin", 0.14);

	// His hat's fur brim, matted, pulled down.
	ellipse(121, 32.5, 13.8, 4.4, -0.05, "fur", 0.02, matted);

	// The arm holding the blade over his shoulder: his shoulder, his arm creased at the elbow, the fur
	// cuff; his mitten round the leather-wrapped grip, the blade's brass guard above it and its
	// hooked pommel below.
	ellipse(104, 60, 8.4, 7, 0.3, "coat", 0.06, wool);
	limb(103, 62, 88, 80, 7.8, 6.4, "coat", 0.04, wool);
	limb(88, 80, 101, 67, 6.6, 5.4, "coat", 0.08, wool);
	crease(87, 76, 91, 79, "coat");
	limb(99, 70, 96, 73, 5.6, 5.6, "fur", 0.06, matted);
	limb(99, 60.5, 108, 66, 1.4, 1.4, "brass", 0.06, worn);
	ellipse(104, 65.5, 5.8, 5.2, -0.4, "coat", 0.14, wool);
	limb(108, 67, 111, 72, 2.4, 2.2, "cane", 0.04);
	limb(111, 72, 108, 76, 2.2, 2, "caneWhite", 0.02);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.2 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 128) / 40) * 0.55,
		outlineAbove: 160,
	});

	// --- The scene (poseScene.ts); his runes: gift, home, the sun, Tyr's spear, dawn, the year's turn,
	// wealth and hail. ---
	const { canvas, context } = poseScene(["gebo", "othala", "sowilo", "tiwaz", "dagaz", "jera", "fehu", "hagalaz"]);
	paintFigure(context, colours);

	// His eyes, glinting under his brows.
	for (const [x, y] of [
		[117, 44],
		[125, 44],
	]) {
		context.fillStyle = RAMPS.eye[2];
		context.fillRect(x, y, 1, 1);
		context.fillStyle = shade(x, y, 0.5, RAMPS.eye);
		context.fillRect(x - 1, y, 1, 1);
	}

	return canvas;
}
