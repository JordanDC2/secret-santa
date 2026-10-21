/**
 * Mari Lwyd of Wales, as her portrait (portraitKit.ts): a horse's skull on a pole, draped in a
 * white sheet, black cloth ears, bottle-glass eyes glinting in its sockets, its jaw a little
 * open on its teeth, and ribbons of every colour streaming from its head with bells on them.
 * Moonlight from behind, on a cold, misty night, the ribbons blowing in the wind.
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
	swirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	bone: ["#2a2620", "#4e483e", "#7a7264", "#a89e8a", "#d0c8b4", "#ece6d6"],
	socket: ["#040304", "#0a0808", "#141010"],
	sheet: ["#1c1e24", "#3a3e46", "#626872", "#9098a2", "#c0c6ce", "#e4e8ec"],
	cloth: ["#040306", "#0a080c", "#141016", "#201a22"],
	tooth: ["#4a4438", "#8a8070", "#c8bea8", "#ece4d0"],
	red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648"],
	green: ["#06120c", "#163a24", "#326c40", "#4a8a52", "#6aaa6a"],
	blue: ["#0a1020", "#1a2a50", "#2a4a80", "#4a70b0", "#70a0d8"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	glass: ["#0a2a1a", "#1a6a40", "#40c080", "#a0ffd0", "#ffffff"],
	fog: ["#030405", "#080a0c", "#101418", "#1a2026", "#262e36", "#38424c"],
	snow: ["#30383e", "#6a7880", "#b0bcc4", "#e8eef2"],
};
// Moonlight from behind her, high on the right.
const RIM: Record<string, string[]> = {
	bone: ["#c8d0d4", "#eef4f8", "#ffffff", "#ffffff"],
	sheet: ["#b8c4cc", "#e4ecf2", "#ffffff", "#ffffff"],
	cloth: ["#4a5058", "#7a8088", "#a8b0b8"],
	tooth: ["#e8eef2", "#ffffff", "#ffffff"],
	red: ["#c06070", "#e8a0a8", "#ffe0e4"],
	green: ["#80b088", "#b8e0bc", "#f0fff0"],
	blue: ["#8090c0", "#b8c8f0", "#f0f4ff"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
};

/** Old bone: pitted and stained. */
const bone: ITexture = (x, y) => 0.08 * (fbm(x * 0.3, y * 0.3) - 0.5) + 0.05 * (hash(x, y) - 0.5);
/** The sheet's folds, hanging down and swaying. */
const folds: ITexture = (x, y) => 0.1 * Math.sin((x - 82) * 0.42 + y * 0.01) * (1 - clamp((y - 104) / 16));

// The skull's own frame: from the back of its head (SKULL_BACK) to the tips of its teeth (SKULL_TIP).
const SKULL_BACK = { x: 74, y: 40 };
const SKULL_TIP = { x: 142, y: 80 };
const SKULL_LENGTH = Math.hypot(SKULL_TIP.x - SKULL_BACK.x, SKULL_TIP.y - SKULL_BACK.y);
const SKULL_COS = (SKULL_TIP.x - SKULL_BACK.x) / SKULL_LENGTH;
const SKULL_SIN = (SKULL_TIP.y - SKULL_BACK.y) / SKULL_LENGTH;

/** A pixel in the skull's frame: u along it (0 at the back, 1 at the teeth), v across it in pixels (below positive). */
function skullFrame(x: number, y: number): { u: number; v: number } {
	const dx = x + 0.5 - SKULL_BACK.x;
	const dy = y + 0.5 - SKULL_BACK.y;

	return { u: (dx * SKULL_COS + dy * SKULL_SIN) / SKULL_LENGTH, v: -dx * SKULL_SIN + dy * SKULL_COS };
}

/** The pixel at (u, v) in the skull's frame. */
function skullPoint(u: number, v: number): { x: number; y: number } {
	return {
		x: SKULL_BACK.x + u * SKULL_LENGTH * SKULL_COS - v * SKULL_SIN,
		y: SKULL_BACK.y + u * SKULL_LENGTH * SKULL_SIN + v * SKULL_COS,
	};
}

