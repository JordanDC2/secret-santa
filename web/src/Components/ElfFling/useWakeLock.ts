import { useEffect } from "react";

/**
 * Keeps the screen on while `active` (the Screen Wake Lock API), so a phone doesn't dim and
 * sleep mid-run. The browser lets go of the lock whenever the page is hidden, so it's taken
 * again when the page comes back. Where there's no API (or it's refused), nothing happens.
 */
export function useWakeLock(active: boolean): void {
	useEffect(() => {
		if (!active || !("wakeLock" in navigator)) {
			return;
		}

		let lock: WakeLockSentinel | null = null;
		let released = false;

		const take = () => {
			if (document.visibilityState !== "visible") {
				return;
			}

			navigator.wakeLock
				.request("screen")
				.then((sentinel) => {
					if (released) {
						void sentinel.release();
					} else {
						lock = sentinel;
					}
				})
				.catch(() => {
					// Refused (low battery, say): the screen sleeps as usual.
				});
		};

		take();
		document.addEventListener("visibilitychange", take);

		return () => {
			released = true;
			document.removeEventListener("visibilitychange", take);
			void lock?.release();
		};
	}, [active]);
}
