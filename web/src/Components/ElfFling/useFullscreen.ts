import { useCallback, useEffect, useState, type RefObject } from "react";

type IKeyboardLock = { lock: (codes: string[]) => Promise<void>; unlock: () => void };

/** The Keyboard Lock API, where the browser has it (TypeScript's DOM types don't include it yet). */
function keyboard(): IKeyboardLock | undefined {
	return (navigator as Navigator & { keyboard?: IKeyboardLock }).keyboard;
}

/**
 * Full-screen play for the game. The game's frame always fills the screen with CSS (which
 * works everywhere, including iPhones, where Safari won't make a page element full screen),
 * and where the browser allows it we also ask for real full screen (hiding the address bar)
 * and, on phones that support it (Android), turn the game sideways (or upright, for a tall game
 * like pinball). Leaving undoes both.
 *
 * Escape leaves, unless `escapeToGame`: then a game has it (for its pause menu), and where the
 * browser has the Keyboard Lock API (Chromium) a quick press goes to the game while holding it
 * for two seconds still leaves full screen; elsewhere the browser's own Escape still leaves.
 */
export function useFullscreen(
	element: RefObject<HTMLElement | null>,
	orientation: "landscape" | "portrait" = "landscape",
	escapeToGame = false,
) {
	const [fullscreen, setFullscreen] = useState(false);

	const enter = useCallback(() => {
		setFullscreen(true);
		const target = element.current;

		if (escapeToGame) {
			// Asked for before full screen, as the Keyboard Lock spec recommends; it only takes hold once full screen.
			keyboard()
				?.lock(["Escape"])
				.catch(() => {});
		}

		if (target?.requestFullscreen) {
			target
				.requestFullscreen({ navigationUI: "hide" })
				// Only possible once the page is full screen, and only on some phones.
				.then(() =>
					(screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> }).lock?.(orientation),
				)
				.catch(() => {
					// Not allowed here (or no orientation lock): the CSS version still fills the screen.
				});
		}
	}, [element, orientation, escapeToGame]);

	const exit = useCallback(() => {
		setFullscreen(false);
		keyboard()?.unlock();

		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		}
	}, []);

	// Leaving real full screen another way (the Escape key, the phone's back gesture) leaves ours too.
	useEffect(() => {
		function onChange() {
			if (!document.fullscreenElement) {
				setFullscreen(false);
				keyboard()?.unlock();
			}
		}

		document.addEventListener("fullscreenchange", onChange);

		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	// While the game covers the page, the page behind it shouldn't scroll, and Escape leaves.
	useEffect(() => {
		if (!fullscreen) {
			return;
		}

		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape" && !escapeToGame) {
				exit();
			}
		}

		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [fullscreen, exit, escapeToGame]);

	return { fullscreen, enter, exit };
}
