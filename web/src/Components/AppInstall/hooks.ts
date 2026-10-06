import { useState, useSyncExternalStore } from "react";
import { installPromptAvailable, subscribeToInstallPrompt } from "Components/AppInstall/installPrompt";

export type IInstallPlatform = "ios" | "android" | "other";

type IInstallInfo = {
	/** A phone or tablet browser, not the installed app itself. */
	canInstall: boolean;
	platform: IInstallPlatform;
};

function detect(): IInstallInfo {
	const standalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	const touch = window.matchMedia("(pointer: coarse)").matches;
	const userAgent = navigator.userAgent;
	// iPads ask for the desktop site, so they say "Macintosh"; touch gives them away.
	const ios = /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

	return {
		canInstall: touch && !standalone,
		platform: ios ? "ios" : /Android/.test(userAgent) ? "android" : "other",
	};
}

/** Whether to offer installing, on which kind of phone, and whether the browser can do it in one tap. */
export function useAppInstall() {
	// Worked out once: none of this changes while the page is open.
	const [info] = useState(detect);
	const promptAvailable = useSyncExternalStore(subscribeToInstallPrompt, installPromptAvailable);

	return { ...info, promptAvailable };
}
