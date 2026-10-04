import { useEffect, useState } from "react";
import { useConnectionStatus, useEchoPublic } from "@laravel/echo-react";

/** Builds that can't tell when they're out of date: the dev server and git-less builds. */
const UNVERSIONED = new Set(["dev", "unknown"]);

const BUILD_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";

async function liveVersion(): Promise<string | null> {
	try {
		// no-store: always ask the server, never a cached copy.
		const response = await fetch("/version.json", { cache: "no-store" });

		return response.ok ? ((await response.json()) as { version: string }).version : null;
	} catch {
		return null;
	}
}

/**
 * Whether a newer version of the site has gone live since this page loaded. The deploy
 * announces it over Reverb; because the deploy also restarts Reverb, a page could reconnect
 * just after that announcement, so every (re)connection double-checks /version.json too.
 */
export function useUpdateAvailable(): boolean {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const status = useConnectionStatus();
	const versioned = !UNVERSIONED.has(BUILD_VERSION);

	useEchoPublic("app", ".app.deployed", (event: { version: string }) => {
		if (versioned && event.version !== BUILD_VERSION) {
			setUpdateAvailable(true);
		}
	});

	useEffect(() => {
		if (!versioned || status !== "connected") {
			return;
		}

		let cancelled = false;
		void liveVersion().then((version) => {
			if (!cancelled && version !== null && version !== BUILD_VERSION) {
				setUpdateAvailable(true);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [status, versioned]);

	return updateAvailable;
}
