/**
 * Krampus, of the Alps, as his portrait at his altars (portraitKit.ts): a black-furred demon
 * with great ridged horns, eyes burning, fangs bared round a long red tongue, a chain coiling
 * round him, a cowbell at his hip and a bundle of birch switches raised in his claw. Lit from below by fire, with embers rising
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
	paintSwirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	fur: ["#040306", "#0a080c", "#141016", "#1e1820", "#2a222c", "#382e38"],
	face: ["#100406", "#220a0c", "#3a1214", "#561c1c", "#742a26", "#923a30"],
	horn: ["#0e0a06", "#221a10", "#3a2e1c", "#56462c", "#76623e", "#9a8456"],
	tongue: ["#2a0408", "#560a12", "#8a1420", "#b82434", "#e04050"],
	tooth: ["#4a4440", "#8a8278", "#cac0b0", "#efe6d6"],
	steel: ["#1a1c22", "#34383f", "#5a5f68", "#8a909a", "#c4c8d0"],
	birch: ["#1a1814", "#3a362e", "#6e6658", "#a8a090", "#d8d2c4"],
	brass: ["#140c04", "#2e1e0a", "#523812", "#7a561c", "#a27a2c", "#c89c44"],
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
	brass: ["#d08030", "#f0b050", "#ffd890", "#fff4d0"],
	ribbon: ["#d04040", "#ff7060", "#ffb090", "#ffe0c0"],
};

/** Shaggy fur: matted locks hanging in clumps. */
const shag: ITexture = (x, y) =>
	0.11 * Math.sin(x * 0.7 + 4 * fbm(x * 0.06, y * 0.03)) + 0.06 * fbm(x * 0.3, y * 0.15) + 0.04 * (hash(x, y) - 0.5);
/** His pelt: long locks of goat hair hanging in overlapping rows, each tapering to a point. */
const locks: ITexture = (x, y) => {
	const shifted = x + 1.5 * Math.sin(y * 0.15);
	const column = Math.floor(shifted / 6);
	const along = y + hash(column, 9) * 13;
	const row = Math.floor(along / 13);
	const across = 2 * Math.abs((shifted % 6) / 6 - 0.5);
	const down = (along % 13) / 13;
	const tone = 0.06 * (hash(column, row) - 0.5);

	return (across < 1 - down * 0.7 ? 0.08 * (1 - across) - 0.05 * down : -0.07) + tone + 0.6 * shag(x, y);
};
/** A ragged edge: a jag of up to `size` pixels, changing every couple of rows. */
const jag = (y: number, size: number) => (hash(Math.floor(y / 2), 41) - 0.5) * size;

/** A horn's ridges, ringing it. */
const ridges: ITexture = (x, y) => 0.1 * Math.sin((x + y) * 0.9) + 0.04 * (hash(x, y) - 0.5);
/** Birch bark: pale, with dark marks across it. */
const bark: ITexture = (x, y) => (hash(Math.floor(x / 2), Math.floor(y / 3)) > 0.8 ? -0.35 : 0);

/** Where his claw grips the birch switches. */
const GRIP = { x: 150, y: 84 };

/**
 * Where his chain is, `t` from its bottom (0) to its top (1): a wide, tilted coil climbing slowly
 * at first, so it swings round his side in the clear below his raised arm rather than behind his
 * claw, and steeply after; `z` is how near us it is.
 */
const coilAt = (t: number) => {
	const coil = t * Math.PI * 3.2 + 0.6;
	const reach = (44 + 14 * t) * 1.3;

	return {
		coil,
		x: 92 + Math.cos(coil) * reach,
		y: 160 - 120 * t ** 1.8 + Math.sin(coil) * 20,
		z: Math.sin(coil) * reach,
	};
};

/** The fire below brightening what it reaches. */
const firelight = (_x: number, y: number) => 0.12 * clamp((y - 70) / 80);

