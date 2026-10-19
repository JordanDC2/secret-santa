import { ANNOUNCEMENTS, type IAnnouncement } from "Components/Announcements/announcements";

/** The announcements this device has seen (by id), so each shows once. */
const SEEN_KEY = "secret-santa-seen-announcements";

function seenIds(): string[] {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");

		return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
	} catch {
		return [];
	}
}

export function markSeen(id: string): void {
	try {
		localStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds(), id]));
	} catch {
		// Storage blocked (private browsing): it may show again next visit.
	}
}

/** This page's announcements, newest first (as they're listed). */
export function announcementsFor(pathname: string): IAnnouncement[] {
	return ANNOUNCEMENTS.filter((announcement) => announcement.paths.includes(pathname));
}

/** This page's newest announcement, if this device hasn't seen it yet (the earlier ones show under it). */
export function unseenAnnouncement(pathname: string): IAnnouncement | null {
	const [newest] = announcementsFor(pathname);

	return newest && !seenIds().includes(newest.id) ? newest : null;
}
