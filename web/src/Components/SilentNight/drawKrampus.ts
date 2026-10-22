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
	leather: ["#120a06", "#24140c", "#3a2214", "#56341e", "#744a2c"],
	ribbon: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
	mouth: ["#040102", "#0c0204", "#1a0406"],
	claw: ["#060406", "#16100e", "#2e2420", "#4e403a", "#7a685c"],
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
	leather: ["#a05a30", "#d08048", "#f0b070", "#ffe0b0"],
};

/** Shaggy fur: matted locks hanging in clumps. */
const shag: ITexture = (x, y) =>
	0.11 * Math.sin(x * 0.7 + 4 * fbm(x * 0.06, y * 0.03)) + 0.06 * fbm(x * 0.3, y * 0.15) + 0.04 * (hash(x, y) - 0.5);
/** His body's half-width at each row: hulking shoulders hunched up round his head, tapering a little below. */
const bodyHalf = (y: number) => (y < 82 ? 18 + Math.sqrt(Math.max(0, y - 70) / 12) * 26 : 44 - (y - 82) * 0.07);

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

/** His fist: his skin's shades (1–5, dark to light) and his claws' (a–d). */
const FIST = [
	"........c345554.",
	"...cd44443333353",
	"..bb.2333334443.",
	"..a..1111111111.",
	"..cd444444555553",
	".bb.23333334443.",
	".a..11111111111.",
	"...cd44444555553",
	"..bb.2333334443.",
	"..a..1111111111.",
	"....cd444555553.",
	"...bb.23334443..",
	"...a..1111122222",
	"...........22222",
];

/** The ribbon round his switches: its shades, 1–5, dark to light. */
const RIBBON = [
	"...................",
	"2233344444.........",
	"1122233333.........",
	"........345........",
	"22333444445........",
	"11222333332433.....",
	"...........5443....",
	"............43.43..",
	".............43.43.",
	"..............3..3.",
	".............22..22",
	".............23..23",
	".............23..2.",
	".............22....",
	".............2.....",
];

const gauss = (d: number) => Math.exp(-d * d);

/** His face's half-width at each row: broadest at his cheekbones, narrowing to his pointed chin. */
const faceHalf = (y: number) => (y <= 58 ? 11.5 + (y - 44) * 0.035 : 12 - (y - 58) * 0.42 - Math.max(0, y - 76) * 0.25);

/**
 * How far his face's features stand out of it at (u, v), across it from its middle (-1 to 1) and
 * down it (the brow near -0.3, the tip of his nose 0.37, his chin 1), carved like an old Krampus
 * mask: a heavy brow knotted low over his nose, deep sockets, sharp cheekbones over sunken cheeks,
 * a long hooked nose wrinkled in a snarl, deep snarl lines down to his mouth, a pointed chin.
 */
function relief(u: number, v: number): number {
	const across = Math.abs(u);
	// The brow, knotted low over his nose and rising outward.
	const brow = -0.2 - 0.3 * Math.min(1, across / 0.7);
	// The snarl lines, from his nostrils down to the corners of his mouth.
	const along = clamp(((across - 0.14) * 0.34 + (v - 0.4) * 0.26) / (0.34 ** 2 + 0.26 ** 2));
	const snarl = Math.hypot(across - 0.14 - 0.34 * along, v - 0.4 - 0.26 * along);
	const wrinkles = [0.02, 0.09, 0.16].reduce((sum, at) => sum + gauss((v - at) / 0.018), 0) * gauss(u / 0.09);

	return (
		0.55 * gauss((v - brow) / 0.07) * clamp((0.85 - across) / 0.15) -
		(v < -0.12 && v > -0.6 ? 0.35 * gauss(u / 0.035) : 0) -
		0.55 * gauss(Math.hypot((across - 0.36) / 0.16, (v - brow - 0.12) / 0.08)) +
		0.4 * gauss(Math.hypot((across - 0.58) / 0.13, (v - 0.02) / 0.09)) -
		0.32 * gauss(Math.hypot((across - 0.48) / 0.13, (v - 0.32) / 0.13)) +
		0.38 * gauss(u / 0.07) * clamp((v + 0.18) / 0.08) * clamp((0.38 - v) / 0.06) +
		0.45 * gauss(Math.hypot(u / 0.12, (v - 0.37) / 0.07)) +
		0.15 * gauss(Math.hypot((across - 0.12) / 0.06, (v - 0.38) / 0.05)) -
		0.3 * gauss(snarl / 0.03) +
		0.15 * gauss(Math.hypot(u / 0.5, (v - 0.5) / 0.05)) +
		0.35 * gauss(Math.hypot(u / 0.18, (v - 1.05) / 0.12)) -
		0.18 * wrinkles
	);
}