export function drawKrampus(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// A chain coiling up round him like a serpent, link after link, out of the dark below to over his shoulder.
	const drawThing = (keep: IPut, { x, y, size: full, angle, front, index }: ISwirlItem) => {
		// Shortened along the chain where it turns away from us, round his sides.
		const size = full * foreshortened[index];

		if (index % 2 === 0) {
			// A link face on: a ring of iron.
			ellipse(x, y, size, full * 0.62, angle, "steel", front ? 0.08 : -0.18, null, keep);
			ellipse(x, y, Math.max(0.5, size - 1.6), Math.max(0.4, full * 0.62 - 1.4), angle, "mouth", 0, null, keep);
		} else {
			// A link edge on: a bar of iron through the rings either side.
			const along = { x: Math.cos(angle), y: Math.sin(angle) };
			limb(
				x - along.x * size,
				y - along.y * size,
				x + along.x * size,
				y + along.y * size,
				0.8,
				0.8,
				"steel",
				(front ? 0.08 : -0.18) + 0.08,
				null,
				keep,
			);
		}
	};
	const foreshortened: number[] = [];
	const things: ISwirlItem[] = Array.from({ length: 76 }, (_, index) => {
		const t = index / 75;
		const here = coilAt(t);
		const ahead = coilAt(t + 0.001);
		const dx = ahead.x - here.x;
		const dy = ahead.y - here.y;
		foreshortened[index] = Math.max(0.35, Math.hypot(dx, dy) / Math.hypot(dx, dy, ahead.z - here.z));

		return {
			x: here.x,
			y: here.y,
			size: 3.4 + t * 1.6,
			angle: Math.atan2(dy, dx),
			front: Math.sin(here.coil) > 0,
			index,
		};
	});

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
			// Hulking shoulders, hunched up round his head, tapering a little below; locks of fur hanging off his sides.
			const half = y < 82 ? 18 + Math.sqrt((y - 70) / 12) * 26 : 44 - (y - 82) * 0.07;
			const hanging = (side: number) => 2.5 * Math.sin(y * 0.45 + side) + jag(y + side * 7, 5);

			return [92 - half - hanging(-1), 92 + half + hanging(1)];
		},
		"fur",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.28 + 0.12 * across + 0.24 * Math.sqrt(Math.max(0, 1 - across * across)) + locks(x, y) + firelight(x, y);
		},
	);
	ellipse(92, 60, 22, 24, 0, "fur", 0.02, shag);

	// His mane, bristling out round his face in shaggy locks.
	for (let i = 0; i < 15; i++) {
		const angle = Math.PI * (0.92 + (i / 14) * 1.16) + (hash(i, 81) - 0.5) * 0.15;
		const length = 9 + hash(i, 82) * 6;
		petal(
			92 + Math.cos(angle) * 18,
			60 + Math.sin(angle) * 20,
			length,
			3.4,
			angle + (hash(i, 83) - 0.5) * 0.4,
			"fur",
			0.06 + hash(i, 84) * 0.06,
			shag,
		);
	}

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

	// Deep sockets under the brow.
	for (const side of [-1, 1]) {
		ellipse(92 + side * 5, 56.5, 4.4, 2.4, -side * 0.25, "face", -0.08);
	}

	// His snout, a ridge down to the nostrils.
	limb(92, 56, 92, 62, 1.6, 2.6, "face", 0.1, firelight);
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

	// A cowbell hanging at his hip on a leather strap, as the Krampus runs ring them: its mouth
	// flared and dark, its clapper hanging out of it.
	limb(74, 90, 66, 120, 1.5, 1.5, "horn", 0.12);
	limb(66, 120, 64, 124, 1.5, 1.5, "horn", 0.12);
	fill(
		123,
		139,
		(y) => {
			const half = 4.5 + (y - 123) * 0.28 + (y > 136 ? (y - 136) * 0.6 : 0);

			return [64 - half, 64 + half];
		},
		"brass",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.22 + 0.22 * across + 0.18 * Math.sqrt(Math.max(0, 1 - across * across)) + 0.05 * (hash(x, y) - 0.5);
		},
	);
	ellipse(64, 123, 4.6, 1.4, 0, "brass", 0.2);
	ellipse(64, 139.5, 7, 1.6, 0, "mouth", 0.1);
	limb(64, 138, 64, 142, 0.6, 0.6, "steel", 0.2);
	ellipse(64, 143, 1.6, 1.5, 0, "steel", 0.28);

	// His claw raised on the right, gripping a bundle of birch switches tied with red.
	limb(124, 82, 146, 104, 8, 6.4, "fur", 0.04, (x, y) => shag(x, y) + firelight(x, y));
	limb(146, 104, 150, 88, 6.4, 5, "fur", 0.08, (x, y) => shag(x, y) + firelight(x, y));

	// Shaggy locks hanging off his arm.
	for (const [x, y] of [
		[136, 98],
		[144, 106],
		[150, 106],
	]) {
		petal(x, y, 9, 2.6, Math.PI / 2 + 0.2, "fur", 0.06, shag);
	}

	// The switches: a bundle of thin birch twigs, of different lengths, crooked, splaying from his
	// grip, some with a fork of a side twig.
	for (let i = 0; i < 14; i++) {
		const spread = (i - 6.5) * 0.045 + (hash(i, 51) - 0.5) * 0.05;
		const length = 40 + hash(i, 52) * 22;
		let x = GRIP.x + (i - 6.5) * 0.3;
		let y = GRIP.y;

		for (let segment = 0; segment < 3; segment++) {
			const turn = spread * (1 + segment * 0.5) + (hash(i, 53 + segment) - 0.5) * 0.12;
			const nx = x + Math.sin(turn) * length * 0.34;
			const ny = y - Math.cos(turn) * length * 0.34;
			const thick = 0.9 - segment * 0.2;
			limb(x, y, nx, ny, thick, thick - 0.15, "birch", (i % 3) * 0.05 - segment * 0.03, bark);

			if (segment === 1 && i % 3 === 0) {
				const side = turn + (i % 2 === 0 ? 0.5 : -0.5);
				limb(nx, ny, nx + Math.sin(side) * 8, ny - Math.cos(side) * 8, 0.5, 0.4, "birch", 0.02, bark);
			}

			x = nx;
			y = ny;
		}
	}

	// Tied with a red ribbon, and his claw round them: knuckles, and long black claws curling over the front.
	ellipse(GRIP.x, GRIP.y - 3, 4.4, 2.2, 0, "ribbon", 0.12);
	limb(GRIP.x + 3, GRIP.y - 3, GRIP.x + 9, GRIP.y + 3, 1.2, 0.8, "ribbon", 0.06);
	ellipse(GRIP.x, GRIP.y + 3, 5.4, 4.6, 0, "face", 0.02, firelight);

	for (const dy of [0, 2.5, 5]) {
		limb(GRIP.x - 3, GRIP.y + 1 + dy, GRIP.x - 6, GRIP.y + 3 + dy, 1, 0.5, "horn", 0.08);
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
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

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