/** Its outline above and below, at points along it: [u, v]. The skull (cranium round at the back, the face long and straight to the muzzle), and the lower jaw (deep and rounded at the back, under the eye). */
const SKULL_TOP: Array<[number, number]> = [
	[0, -5],
	[0.06, -11],
	[0.22, -13],
	[0.45, -9.5],
	[0.75, -7],
	[0.92, -6],
	[1, -3],
];
const SKULL_BOTTOM: Array<[number, number]> = [
	[0, 6],
	[0.08, 9],
	[0.25, 9],
	[0.45, 6.5],
	[0.75, 5.5],
	[0.92, 5.5],
	[1, 3],
];
const JAW_TOP: Array<[number, number]> = [
	[0.17, 5],
	[0.3, 9.5],
	[0.45, 8.5],
	[0.75, 7.5],
	[0.95, 7.5],
	[1, 8.5],
];
const JAW_BOTTOM: Array<[number, number]> = [
	[0.17, 14],
	[0.22, 25],
	[0.3, 25],
	[0.45, 15],
	[0.75, 12],
	[0.95, 11.5],
	[1, 10],
];

/** The outline's [top, bottom] at u, from points along it, or null past its ends. */
function profile(u: number, top: Array<[number, number]>, bottom: Array<[number, number]>): [number, number] | null {
	const at = (points: Array<[number, number]>) => {
		if (u < points[0][0] || u > points[points.length - 1][0]) {
			return null;
		}

		const next = points.findIndex(([pu]) => pu >= u);
		const [u1, v1] = points[Math.max(0, next - 1)];
		const [u2, v2] = points[next];

		return u2 === u1 ? v2 : v1 + ((v2 - v1) * (u - u1)) / (u2 - u1);
	};
	const t = at(top);
	const b = at(bottom);

	return t === null || b === null ? null : [t, b];
}

const EYE = skullPoint(0.24, -4);

