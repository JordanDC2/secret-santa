import { TABLE, type IPoint } from "Components/Pinball/table";

/**
 * How Christmas pinball's table is seen: in 2.5D, like the old Windows "3D Pinball", the flat
 * table tilted away from the player in perspective (narrower at the far end), with things
 * standing up off it. Under a dot-matrix display across the top. The view is VIEW across and
 * down; the caller scales the context to fit.
 */

export const VIEW = { width: 420, height: 780 };
export const DISPLAY_HEIGHT = 62;
/** Where the table's far edge is drawn; how big a table unit is; how much it's squashed into the distance. */
const TABLE_TOP = 72;
const UNIT = VIEW.width / TABLE.width;
const DEPTH_SQUASH = 0.9;
/** The far end of the table is drawn this much smaller than the near end. */
const FAR_SCALE = 0.78;

/** A point as drawn: where, and how big a table unit is there. */
export type IProjected = { x: number; y: number; scale: number };

/** Where a point on (or `z` above) the table appears: shrunk towards the middle with distance, and lifted by height. */
export function project(x: number, y: number, z = 0): IProjected {
	const scale = UNIT * (FAR_SCALE + (1 - FAR_SCALE) * (y / TABLE.height));

	return {
		x: VIEW.width / 2 + (x - TABLE.width / 2) * scale,
		y: TABLE_TOP + y * UNIT * DEPTH_SQUASH - z * scale * 0.85,
		scale,
	};
}

/** Shadows fall down and to the right, further the higher the thing casting them. */
export function shadowOf(x: number, y: number, z: number): IProjected {
	const ground = project(x, y);

	return { ...ground, x: ground.x + (3 + z * 0.25) * ground.scale, y: ground.y + (2 + z * 0.12) * ground.scale };
}

export function polygon(context: CanvasRenderingContext2D, points: IProjected[]) {
	context.beginPath();
	points.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
	context.closePath();
}

/** A line through the points. */
export function polyline(context: CanvasRenderingContext2D, points: IProjected[]) {
	context.beginPath();
	points.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
	context.stroke();
}

/** A circle lying flat on the table (an ellipse, seen at an angle), `z` above it. */
export function flatCircle(context: CanvasRenderingContext2D, point: IPoint, radius: number, z = 0) {
	const at = project(point.x, point.y, z);
	context.beginPath();
	context.ellipse(at.x, at.y, radius * at.scale, radius * at.scale * DEPTH_SQUASH, 0, 0, Math.PI * 2);
}
