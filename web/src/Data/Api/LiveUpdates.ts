import { configureEcho, echoIsConfigured } from "@laravel/echo-react";
import { apiClient } from "Data/Api/Client";

type IChannelAuth = { auth: string; channel_data?: string };

/**
 * Connects Laravel Echo to Reverb. The socket goes to this page's own host (Vite proxies
 * /app in development, the web server does in production), and private channels are
 * authorized with the same session cookie + CSRF token as every other API call.
 */
export function configureLiveUpdates() {
	const key = import.meta.env.VITE_REVERB_APP_KEY;

	if (!key) {
		console.warn("VITE_REVERB_APP_KEY is not set, so live updates are off. Pages still work; refresh to see changes.");
		return;
	}

	const isHttps = window.location.protocol === "https:";
	const port = Number(window.location.port) || (isHttps ? 443 : 80);

	configureEcho({
		broadcaster: "reverb",
		key,
		wsHost: window.location.hostname,
		wsPort: port,
		wssPort: port,
		forceTLS: isHttps,
		enabledTransports: ["ws", "wss"],
		authorizer: (channel: { name: string }) => ({
			authorize: (socketId: string, callback: (error: Error | null, auth: IChannelAuth | null) => void) => {
				apiClient
					.post<IChannelAuth>("/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
					.then((auth) => callback(null, auth))
					.catch((error: Error) => callback(error, null));
			},
		}),
	});
}

/** Live-update listeners render only when Echo is set up; its hooks throw otherwise. */
export const liveUpdatesEnabled = echoIsConfigured;
