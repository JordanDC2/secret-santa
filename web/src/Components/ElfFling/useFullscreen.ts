import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Full-screen play for the game. The game's frame always fills the screen with CSS (which
 * works everywhere, including iPhones, where Safari won't make a page element full screen),
 * and where the browser allows it we also ask for real full screen (hiding the address bar)
 * and, on phones that support it (Android), turn the game sideways. Leaving undoes both.
 */
export function useFullscreen(element: RefObject<HTMLElement | null>) {
	const [fullscreen, setFullscreen] = useState(false);

	const enter = useCallback(() => {
		setFullscreen(true);
		const target = element.current;

		if (target?.requestFullscreen) {
			target
				.requestFullscreen({ navigationUI: "hide" })
				// Only possible once the page is full screen, and only on some phones.
				.then(() =>
					(screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> }).lock?.("landscape"),
				)
				.catch(() => {
					// Not allowed here (or no orientation lock): the CSS version still fills the screen.
				});
		}
	}, [element]);

	const exit = useCallback(() => {
		setFullscreen(false);

		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		}
	}, []);

	// Leaving real full screen another way (the Escape key, the phone's back gesture) leaves ours too.
	useEffect(() => {
		function onChange() {
			if (!document.fullscreenElement) {
				setFullscreen(false);
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
			if (event.key === "Escape") {
				exit();
			}
		}

		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [fullscreen, exit]);

	return { fullscreen, enter, exit };
}
