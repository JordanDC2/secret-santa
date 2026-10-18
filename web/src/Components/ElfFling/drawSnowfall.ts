import type { ICamera, IPalette } from "Components/ElfFling/draw";

/**
 * Gentle snow falling over the scene, for atmosphere: small, faint flakes drifting down and
 * sideways on their own clock (so it snows before a throw too), sliding back a little as the
 * camera pans to feel like they're near. Screen units (pixels). Skipped for anyone who has
 * asked their device for less motion.
 */

/**
 * How far the background (stars, hills, falling snow) scrolls per metre travelled, in pixels,
 * before parallax. Fixed rather than taken from the camera's zoom: on a long run the distance is
 * thousands of metres, so tying it to the zoom made the background lurch whenever it zoomed.
 */
export const BACKGROUND_PIXELS_PER_METRE = 20;

const FLAKES = 60;
/** Each flake's fixed character, from its number: where it starts, how big, fast and near it is. */
const flakes = Array.from({ length: FLAKES }, (_, index) => ({
	x: fraction(index * 12.9898),
	y: fraction(index * 78.233),
	radius: 0.8 + fraction(index * 3.17) * 1.6,
	fallSpeed: 14 + fraction(index * 5.71) * 22,
	sway: 6 + fraction(index * 9.13) * 10,
	// How much it slides past as the camera pans: nearer flakes slide more.
	depth: 0.15 + fraction(index * 2.39) * 0.35,
	alpha: 0.3 + fraction(index * 7.77) * 0.4,
}));

const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** clock is in seconds and keeps running whether or not a throw is under way. */
export function drawSnowfall(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	camera: ICamera,
	size: { width: number; height: number },
	clock: number,
	/** How much snow is falling, 0 to 1: less by day. */
	amount = 1,
) {
	if (reducedMotion) {
		return;
	}

	const { width, height } = size;
	context.fillStyle = palette.white;

	for (const flake of flakes) {
		const pan = camera.left * BACKGROUND_PIXELS_PER_METRE * flake.depth;
		const x = wrap(flake.x * width - pan + Math.sin(clock * 0.8 + flake.x * 20) * flake.sway, width);
		const y = wrap(flake.y * height + clock * flake.fallSpeed, height);

		context.globalAlpha = flake.alpha * amount;
		context.beginPath();
		context.arc(x, y, flake.radius, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = 1;
}

function wrap(value: number, size: number): number {
	return ((value % size) + size) % size;
}

/** A repeatable "random" number in [0, 1) from a seed. */
function fraction(seed: number): number {
	const value = Math.sin(seed) * 43758.5453;

	return value - Math.floor(value);
}
