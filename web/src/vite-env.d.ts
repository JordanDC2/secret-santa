/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Reverb's public app key, read from api/.env (see vite.config.ts envDir). */
	readonly VITE_REVERB_APP_KEY?: string;
	/** The commit this build came from ("dev" on the dev server); set by vite.config.ts. */
	readonly VITE_APP_VERSION?: string;
	/** The public half of the push key pair, read from api/.env (VAPID_PUBLIC_KEY). */
	readonly VITE_VAPID_PUBLIC_KEY?: string;
}
