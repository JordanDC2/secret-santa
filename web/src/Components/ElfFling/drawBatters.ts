import type { IPalette } from "Components/ElfFling/draw";
import { drawCharacter } from "Components/ElfFling/drawFlyers";
import { REINDEER_X, SWEET_SPOT_Y, SWING_CONTACT_TIME, SWING_DURATION } from "Components/ElfFling/physics";
import type { IBatterId } from "Components/ElfFling/skins";

/**
 * Whoever's swinging the candy cane: the reindeer, or one of the flyers' characters drawn big.
 * Every batter swings from the same shoulder point, level with the bat's sweet spot, so the
 * timing never changes with the look. World units (metres, y up).
 */

const BOOT = "#3b2416";
const COAL = "#1c120b";

/**
 * How each character stands at the plate: drawn this many times life size, shifted back
 * (left) this far so the swinging arm comes out of its shoulder rather than in front of its
 * face, with these arms. The snowman is drawn bigger so its arm comes from between its
 * snowballs.
 */
const BIG_CHARACTERS: Record<
	Exclude<IBatterId, "reindeer">,
	{
		scale: number;
		shiftBack: number;
		arm: (palette: IPalette) => string;
		armWidth: number;
		hand: ((palette: IPalette) => string) | null;
	}
> = {
	elf: {
		scale: 3.6,
		shiftBack: 0.38,
		arm: (palette) => palette.green,
		armWidth: 0.13,
		hand: (palette) => palette.skin,
	},
	santa: {
		scale: 3.6,
		shiftBack: 0.4,
		arm: (palette) => palette.red,
		armWidth: 0.14,
		hand: (palette) => palette.white,
	},
	mrsClaus: {
		scale: 3.6,
		shiftBack: 0.36,
		arm: (palette) => palette.red,
		armWidth: 0.12,
		hand: (palette) => palette.skin,
	},
	snowman: { scale: 4.4, shiftBack: 0.55, arm: (palette) => palette.bark, armWidth: 0.05, hand: null },
};

export function drawBatter(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	swingTime: number | null,
	batter: IBatterId,
) {
	context.save();
	context.translate(REINDEER_X, 0);

	if (batter === "reindeer") {
		drawReindeerBody(context, palette);
		drawArmAndCane(context, palette, swingTime, palette.fur, 0.13, palette.fur);
	} else {
		const look = BIG_CHARACTERS[batter];
		// The characters are drawn about their middle with their feet at -0.3 life size.
		context.save();
		context.translate(-look.shiftBack, 0.3 * look.scale);
		context.scale(look.scale, look.scale);
		drawCharacter(context, palette, batter);
		context.restore();
		drawArmAndCane(context, palette, swingTime, look.arm(palette), look.armWidth, look.hand?.(palette) ?? null);
	}

	context.restore();
}

/** The bat's angle (radians, 0 = pointing ahead) at this point in the swing. */
function batAngle(swingTime: number | null): number {
	const raised = 1.9;
	const followThrough = -1.2;

	if (swingTime === null) {
		return raised;
	}

	const progress = Math.min(1, swingTime / SWING_DURATION);
	const contactShare = SWING_CONTACT_TIME / SWING_DURATION;

	// Fast down to the contact point (level, pointing ahead), then easing into the follow-through.
	if (progress <= contactShare) {
		return raised * (1 - progress / contactShare);
	}

	const after = (progress - contactShare) / (1 - contactShare);

	return followThrough * (1 - (1 - after) ** 2);
}

/** The arm and the candy cane, turning about the shoulder (level with the bat's sweet spot). */
function drawArmAndCane(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	swingTime: number | null,
	armColor: string,
	armWidth: number,
	handColor: string | null,
) {
	context.save();
	context.translate(0.05, SWEET_SPOT_Y);
	context.rotate(batAngle(swingTime));
	context.strokeStyle = armColor;
	context.lineWidth = armWidth;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(0, 0);
	context.lineTo(0.38, 0);
	context.stroke();
	drawCandyCane(context, palette);

	if (handColor) {
		context.fillStyle = handColor;
		ellipse(context, 0.36, 0, 0.09, 0.09);
	}

	context.restore();
}

/** Held at the straight end; the crook curls at the far end. */
function drawCandyCane(context: CanvasRenderingContext2D, palette: IPalette) {
	const path = () => {
		context.beginPath();
		context.moveTo(0.3, 0);
		context.lineTo(1.45, 0);
		context.arc(1.45, 0.17, 0.17, -Math.PI / 2, Math.PI / 2, false);
	};

	context.lineCap = "round";
	context.lineWidth = 0.12;
	context.strokeStyle = palette.white;
	path();
	context.stroke();
	context.setLineDash([0.08, 0.08]);
	context.strokeStyle = palette.red;
	path();
	context.stroke();
	context.setLineDash([]);
}

/** The original batter: a reindeer standing upright, with a pale belly and antlers. */
function drawReindeerBody(context: CanvasRenderingContext2D, palette: IPalette) {
	// Legs and hooves.
	context.fillStyle = palette.bark;
	context.fillRect(-0.32, 0, 0.18, 0.75);
	context.fillRect(0.06, 0, 0.18, 0.75);
	context.fillStyle = BOOT;
	context.fillRect(-0.34, 0, 0.22, 0.1);
	context.fillRect(0.04, 0, 0.22, 0.1);

	// Body, with a pale belly.
	context.fillStyle = palette.fur;
	ellipse(context, -0.04, 1.2, 0.42, 0.58);
	context.fillStyle = palette.gold;
	ellipse(context, 0.06, 1.12, 0.22, 0.38);

	// Head, snout and ears.
	context.fillStyle = palette.fur;
	ellipse(context, 0.02, 1.98, 0.27, 0.27);
	ellipse(context, 0.24, 1.9, 0.17, 0.12);
	ellipse(context, -0.22, 2.12, 0.1, 0.05, -0.5);
	context.fillStyle = BOOT;
	ellipse(context, 0.39, 1.92, 0.06, 0.05);
	context.fillStyle = palette.white;
	ellipse(context, 0.1, 2.04, 0.06, 0.06);
	context.fillStyle = COAL;
	ellipse(context, 0.12, 2.04, 0.032, 0.032);

	// Antlers.
	context.strokeStyle = palette.bark;
	context.lineWidth = 0.06;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(-0.06, 2.2);
	context.lineTo(-0.16, 2.6);
	context.moveTo(-0.13, 2.47);
	context.lineTo(-0.3, 2.6);
	context.moveTo(0.08, 2.21);
	context.lineTo(0.14, 2.62);
	context.moveTo(0.12, 2.48);
	context.lineTo(0.28, 2.6);
	context.stroke();
}

function ellipse(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	radiusX: number,
	radiusY: number,
	rotation = 0,
) {
	context.beginPath();
	context.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
	context.fill();
}
