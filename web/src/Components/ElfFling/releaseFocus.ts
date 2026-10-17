import type { MouseEvent } from "react";

/**
 * Call at the end of a click handler on buttons around the game, to let go of focus.
 * Otherwise the button stays focused after a click, and the next Space or Enter (the game's
 * keyboard controls) presses it again: toggling full screen, or buying another level,
 * instead of playing.
 */
export function releaseFocus(event: MouseEvent<HTMLElement>) {
	event.currentTarget.blur();
}
