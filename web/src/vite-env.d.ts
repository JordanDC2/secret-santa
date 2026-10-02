/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Reverb's public app key, read from api/.env (see vite.config.ts envDir). */
	readonly VITE_REVERB_APP_KEY?: string;
}
