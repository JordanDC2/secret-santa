import { apiClient } from "Data/Api/Client";

/**
 * This browser's side of push notifications: the service worker (public/sw.js) and the push
 * address the browser makes for this site. The API keeps those addresses per person
 * (PushSubscriptionController) and pushes to them.
 */

/** What this device can do: push works, needs the app on the Home Screen first (iPhone), or never. */
export type IPushSupport = "supported" | "needs-install" | "unsupported";

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function pushSupport(): IPushSupport {
	const browserCanPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

	if (browserCanPush && PUBLIC_KEY) {
		return "supported";
	}

	const standalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	const userAgent = navigator.userAgent;
	const ios = /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

	// Apple only allows web push for apps added to the Home Screen.
	return ios && !standalone ? "needs-install" : "unsupported";
}

/** Registered on every page load, so pushes arrive even with the app closed. */
export function registerServiceWorker(): void {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// No service worker (e.g. a private window): the app works the same, just without push.
		});
	}
}

export async function currentSubscription(): Promise<PushSubscription | null> {
	if (pushSupport() !== "supported") {
		return null;
	}

	// getRegistration, not .ready: .ready waits forever where no service worker could register
	// (a private window, say), and logging out waits on this.
	const registration = await navigator.serviceWorker.getRegistration();

	return registration ? registration.pushManager.getSubscription() : null;
}

/** Sends this device's push address to the API (it moves to whoever is signed in). */
export async function saveSubscription(subscription: PushSubscription): Promise<void> {
	const { endpoint, keys } = subscription.toJSON();
	const encodings = (PushManager as typeof PushManager & { supportedContentEncodings?: string[] })
		.supportedContentEncodings;

	await apiClient.post<void>("/account/push-subscriptions", {
		endpoint,
		keys,
		content_encoding: encodings?.includes("aes128gcm") === false ? "aesgcm" : "aes128gcm",
	});
}

/** Asks for permission (must follow a tap: iPhones insist), then subscribes and saves. */
export async function turnOnPush(): Promise<void> {
	if ((await Notification.requestPermission()) !== "granted") {
		throw new Error("Notifications weren't allowed. You can allow them in this site's settings, then try again.");
	}

	const registration = await navigator.serviceWorker.ready;
	const subscription =
		(await registration.pushManager.getSubscription()) ??
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToBytes(PUBLIC_KEY ?? ""),
		}));

	await saveSubscription(subscription);
}

/** Stops pushes to this device: forgets it on the API and in the browser. */
export async function turnOffPush(): Promise<void> {
	const subscription = await currentSubscription();

	if (subscription) {
		await apiClient.delete<void>("/account/push-subscriptions", { endpoint: subscription.endpoint });
		await subscription.unsubscribe();
	}
}

/** Push keys come base64url-encoded; the browser wants the raw bytes. */
function urlBase64ToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
	const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(base64);
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));

	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}
