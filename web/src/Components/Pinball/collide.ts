import type { IPoint, ISegment } from "Components/Pinball/table";

/** Pinball's collisions: the ball against walls, bumpers, flippers and other balls. Mutate the ball. */

export type IMovingBall = { x: number; y: number; vx: number; vy: number };

export function closestPoint(p: IPoint, a: IPoint, b: IPoint): IPoint {
	const abx = b.x - a.x;
	const aby = b.y - a.y;
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby)));

	return { x: a.x + abx * t, y: a.y + aby * t };
}

/**
 * Pushes the ball out of a segment it overlaps and bounces it off (restitution `bounce`),
 * adding `kick` straight out from the surface. Returns whether it touched.
 */
export function bounceOffSegment(
	ball: IMovingBall,
	{ a, b }: ISegment,
	radius: number,
	bounce: number,
	kick = 0,
): boolean {
	const closest = closestPoint(ball, a, b);
	const dx = ball.x - closest.x;
	const dy = ball.y - closest.y;
	const distance = Math.hypot(dx, dy);

	if (distance >= radius || distance === 0) {
		return false;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	ball.x = closest.x + nx * radius;
	ball.y = closest.y + ny * radius;
	const into = ball.vx * nx + ball.vy * ny;

	if (into < 0) {
		ball.vx -= (1 + bounce) * into * nx;
		ball.vy -= (1 + bounce) * into * ny;

		if (kick > 0) {
			ball.vx += nx * kick;
			ball.vy += ny * kick;
		}
	}

	return true;
}

/** Solid only to a ball on its upper side (the gate a launched ball passes up through). */
export function bounceOffGate(ball: IMovingBall, gate: ISegment, radius: number): boolean {
	const side = (gate.b.x - gate.a.x) * (ball.y - gate.a.y) - (gate.b.y - gate.a.y) * (ball.x - gate.a.x);

	return side < 0 && bounceOffSegment(ball, gate, radius, 0.4);
}

/** A round bumper kicks the ball straight away from its centre at `kick`, whatever came in. */
export function bounceOffBumper(
	ball: IMovingBall,
	bumper: { x: number; y: number; radius: number },
	radius: number,
	kick: number,
): boolean {
	const dx = ball.x - bumper.x;
	const dy = ball.y - bumper.y;
	const distance = Math.hypot(dx, dy);
	const reach = bumper.radius + radius;

	if (distance >= reach || distance === 0) {
		return false;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	ball.x = bumper.x + nx * reach;
	ball.y = bumper.y + ny * reach;
	ball.vx = nx * kick;
	ball.vy = ny * kick;

	return true;
}

/**
 * A flipper is a rounded bar from its pivot to its tip, turning at `omega`. A moving flipper bats
 * the ball with the bar's own speed where it touches, so the tip hits hardest.
 */
export function bounceOffFlipper(ball: IMovingBall, pivot: IPoint, tip: IPoint, omega: number, reach: number): boolean {
	const closest = closestPoint(ball, pivot, tip);
	const dx = ball.x - closest.x;
	const dy = ball.y - closest.y;
	const distance = Math.hypot(dx, dy);

	if (distance >= reach || distance === 0) {
		return false;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	ball.x = closest.x + nx * reach;
	ball.y = closest.y + ny * reach;
	const surfaceVx = -omega * (closest.y - pivot.y);
	const surfaceVy = omega * (closest.x - pivot.x);
	const relativeVx = ball.vx - surfaceVx;
	const relativeVy = ball.vy - surfaceVy;
	const into = relativeVx * nx + relativeVy * ny;

	if (into < 0) {
		ball.vx = surfaceVx + relativeVx - 1.3 * into * nx;
		ball.vy = surfaceVy + relativeVy - 1.3 * into * ny;
	}

	return true;
}

/** Two balls of the same weight: pushed apart, trading their speeds along the line between them. */
export function bounceBalls(first: IMovingBall, second: IMovingBall, radius: number) {
	const dx = second.x - first.x;
	const dy = second.y - first.y;
	const distance = Math.hypot(dx, dy);

	if (distance >= radius * 2 || distance === 0) {
		return;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	const overlap = (radius * 2 - distance) / 2;
	first.x -= nx * overlap;
	first.y -= ny * overlap;
	second.x += nx * overlap;
	second.y += ny * overlap;
	const closing = (first.vx - second.vx) * nx + (first.vy - second.vy) * ny;

	if (closing > 0) {
		const swap = closing * 0.95;
		first.vx -= swap * nx;
		first.vy -= swap * ny;
		second.vx += swap * nx;
		second.vy += swap * ny;
	}
}
