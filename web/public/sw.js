// The service worker: shows push notifications, even with the app closed, and opens the right
// page when one is tapped. Push only: it caches nothing, so every visit still loads the newest
// version of the app. Pushes are built by FestivePush on the server: { title, body, icon, tag,
// renotify, data: { url } }.

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
			tag: push.tag,
			renotify: Boolean(push.tag && push.renotify),
			data: push.data || {},
		}),
	);
});

// Tapping a notification: reuse an open Secret Santa window if there is one, else open one.
self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;

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
