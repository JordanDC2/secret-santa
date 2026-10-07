const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** "Oct 7, 2026". Date-only strings ("2026-12-20") are read as local dates, not UTC midnight. */
export function formatDate(value: string): string {
	return dateFormat.format(/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00`) : new Date(value));
}

export function formatDateTime(iso: string): string {
	return dateTimeFormat.format(new Date(iso));
}

/** "5 minutes ago", "yesterday", "3 weeks ago". */
export function timeAgo(iso: string): string {
	const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["year", 31_536_000],
		["month", 2_592_000],
		["week", 604_800],
		["day", 86_400],
		["hour", 3_600],
		["minute", 60],
	];

	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) {
			return relative.format(Math.round(seconds / size), unit);
		}
	}

	return "just now";
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
