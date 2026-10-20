/**
 * The patrons' portraits (and Krampus's), shown at their shrines: each drawn once, the first
 * time it's needed, and kept as an image URL.
 */

import { drawLaFlor } from "Components/SilentNight/drawLaFlor";
import type { IPatronId } from "Components/SilentNight/types";

export type IPortraitId = IPatronId | "krampus";

const DRAWINGS: Partial<Record<IPortraitId, () => HTMLCanvasElement>> = {
	laFlor: drawLaFlor,
};

const urls = new Map<IPortraitId, string>();

export function portraitUrl(id: IPortraitId): string | null {
	const draw = DRAWINGS[id];

	if (!draw) {
		return null;
	}

	if (!urls.has(id)) {
		urls.set(id, draw().toDataURL());
	}

	return urls.get(id)!;
}
