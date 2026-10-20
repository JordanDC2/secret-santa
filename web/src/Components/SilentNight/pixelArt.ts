/**
 * Silent Night's pixel art, drawn by code in the style La Flor's portrait set (drawLaFlor.ts):
 * shapes write a material and a brightness into a small buffer, then a rim-light pass, a dark
 * outline on the shadowed side and dithered colour ramps turn it into pixels. Sprites are drawn
 * once, into canvases, and reused every frame.
 */

export type IRamps = Record<string, string[]>;

const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** A dithering threshold (0 to 1) for a pixel, from the 4 × 4 Bayer pattern. */
export const threshold = (x: number, y: number) => (BAYER[y & 3][x & 3] + 0.5) / 16;

/** A colour from a ramp for brightness t (0 to 1), dithered only where one shade meets the next. */
export function shade(x: number, y: number, t: number, ramp: string[]): string {
	const v = clamp(t) * (ramp.length - 1);
	const i = Math.floor(v);
	const f = clamp((v - i - 0.5) * 2.4 + 0.5);

	return ramp[Math.min(ramp.length - 1, f > threshold(x, y) ? i + 1 : i)];
}

/** A steady pseudo-random 0–1 for a point. */
export function hash(x: number, y: number): number {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;

	return s - Math.floor(s);
}

/** Smooth value noise, 0–1. */
export function noise(x: number, y: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = hash(xi, yi);
	const b = hash(xi + 1, yi);
	const c = hash(xi, yi + 1);
	const d = hash(xi + 1, yi + 1);

	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Layered noise, 0–1, for fog and texture. */
export function fbm(x: number, y: number): number {
	return noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;
}

/** The key light: dim and cool, from the front left and above. */
const KEY = [-0.5, -0.85];

/**
 * A sprite being drawn: shapes into a material-and-brightness buffer, then `render` lights it
 * and turns it into a canvas.
 */
export class Sprite {
	readonly width: number;
	readonly height: number;
	private readonly materials: Array<string | null>;
	private readonly brightness: Float32Array;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.materials = Array.from({ length: width * height }, () => null);
		this.brightness = new Float32Array(width * height);
	}

	put(x: number, y: number, material: string, t: number) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this.materials[y * this.width + x] = material;
			this.brightness[y * this.width + x] = t;
		}
	}

	/** Clears a pixel (a bite out of something, say). */
	erase(x: number, y: number) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this.materials[y * this.width + x] = null;
		}
	}

	/** A filled ellipse, rotated, shaded as a rounded form. */
	ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, material: string, bias = 0) {
		const c = Math.cos(rot);
		const s = Math.sin(rot);
		const r = Math.ceil(Math.max(rx, ry)) + 1;

		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const dx = x + 0.5 - cx;
				const dy = y + 0.5 - cy;
				const u = (dx * c + dy * s) / rx;
				const v = (-dx * s + dy * c) / ry;
				const d = u * u + v * v;

				if (d <= 1) {
					this.put(x, y, material, lit(u * c - v * s, u * s + v * c, Math.sqrt(1 - d)) + bias);
				}
			}
		}
	}

	/** A limb from one point to another, tapering from r1 to r2. */
	limb(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number, material: string, bias = 0) {
		const lx = x2 - x1;
		const ly = y2 - y1;
		const length2 = Math.max(0.0001, lx * lx + ly * ly);
		const r = Math.max(r1, r2) + 1;

		for (let y = Math.floor(Math.min(y1, y2) - r); y <= Math.max(y1, y2) + r; y++) {
			for (let x = Math.floor(Math.min(x1, x2) - r); x <= Math.max(x1, x2) + r; x++) {
				const px = x + 0.5 - x1;
				const py = y + 0.5 - y1;
				const t = clamp((px * lx + py * ly) / length2);
				const dx = px - lx * t;
				const dy = py - ly * t;
				const radius = r1 + (r2 - r1) * t;
				const d = Math.hypot(dx, dy) / radius;

				if (d <= 1) {
					this.put(x, y, material, lit(dx / radius, dy / radius, Math.sqrt(Math.max(0, 1 - d * d))) + bias);
				}
			}
		}
	}

	/** A filled rectangle at a flat brightness. */
	rect(x: number, y: number, width: number, height: number, material: string, t: number) {
		for (let py = y; py < y + height; py++) {
			for (let px = x; px < x + width; px++) {
				this.put(px, py, material, t);
			}
		}
	}

	/**
	 * Lights the sprite and draws it on a canvas: rim light on the side facing `rimSide` (1 the
	 * right, -1 the left) and from above, a dark outline on the rest. Materials without a rim
	 * colour (glowing eyes, say) aren't rim-lit.
	 */
	render(ramps: IRamps, rims: IRamps, outline: string, rimSide: 1 | -1 = 1, rimStrength = 1): HTMLCanvasElement {
		const { width, height } = this;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d")!;
		const filled = (x: number, y: number) =>
			x >= 0 && x < width && y >= 0 && y < height && this.materials[y * width + x] !== null;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const material = this.materials[y * width + x];

				if (!material) {
					// The outline: the shadowed side (away from the rim light) and below.
					if (filled(x - rimSide, y) || filled(x, y - 1)) {
						context.fillStyle = outline;
						context.fillRect(x, y, 1, 1);
					}

					continue;
				}

				const rimRamp = rims[material];
				const rim = rimRamp && (!filled(x + rimSide, y) || !filled(x, y - 1)) ? rimStrength : 0;
				context.fillStyle =
					rim > 0.5 && rimRamp
						? shade(x, y, 0.55, rimRamp)
						: shade(x, y, this.brightness[y * width + x], ramps[material]);
				context.fillRect(x, y, 1, 1);
			}
		}

		return canvas;
	}
}

function lit(nx: number, ny: number, z: number): number {
	return 0.3 + 0.32 * (nx * KEY[0] + ny * KEY[1]) + 0.28 * z;
}

/** A canvas flipped left to right (sprites are drawn facing right). */
export function flipped(source: HTMLCanvasElement): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = source.width;
	canvas.height = source.height;
	const context = canvas.getContext("2d")!;
	context.translate(source.width, 0);
	context.scale(-1, 1);
	context.drawImage(source, 0, 0);

	return canvas;
}
