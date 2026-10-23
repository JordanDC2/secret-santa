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
	skin: ["#1c0e0c", "#3c1e18", "#62342a", "#8a4c3c", "#ae6a52", "#cc8a6c"],
	coat: ["#16030a", "#300610", "#520a18", "#781424", "#a01e30", "#c02c3c"],
	fur: ["#2a2828", "#4a4646", "#726c6a", "#9a9490", "#c0bab4"],
	beard: ["#3a3638", "#5e5a5a", "#86807e", "#aea8a2", "#d4cec6", "#f0eae2"],
	black: ["#050406", "#0c0a0e", "#161218", "#221c24", "#2e2830"],
	brass: ["#2a1c08", "#4e3410", "#76501c", "#9a6c2a", "#b8873a"],
	cane: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	caneWhite: ["#4a4650", "#7a7480", "#aaa2a8", "#d6ccc8", "#f2e8e0"],
	eye: ["#060406", "#2a1408", "#ffd080"],
};
// The candle's warm light, low on the left.
const RIM: Record<string, string[]> = {
	skin: ["#b85a3a", "#f08c56", "#ffbe84", "#ffe0c0"],
	coat: ["#b0283a", "#f05a5a", "#ff9a7a", "#ffd0b0"],
	fur: ["#d6ccc8", "#fff4e8", "#ffffff", "#ffffff"],
	beard: ["#e8d0b8", "#fff0dc", "#ffffff", "#ffffff"],
	black: ["#5a3a3a", "#8a5a4a", "#c08a64", "#f0c090"],
	brass: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	cane: ["#d73648", "#f2666a", "#ff9a8a", "#ffd0c0"],
	caneWhite: ["#fff4e8", "#ffffff", "#ffffff", "#ffffff"],
};

/** His beard: untidy locks falling, waving. */
const locks: ITexture = (x, y) => 0.12 * Math.sin(x * 0.8 + 3 * fbm(x * 0.1, y * 0.04)) + 0.06 * (hash(x, y) - 0.5);

export function drawSantaPose(): HTMLCanvasElement {
	const { ellipse, limb, fill, petal, light } = figure(RAMPS, RIM);

	// --- Santa, back to front. ---

	// His hat flopping back behind him, its bobble.
	limb(120, 25, 137, 21, 8, 5.4, "coat", -0.06);
	limb(137, 21, 147, 32, 5.4, 3.2, "coat", -0.12);
	ellipse(149, 36.5, 4.2, 4.2, 0, "fur", -0.06);

	// The candy cane blade over his shoulder, up and away behind him: broad and flat, striped red and
	// white across it, its edge honed bright, its point.
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
			0.04 - 0.1 * along,
		);
		ellipse(cx - 2.6, cy + 1.6, 0.9, 0.9, 0, "caneWhite", 0.3);
	}

	petal(70.5, 12.5, 7, 3.6, blade, "caneWhite", 0.12);

	// His legs, planted wide, in old black boots.
	limb(114, 122, 99, 145, 7.2, 6, "black", 0.04);
	ellipse(94, 151.5, 11, 5, -0.05, "black", 0.08);
	limb(140, 122, 155, 145, 7.2, 6, "black", -0.08);
	ellipse(160, 151.5, 11, 5, 0.05, "black", -0.02);

	// His coat: broad at the shoulders, round over his belly, flaring to its hem.
	const hemAt = 130;
	fill(
		54,
		hemAt,
		(y) => {
			const half =
				y < 60 ? 14 + (y - 54) * 1.6 : y < 92 ? 23.6 + 3 * Math.sin((Math.PI * (y - 60)) / 32) : 24 + (y - 92) * 0.3;
			const middle = 122 + (y - 54) * 0.1;

			return [middle - half, middle + half];
		},
		"coat",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			// His belly, round under the coat; folds hanging from the belt.
			const belly =
				y > 66 && y < 92
					? 0.14 * Math.sqrt(Math.max(0, 1 - ((y - 79) / 13) ** 2)) * Math.sqrt(Math.max(0, 1 - across * across))
					: 0;
			const fold = y > 96 ? ((((x - 126) % 8) + 8) % 8 === 0 ? -0.12 : 0) : 0;

			return 0.3 - 0.18 * across + 0.24 * Math.sqrt(Math.max(0, 1 - across * across)) + belly + fold;
		},
	);

	// The fur trim down the front of his coat and round its hem, gone grey.
	limb(126, 94, 129.4, 128, 3, 3, "fur", 0.02);
	limb(96, 129, 163, 129, 2.8, 2.8, "fur", 0.04);

	// His belt, black, its dull brass buckle.
	limb(102, 92, 150, 92, 3, 3, "black", 0.16);
	fill(
		88,
		96,
		() => [121, 131],
		"brass",
		(x, y) => (x > 122 && x < 130 && y > 89 && y < 95 ? (x === 126 ? 0.3 : null) : 0.5 + (y === 88 ? 0.25 : 0)),
	);

	// The arm thrust out at you, its mitten a fist, the fur cuff gone grey.
	limb(146, 62, 165, 72, 7, 6, "coat", -0.04);
	limb(165, 72, 180, 66, 6, 5, "coat", 0);
	limb(178, 66.5, 183, 64.5, 5.2, 5.2, "fur", 0.04);
	ellipse(189, 63, 6.2, 5.6, 0.2, "coat", 0.1);
	limb(187, 58.5, 192, 60, 1.8, 1.6, "coat", 0.16);

	// His great untidy beard, down over his chest, and his moustache; his face above it, weathered.
	ellipse(121, 44, 9.5, 10.5, 0, "skin", -0.02);
	ellipse(121, 64, 15, 19, 0.06, "beard", 0, locks);
	petal(116, 52, 9, 3.2, 2.7, "beard", 0.08);
	petal(126, 52, 9, 3.2, 0.45, "beard", 0);
	ellipse(121, 50, 2.6, 2.2, 0, "skin", 0.12);

	// His bushy brows, scowling, and his eyes under them, catching the candle.
	limb(113, 40.5, 119, 42.5, 1.8, 1.4, "beard", 0.12);
	limb(123, 42.5, 129, 40.5, 1.8, 1.4, "beard", 0.04);

	// His hat's fur brim, pulled down.
	ellipse(121, 32.5, 13.5, 4.2, -0.05, "fur", 0.04);

	// The arm holding the blade over his shoulder, its mitten round the hooked hilt.
	limb(103, 62, 88, 80, 7, 6, "coat", 0.08);
	limb(88, 80, 101, 67, 6, 5, "coat", 0.12);
	limb(99, 70, 96, 73, 5, 5, "fur", 0.08);
	ellipse(103.5, 64.5, 5.6, 5, -0.4, "coat", 0.18);
	limb(108, 66, 111, 72, 2.4, 2.2, "cane", 0.06);
	limb(111, 72, 108, 76, 2.2, 2, "caneWhite", 0.04);

	// --- Light: the candle, below on the left; the dark below. ---
	const colours = light({
		side: -1,
		reach: (x, y) => clamp(1.25 - Math.hypot(x - 60, y - 150) / 150),
		fade: (_x, y) => clamp((y - 132) / 40) * 0.5,
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
