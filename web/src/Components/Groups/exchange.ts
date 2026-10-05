import type { IBudget } from "Components/Groups/types";

const MS_PER_DAY = 86_400_000;

/** "2026-12-20" as a local calendar date (new Date("2026-12-20") would be UTC midnight). */
export function parseExchangeDate(date: string): Date {
	const [year, month, day] = date.split("-").map(Number);

	return new Date(year, month - 1, day);
}

/** "Sun, Dec 20", plus the year when it isn't this year. */
export function formatExchangeDate(date: string, today = new Date()): string {
	const parsed = parseExchangeDate(date);

	return parsed.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		...(parsed.getFullYear() !== today.getFullYear() && { year: "numeric" }),
	});
}

/** Whole days from today until the exchange: 0 on the day, negative once it's passed. */
export function daysUntil(date: string, today = new Date()): number {
	const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

	return Math.round((parseExchangeDate(date).getTime() - midnight.getTime()) / MS_PER_DAY);
}

/** "76 days to go", "Tomorrow!", "Today!", or "Exchanged Dec 20" once it's passed. */
export function countdownLabel(date: string, today = new Date()): string {
	const days = daysUntil(date, today);

	if (days > 1) {
		return `${formatExchangeDate(date, today)} · ${days} days to go`;
	}

	if (days === 1) {
		return `${formatExchangeDate(date, today)} · Tomorrow!`;
	}

	return days === 0 ? "Exchange day is today!" : `Exchanged ${formatExchangeDate(date, today)}`;
}

/** "$50 budget" or "$30–$50 budget". */
export function budgetLabel(budget: IBudget): string {
	return budget.min === null ? `$${budget.max} budget` : `$${budget.min}–$${budget.max} budget`;
}
