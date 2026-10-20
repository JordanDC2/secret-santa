/**
 * Krampus, of the Alps, as his portrait at his altars (portraitKit.ts): a black-furred demon
 * with great ridged horns, eyes burning, fangs bared round a long red tongue, chains across his
 * chest and a bundle of birch switches in his claw. Lit from below by fire, with embers rising
 * through the smoke.
 */

import {
	canvasWith,
	clamp,
	fbm,
	figure,
	hash,
	paintFigure,
	paintLayer,
	shade,
	type ITexture,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	fur: ["#040306", "#0a080c", "#141016", "#1e1820", "#2a222c", "#382e38"],
	face: ["#100406", "#220a0c", "#3a1214", "#561c1c", "#742a26", "#923a30"],
	horn: ["#0e0a06", "#221a10", "#3a2e1c", "#56462c", "#76623e", "#9a8456"],
	tongue: ["#2a0408", "#560a12", "#8a1420", "#b82434", "#e04050"],
	tooth: ["#4a4440", "#8a8278", "#cac0b0", "#efe6d6"],
	steel: ["#1a1c22", "#34383f", "#5a5f68", "#8a909a", "#c4c8d0"],
	birch: ["#1a1814", "#3a362e", "#6e6658", "#a8a090", "#d8d2c4"],
	ribbon: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	mouth: ["#040102", "#0c0204", "#1a0406"],
	burning: ["#a01010", "#ff4020", "#ffb040", "#fff0a0"],
	hell: ["#040102", "#0e0204", "#1e0406", "#320808", "#4a0e08", "#6a180a", "#8a2a0c"],
};
// Firelight from below on the right.
const RIM: Record<string, string[]> = {
	fur: ["#5a2010", "#a04020", "#e07030", "#ffb060"],
	face: ["#a03020", "#e06030", "#ffa050", "#ffd090"],
	horn: ["#c07030", "#f0a050", "#ffd080", "#fff0c0"],
	tongue: ["#e04050", "#ff7060", "#ffa080", "#ffd0b0"],
	tooth: ["#ffd8b0", "#fff0e0", "#ffffff", "#ffffff"],
	steel: ["#d08050", "#f0b080", "#ffe0c0", "#ffffff"],
	birch: ["#d0a070", "#f0c890", "#fff0d0", "#ffffff"],
	ribbon: ["#d04040", "#ff7060", "#ffb090", "#ffe0c0"],
};

/** Shaggy fur: matted locks hanging in clumps. */
const shag: ITexture = (x, y) =>
	0.11 * Math.sin(x * 0.7 + 4 * fbm(x * 0.06, y * 0.03)) + 0.06 * fbm(x * 0.3, y * 0.15) + 0.04 * (hash(x, y) - 0.5);
/** A ragged edge: a jag of up to `size` pixels, changing every couple of rows. */
const jag = (y: number, size: number) => (hash(Math.floor(y / 2), 41) - 0.5) * size;

/** A horn's ridges, ringing it. */
const ridges: ITexture = (x, y) => 0.1 * Math.sin((x + y) * 0.9) + 0.04 * (hash(x, y) - 0.5);
/** Birch bark: pale, with dark marks across it. */
const bark: ITexture = (x, y) => (hash(Math.floor(x / 2), Math.floor(y / 3)) > 0.8 ? -0.35 : 0);

/** The fire below brightening what it reaches. */
const firelight = (_x: number, y: number) => 0.12 * clamp((y - 70) / 80);

