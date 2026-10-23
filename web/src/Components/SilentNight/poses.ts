/**
 * The cast struck in their poses, the backdrop to choosing who plays: each drawn once, the first
 * time it's needed, and kept as an image URL.
 */

import { drawElfPose } from "Components/SilentNight/drawElfPose";
import { drawMrsClausPose } from "Components/SilentNight/drawMrsClausPose";
import { drawReindeerPose } from "Components/SilentNight/drawReindeerPose";
import { drawSantaPose } from "Components/SilentNight/drawSantaPose";
import { drawSnowmanPose } from "Components/SilentNight/drawSnowmanPose";
import type { ICastId } from "Components/SilentNight/types";

const DRAWINGS: Record<ICastId, () => HTMLCanvasElement> = {
	elf: drawElfPose,
	santa: drawSantaPose,
	mrsClaus: drawMrsClausPose,
	snowman: drawSnowmanPose,
	reindeer: drawReindeerPose,
};

const urls = new Map<ICastId, string>();

export function poseUrl(id: ICastId): string {
	if (!urls.has(id)) {
		urls.set(id, DRAWINGS[id]().toDataURL());
	}

	return urls.get(id)!;
}
