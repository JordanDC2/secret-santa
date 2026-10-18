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

/** The first announcement for this page that this device hasn't seen yet, if any. */
export function unseenAnnouncement(pathname: string): IAnnouncement | null {
	const seen = seenIds();

	return (
		ANNOUNCEMENTS.find((announcement) => announcement.paths.includes(pathname) && !seen.includes(announcement.id)) ??
		null
	);
}
