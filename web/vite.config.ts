import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	// VITE_* values (e.g. the Reverb app key) come from the API's .env, so there's one source of truth.
	envDir: "../api",
	server: {
		port: 3000,
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
			"/app": {
				target: "ws://localhost:8080",
				ws: true,
			},
		},
	},
});
