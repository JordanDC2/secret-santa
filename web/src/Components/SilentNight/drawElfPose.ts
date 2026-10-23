/**
 * The elf, as the backdrop to choosing who plays (portraitKit.ts; shown out of focus behind the
 * choice): drawn tall and dangerous, struck in a pose as JoJo's heroes strike them. His hips cocked
 * and his legs crossed, his weight on the far one; one hand pulling the brim of his crumpled hat
 * down, its elbow high, his face in its shadow but for his eyes; the other holding the candy cane
 * gun up beside his head. Candlelight from below on the left; behind him the menacing scene the
 * cast share (poseScene.ts).
 */

import { clamp, figure, paintFigure, shade } from "Components/SilentNight/portraitKit";
import { poseScene } from "Components/SilentNight/poseScene";

const RAMPS: Record<string, string[]> = {
	skin: ["#1a100c", "#3a2418", "#5e3c26", "#84583a", "#a87650", "#c8966c"],
	felt: ["#160406", "#30080c", "#520e14", "#7a141e", "#a01e28", "#c03038"],
	fur: ["#2e2a2c", "#4e4848", "#767070", "#9e9894", "#c4beb6"],
	tunic: ["#040c08", "#0a1a10", "#12301c", "#1c4628", "#285e36", "#387a46"],
	hose: ["#060408", "#100c12", "#1c161e", "#2a222c", "#3a303c"],
	leather: ["#120806", "#26140c", "#3e2214", "#5a341e", "#784828"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	cane: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	caneWhite: ["#4a4650", "#7a7480", "#aaa2a8", "#d6ccc8", "#f2e8e0"],
	eye: ["#060406", "#2a1408", "#ffd080"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#b85a3a", "#f08c56", "#ffbe84", "#ffe0c0"],
	felt: ["#b0283a", "#f05a5a", "#ff9a7a", "#ffd0b0"],
	fur: ["#d6ccc8", "#fff4e8", "#ffffff", "#ffffff"],
	tunic: ["#3a6a3a", "#7a9a4a", "#c0c070", "#f0e8a0"],
	hose: ["#5a3a3a", "#8a5a4a", "#c08a64", "#f0c090"],
	leather: ["#c86a30", "#f09a50", "#ffc88a", "#ffe8c0"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	cane: ["#d73648", "#f2666a", "#ff9a8a", "#ffd0c0"],
	caneWhite: ["#fff4e8", "#ffffff", "#ffffff", "#ffffff"],
};

export function drawElfPose(): HTMLCanvasElement {
	const { ellipse, limb, fill, light } = figure(RAMPS, RIM);

	// --- The elf, back to front. ---

	// His hat's tip, blown back behind him to the right, its bobble swinging.
	limb(130, 22, 144, 16.5, 6, 4.2, "felt", -0.06);
	limb(144, 16.5, 153, 20, 4.2, 2.6, "felt", -0.12);
	ellipse(156, 22.5, 3.4, 3.4, 0, "fur", -0.08);

	// His legs in dark hose, crossed: his weight on the far one, straight under his hip; the near one
	// crossing in front of it, its knee bent and its toe pointed down beyond it.
	limb(137, 101, 139, 126, 5.8, 4.8, "hose", -0.12);
	limb(139, 126, 137, 148, 4.8, 3.8, "hose", -0.16);
	ellipse(132.5, 152, 7, 3.8, -0.05, "leather", -0.08);
	limb(126.5, 152.5, 121, 146.5, 2, 0.9, "leather", -0.06);
	limb(122, 104, 131, 127, 5.8, 4.8, "hose", 0.02);
	limb(131, 127, 148, 145.5, 4.8, 3.8, "hose", 0);
	ellipse(152, 149.5, 6.2, 3.5, 0.5, "leather", 0.04);
	limb(157, 152.5, 162.5, 147.5, 2, 0.9, "leather", 0.06);

	// His tunic, belted, flaring to its jagged hem: broad at the shoulders, his hips cocked to the right.
	const hem = (x: number) => 104 + 4 * Math.abs(((x + 2) % 6) / 3 - 1);
	fill(
		58,
		109,
		(y) => {
			const half = y < 63 ? 11 + (y - 58) * 1.2 : y < 86 ? 17 - (y - 63) * 0.26 : 11 + (y - 86) * 0.3;
			const middle = 124.5 + (y - 58) * 0.14;

			return [middle - half, middle + half];
		},
		"tunic",
		(x, y, left, right) => {
			if (y > hem(x)) {
				return null;
			}

			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			// Folds pulled across him by the twist, from his hip up to his shoulder.
			const fold = Math.sin((x - 125) * 0.5 + (y - 80) * 0.35);

			return (
				0.32 -
				0.16 * across +
				0.24 * Math.sqrt(Math.max(0, 1 - across * across)) +
				0.05 * fold -
				(y > hem(x) - 2 ? 0.1 : 0)
			);
		},
	);

	// His shoulders, the near one high with his arm raised.
	ellipse(110.5, 61, 6.4, 5.2, 0.4, "tunic", 0.08);
	ellipse(141.5, 64, 6.2, 5.2, -0.3, "tunic", -0.04);

	// His belt, sloping with his hips, and its brass buckle.
	limb(118.5, 86, 143, 89.5, 2.3, 2.3, "leather", 0.1);
	ellipse(131, 88, 2.4, 2.4, 0, "gold", 0.18);

	// The far arm bent up, its hand gripping the candy cane gun by its hook beside his head, the
	// barrel pointing up, striped red and white.
	limb(142, 64, 160, 78, 4.8, 4, "tunic", -0.06);
	limb(160, 78, 155.5, 59, 4, 3.2, "tunic", -0.02);
	limb(154.5, 58, 151, 64.5, 2.2, 2, "cane", 0.02);

	for (let i = 0; i <= 34; i++) {
		const along = i / 34;
		const cx = 156 + 13 * along;
		const cy = 53 - 30 * along;
		ellipse(cx, cy, 3, 3, 0, Math.floor((cy + 60) / 3.4) % 2 === 0 ? "cane" : "caneWhite", 0.02 - 0.08 * along);
	}

	ellipse(170, 21.5, 3.4, 2.2, 0.4, "caneWhite", 0.1);
	ellipse(154, 56, 3.4, 3, 0.2, "skin", -0.02);

	// His neck, and his head bowed, in the shadow of his hat; his long pointed ears.
	limb(125, 51, 126, 58, 3.2, 3.4, "skin", -0.16);
	ellipse(125, 43, 7.5, 9, 0.12, "skin", -0.1, (_x, y) => -0.22 * clamp((44 - y) / 6));
	limb(118, 44, 100, 40, 2.5, 0.4, "skin", -0.04);
	limb(132, 44, 149, 38.5, 2.5, 0.4, "skin", -0.16);

	// His hat: crumpled felt over a dingy fur brim, pulled low.
	limb(125, 33, 130, 22, 7.4, 6, "felt", 0.02);
	ellipse(125, 35.5, 11.5, 3.3, 0.12, "fur", 0.04);

	// The near arm raised, its elbow high and out, its hand pulling the brim down.
	limb(110, 61, 88, 47, 4.8, 4, "tunic", 0.08);
	limb(88, 47, 110, 37, 4, 3.2, "tunic", 0.12);
	ellipse(113, 35.5, 3.4, 2.8, -0.3, "skin", 0.12);

	for (const [x1, y1, x2, y2] of [
		[111.5, 33.5, 117, 33],
		[112, 35.6, 117.5, 35.2],
	]) {
		limb(x1, y1, x2, y2, 0.8, 0.7, "skin", 0.16);
	}

	// A sharp nose, in the shadow.
	limb(126, 44, 129.5, 49, 1.3, 0.7, "skin", 0.08);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.25 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 132) / 40) * 0.5,
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