export function drawKrampus(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// --- The figure, back to front. ---

	// His horns: long, ridged, sweeping up and back from his brow.
	for (const side of [-1, 1]) {
		const path: Array<[number, number, number]> = [
			[92 + side * 8, 46, 6.6],
			[92 + side * 18, 34, 5.8],
			[92 + side * 28, 24, 4.6],
			[92 + side * 35, 12, 3.4],
			[92 + side * 34, 3, 2.2],
			[92 + side * 29, -2, 0.8],
		];

		for (let i = 0; i < path.length - 1; i++) {
			const [x1, y1, r1] = path[i];
			const [x2, y2, r2] = path[i + 1];
			limb(x1, y1, x2, y2, r1, r2, "horn", side === 1 ? 0.02 : 0.08, ridges);
		}
	}

	// The shaggy black fur of his shoulders and chest, and his mane round his face.
	fill(
		70,
		160,
		(y) => {
			const half = y < 84 ? 18 + (y - 70) * 1.8 : 43.2 + (y - 84) * 0.1;

			return [92 - half + jag(y, 4), 92 + half + jag(y + 7, 4)];
		},
		"fur",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.28 + 0.12 * across + 0.24 * Math.sqrt(Math.max(0, 1 - across * across)) + shag(x, y) + firelight(x, y);
		},
	);
	ellipse(92, 60, 22, 24, 0, "fur", 0.02, shag);

	// His pointed ears, out to the sides.
	petal(80, 52, 13, 3.6, Math.PI + 0.35, "face", -0.02);
	petal(104, 52, 13, 3.6, -0.35, "face", -0.06);

	// His face: long, dark red, a heavy brow over burning eyes.
	ellipse(92, 58, 12.5, 15, 0, "face", 0, firelight);
	ellipse(92, 44, 12, 4, 0, "fur", 0.06, shag);

	// The brow, knotted in a scowl: low over his nose, rising outward.
	for (const side of [-1, 1]) {
		for (let i = 0; i < 7; i++) {
			put(92 + side * (1 + i), 54 - Math.round(i * 0.6), "face", 0.06);
			put(92 + side * (1 + i), 53 - Math.round(i * 0.6), "face", 0.16);
		}
	}

	// His snout and nostrils.
	ellipse(92, 63, 5, 4, 0, "face", 0.12, firelight);
	put(90, 64, "mouth", 0.2);
	put(94, 64, "mouth", 0.2);

	// His mouth gaping: fangs, and his long red tongue hanging out, curling at the tip.
	ellipse(92, 71, 8, 3.4, 0, "mouth", 0.1);

	for (const [dx, length] of [
		[-6, 3],
		[-3, 2],
		[3, 2],
		[6, 3],
	]) {
		for (let i = 0; i < length; i++) {
			put(92 + dx, 68 + i, "tooth", 0.7 - i * 0.1);
		}
	}

	for (const dx of [-5, 5]) {
		put(92 + dx, 74, "tooth", 0.6);
		put(92 + dx, 73, "tooth", 0.7);
	}

	limb(92, 71, 93, 88, 3, 2.4, "tongue", 0.12);
	limb(93, 88, 97, 98, 2.4, 1.8, "tongue", 0.1);
	ellipse(98, 99, 2.6, 2, 0.4, "tongue", 0.14);
	put(92, 75, "tongue", 0.02);
	put(92, 78, "tongue", 0.02);
	put(93, 82, "tongue", 0.04);

	// A goatee of black fur under his jaw.
	petal(92, 72, 16, 5, Math.PI / 2 + 0.05, "fur", 0.04);

	// Chains across his chest, heavy links.
	for (let i = 0; i <= 18; i++) {
		const t = i / 18;
		const x = 54 + t * 76;
		const y = 96 + t * 22 + Math.sin(t * Math.PI) * 8;
		ellipse(x, y, i % 2 === 0 ? 3 : 1.6, i % 2 === 0 ? 2 : 2.6, 0.3, "steel", 0.1);

		if (i % 2 === 0) {
			put(Math.round(x), Math.round(y), "fur", 0.1);
		}
	}

	// His claw raised on the right, gripping a bundle of birch switches tied with red.
	limb(124, 90, 134, 104, 7, 6, "fur", 0.04, (x, y) => shag(x, y) + firelight(x, y));
	limb(134, 104, 138, 86, 6, 5, "fur", 0.06, shag);

	// The switches: a dozen thin twigs, of different lengths, bending a little as they splay.
	for (let i = 0; i < 13; i++) {
		const spread = (i - 6) * 0.05 + (hash(i, 51) - 0.5) * 0.06;
		const length = 46 + hash(i, 52) * 18;
		const bend = (hash(i, 53) - 0.5) * 6;
		const midX = 138 + Math.sin(spread) * length * 0.5 + 3;
		const midY = 84 - Math.cos(spread) * length * 0.5;
		limb(138, 84, midX, midY, 1, 0.8, "birch", 0.05 + (i % 3) * 0.06, bark);
		limb(
			midX,
			midY,
			midX + Math.sin(spread) * length * 0.5 + bend + 3,
			midY - Math.cos(spread) * length * 0.5,
			0.8,
			0.5,
			"birch",
			0.08 + (i % 3) * 0.06,
			bark,
		);
	}

	ellipse(138, 82, 4.2, 2.4, 0, "ribbon", 0.1);
	ellipse(138, 86, 5, 4.4, 0, "face", 0.02, firelight);

	for (const dx of [-3, -1, 1, 3]) {
		put(138 + dx, 89, "horn", 0.6);
		put(138 + dx, 90, "horn", 0.4);
	}

	// --- Light: firelight, from below on the right; a fade into the dark at the very bottom. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp((y - 10) / 90) * clamp((x - 70) / 40),
		fade: (_x, y) => clamp((y - 128) / 32) * 0.45,
		outlineAbove: 140,
	});

	// --- The scene: fire glowing up from below, smoke drifting through it, embers rising. ---
	const { canvas, context } = canvasWith((x, y) => {
		const smoke = fbm(x * 0.03 + 5, y * 0.05 - 3);
		const fire = clamp(1 - Math.hypot((x - 100) / 170, (y - 175) / 125));
		const dark = clamp(1 - Math.abs(x - 110) / 220);

		return shade(x, y, (fire * 0.95 + smoke * 0.3 - 0.12) * dark, RAMPS.hell);
	});

	const embers = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 50; i++) {
					if ((i % 5 === 0) !== front) {
						continue;
					}

					const x = Math.round(hash(i, 31) * 256);
					const y = Math.round(40 + hash(i, 32) * 120);
					const t = 0.4 + hash(i, 33) * 0.6;
					keep(x, y, "burning", t * clamp(y / 120));

					if (front) {
						keep(x, y - 1, "burning", t * 0.6);
					}
				}
			},
			RAMPS,
			null,
		);

	embers(false);
	paintFigure(context, colours);

	// His eyes, burning: slanted slits.
	paintLayer(
		context,
		(keep) => {
			for (const side of [-1, 1]) {
				for (let i = 0; i < 4; i++) {
					keep(92 + side * (3 + i), 56 - Math.round(i * 0.5), "burning", i === 1 ? 1 : 0.75);
				}

				keep(92 + side * 4, 57, "burning", 0.6);
			}
		},
		RAMPS,
		null,
	);
	embers(true);

	return canvas;
}
