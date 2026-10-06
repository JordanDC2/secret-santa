/**
 * Chrome and Edge on Android fire `beforeinstallprompt` once, early in the page load, when the
 * site can be installed. We keep it so our own "Get the app" link can open the browser's
 * install dialog later; React subscribes through useSyncExternalStore.
 */

/** Not in TypeScript's DOM types yet: Chromium only. */
type IBeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: IBeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
	listeners.forEach((listener) => listener());
}

/** Call once at startup, before React renders, so the event isn't missed. */
export function listenForInstallPrompt() {
	window.addEventListener("beforeinstallprompt", (event) => {
		// Stop Chrome's own mini-infobar; we offer installing in our own words.
		event.preventDefault();
		deferredPrompt = event as IBeforeInstallPromptEvent;
		notify();
	});

	window.addEventListener("appinstalled", () => {
		deferredPrompt = null;
		notify();
	});
}

export function subscribeToInstallPrompt(listener: () => void) {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

export function installPromptAvailable() {
	return deferredPrompt !== null;
}

/** Opens the browser's install dialog. It can only be used once, so it's cleared afterwards. */
export async function showInstallPrompt() {
	const event = deferredPrompt;

	if (!event) {
		return;
	}

	deferredPrompt = null;
	notify();
	await event.prompt();
	await event.userChoice;
}
