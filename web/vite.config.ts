import { execSync } from "node:child_process";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Which version this build is: APP_VERSION if the deploy script sets it, else the current
 * commit. Builds from a folder without git history (like the Podman rehearsal) fall back to
 * "unknown", which never prompts anyone to refresh.
 */
function appVersion(): string {
	if (process.env.APP_VERSION) {
		return process.env.APP_VERSION;
	}

	try {
		return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
			.toString()
			.trim();
	} catch {
		return "unknown";
	}
}

/**
 * Bakes the version into the app as import.meta.env.VITE_APP_VERSION and writes it to /version.json, so an
 * open page can tell when a newer version has gone live. The dev server uses "dev".
 */
function versionStamp(): Plugin {
	let version = "dev";

	return {
		name: "version-stamp",
		config(_, { command }) {
			version = command === "build" ? appVersion() : "dev";

			return { define: { "import.meta.env.VITE_APP_VERSION": JSON.stringify(version) } };
		},
		generateBundle() {
			this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version }) });
		},
	};
}

export default defineConfig({
	plugins: [react(), tsconfigPaths(), versionStamp()],
	// VITE_* values (e.g. the Reverb app key) come from the API's .env, so there's one source of truth.
	envDir: "../api",
	server: {
		// Not 3000: other local projects (an Electron app) use it. Fail rather than drift to another
		// port, since the API only trusts logins from this one (see api/config/sanctum.php).
		port: 3001,
		strictPort: true,
		open: true,
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
			"/sanctum": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
			// Reverb's WebSocket endpoint; production's web server proxies the same path.
			// A plain "/app" key is a prefix match and would also catch /apple-touch-icon.png.
			"^/app(/|$)": {
				target: "ws://localhost:8080",
				ws: true,
			},
		},
	},
});