/** How far his face's features stand out at the pixel position (x, y). */
const reliefAt = (x: number, y: number) => relief((x - 92) / 12, (y - 60) / 18);

/**
 * The light on his carved face at (x, y): what stands out catching it and what's sunk in shadow,
 * the undersides of his features lit by the fire below, his face darker towards its edges and
 * under his hair, warmer on the fire's side.
 */
function carved(x: number, y: number): number {
	const u = (x + 0.5 - 92) / 12;
	const v = (y + 0.5 - 60) / 18;
	const under = (reliefAt(x + 0.5, y - 0.5) - reliefAt(x + 0.5, y + 1.5)) / 2;

	return (
		0.5 +
		0.85 * reliefAt(x + 0.5, y + 0.5) +
		0.6 * under -
		0.2 * u * u -
		0.12 * Math.max(0, -v) +
		0.06 * u +
		0.035 * (fbm(x * 0.5, y * 0.5) - 0.5) +
		0.02 * (hash(x, y) - 0.5)
	);
}

/** His upper lip, drawn up in a snarl over his fangs, and his lower lip, sagging open: a wide mouth. */
const upperLip = (x: number) => 69.4 - 1.5 * Math.exp(-(((Math.abs(x - 92) - 3.6) / 1.3) ** 2)) + 0.05 * (x - 92) ** 2;
const lowerLip = (x: number) => 75.6 - 0.1 * (x - 92) ** 2;

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

	// His body under his pelt: hulking shoulders hunched up round his head, tapering a little below.
	fill(
		70,
		160,
		(y) => {
			const hanging = (side: number) => 2.5 * Math.sin(y * 0.45 + side) + jag(y + side * 7, 5);

			return [92 - bodyHalf(y) - hanging(-1), 92 + bodyHalf(y) + hanging(1)];
		},
		"fur",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.2 + 0.1 * across + 0.2 * Math.sqrt(Math.max(0, 1 - across * across)) + shag(x, y) + firelight(x, y);
		},
	);

	// His pelt: long locks of black goat hair layered from his shoulders down in tiers, like a
	// Krampus's coat, each lock its own length and shade, spreading a little as they fall; those at
	// his sides breaking his outline; the fire catching them from below.
	for (let tier = 0; tier < 6; tier++) {
		const y = 72 + tier * 14;
		const half = bodyHalf(y);
		const count = Math.round(half / 3.2);

		for (let i = 0; i <= count; i++) {
			const across = (i / count) * 2 - 1;
			const x = 92 + across * (half + 2) + (hash(i, tier + 71) - 0.5) * 3;
			petal(
				x,
				y + (hash(i, tier + 72) - 0.5) * 4,
				20 + hash(i, tier + 73) * 12,
				3.2 + hash(i, tier + 74) * 2,
				Math.PI / 2 - across * 0.18 + (hash(i, tier + 75) - 0.5) * 0.12,
				"fur",
				0.02 + hash(i, tier + 76) * 0.08 + firelight(x, y) * 0.8 - tier * 0.01,
			);
		}
	}

	// Stray locks sticking out along his right flank at odd lengths and angles, the fire catching
	// them, ragging his outline.
	for (let y = 84; y < 158; y += 5 + Math.floor(hash(y, 91) * 4)) {
		if (hash(y, 95) < 0.25) {
			continue;
		}

		petal(
			92 + bodyHalf(y) + 2 + hash(y, 96) * 2,
			y,
			8 + hash(y, 91) * 10,
			1.6 + hash(y, 92) * 1.2,
			Math.PI / 2 - (0.4 + hash(y, 93) * 0.7),
			"fur",
			0.04 + hash(y, 94) * 0.06 + firelight(132, y),
		);
	}

	// His hair: long black goat hair hanging from his crown like a hood, falling past his face and
	// down over his shoulders, flaring a little as it falls; ragged tufts round the roots of his horns.
	ellipse(92, 50, 17, 13, 0, "fur", 0.04, shag);

	for (const side of [-1, 1]) {
		for (let j = 0; j < 5; j++) {
			petal(
				92 + side * (7 + j * 2.8),
				40 + j * 3,
				30 + j * 4 + hash(j, side + 61) * 6,
				4 + hash(j, side + 62),
				Math.PI / 2 - side * (0.1 + j * 0.05),
				"fur",
				0.03 + hash(j, side + 63) * 0.06,
			);
		}
	}

	for (const [x, angle, length] of [
		[84, -Math.PI / 2 - 0.55, 8],
		[89, -Math.PI / 2 - 0.15, 7],
		[95, -Math.PI / 2 + 0.2, 8],
		[100, -Math.PI / 2 + 0.6, 7],
	]) {
		petal(x, 41, length, 2.4, angle, "fur", 0.08);
	}

	// His ears: a devil's, long and pointed, sweeping out and up from under his hair to a sharp
	// tip, dark inside.
	for (const side of [-1, 1]) {
		const bias = side === -1 ? 0.02 : -0.02;
		limb(92 + side * 10, 54, 92 + side * 18, 48.5, 4.2, 2.4, "face", bias);
		limb(92 + side * 18, 48.5, 92 + side * 24.5, 41, 2.4, 0.3, "face", bias + 0.04);
		limb(92 + side * 11.5, 53.6, 92 + side * 18.6, 49, 2, 1, "face", -0.26);
	}

	// His face, carved like an old Krampus mask (relief, carved): long and gaunt, a heavy brow
	// knotted low over his nose, deep sockets, sharp cheekbones over sunken cheeks, a long hooked
	// nose, deep snarl lines down to his mouth, his chin pointed; lit from below by the fire, dimly
	// from the front left.
	fill(
		44,
		84,
		(y) => {
			const half = faceHalf(y);

			return half > 0 ? [92 - half, 92 + half] : null;
		},
		"face",
		(x, y) => carved(x, y),
	);

	for (const side of [-1, 1]) {
		ellipse(92 + side * 1.6, 67.6, 0.9, 0.6, 0, "mouth", 0.1);
	}

	// His mouth gaping in a snarl, wide, his lip drawn up over long yellowed fangs, his few teeth worn.
	fill(
		66,
		77,
		(y) => {
			let left = 999;
			let right = -999;

			for (let x = 84; x <= 100; x++) {
				if (y >= upperLip(x + 0.5) && y <= lowerLip(x + 0.5)) {
					left = Math.min(left, x);
					right = Math.max(right, x);
				}
			}

			return left <= right ? [left, right] : null;
		},
		"mouth",
		(x, y) => (y >= upperLip(x + 0.5) && y <= lowerLip(x + 0.5) ? 0.15 + 0.3 * clamp((y - 70) / 5) : null),
	);

	for (const side of [-1, 1]) {
		const fang = 92 + side * 3.6;
		limb(fang, upperLip(fang) - 0.4, fang - side * 0.6, upperLip(fang) + 5, 1, 0.3, "tooth", 0.22);
		const low = 92 + side * 4.6;
		limb(low, lowerLip(low) + 0.4, low - side * 0.3, lowerLip(low) - 3, 0.8, 0.3, "tooth", 0.12);
	}

	for (const [dx, length] of [
		[-1.6, 1.4],
		[0.2, 1.8],
		[1.8, 1.2],
	]) {
		const x = 92 + dx;
		limb(x, upperLip(x) - 0.2, x, upperLip(x) + length, 0.5, 0.4, "tooth", -0.08 - length * 0.04);
	}

	// A ragged fringe of hair over his brow, and locks of it falling down over the edges of his face.
	ellipse(92, 42, 13, 4.6, 0, "fur", 0.06, shag);

	for (const [x, length] of [
		[81.5, 7],
		[85, 5],
		[88.5, 4],
		[95.5, 4.5],
		[99, 5.5],
		[102.5, 7.5],
	]) {
		petal(x, 43.5, length, 2.4, Math.PI / 2 + (x - 92) * 0.02, "fur", 0.08);
	}

	for (const side of [-1, 1]) {
		petal(92 + side * 11.8, 47, 30, 3.4, Math.PI / 2 - side * 0.06, "fur", side === -1 ? 0.06 : 0.1);
	}

	// His long, pointed goat beard, hanging from his chin.
	petal(92, 79, 30, 5, Math.PI / 2 + 0.03, "fur", 0.05);
	petal(89, 77, 22, 2.6, Math.PI / 2 + 0.12, "fur", 0.02);
	petal(95, 77, 22, 2.6, Math.PI / 2 - 0.08, "fur", 0.07);

	// His long red tongue, out over his lip and down over his beard, a groove down it, curling at the tip.
	limb(92, 72, 92.6, 80, 2.8, 2.6, "tongue", 0.12);
	limb(92.6, 80, 94, 90, 2.6, 2.1, "tongue", 0.1);
	limb(94, 90, 96.6, 96.6, 2.1, 1.7, "tongue", 0.1);
	ellipse(97.8, 98, 2.4, 1.8, 0.5, "tongue", 0.14);
	limb(92.4, 73.5, 93.4, 83, 0.45, 0.45, "tongue", -0.14);
	limb(93.4, 83, 94.4, 90, 0.45, 0.4, "tongue", -0.14);

	// A cowbell hanging at his hip from his chain on a broad leather strap (the strap, looped over
	// a link, is painted over the chain below): hammered brass, tall and boxy, a flat face between
	// narrower sides, square shoulders, its mouth dark across the bottom and its clapper hanging out
	// of it, resting against his pelt, its shadow in the fur beside it.
	ellipse(66.5, 131, 8, 11, 0, "fur", -0.2, shag);
	ellipse(64, 119, 2.4, 1.8, 0, "brass", 0.2);
	ellipse(64, 119, 1, 0.7, 0, "mouth", 0);
	fill(
		121,
		139,
		(y) => {
			const half = 5.4 + (y - 121) * 0.12 - (y < 123 ? (123 - y) * 0.9 : 0);

			return [64 - half, 64 + half];
		},
		"brass",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;
			const hammered = 0.06 * (hash(Math.floor(x / 2), Math.floor(y / 2)) - 0.5);

			// The face, flat and evenly lit with a sheen down it; dark seams at its edges; the sides
			// turned away, the right one towards the fire.
			if (Math.abs(across) < 0.5) {
				return (Math.abs(across + 0.2) < 0.1 ? 0.7 : 0.52) - 0.1 * ((y - 121) / 18) + hammered;
			}

			return (Math.abs(across) < 0.64 ? 0.12 : across < 0 ? 0.28 : 0.38) + hammered;
		},
	);
	fill(
		137,
		139,
		(y) => [57.6 - (y - 137) * 0.2, 70.4 + (y - 137) * 0.2],
		"brass",
		(x) => (x < 64 ? 0.42 : 0.34),
	);
	ellipse(64, 140, 6.4, 1.1, 0, "mouth", 0.1);
	limb(64, 139, 64, 142, 0.6, 0.6, "steel", 0.2);
	ellipse(64, 143, 1.6, 1.5, 0, "steel", 0.28);

	// His claw raised on the right, gripping a bundle of birch switches tied with red.
	limb(124, 82, 146, 104, 8, 6.4, "fur", 0.04, (x, y) => shag(x, y) + firelight(x, y));
	limb(146, 104, 154, 90, 6.4, 4.4, "fur", 0.08, (x, y) => shag(x, y) + firelight(x, y));

	// Long locks of his pelt hanging off his arm.
	for (const [x, y, length] of [
		[128, 90, 13],
		[134, 96, 14],
		[140, 101, 13],
		[146, 106, 12],
		[152, 103, 10],
	]) {
		petal(x, y, length, 2.8, Math.PI / 2 + 0.18, "fur", 0.06 + firelight(x, y));
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

	// The butts of the switches, poking out below his fist.
	for (const dx of [-1.2, 0, 1.2]) {
		limb(GRIP.x - 1 + dx, 90, GRIP.x - 0.6 + dx * 1.3, 95, 0.8, 0.7, "birch", 0.04, bark);
	}

	// His fist round them, raised as a torch is, painted pixel by pixel (FIST): the back of his hand
	// towards the fire, four fingers curled round the bundle one above another, knuckled, each
	// ending in a black claw hooked down off its tip, and his thumb laid over the top.
	FIST.forEach((row, y) => {
		[...row].forEach((letter, x) => {
			if (letter !== ".") {
				const claw = "abcd".indexOf(letter);
				put(GRIP.x - 8 + x, GRIP.y - 4 + y, claw < 0 ? "face" : "claw", claw < 0 ? Number(letter) / 5 : (claw + 1) / 4);
			}
		});
	});

	// The red ribbon binding them, painted pixel by pixel (RIBBON) and lit by hand rather than
	// rim-lit, which would turn so thin a thing pink: twice round the bundle above his fist,
	// knotted, its two ends hanging out past his knuckles, twisting to show their darker backs.
	RIBBON.forEach((row, y) => {
		[...row].forEach((step, x) => {
			if (step !== ".") {
				put(GRIP.x - 5 + x, GRIP.y - 10 + y, "ribbon", Number(step) / 5);
			}
		});
	});

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

	// The cowbell's strap, looped over a link of his chain and hanging down in front of it to the
	// bell's loop, a brass buckle on it.
	paintLayer(
		context,
		(keep) => {
			ellipse(65.2, 103.4, 1.7, 1.2, 0, "leather", 0.16, null, keep);
			limb(65.2, 103.6, 64.4, 117.6, 1.4, 1.3, "leather", 0.08, null, keep);
			limb(65.4, 103.8, 65.2, 107, 0.5, 0.5, "leather", -0.12, null, keep);

			for (const [x, y, t] of [
				[64, 110, 0.75],
				[65, 110, 0.6],
				[64, 111, 0.5],
				[65, 111, 0.3],
			]) {
				keep(x, y, "brass", t);
			}
		},
		RAMPS,
		null,
	);

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
