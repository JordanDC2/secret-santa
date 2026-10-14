/**
 * Google's "Continue with Google" button (Google Identity Services). Google's script draws the
 * button; picking an account hands us a signed token, which the API checks (GoogleLoginHandler).
 */

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

/** Just the parts of Google's script this app uses. */
type IGoogleIdentity = {
	initialize: (config: {
		client_id: string;
		callback: (response: { credential: string }) => void;
		ux_mode: "popup";
		cancel_on_tap_outside: boolean;
	}) => void;
	renderButton: (
		parent: HTMLElement,
		options: {
			type: "standard";
			theme: "outline" | "filled_black";
			size: "large";
			text: "continue_with";
			shape: "pill";
			logo_alignment: "center";
			width: number;
		},
	) => void;
};

declare global {
	interface Window {
		google?: { accounts: { id: IGoogleIdentity } };
	}
}

let loading: Promise<IGoogleIdentity> | null = null;

/** Whoever is showing a button right now; Google only lets the page set one callback. */
let onCredential: ((credential: string) => void) | null = null;

/** Loads Google's script once, the first time a sign-in page shows the button. */
export function loadGoogleIdentity(): Promise<IGoogleIdentity> {
	loading ??= new Promise<IGoogleIdentity>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_URL;
		script.async = true;
		script.addEventListener("load", () => {
			const identity = window.google?.accounts.id;

			if (!identity || !GOOGLE_CLIENT_ID) {
				reject(new Error("Google sign-in is unavailable."));
				return;
			}

			identity.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: ({ credential }) => onCredential?.(credential),
				ux_mode: "popup",
				cancel_on_tap_outside: true,
			});
			resolve(identity);
		});
		script.addEventListener("error", () => {
			// Let a later visit to the page try again (e.g. after a dropped connection).
			loading = null;
			script.remove();
			reject(new Error("Google sign-in couldn't load."));
		});
		document.head.appendChild(script);
	});

	return loading;
}

export function setGoogleCredentialHandler(handler: ((credential: string) => void) | null) {
	onCredential = handler;
}