export function drawMariLwyd(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// Swirling round her: ribbons torn loose, fluttering along the swirl.
	const drawThing = (keep: IPut, { x, y, size, angle, front, index }: ISwirlItem) => {
		const material = ["red", "green", "blue", "gold"][index % 4];
		const along = { x: Math.cos(angle), y: Math.sin(angle) };
		const point = (t: number) => ({
			x: x + along.x * (t - 0.5) * size * 2.6 - along.y * Math.sin(t * 7) * size * 0.3,
			y: y + along.y * (t - 0.5) * size * 2.6 + along.x * Math.sin(t * 7) * size * 0.3,
		});

		for (let k = 0; k < 6; k++) {
			const a = point(k / 6);
			const b = point((k + 1) / 6);
			limb(a.x, a.y, b.x, b.y, 0.8, 0.8, material, front ? 0.08 : -0.18, null, keep);
		}
	};
	const things = swirl(96, 70, 64, 40, -0.15, 8);

	// --- The figure, back to front. ---

	// Ribbons streaming from the top of her head, blowing back to the left, the far ones behind.
	const ribbon = (index: number, material: string, bias: number) => {
		const points: Array<[number, number]> = [];

		for (let i = 0; i <= 12; i++) {
			const t = i / 12;
			points.push([84 - t * (66 + index * 8), 36 + t * (32 + index * 9) + Math.sin(t * 6 + index * 1.7) * (3 + t * 5)]);
		}

		for (let i = 0; i < points.length - 1; i++) {
			limb(
				points[i][0],
				points[i][1],
				points[i + 1][0],
				points[i + 1][1],
				1.5,
				1.4,
				material,
				bias + Math.sin(i * 0.9 + index) * 0.08,
			);
		}

		// A bell, tied partway along.
		const [bx, by] = points[5 + (index % 4)];
		ellipse(bx, by + 2, 1.8, 1.8, 0, "gold", 0.2);
	};

	["blue", "green", "gold"].forEach((material, index) => ribbon(index + 3, material, -0.12));

	// The sheet, hanging from her skull over whoever carries her, in long folds.
	fill(
		54,
		160,
		(y) => {
			const half = y < 70 ? 12 + (y - 54) * 1.1 : 29.6 + (y - 70) * 0.18;

			return [82 - half, 82 + half];
		},
		"sheet",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.28 + 0.14 * -across + 0.22 * Math.sqrt(Math.max(0, 1 - across * across)) + folds(x, y);
		},
	);

	// Her black cloth ears.
	petal(80, 36, 16, 4.4, -Math.PI / 2 - 0.5, "cloth", 0.1);
	petal(88, 33, 15, 4, -Math.PI / 2 - 0.2, "cloth", 0.02);

	// The skull, drawn along its own length (u, from the back of the head to the teeth) and across
	// it (v, below the line positive): the long straight profile of a horse's skull.
	for (let y = 20; y < 110; y++) {
		for (let x = 60; x < 152; x++) {
			const { u, v } = skullFrame(x, y);
			const upper = profile(u, SKULL_TOP, SKULL_BOTTOM);
			const lower = u > 0.17 ? profile(u, JAW_TOP, JAW_BOTTOM) : null;

			if (upper && v >= upper[0] && v <= upper[1]) {
				const across = ((v - upper[0]) / (upper[1] - upper[0])) * 2 - 1;
				put(x, y, "bone", 0.36 + 0.26 * Math.sqrt(Math.max(0, 1 - across * across)) - 0.14 * across + bone(x, y));
			} else if (lower && v >= lower[0] && v <= lower[1]) {
				const across = ((v - lower[0]) / (lower[1] - lower[0])) * 2 - 1;
				put(x, y, "bone", 0.26 + 0.22 * Math.sqrt(Math.max(0, 1 - across * across)) - 0.16 * across + bone(x, y));
			} else if (lower && u > 0.3 && v > upper![1] && v < lower[0]) {
				// The dark between the jaws, a little open.
				put(x, y, "socket", 0.1);
			}
		}
	}

	// The cheek teeth along the jaws, and the incisors at the end.
	for (let u = 0.42; u < 0.68; u += 0.045) {
		const edge = profile(u, SKULL_TOP, SKULL_BOTTOM)![1];
		const at = skullPoint(u, edge);
		put(Math.round(at.x), Math.round(at.y), "tooth", 0.7);
		put(Math.round(at.x) + 1, Math.round(at.y), "tooth", 0.5);
	}

	for (const [u, v] of [
		[0.985, 2],
		[0.99, 4],
		[0.975, 6],
		[0.96, 9.5],
		[0.95, 11.5],
	]) {
		const at = skullPoint(u, v);
		put(Math.round(at.x), Math.round(at.y), "tooth", 0.75);
	}

	// The ridge along the cheek, lit above and shadowed below; the long notch of the nostril.
	for (let u = 0.28; u < 0.56; u += 0.01) {
		const top = skullPoint(u, 4);
		const below = skullPoint(u, 5.2);
		put(Math.round(top.x), Math.round(top.y), "bone", 0.78);
		put(Math.round(below.x), Math.round(below.y), "bone", 0.12);
	}

	for (let u = 0.7; u < 0.93; u += 0.008) {
		const width = Math.sin(((u - 0.7) / 0.23) * Math.PI) * 2.2;

		for (let v = 0.5 - width; v <= 0.5 + width; v += 0.6) {
			const at = skullPoint(u, v);
			put(Math.round(at.x), Math.round(at.y), "socket", 0.15);
		}
	}

	// The eye socket, set high and far back, ringed with bone.
	ellipse(EYE.x, EYE.y, 7, 5.6, 0.5, "bone", 0.3, bone);
	ellipse(EYE.x, EYE.y, 5.2, 4.2, 0.5, "socket", 0.1);

	// The near ribbons, over her shoulder.
	["red", "green", "red"].forEach((material, index) => ribbon(index, material, 0));

	// --- Light: the moon behind her, high on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 30) / 150) * clamp((x - 40) / 50),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.6,
		outlineAbove: 128,
	});

	// --- The scene: a cold mist under the moon. ---
	const { canvas, context } = canvasWith((x, y) => {
		const mist = fbm(x * 0.025 + 71, y * 0.05);
		const glow = clamp(1 - Math.hypot((x - 190) / 120, (y - 30) / 90));
		const dark = clamp(1 - y / 230) * clamp(1 - Math.abs(x - 130) / 240);

		return shade(x, y, (glow * 0.8 + mist * 0.6 - 0.12) * dark, RAMPS.fog);
	});

	// Snow blowing through, and her glass eye glinting in the dark.
	const snow = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 60; i++) {
					if ((i % 6 === 0) !== front) {
						continue;
					}

					const x = Math.round(hash(i, 81) * 256);
					const y = Math.round(hash(i, 82) * 160);
					keep(x, y, "snow", front ? 0.9 : 0.3 + hash(i, 83) * 0.4);

					if (front) {
						keep(x - 1, y, "snow", 0.6);
					}
				}
			},
			RAMPS,
			null,
		);

	snow(false);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);
	paintLayer(
		context,
		(keep) => {
			ellipse(EYE.x, EYE.y, 2.8, 2.4, 0, "glass", 0.3, null, keep);
			keep(EYE.x - 1, EYE.y - 1, "glass", 1);
		},
		RAMPS,
		null,
	);
	snow(true);

	return canvas;
}
