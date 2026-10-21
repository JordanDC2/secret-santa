/**
 * The patrons' portraits (and Krampus's), shown at their shrines: each drawn once, the first
 * time it's needed, and kept as an image URL.
 */

import { drawBefana } from "Components/SilentNight/drawBefana";
import { drawChristkind } from "Components/SilentNight/drawChristkind";
import { drawKrampus } from "Components/SilentNight/drawKrampus";
import { drawLaFlor } from "Components/SilentNight/drawLaFlor";
import { drawLucia } from "Components/SilentNight/drawLucia";
import { drawMariLwyd } from "Components/SilentNight/drawMariLwyd";
import { drawMoroz } from "Components/SilentNight/drawMoroz";
import { drawYuleGoat } from "Components/SilentNight/drawYuleGoat";
import { drawYuleLads } from "Components/SilentNight/drawYuleLads";
import type { IPatronId } from "Components/SilentNight/types";

export type IPortraitId = IPatronId | "krampus";

const DRAWINGS: Record<IPortraitId, () => HTMLCanvasElement> = {
	laFlor: drawLaFlor,
	lucia: drawLucia,
	moroz: drawMoroz,
	christkind: drawChristkind,
	yuleLads: drawYuleLads,
	befana: drawBefana,
	yuleGoat: drawYuleGoat,
	mariLwyd: drawMariLwyd,
	krampus: drawKrampus,
};

const urls = new Map<IPortraitId, string>();

export function portraitUrl(id: IPortraitId): string {
	if (!urls.has(id)) {
		urls.set(id, DRAWINGS[id]().toDataURL());
	}

	return urls.get(id)!;
}
