// The service worker: shows push notifications, even with the app closed, and opens the right
// page when one is tapped. Push only: it caches nothing, so every visit still loads the newest
// version of the app. Pushes are built by FestivePush on the server: { title, body, icon, badge,
// tag, renotify, data: { url } }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
	if (!event.data) {
		return;
	}

	let push;
	try {
		push = event.data.json();
	} catch {
		push = { title: "Secret Santa", body: event.data.text() };
	}

	event.waitUntil(
		self.registration.showNotification(push.title || "Secret Santa", {
			body: push.body,
			icon: push.icon || "/icon-192.png",
			// Android's status-bar icon (a white silhouette); without it, Chrome shows a bell.
			badge: push.badge || "/badge-96.png",
			tag: push.tag,
			renotify: Boolean(push.tag && push.renotify),
			data: push.data || {},
		}),
	);
});

// Tapping a notification opens its page.
//  - Android: always "open" the link. If Secret Santa is installed, Android hands links for this
//    site to the app (bringing it forward if it's already running). Reusing an "open window"
//    instead would pick a Chrome tab of the site, and focusing that lands in Chrome's tab switcher.
//  - Computers: reuse a Secret Santa window if one's open, so taps don't pile up tabs.
const ANDROID = /Android/i.test(self.navigator.userAgent);

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;

	if (ANDROID) {
		event.waitUntil(self.clients.openWindow(url));

		return;
	}

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
			const open = windows.find((client) => new URL(client.url).origin === self.location.origin);

			if (open) {
				return open.focus().then((client) => (client ? client.navigate(url) : self.clients.openWindow(url)));
			}

			return self.clients.openWindow(url);
		}),
	);
});
